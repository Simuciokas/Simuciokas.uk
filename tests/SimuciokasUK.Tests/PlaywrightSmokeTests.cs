using System.Text.Json;
using Microsoft.Playwright;
using Xunit;
using static Microsoft.Playwright.Assertions;

namespace SimuciokasUK.Tests;

[Trait("Category", "E2E")]
public sealed class PlaywrightSmokeTests : IClassFixture<PlaywrightFixture>
{
    private readonly PlaywrightFixture _fx;

    public PlaywrightSmokeTests(PlaywrightFixture fx)
    {
        _fx = fx;
    }

    private static string FixturePath(params string[] parts) =>
        Path.Combine(AppContext.BaseDirectory, "fixtures", Path.Combine(parts));

    private async Task<(IBrowserContext, IPage)> OpenAsync(string path = "/")
    {
        var (ctx, page) = await _fx.NewPageAsync();
        // Wait until the bundle's data.js Promise.allSettled has resolved and
        // each solver module has attached its input listeners. Defer-loaded
        // scripts run after DOMContentLoaded, so the default "load" criterion
        // returns too early — especially against the dev tunnel.
        var response = await page.GotoAsync(path, new() { WaitUntil = WaitUntilState.NetworkIdle });
        Assert.NotNull(response);
        Assert.Equal(200, response!.Status);
        return (ctx, page);
    }

    // ---------- Static pages ----------

    [Fact]
    public async Task Home_Loads()
    {
        var (ctx, page) = await OpenAsync("/");
        await using var _ = ctx;
        await Expect(page).ToHaveTitleAsync(new System.Text.RegularExpressions.Regex("Simuciokas\\.uk"));
    }

    [Fact]
    public async Task Privacy_Loads_AndHasContent()
    {
        var (ctx, page) = await OpenAsync("/Privacy");
        await using var _ = ctx;
        await Expect(page.Locator("h1")).ToHaveTextAsync("Privacy Policy");
        await Expect(page.Locator("h2", new() { HasTextString = "What is stored" })).ToBeVisibleAsync();
    }

    // ---------- Tabs ----------

    [Fact]
    public async Task Minescape_Tabs_SwitchOnRadioClick()
    {
        var (ctx, page) = await OpenAsync("/Minescape");
        await using var _ = ctx;

        await Expect(page.Locator("#Puzzle")).ToBeVisibleAsync();
        await Expect(page.Locator("#Anagram")).ToBeHiddenAsync();

        await page.Locator("label[for=rAnagram]").ClickAsync();
        await Expect(page.Locator("#Anagram")).ToBeVisibleAsync();
        await Expect(page.Locator("#Puzzle")).ToBeHiddenAsync();

        await page.Locator("label[for=rBeacon]").ClickAsync();
        await Expect(page.Locator("#Beacon")).ToBeVisibleAsync();
        await Expect(page.Locator("#Anagram")).ToBeHiddenAsync();
    }

    // ---------- Typeahead solvers ----------

    [Fact]
    public async Task Anagram_Typeahead_FindsAndSelectsRealEntry()
    {
        var (ctx, page) = await OpenAsync("/Minescape#Anagram");
        await using var _ = ctx;

        await page.Locator("#AnagramInput").FillAsync("Lilal");
        var results = page.Locator("#searchResultsAnagram div");
        await Expect(results.First).ToHaveTextAsync("Lilal");

        await results.First.ClickAsync();
        await Expect(page.Locator("#solution-anagram-name")).ToHaveTextAsync("Lalli");
        await Expect(page.Locator("#solution-anagram-url")).ToHaveTextAsync("-1741, 74, -1056");
    }

    [Fact]
    public async Task Beacon_Typeahead_FindsAndSelectsRealEntry()
    {
        var (ctx, page) = await OpenAsync("/Minescape#Beacon");
        await using var _ = ctx;

        await page.Locator("#BeaconInput").FillAsync("Al-");
        var results = page.Locator("#searchResultsBeacon div");
        await Expect(results.First).ToBeVisibleAsync();

        await results.First.ClickAsync();
        await Expect(page.Locator("#solution-beacon-url")).ToHaveTextAsync("-115, 69, 279");
    }

    // ---------- Cypher ----------

    [Fact]
    public async Task Cypher_DecodesShiftedAnagramId()
    {
        var (ctx, page) = await OpenAsync("/Minescape#Cypher");
        await using var _ = ctx;

        // The anagrams JSON has an entry with id "doomsayer". Cypher tries
        // every Caesar shift, so unshifted input must produce a direct match.
        await page.Locator("#CypherInput").FillAsync("doomsayer");

        await Expect(page.Locator("#solution-cypher-name")).ToHaveTextAsync("doomsayer");
        await Expect(page.Locator("#solution-cypher-url")).ToHaveTextAsync("-311, 68, 138");
    }

    [Fact]
    public async Task Cypher_DecodesNonZeroShift()
    {
        var (ctx, page) = await OpenAsync("/Minescape#Cypher");
        await using var _ = ctx;

        // "lalli" shifted +3 => "odoool"... wait: l->o a->d l->o l->o i->l => "odool"
        // (5 chars, still >= MIN_CIPHER_LENGTH). The cypher tries all 26 shifts so
        // shift 23 will produce "lalli" from "odool" and match the anagram entry.
        await page.Locator("#CypherInput").FillAsync("odool");
        await Expect(page.Locator("#solution-cypher-name")).ToHaveTextAsync("lalli");
    }

    // ---------- Suggestion modal ----------

    [Fact]
    public async Task Suggestion_Modal_OpensFromNavbarAndSubmits()
    {
        var (ctx, page) = await OpenAsync("/Minescape");
        await using var _ = ctx;

        await page.Locator("button[data-suggestion]").ClickAsync();
        await Expect(page.Locator("#suggestionModal")).ToBeVisibleAsync();

        // Tag the note so it's easy to spot if these end up against a real DB.
        var marker = $"[E2E TEST {DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}] playwright suggestion";
        await page.Locator("#suggestionNote").FillAsync(marker);
        await page.Locator("#suggestionSubmit").ClickAsync();

        // The endpoint either accepts the suggestion or returns the rate-limit
        // message. When E2E_BASE_URL points at a real deploy and the cap (5/hr
        // per IP per type) is exhausted, treat the limit reply as "the form
        // worked"; otherwise insist on success.
        var msg = page.Locator("#suggestionMessage");
        await Expect(msg).ToBeVisibleAsync(new() { Timeout = 5000 });
        var text = (await msg.InnerTextAsync()).ToLowerInvariant();
        if (_fx.IsExternalTarget && text.Contains("limit reached"))
            return;
        Assert.Contains("submitted", text);
    }

    // ---------- Map ----------

    [Fact]
    public async Task Map_TierRadioRendersCards()
    {
        var (ctx, page) = await OpenAsync("/Minescape#Map");
        await using var _ = ctx;

        await Expect(page.Locator("#Map")).ToBeVisibleAsync();
        await Expect(page.Locator("#solution-map > label").First).ToBeVisibleAsync();
    }

    // ---------- HotCold (synthetic) ----------

    [Fact]
    public async Task HotCold_TrySolve_FiltersByDistance()
    {
        var (ctx, page) = await OpenAsync("/Minescape#HotCold");
        await using var _ = ctx;

        // hotcold.js parses x and z from a map URL using regex `#/(-*\d+)/-*\d+/(-*\d+)`.
        // Build a synthetic URL pointing at the origin and give a small distance,
        // then click the solve button.
        await page.Locator("#HotColdMap").FillAsync("/Map/#/0/0/0/-2/minescape/minescape");
        await page.Locator("#HotColdMap").BlurAsync(); // triggers change-driven UpdateLabels()
        await page.Locator("#HotColdDistance").FillAsync("500");
        await page.Locator("#HotColdSolve").ClickAsync();

        // After solve, the possible-locations header text reflects how many items
        // were filtered in for the current tier.
        await Expect(page.Locator("#solution-hotcold-header")).ToContainTextAsync("Possible Locations");
    }

    // ---------- GE (with API mocked at the network layer) ----------

    [Fact]
    public async Task GE_RendersInitialOffersFromMockedApi()
    {
        var (ctx, page) = await _fx.NewPageAsync();
        await using var _ = ctx;

        var mockExchange = JsonSerializer.Serialize(new[]
        {
            new { symbol = "MS.IRON_ORE", buy = new { name = "Iron Ore" } },
            new { symbol = "MS.COAL",     buy = new { name = "Coal" } },
        });
        var mockSell = JsonSerializer.Serialize(new[]
        {
            new { symbol = "MS.IRON_ORE", type = "sell", price = 100, amount = 5, user = "alice", timestamp = 1_700_000_000 },
        });
        var mockBuy = JsonSerializer.Serialize(new[]
        {
            new { symbol = "MS.COAL", type = "buy", price = 80, amount = 12, user = "bob", timestamp = 1_700_000_500 },
        });

        await ctx.RouteAsync("**/exchange/", async route =>
            await route.FulfillAsync(new() { ContentType = "application/json", Body = mockExchange }));
        await ctx.RouteAsync("**/exchange/orders/MS.*/sell", async route =>
            await route.FulfillAsync(new() { ContentType = "application/json", Body = mockSell }));
        await ctx.RouteAsync("**/exchange/orders/MS.*/buy", async route =>
            await route.FulfillAsync(new() { ContentType = "application/json", Body = mockBuy }));

        await page.GotoAsync("/Minescape#GE");

        // GE Startup() merges sell+buy into the initial offers table, sorted by timestamp desc.
        // The buy row (timestamp 1_700_000_500) is newer, so Coal should appear first.
        // Don't assert on the username — it's resolved through a separate API call we
        // haven't mocked, so the cell will read "undefined".
        var firstRow = page.Locator("#detailsTable tbody tr").First;
        await Expect(firstRow).ToContainTextAsync("Coal", new() { Timeout = 10_000 });
        await Expect(page.Locator("#detailsTable tbody tr")).ToHaveCountAsync(2);
        await Expect(page.Locator("#detailsTable tbody")).ToContainTextAsync("Iron Ore");
    }

    [Fact]
    public async Task GE_ShowsBannerWhenApiFails()
    {
        var (ctx, page) = await _fx.NewPageAsync();
        await using var _ = ctx;

        // Override the fixture's default api.gameslabs.net mock with 500s so
        // ge.js Startup() hits its degraded path.
        await ctx.RouteAsync("**/api.gameslabs.net/**", async route =>
            await route.FulfillAsync(new() { Status = 500, Body = "boom" }));

        await page.GotoAsync("/Minescape#GE", new() { WaitUntil = WaitUntilState.NetworkIdle });

        await Expect(page.Locator("#ge-data-warning")).ToBeVisibleAsync();
        await Expect(page.Locator("#ge-data-warning")).ToContainTextAsync("Grand Exchange data is unavailable");
    }

    // ---------- Puzzle (file upload) ----------

    [Fact]
    public async Task Puzzle_AcceptsUploadAndRunsSolver()
    {
        var (ctx, page) = await OpenAsync("/Minescape");
        await using var _ = ctx;

        // PuzzleInput is the visible file dropzone for the Puzzle tab.
        var puzzleImage = FixturePath("puzzle", "puzzle1.png");
        Assert.True(File.Exists(puzzleImage), $"missing fixture: {puzzleImage}");

        await page.Locator("#PuzzleInput").SetInputFilesAsync(puzzleImage);

        // The solver runs on a web worker; #solution is populated when the
        // pipeline finishes. Generous timeout (OCR is slow on first run).
        await Expect(page.Locator("#solution")).Not.ToHaveTextAsync("", new() { Timeout = 60_000 });
    }

    // ---------- Light (9-step file upload flow) ----------

    [Fact]
    public async Task Light_AcceptsAllUploads_AndReachesSolution()
    {
        var (ctx, page) = await OpenAsync("/Minescape#Light");
        await using var _ = ctx;

        var steps = new (string inputId, string file)[]
        {
            ("LightInput0", "Initial.png"),
            ("LightInput1", "A.png"),
            ("LightInput2", "B.png"),
            ("LightInput3", "C.png"),
            ("LightInput4", "D.png"),
            ("LightInput5", "E.png"),
            ("LightInput6", "F.png"),
            ("LightInput7", "G.png"),
            ("LightInput8", "H.png"),
        };

        for (var i = 0; i < steps.Length; i++)
        {
            var (inputId, file) = steps[i];
            var path = FixturePath("light", file);
            Assert.True(File.Exists(path), $"missing fixture: {path}");

            await page.Locator($"#{inputId}").SetInputFilesAsync(path);

            // light.js shares one module-level lightIndex across all uploads. After
            // each image processes, it EITHER reveals the next input OR (once it
            // has enough state) triggers TrySolveMidWay and shows LightSolution.
            // Wait for either signal before moving to the next step.
            if (i < steps.Length - 1)
            {
                var nextInput = page.Locator($"#{steps[i + 1].inputId}");
                var solution = page.Locator("#LightSolution");
                await Task.WhenAny(
                    Expect(nextInput).ToBeVisibleAsync(new() { Timeout = 10_000 }),
                    Expect(solution).ToBeVisibleAsync(new() { Timeout = 10_000 })
                );
                if (await solution.IsVisibleAsync()) break;
            }
        }

        await Expect(page.Locator("#LightSolution")).ToBeVisibleAsync(new() { Timeout = 30_000 });
    }

    [Fact]
    public async Task Map_LoadsMarkersAfterDeferAndDynamicScripts()
    {
        // baseMarkers.js dynamically injects marker DB scripts (markersDB.js,
        // markers.js, regions.js) at module load. Those injected scripts load
        // between DOMContentLoaded and window.load — so initialize() has to
        // wait for the load event, not just DOMContentLoaded, or the marker
        // globals will be undefined when initialize() iterates them.
        var (ctx, page) = await _fx.NewPageAsync();
        await using var _ = ctx;

        var response = await page.GotoAsync("/Map", new() { WaitUntil = WaitUntilState.NetworkIdle, Timeout = 30_000 });
        Assert.NotNull(response);
        Assert.Equal(200, response!.Status);

        var probe = await page.EvaluateAsync<JsonElement>(@"
            () => ({
                isReady: window.overviewer?.util?.isReady === true,
                markersDefined: typeof window.markers !== 'undefined',
                markersDBDefined: typeof window.markersDB !== 'undefined',
                groupCount: window.overviewer?.current_layer?.minescape?.tileSetConfig?.marker_groups
                    ? Object.keys(window.overviewer.current_layer.minescape.tileSetConfig.marker_groups).length : 0,
                domMarkerCount: document.querySelectorAll('.ov-marker').length,
            })
        ");

        Assert.True(probe.GetProperty("isReady").GetBoolean(), "overviewer did not finish initializing");
        Assert.True(probe.GetProperty("markersDefined").GetBoolean(), "window.markers was undefined");
        Assert.True(probe.GetProperty("markersDBDefined").GetBoolean(), "window.markersDB was undefined");
        Assert.True(probe.GetProperty("groupCount").GetInt32() > 0, "no marker_groups were created");
        Assert.True(probe.GetProperty("domMarkerCount").GetInt32() > 0, "no .ov-marker elements in the DOM");
    }
}
