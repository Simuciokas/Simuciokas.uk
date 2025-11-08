using Dapper;
using Microsoft.AspNetCore.Rewrite;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Data.Sqlite;
using SimuciokasUK.Models;
using SimuciokasUK.Repositories;
using System.Data;

string[] AllowedTypes = ["Map", "Cypher", "Anagram", "Puzzle", "Light", "Beacon", "Chest", "HotCold", "GE", "Other"];

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddSingleton<FeedbackRepository>();
builder.Services.AddSingleton<SuggestionRepository>();

builder.Services.AddResponseCaching(options =>
{
    options.MaximumBodySize = 314572800;
    options.UseCaseSensitivePaths = true;
});
builder.Services.AddTransient<IDbConnection>(sp =>
    new SqliteConnection(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=app.db"));

var app = builder.Build();

var _connection = app.Services.GetRequiredService<IDbConnection>();
_connection?.Execute(@"
    CREATE TABLE IF NOT EXISTS Feedback (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        IPAddress TEXT,
        Rating INTEGER NOT NULL,
        Notes TEXT,
        Created TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS Suggestions (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        IPAddress TEXT,
        Type TEXT,
        Notes TEXT,
        Created TEXT NOT NULL
    );
");

app.MapPost("/api/suggestion/{type}", (string type, Suggestion suggestion, SuggestionRepository repo, IDbConnection db, IConfiguration _configuration, HttpContext http) =>
{
    if (!AllowedTypes.Contains(type, StringComparer.InvariantCultureIgnoreCase))
        return Results.BadRequest(new { message = "Invalid suggestion type." });


    suggestion.IPAddress = http.Request.Headers["CF-Connecting-IP"].FirstOrDefault()
                           ?? http.Connection.RemoteIpAddress?.ToString()
                           ?? "unknown";

    suggestion.Type = AllowedTypes.First(t => t.Equals(type, StringComparison.InvariantCultureIgnoreCase));

    var suggestionLimit = _configuration.GetValue("SuggestionLimitPerHour", 5);
    if (repo.GetLastHourCount(suggestion.IPAddress, suggestion.Type) >= suggestionLimit)
        return Results.BadRequest(new { message = $"Suggestion limit reached ({suggestionLimit} per hour). Please try again later." });

    suggestion.Created = DateTime.UtcNow;
    
    repo.Insert(suggestion);

    return Results.Ok(new { message = "Suggestion submitted successfully." });
});


app.MapPost("/api/feedback", (HttpContext http, Feedback feedback, FeedbackRepository repo) =>
{
    var ip = http.Request.Headers["CF-Connecting-IP"].FirstOrDefault()
         ?? http.Connection.RemoteIpAddress?.ToString()
         ?? "unknown";

    var recentFeedback = repo.Get(ip);

    if (recentFeedback != null && recentFeedback.Created > DateTime.UtcNow.AddDays(-30))
        return Results.Ok(new { message = "Feedback already submitted recently." });

    feedback.IPAddress = ip;
    feedback.Created = DateTime.UtcNow;
    repo.Insert(feedback);

    return Results.Ok(new { message = "Thank you for your feedback!" });
})
.WithName("SubmitFeedback");

app.MapGet("/api/feedback/needed", (HttpContext http, FeedbackRepository repo) =>
{
    var ip = http.Request.Headers["CF-Connecting-IP"].FirstOrDefault()
         ?? http.Connection.RemoteIpAddress?.ToString()
         ?? "unknown";

    var recentFeedback = repo.Get(ip);

    return Results.Ok(new { feedbackNeeded = recentFeedback == null || recentFeedback.Created <= DateTime.UtcNow.AddDays(-30) });
})
.WithName("FeedbackNeeded");

app.UseResponseCaching();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".7z"] = "application/x-msdownload";
provider.Mappings[".zip"] = "application/x-msdownload";
provider.Mappings[".db"] = "application/x-msdownload";
provider.Mappings[".json"] = "application/json";
provider.Mappings[".webp"] = "image/webp";
provider.Mappings[".svg"] = "image/svg+xml";

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "databases")),
    RequestPath = "/Data",
    ContentTypeProvider = provider,
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "img", "maps")),
    RequestPath = "/MapImages",
    ContentTypeProvider = provider,
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "img", "icons")),
    RequestPath = "/Icons",
    ContentTypeProvider = provider,
});


app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")),
    RequestPath = "/MapNoOverlay",
    ContentTypeProvider = provider,
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "img", "icons")),
    RequestPath = "/MapNoOverlay/Icons",
    ContentTypeProvider = provider,
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "databases")),
    RequestPath = "/MapNoOverlay/Data",
    ContentTypeProvider = provider,
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")),
    RequestPath = "/Map",
    ContentTypeProvider = provider,
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "img", "icons")),
    RequestPath = "/Map/Icons",
    ContentTypeProvider = provider,
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "databases")),
    RequestPath = "/Map/Data",
    ContentTypeProvider = provider,
});

var options = new RewriteOptions()
    .AddRedirect(@"^Minescape/MapNoOverlay/?$", "MapNoOverlay", 301)
    .AddRedirect(@"^Minescape/Map/?$", "Map", 301);
app.UseRewriter(options);
app.UseRouting();
app.UseAuthorization();
app.MapRazorPages();
app.Run();