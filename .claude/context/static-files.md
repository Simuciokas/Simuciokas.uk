# Static file routing

Read this when adding a new client asset path or debugging a 404 on `/Data/...`, `/Map/...`, etc.

## Aliases table

Aliases are declared as a `(RequestPath, PhysicalRelativePath)` tuple array in `Program.cs` and wired via `app.UseStaticFileAlias(...)` in order. The same physical directories are mounted under multiple URL prefixes so legacy client paths and the Razor Pages routes both resolve.

Current entries:

| URL prefix | Physical path |
|---|---|
| `/Data` | `wwwroot/databases` |
| `/MapImages` | `wwwroot/img/maps` |
| `/Icons` | `wwwroot/img/icons` |
| `/MapNoOverlay` | `wwwroot` |
| `/MapNoOverlay/Icons` | `wwwroot/img/icons` |
| `/MapNoOverlay/Data` | `wwwroot/databases` |
| `/Map` | `wwwroot` |
| `/Map/Icons` | `wwwroot/img/icons` |
| `/Map/Data` | `wwwroot/databases` |

**Order matters.** Parent aliases (`/Map` → `wwwroot`) must come before more-specific children (`/Map/Data` → `wwwroot/databases`), so the child mounts act as fallbacks when the broader physical root doesn't contain the requested path.

Mounts are skipped (with no error) if their physical path doesn't exist — important for test runs and partial deployments.

## Adding a new alias

Append a row to the table in `Program.cs`. The helper itself (`Helpers/StaticFileAliasExtensions.cs`) handles the file provider + cache headers + content-type provider.

## Custom content types

A shared `FileExtensionContentTypeProvider` forces:
- `.7z`, `.zip`, `.db` → `application/x-msdownload` (browser will download instead of trying to render)
- `.json` → `application/json`
- `.webp` → `image/webp`
- `.svg` → `image/svg+xml`

## Cache-Control

`StaticFileAliasExtensions.SetCacheControl` runs on both the default static-file middleware and every aliased mount:

- `?v=...` query (from `asp-append-version`), OR path under `wwwroot/lib/bootstrap-5.3.5-dist`, OR anything under `wwwroot/dist/` → `Cache-Control: public, max-age=31536000, immutable`
- Everything else → `Cache-Control: public, max-age=3600`

The `_Layout.cshtml` and page-specific `<script>`/`<link>` tags use `asp-append-version="true"` for cache-busting, which combined with the immutable max-age gives one-fetch-forever per content hash and instant invalidation on deploy. Don't drop `asp-append-version` on assets that change.
