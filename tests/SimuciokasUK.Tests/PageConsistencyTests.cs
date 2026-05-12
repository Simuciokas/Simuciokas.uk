using System.Text.RegularExpressions;
using SimuciokasUK.Helpers;
using Xunit;

namespace SimuciokasUK.Tests;

/// <summary>
/// Catches drift between the server-side suggestion type allowlist, the
/// Minescape page's radio buttons, and the JS aggregator entry. All three
/// have to stay in sync; this test fails fast if you add a clue type to one
/// and forget another.
/// </summary>
public sealed class PageConsistencyTests : IClassFixture<TestApplicationFactory>
{
    private readonly TestApplicationFactory _factory;

    public PageConsistencyTests(TestApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task NavRadios_MatchSuggestionTypes()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/Minescape");

        // Pull every navRadio value="..." from the rendered page.
        var pageValues = Regex.Matches(html, @"class=""navRadio"".*?value=""([^""]+)""", RegexOptions.Singleline)
            .Select(m => m.Groups[1].Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // SuggestionTypes.Allowed includes "Other" which is a fallback suggestion
        // type with no nav radio of its own — exclude it from the comparison.
        var expected = SuggestionTypes.Allowed
            .Where(t => !string.Equals(t, "Other", StringComparison.OrdinalIgnoreCase))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(expected.OrderBy(s => s), pageValues.OrderBy(s => s));
    }

    [Fact]
    public async Task BundleEntry_ImportsOneFilePerNavRadio()
    {
        var solversDir = Path.Combine(
            new DirectoryInfo(AppContext.BaseDirectory).Parent!.Parent!.Parent!.Parent!.Parent!.FullName,
            "wwwroot", "js", "minescape");
        Assert.True(Directory.Exists(solversDir), $"could not locate minescape js dir at {solversDir}");

        var entry = await File.ReadAllTextAsync(Path.Combine(solversDir, "_entry.js"));
        var imported = Regex.Matches(entry, @"import\s+['""]\./([a-zA-Z0-9_-]+)\.js['""]")
            .Select(m => m.Groups[1].Value)
            .Where(name => !name.StartsWith("_"))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Lower-case tab name → expected file name (kebab/lowercase).
        var expectedFiles = SuggestionTypes.Allowed
            .Where(t => !string.Equals(t, "Other", StringComparison.OrdinalIgnoreCase))
            .Select(t => t.ToLowerInvariant())
            .Concat(new[] { "data", "tabs" })
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(expectedFiles.OrderBy(s => s), imported.OrderBy(s => s));
    }
}
