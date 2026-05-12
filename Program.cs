using Microsoft.AspNetCore.Rewrite;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Data.Sqlite;
using SimuciokasUK.Helpers;
using SimuciokasUK.Repositories;
using System.Data;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsDevelopment())
{
    builder.Logging.ClearProviders();
    builder.Logging.AddJsonConsole(options =>
    {
        options.IncludeScopes = true;
        options.UseUtcTimestamp = true;
    });
}

// Don't advertise the server software.
builder.WebHost.ConfigureKestrel(options => options.AddServerHeader = false);

builder.Services.AddRazorPages();
builder.Services.AddHealthChecks();
builder.Services.AddScoped<FeedbackRepository>();
builder.Services.AddScoped<SuggestionRepository>();
builder.Services.Configure<UploadOptions>(builder.Configuration.GetSection("Upload"));
builder.Services.Configure<TurnstileOptions>(builder.Configuration.GetSection("Turnstile"));

// Only wire the Turnstile HttpClient when it's actually enabled in config;
// otherwise the no-op verifier path doesn't need a backing client at all.
if (builder.Configuration.GetValue("Turnstile:Enabled", false))
{
    builder.Services.AddHttpClient<ITurnstileVerifier, TurnstileVerifier>();
}
else
{
    builder.Services.AddSingleton<ITurnstileVerifier, NoOpTurnstileVerifier>();
}

builder.Services.AddScoped<IDbConnection>(sp =>
    new SqliteConnection(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=app.db"));

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// TLS terminates at nginx/cloudflared upstream; Kestrel listens HTTP only, so
// app.UseHttpsRedirection() would just log "Failed to determine the https port".
app.UseSecurityHeaders();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = StaticFileAliasExtensions.SetCacheControl,
});

var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".7z"] = "application/x-msdownload";
provider.Mappings[".zip"] = "application/x-msdownload";
provider.Mappings[".db"] = "application/x-msdownload";
provider.Mappings[".json"] = "application/json";
provider.Mappings[".webp"] = "image/webp";
provider.Mappings[".svg"] = "image/svg+xml";

// Order matters: register parent aliases before more-specific children so the
// child mounts act as fallbacks when the broader physical root doesn't contain
// the requested path.
var aliases = new (string RequestPath, string PhysicalRelativePath)[]
{
    ("/Data",                 "wwwroot/databases"),
    ("/MapImages",            "wwwroot/img/maps"),
    ("/Icons",                "wwwroot/img/icons"),
    ("/MapNoOverlay",         "wwwroot"),
    ("/MapNoOverlay/Icons",   "wwwroot/img/icons"),
    ("/MapNoOverlay/Data",    "wwwroot/databases"),
    ("/Map",                  "wwwroot"),
    ("/Map/Icons",            "wwwroot/img/icons"),
    ("/Map/Data",             "wwwroot/databases"),
};
foreach (var (requestPath, physicalPath) in aliases)
{
    var absolute = Path.Combine(app.Environment.ContentRootPath, physicalPath);
    if (Directory.Exists(absolute))
        app.UseStaticFileAlias(requestPath, absolute, provider);
}

var rewriteOptions = new RewriteOptions()
    .AddRedirect(@"^Minescape/MapNoOverlay/?$", "MapNoOverlay", 301)
    .AddRedirect(@"^Minescape/Map/?$", "Map", 301);

app.UseRewriter(rewriteOptions);
app.UseRouting();
app.UseRequestScopeLogging();

using (var scope = app.Services.CreateScope())
{
    var connection = scope.ServiceProvider.GetRequiredService<IDbConnection>();
    SchemaMigrator.Run(connection);
}

app.MapHealthChecks("/healthz");
app.MapSuggestionEndpoints();
app.MapFeedbackEndpoints();
app.MapRazorPages();
app.Run();

public partial class Program { }
