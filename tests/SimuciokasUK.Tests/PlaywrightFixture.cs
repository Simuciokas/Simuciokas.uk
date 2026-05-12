using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.Playwright;
using Xunit;

namespace SimuciokasUK.Tests;

/// <summary>
/// Hosts the SimuciokasUK app for Playwright tests. By default launches the
/// built DLL as a subprocess on a random loopback port; if the env var
/// <c>E2E_BASE_URL</c> is set, skips the subprocess and points tests at that
/// URL instead (e.g. https://dev.simuciokas.uk). Either way shares one
/// Chromium browser across all tests in the fixture.
/// </summary>
public sealed class PlaywrightFixture : IAsyncLifetime
{
    public string DbPath { get; } = Path.Combine(
        Path.GetTempPath(),
        $"simuciokas-e2e-{Guid.NewGuid():N}.db");

    public string BaseUrl { get; private set; } = string.Empty;
    public bool IsExternalTarget { get; private set; }
    public IPlaywright Playwright { get; private set; } = null!;
    public IBrowser Browser { get; private set; } = null!;

    private Process? _app;
    private readonly List<string> _stdoutBuffer = new();

    public async Task InitializeAsync()
    {
        SweepStaleTestDatabases();

        var externalUrl = Environment.GetEnvironmentVariable("E2E_BASE_URL");
        if (!string.IsNullOrWhiteSpace(externalUrl))
        {
            BaseUrl = externalUrl.TrimEnd('/');
            IsExternalTarget = true;
        }
        else
        {
            BaseUrl = await StartSubprocessAsync();
        }

        Playwright = await Microsoft.Playwright.Playwright.CreateAsync();
        Browser = await Playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true,
        });
    }

    private async Task<string> StartSubprocessAsync()
    {
        var projectRoot = FindMainProjectRoot();
        var dll = Path.Combine(projectRoot, "bin", "Debug", "net8.0", "SimuciokasUK.dll");
        if (!File.Exists(dll))
            throw new InvalidOperationException(
                $"Expected build output at {dll}. Run `dotnet build` for the main project first.");

        var psi = new ProcessStartInfo("dotnet", $"exec \"{dll}\" --urls http://127.0.0.1:0")
        {
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
            WorkingDirectory = projectRoot,
        };
        psi.Environment["ASPNETCORE_ENVIRONMENT"] = "Testing";
        psi.Environment["ConnectionStrings__DefaultConnection"] = $"Data Source={DbPath}";
        psi.Environment["SuggestionLimitPerHour"] = "5";
        psi.Environment["Upload__MaxFileSizeBytes"] = "1048576";
        psi.Environment["Upload__MaxTotalSizeBytes"] = "2097152";
        psi.Environment["Upload__MaxFilesPerRequest"] = "3";
        psi.Environment["Upload__AllowedExtensions__0"] = ".png";
        psi.Environment["Upload__AllowedExtensions__1"] = ".jpg";

        _app = Process.Start(psi) ?? throw new InvalidOperationException("Failed to start app process.");

        _app.OutputDataReceived += (_, e) => { if (e.Data != null) _stdoutBuffer.Add(e.Data); };
        _app.ErrorDataReceived += (_, e) => { if (e.Data != null) _stdoutBuffer.Add(e.Data); };
        _app.BeginOutputReadLine();
        _app.BeginErrorReadLine();

        return await WaitForListeningUrlAsync(TimeSpan.FromSeconds(30));
    }

    public async Task DisposeAsync()
    {
        if (Browser is not null) await Browser.DisposeAsync();
        Playwright?.Dispose();

        if (_app is not null)
        {
            try
            {
                if (!_app.HasExited) _app.Kill(entireProcessTree: true);
                await _app.WaitForExitAsync();
            }
            catch { /* best effort */ }
            _app.Dispose();
        }

        try { if (File.Exists(DbPath)) File.Delete(DbPath); } catch { /* best effort */ }
    }

    /// <summary>Returns a fresh browser context + page bound to the test server.</summary>
    public async Task<(IBrowserContext context, IPage page)> NewPageAsync()
    {
        var context = await Browser.NewContextAsync(new BrowserNewContextOptions
        {
            BaseURL = BaseUrl,
            IgnoreHTTPSErrors = true,
        });

        // Default mock for the GE backend so module-load fetches don't hit the
        // live API during unrelated tests. Individual tests can override by
        // registering their own RouteAsync handler (which takes precedence).
        await context.RouteAsync("**/api.gameslabs.net/**", async route =>
            await route.FulfillAsync(new() { ContentType = "application/json", Body = "[]" }));

        var page = await context.NewPageAsync();
        return (context, page);
    }

    private async Task<string> WaitForListeningUrlAsync(TimeSpan timeout)
    {
        var listeningRegex = new Regex(@"Now listening on: (http://[^\s""]+)");
        var deadline = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            if (_app!.HasExited)
                throw new InvalidOperationException(
                    $"App process exited (code {_app.ExitCode}) before binding.\n--- Output ---\n{string.Join("\n", _stdoutBuffer)}");

            foreach (var line in _stdoutBuffer.ToArray())
            {
                var match = listeningRegex.Match(line);
                if (match.Success) return match.Groups[1].Value;
            }

            await Task.Delay(100);
        }

        throw new TimeoutException(
            $"App did not log a 'Now listening on' line within {timeout.TotalSeconds:F0}s.\n--- Output ---\n{string.Join("\n", _stdoutBuffer)}");
    }

    private static void SweepStaleTestDatabases()
    {
        try
        {
            var cutoff = DateTime.UtcNow.AddHours(-1);
            foreach (var pattern in new[] { "simuciokas-e2e-*.db", "simuciokas-tests-*.db" })
            {
                foreach (var path in Directory.EnumerateFiles(Path.GetTempPath(), pattern))
                {
                    if (File.GetLastWriteTimeUtc(path) < cutoff)
                    {
                        try { File.Delete(path); } catch { /* best effort */ }
                    }
                }
            }
        }
        catch { /* best effort */ }
    }

    private static string FindMainProjectRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "SimuciokasUK.csproj")))
            dir = dir.Parent;
        return dir?.FullName
            ?? throw new InvalidOperationException("Could not locate SimuciokasUK.csproj walking up from " + AppContext.BaseDirectory);
    }
}
