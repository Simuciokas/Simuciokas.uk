using SimuciokasUK.Models;
using SimuciokasUK.Repositories;

namespace SimuciokasUK.Helpers
{
    public static class FeedbackEndpoints
    {
        public static IEndpointRouteBuilder MapFeedbackEndpoints(this IEndpointRouteBuilder app)
        {
            app.MapPost("/api/feedback", (HttpContext http, Feedback feedback, FeedbackRepository repo) =>
            {
                var ip = ClientIp.Resolve(http);
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
                var ip = ClientIp.Resolve(http);
                var recentFeedback = repo.Get(ip);

                return Results.Ok(new
                {
                    feedbackNeeded = recentFeedback == null ||
                                     recentFeedback.Created <= DateTime.UtcNow.AddDays(-30)
                });
            })
            .WithName("FeedbackNeeded");

            return app;
        }
    }
}
