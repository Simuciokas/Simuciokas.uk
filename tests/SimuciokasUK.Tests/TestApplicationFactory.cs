using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace SimuciokasUK.Tests;

public sealed class TestApplicationFactory : WebApplicationFactory<Program>
{
    public string DbPath { get; } = Path.Combine(
        Path.GetTempPath(),
        $"simuciokas-tests-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseContentRoot(FindMainProjectRoot());

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={DbPath}",
                ["SuggestionLimitPerHour"] = "5",
                ["Upload:MaxFileSizeBytes"] = "1048576",
                ["Upload:MaxTotalSizeBytes"] = "2097152",
                ["Upload:MaxFilesPerRequest"] = "3",
                ["Upload:AllowedExtensions:0"] = ".png",
                ["Upload:AllowedExtensions:1"] = ".jpg",
            });
        });
    }

    private static string FindMainProjectRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "SimuciokasUK.csproj")))
            dir = dir.Parent;
        return dir?.FullName
            ?? throw new InvalidOperationException("Could not locate SimuciokasUK.csproj walking up from " + AppContext.BaseDirectory);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && File.Exists(DbPath))
        {
            try { File.Delete(DbPath); } catch { /* best effort */ }
        }
    }
}
