# Suggestion uploads

Read this when changing the suggestion form, adding new clue features, or touching upload validation.

## Endpoint: `POST /api/v2/suggestion/{type}`

Defined in `Helpers/SuggestionEndpoints.cs`. Antiforgery is disabled on this route.

### Pipeline

1. **Resolve client IP** from `CF-Connecting-IP` (see `server.md`).
2. **Rate-limit check** BEFORE reading the form body — counts rows in `Suggestions` for this IP+type within the last hour. If ≥ `SuggestionLimitPerHour`, return 429 immediately. Saves the body-read cost on a rate-limited client.
3. **Validate `{type}`** against `SuggestionTypes.Allowed` (case-insensitive). 400 if not in allowlist.
4. **ReadFormAsync** to materialize the multipart payload.
5. **Turnstile verifier** runs (no-op if `Turnstile.Enabled=false`).
6. **Attachment validation** against `UploadOptions`:
   - `MaxFilesPerRequest` — too many files → 400
   - `MaxTotalSizeBytes` — sum of file sizes → 400
   - `MaxFileSizeBytes` — per-file → 400
   - `AllowedExtensions` — extension allowlist on `IFormFile.FileName` → 400
7. **Write files** to `uploads/` (relative to content root) as `<Guid>_<originalName>`. Comma-joined relative paths stored in `Suggestions.AttachmentPaths`.
8. **Insert** suggestion row via `SuggestionRepository`.
9. Log decision with named parameters `SuggestionType`, `ClientIp`, `AttachmentCount`.

### Allowed types

`SuggestionTypes.Allowed` (case-insensitive): `Map, Cypher, Anagram, Puzzle, Light, Beacon, Chest, HotCold, GE, Other`.

When adding a new clue feature:
1. Add the type to `SuggestionTypes.Allowed`.
2. Add a corresponding `<input type="radio" name="suggestionType" value="...">` in `Pages/Minescape/Index.cshtml` nav.
3. `PageConsistencyTests` asserts these two stay in sync.

### UploadOptions

Bound from the `Upload` config section:
- `MaxFileSizeBytes` — per-file cap.
- `MaxTotalSizeBytes` — aggregate cap across all files in the request.
- `MaxFilesPerRequest` — file count cap.
- `AllowedExtensions` — string array, lowercase, dot-prefixed (e.g. `[".png", ".jpg"]`).

### Attachment storage

`uploads/` directory at the content root. **Excluded from rsync deploys** (see `deploy.md`), so changes don't get wiped on deploy. Not served by any static file mount (intentional — no public access).

### Known gaps

- Extension allowlist trusts `IFormFile.FileName` — no magic-byte check.
- Filename written to disk is `Guid + "_" + Path.GetFileName(file.FileName)`. `Path.GetFileName` on Linux doesn't strip Windows separators, so `..\..\evil.png` is preserved verbatim. The Guid prefix keeps the path inside `uploads/` so traversal is contained, but the filename itself can contain garbage.
- No `RequestSizeLimit` attribute or `FormOptions.MultipartBodyLengthLimit` is set, so Kestrel's default 30 MB body limit applies — larger than the configured `MaxTotalSizeBytes`. Request is read fully before being rejected.

These are tracked but not yet fixed. If you change upload code, fix the relevant one while you're there.
