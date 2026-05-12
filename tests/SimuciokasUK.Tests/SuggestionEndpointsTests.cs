using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace SimuciokasUK.Tests;

public sealed class SuggestionEndpointsTests : IClassFixture<TestApplicationFactory>
{
    private readonly TestApplicationFactory _factory;

    public SuggestionEndpointsTests(TestApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient ClientForIp(string ip)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("CF-Connecting-IP", ip);
        return client;
    }

    private static MultipartFormDataContent FormWith(string note, params (string Name, byte[] Bytes, string ContentType)[] files)
    {
        var form = new MultipartFormDataContent { { new StringContent(note), "Note" } };
        foreach (var (name, bytes, contentType) in files)
        {
            var file = new ByteArrayContent(bytes);
            file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            form.Add(file, "Attachments", name);
        }
        return form;
    }

    [Fact]
    public async Task ValidSuggestion_NoAttachments_Returns200()
    {
        var client = ClientForIp("198.51.100.1");

        var response = await client.PostAsync("/api/v2/suggestion/Other", FormWith("hello"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task InvalidType_Returns400()
    {
        var client = ClientForIp("198.51.100.2");

        var response = await client.PostAsync("/api/v2/suggestion/NotAType", FormWith("x"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<MessageResponse>();
        Assert.Contains("Invalid", body!.message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DisallowedExtension_Returns400()
    {
        var client = ClientForIp("198.51.100.3");

        var response = await client.PostAsync(
            "/api/v2/suggestion/Map",
            FormWith("x", ("evil.exe", new byte[] { 0, 1, 2 }, "application/octet-stream")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<MessageResponse>();
        Assert.Contains(".exe", body!.message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TooManyFiles_Returns400()
    {
        var client = ClientForIp("198.51.100.4");
        var bytes = new byte[] { 0xff };

        // Test config caps MaxFilesPerRequest=3; send 4
        var response = await client.PostAsync(
            "/api/v2/suggestion/Map",
            FormWith("x",
                ("a.png", bytes, "image/png"),
                ("b.png", bytes, "image/png"),
                ("c.png", bytes, "image/png"),
                ("d.png", bytes, "image/png")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RateLimit_Returns400_AfterConfiguredHourlyCap()
    {
        var client = ClientForIp("198.51.100.5");

        // Test config caps SuggestionLimitPerHour=5 per type. Send 5 OKs then expect 400.
        for (var i = 0; i < 5; i++)
        {
            var ok = await client.PostAsync("/api/v2/suggestion/Other", FormWith($"hello {i}"));
            Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        }

        var limited = await client.PostAsync("/api/v2/suggestion/Other", FormWith("over"));
        Assert.Equal(HttpStatusCode.BadRequest, limited.StatusCode);
        var body = await limited.Content.ReadFromJsonAsync<MessageResponse>();
        Assert.Contains("limit", body!.message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TypeNormalization_AcceptsCaseInsensitive()
    {
        var client = ClientForIp("198.51.100.6");

        var response = await client.PostAsync("/api/v2/suggestion/oTher", FormWith("hello"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private sealed record MessageResponse(string message);
}
