using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using SimuciokasUK.Models;
using SimuciokasUK.Repositories;

namespace SimuciokasUK.Helpers
{
    public static class SuggestionEndpoints
    {
        public static IEndpointRouteBuilder MapSuggestionEndpoints(this IEndpointRouteBuilder app)
        {
            app.MapPost("/api/v2/suggestion/{type}", async (
                string type,
                SuggestionRepository repo,
                IConfiguration configuration,
                IOptions<UploadOptions> uploadOptions,
                ITurnstileVerifier turnstile,
                IHostEnvironment env,
                ILoggerFactory loggerFactory,
                HttpContext http) =>
            {
                var logger = loggerFactory.CreateLogger("SuggestionEndpoint");

                if (!SuggestionTypes.TryNormalize(type, out var normalizedType))
                {
                    logger.LogInformation("Rejecting suggestion: invalid type {SuggestionType}", type);
                    return Results.BadRequest(new { message = "Invalid suggestion type." });
                }

                var ip = ClientIp.Resolve(http);

                var suggestionLimit = configuration.GetValue("SuggestionLimitPerHour", 5);
                if (repo.GetLastHourCount(ip, normalizedType) >= suggestionLimit)
                {
                    logger.LogWarning(
                        "Rate limit hit for {ClientIp} on {SuggestionType} (limit={Limit}/hr)",
                        ip, normalizedType, suggestionLimit);
                    return Results.BadRequest(new
                    {
                        message = $"Suggestion limit reached ({suggestionLimit} per hour). Please try again later."
                    });
                }

                var form = await http.Request.ReadFormAsync();

                var token = form["cf-turnstile-response"].ToString();
                if (!await turnstile.VerifyAsync(token, ip, http.RequestAborted))
                {
                    logger.LogInformation("Turnstile challenge failed for {ClientIp}", ip);
                    return Results.BadRequest(new { message = "Challenge failed. Please try again." });
                }

                var opts = uploadOptions.Value;

                var files = (form.Files ?? Enumerable.Empty<IFormFile>())
                    .Where(f => f.Length > 0)
                    .ToList();

                if (files.Count > opts.MaxFilesPerRequest)
                    return Results.BadRequest(new
                    {
                        message = $"Too many files (max {opts.MaxFilesPerRequest})."
                    });

                if (files.Sum(f => f.Length) > opts.MaxTotalSizeBytes)
                    return Results.BadRequest(new
                    {
                        message = $"Total upload exceeds {opts.MaxTotalSizeBytes} bytes."
                    });

                foreach (var file in files)
                {
                    if (file.Length > opts.MaxFileSizeBytes)
                        return Results.BadRequest(new
                        {
                            message = $"File '{file.FileName}' exceeds {opts.MaxFileSizeBytes} bytes."
                        });

                    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                    if (!opts.AllowedExtensions.Contains(ext))
                        return Results.BadRequest(new
                        {
                            message = $"File extension '{ext}' is not allowed."
                        });
                }

                var suggestion = new Suggestion
                {
                    Type = normalizedType,
                    Note = form["Note"].ToString(),
                    Created = DateTime.UtcNow,
                    IPAddress = ip,
                    AttachmentPaths = new List<string>(),
                };

                if (files.Count > 0)
                {
                    var uploadsPath = Path.Combine(env.ContentRootPath, "uploads");
                    Directory.CreateDirectory(uploadsPath);

                    foreach (var file in files)
                    {
                        var safeOriginalName = Path.GetFileName(file.FileName);
                        var uniqueFileName = $"{Guid.NewGuid()}_{safeOriginalName}";
                        var filePath = Path.Combine(uploadsPath, uniqueFileName);

                        await using var stream = new FileStream(filePath, FileMode.Create);
                        await file.CopyToAsync(stream);

                        suggestion.AttachmentPaths.Add($"/uploads/{uniqueFileName}");
                    }
                }

                repo.Insert(suggestion);
                logger.LogInformation(
                    "Suggestion accepted for {SuggestionType} from {ClientIp} with {AttachmentCount} attachment(s)",
                    normalizedType, ip, suggestion.AttachmentPaths.Count);
                return Results.Ok(new { message = "Suggestion submitted successfully." });
            })
            .DisableAntiforgery();

            return app;
        }
    }
}
