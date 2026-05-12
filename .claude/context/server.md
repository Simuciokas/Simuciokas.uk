# Server composition

`Program.cs` is the single composition file. Read this when changing middleware order, DI registrations, endpoints, or environment-specific behavior.

## Pipeline order (matters)

```
ConfigureKestrel(AddServerHeader = false)
  → AddRazorPages
  → AddHealthChecks
  → AddScoped<FeedbackRepository, SuggestionRepository, IDbConnection>
  → Configure<UploadOptions, TurnstileOptions>
  → conditional: AddHttpClient<TurnstileVerifier> OR singleton NoOpTurnstileVerifier
Build()
  → UseExceptionHandler("/Error") + UseHsts  (non-Dev only)
  → UseSecurityHeaders   (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
  → UseStaticFiles (default mount, with SetCacheControl)
  → foreach alias: UseStaticFileAlias  (see static-files.md)
  → UseRewriter (Minescape/Map → Map, Minescape/MapNoOverlay → MapNoOverlay redirects)
  → UseRouting
  → UseRequestScopeLogging   (begins scope with RequestId/ClientIp/Path)
  → SchemaMigrator.Run       (one-time, on a scoped IDbConnection)
  → MapHealthChecks("/healthz")
  → MapSuggestionEndpoints
  → MapFeedbackEndpoints
  → MapRazorPages
  → Run()
```

Dead middleware that USED to be in the pipeline and was deliberately removed: `UseAuthorization`, `UseAntiforgery`, `UseResponseCaching`. Don't re-add unless you actually need them — there's no user auth, no antiforgery-protected forms (suggestion endpoint disables antiforgery explicitly), and Cloudflare handles HTTP caching at the edge.

TLS terminates at Cloudflared upstream; Kestrel listens HTTP only. `UseHttpsRedirection` is intentionally absent — it would log "Failed to determine the https port" on every boot.

## HTTP endpoints

All endpoints (except `/healthz` and Razor pages) live as extension methods in `Helpers/`:

- `GET /healthz` — built-in ASP.NET health checks. Returns `Healthy` 200. For Cloudflared health probe / external monitoring.
- `POST /api/v2/suggestion/{type}` — multipart form. See `uploads.md`.
- `POST /api/feedback` — accepts a rating. One row per IP per 30 days; silently no-ops if a recent row exists.
- `GET /api/feedback/needed` — boolean used by the UI to decide whether to prompt for feedback.

`{type}` must be in `SuggestionTypes.Allowed` (case-insensitive): `Map, Cypher, Anagram, Puzzle, Light, Beacon, Chest, HotCold, GE, Other`. When adding a new clue feature you must update that array AND the navigation radio buttons in `Pages/Minescape/Index.cshtml`. There is a `PageConsistencyTests` test that asserts this.

The legacy JSON `/api/suggestion/{type}` route was removed — only the v2 multipart route remains.

## Rate limiting / client IP

Cloudflare sits in front in prod. `Helpers/ClientIp.cs` resolves IP from `CF-Connecting-IP` header → `Connection.RemoteIpAddress` → `"unknown"`. Per-type suggestion rate limit comes from `SuggestionLimitPerHour` in configuration (default 5). The check happens BEFORE `ReadFormAsync` so a rate-limited client never pays the body-read cost.

## Cloudflare Turnstile (off by default)

`ITurnstileVerifier` has two implementations:
- `TurnstileVerifier` — typed `HttpClient`, only registered when `Turnstile.Enabled=true`.
- `NoOpTurnstileVerifier` — singleton, always returns `true`.

The suggestion endpoint calls the verifier after reading the form. To enable: set `Turnstile.Enabled=true`, populate `SiteKey`/`SecretKey` from Cloudflare dashboard → Turnstile, and add the Turnstile widget script + `<div class="cf-turnstile" data-sitekey="...">` to the suggestion modal so the token reaches the form as `cf-turnstile-response`.

## Logging

- Development: default console logger.
- Non-Development: `AddJsonConsole` with scopes enabled, UTC timestamps.
- `UseRequestScopeLogging` (`Helpers/RequestScopeLogging.cs`) wraps every request in a logger scope carrying `RequestId`, `ClientIp`, and `Path`, so endpoint log entries are correlatable.
- Suggestion accept / reject / rate-limit decisions are logged with named parameters (`SuggestionType`, `ClientIp`, `AttachmentCount`).

## Configuration sections

- `ConnectionStrings:DefaultConnection` — SQLite path. Fallback hardcoded to `Data Source=app.db`.
- `Upload:*` — `MaxFileSizeBytes`, `MaxTotalSizeBytes`, `MaxFilesPerRequest`, `AllowedExtensions`. See `uploads.md`.
- `Turnstile:*` — `Enabled`, `SiteKey`, `SecretKey`.
- `SuggestionLimitPerHour` — int, default 5.
