using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;

namespace SimuciokasUK.Helpers
{
    public static class StaticFileAliasExtensions
    {
        public static IApplicationBuilder UseStaticFileAlias(
            this IApplicationBuilder app,
            string requestPath,
            string absolutePhysicalPath,
            IContentTypeProvider provider)
        {
            return app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(absolutePhysicalPath),
                RequestPath = requestPath,
                ContentTypeProvider = provider,
                OnPrepareResponse = SetCacheControl,
            });
        }

        public static void SetCacheControl(StaticFileResponseContext ctx)
        {
            var path = ctx.File.PhysicalPath ?? string.Empty;

            // Files whose URL carries a content hash (?v=...) from asp-append-version,
            // or whose paths are versioned (lib/bootstrap-5.3.5-dist), can be cached forever.
            var hasQueryVersion = ctx.Context.Request.Query.ContainsKey("v");
            var isVersionedLib = path.Contains("bootstrap-5.3.5-dist");
            var isBundle = path.Contains($"{Path.DirectorySeparatorChar}dist{Path.DirectorySeparatorChar}");

            if (hasQueryVersion || isVersionedLib || isBundle)
            {
                ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=31536000, immutable";
            }
            else
            {
                ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=3600";
            }
        }
    }
}
