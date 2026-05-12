# CLAUDE.md

Guidance for Claude Code when working in this repository. Detailed context lives in [.claude/context/](.claude/context/) — read the relevant file before changing that area.

## Project

`SimuciokasUK` is a .NET 8 Razor Pages web app deployed at https://simuciokas.uk. The site hosts in-browser image-recognition / solver tools for a game ("Minescape" — a Minecraft-based Runescape recreation by GamesLabs), targeting the clue-scroll mini-game. Plus Leaflet + Overviewer map tile viewers. The server side is small: static solver UI/assets and feedback + suggestion APIs backed by SQLite. No user auth.

## Common commands

```powershell
dotnet watch run             # dev server, hot reload — http://localhost:5198 / https://localhost:7185
dotnet build
dotnet publish -c Release
npm run build                # rebuild the client JS bundle (esbuild); dotnet watch does NOT do this
dotnet test                                          # all tests
dotnet test --filter "Category!=E2E"                 # fast endpoint tests
dotnet test --filter "Category=E2E"                  # Playwright browser tests
```

Production Kestrel binds http://localhost:5001 (from `appsettings.json`).

## Layout map

| Area | Path | Context file |
|---|---|---|
| Server composition, DI, endpoints, middleware | [Program.cs](Program.cs), [Helpers/](Helpers/) | [.claude/context/server.md](.claude/context/server.md) |
| Static file aliases + Cache-Control | [Program.cs](Program.cs), [Helpers/StaticFileAliasExtensions.cs](Helpers/StaticFileAliasExtensions.cs) | [.claude/context/static-files.md](.claude/context/static-files.md) |
| SQLite, Dapper, schema migrations | [Helpers/SchemaMigrator.cs](Helpers/SchemaMigrator.cs), [Repositories/](Repositories/), [Models/](Models/) | [.claude/context/persistence.md](.claude/context/persistence.md) |
| Suggestion upload pipeline | [Helpers/SuggestionEndpoints.cs](Helpers/SuggestionEndpoints.cs), [Helpers/UploadOptions.cs](Helpers/UploadOptions.cs) | [.claude/context/uploads.md](.claude/context/uploads.md) |
| Client JS bundle (esbuild, modules, timing) | [build.mjs](build.mjs), [wwwroot/js/minescape/](wwwroot/js/minescape/) | [.claude/context/client-bundle.md](.claude/context/client-bundle.md) |
| Solver modules + shared helpers | [wwwroot/js/minescape/](wwwroot/js/minescape/) | [.claude/context/solvers.md](.claude/context/solvers.md) |
| Map pages (Leaflet/Overviewer timing!) | [Pages/Map/](Pages/Map/), [Pages/MapNoOverlay/](Pages/MapNoOverlay/) | [.claude/context/map-pages.md](.claude/context/map-pages.md) |
| Tests (endpoint, Playwright, consistency) | [tests/SimuciokasUK.Tests/](tests/SimuciokasUK.Tests/) | [.claude/context/testing.md](.claude/context/testing.md) |
| Deploy flow, Cloudflare, environments | — | [.claude/context/deploy.md](.claude/context/deploy.md) |

## Top-level directory cheat sheet

- `Program.cs` — server composition (the only one).
- `Helpers/` — endpoint maps, schema migrator, security headers, request-scope logging, static-file alias helper, IP/Turnstile/upload helpers.
- `Models/`, `Repositories/` — Dapper POCOs + thin DB wrappers.
- `Pages/` — Razor Pages: `Index` (landing), `Minescape/Index` (clue helper SPA), `Map/Index`, `MapNoOverlay/Index`, `Privacy`, `Error`.
- `wwwroot/js/minescape/` — solver source modules, bundled by esbuild via `_entry.js`.
- `wwwroot/js/map/` — Leaflet + Overviewer assets, served directly (not bundled).
- `wwwroot/databases/` — JSON lookup tables and zipped SQLite tile DBs that the client fetches at runtime.
- `tests/SimuciokasUK.Tests/` — xUnit endpoint tests + Playwright E2E.

## Rules that bite

These come up repeatedly — call out the matching context file before editing.

- **Map pages must call `overviewer.util.initialize()` on `window.load`**, not `DOMContentLoaded`. Markers are loaded by dynamically-injected scripts that only finish between those two events. See [map-pages.md](.claude/context/map-pages.md).
- **`IDbConnection` and repositories are scoped, not singleton.** Microsoft.Data.Sqlite connections aren't safe to share across concurrent requests. See [persistence.md](.claude/context/persistence.md).
- **JS bundle runs in strict mode** (loaded as `<script type="module">`). Implicit globals throw. Use `onDomReady` from `_dom.js` instead of `DOMContentLoaded` because `data.js` uses top-level await. See [client-bundle.md](.claude/context/client-bundle.md).
- **`npm run build` is not automatic.** `dotnet watch run` does not rebuild the JS bundle. Run it manually after editing anything under `wwwroot/js/minescape/`.
- **Static file alias order matters.** Parent prefixes before children. See [static-files.md](.claude/context/static-files.md).
- **Adding a new clue feature**: update `SuggestionTypes.Allowed`, the radio nav in `Pages/Minescape/Index.cshtml`, and import in `_entry.js`. `PageConsistencyTests` will fail if any of these drift.
- **`asp-append-version="true"`** on static `<link>`/`<script>` tags is what makes `Cache-Control: immutable` safe. Don't strip it.
