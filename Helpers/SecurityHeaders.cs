namespace SimuciokasUK.Helpers
{
    public static class SecurityHeaders
    {
        public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        {
            return app.Use(async (context, next) =>
            {
                var headers = context.Response.Headers;

                if (!headers.ContainsKey("X-Content-Type-Options"))
                    headers["X-Content-Type-Options"] = "nosniff";

                if (!headers.ContainsKey("X-Frame-Options"))
                    headers["X-Frame-Options"] = "SAMEORIGIN";

                if (!headers.ContainsKey("Referrer-Policy"))
                    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

                if (!headers.ContainsKey("Permissions-Policy"))
                    headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";

                await next();
            });
        }
    }
}
