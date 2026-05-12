using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SimuciokasUK.Tests;

public sealed class FeedbackEndpointsTests : IClassFixture<TestApplicationFactory>
{
    private readonly TestApplicationFactory _factory;

    public FeedbackEndpointsTests(TestApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient ClientForIp(string ip)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("CF-Connecting-IP", ip);
        return client;
    }

    [Fact]
    public async Task FeedbackNeeded_ReturnsTrue_ForUnknownIp()
    {
        var client = ClientForIp("203.0.113.1");

        var body = await client.GetFromJsonAsync<NeededResponse>("/api/feedback/needed");

        Assert.NotNull(body);
        Assert.True(body!.feedbackNeeded);
    }

    [Fact]
    public async Task SubmitFeedback_ThenNeeded_BecomesFalse()
    {
        var client = ClientForIp("203.0.113.2");

        var post = await client.PostAsJsonAsync("/api/feedback", new { Rating = 5, Notes = "good" });
        Assert.Equal(HttpStatusCode.OK, post.StatusCode);

        var body = await client.GetFromJsonAsync<NeededResponse>("/api/feedback/needed");
        Assert.False(body!.feedbackNeeded);
    }

    [Fact]
    public async Task SecondFeedback_WithinWindow_IsNoOpped()
    {
        var client = ClientForIp("203.0.113.3");

        var first = await client.PostAsJsonAsync("/api/feedback", new { Rating = 5, Notes = "a" });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/feedback", new { Rating = 1, Notes = "b" });
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        var message = (await second.Content.ReadFromJsonAsync<MessageResponse>())!.message;
        Assert.Contains("already submitted", message, StringComparison.OrdinalIgnoreCase);
    }

    private sealed record NeededResponse(bool feedbackNeeded);
    private sealed record MessageResponse(string message);
}
