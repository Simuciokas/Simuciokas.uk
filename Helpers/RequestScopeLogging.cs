namespace SimuciokasUK.Helpers
{
    public static class RequestScopeLogging
    {
        public static IApplicationBuilder UseRequestScopeLogging(this IApplicationBuilder app)
        {
            return app.Use(async (context, next) =>
            {
                var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
                    .CreateLogger("RequestScope");

                using (logger.BeginScope(new Dictionary<string, object>
                {
                    ["RequestId"] = context.TraceIdentifier,
                    ["ClientIp"] = ClientIp.Resolve(context),
                    ["Path"] = context.Request.Path.Value ?? string.Empty,
                }))
                {
                    await next();
                }
            });
        }
    }
}
