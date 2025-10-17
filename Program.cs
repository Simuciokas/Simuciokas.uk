using Dapper;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Data.Sqlite;
using SimuciokasUK.Models;
using SimuciokasUK.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddSingleton<FeedbackRepository>();

builder.Services.AddResponseCaching(options =>
{
    options.MaximumBodySize = 314572800;
    options.UseCaseSensitivePaths = true;
});

var app = builder.Build();

using (var conn = new SqliteConnection(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=app.db"))
{
    conn.Execute(@"CREATE TABLE IF NOT EXISTS Feedback (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        IPAddress TEXT,
        Rating INTEGER NOT NULL,
        Notes TEXT,
        Created TEXT NOT NULL
    );");
}

app.MapPost("/api/feedback", async (HttpContext http, Feedback feedback, FeedbackRepository repo, IConfiguration config) =>
{
    var ip = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    var recentFeedback = repo.Get(ip);

    if (recentFeedback != null && recentFeedback.Created > DateTime.UtcNow.AddDays(-30))
    {
        return Results.Ok(new { message = "Feedback already submitted recently." });
    }

    feedback.IPAddress = ip;
    feedback.Created = DateTime.UtcNow;
    repo.Insert(feedback);

    return Results.Ok(new { message = "Thank you for your feedback!" });
})
.WithName("SubmitFeedback");

app.MapGet("/api/feedback/needed", async (HttpContext http, FeedbackRepository repo, IConfiguration config) =>
{
    var ip = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";

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

app.UseRouting();
app.UseAuthorization();
app.MapRazorPages();
app.Run();