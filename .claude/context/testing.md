# Testing

Read this before adding tests or debugging a flaky one.

## Layout

All tests are under `tests/SimuciokasUK.Tests/`:

- **Endpoint tests** — `FeedbackEndpointsTests.cs`, `SuggestionEndpointsTests.cs`. xUnit + `WebApplicationFactory<Program>` via `TestApplicationFactory`. Each test class gets a temp-file SQLite. ~40ms total.
- **Playwright E2E** — `PlaywrightSmokeTests.cs`. Marked `[Trait("Category", "E2E")]`. ~10s total. Drives Chromium via `PlaywrightFixture`.
- **Consistency tests** — `PageConsistencyTests.cs`. Asserts `SuggestionTypes.Allowed` matches the radio nav in `Pages/Minescape/Index.cshtml` AND the imports in `_entry.js`.

## Running

```powershell
dotnet test                              # all
dotnet test --filter "Category!=E2E"     # fast only
dotnet test --filter "Category=E2E"      # E2E only
```

Playwright requires a one-time browser install:

```powershell
pwsh tests/SimuciokasUK.Tests/bin/Debug/net8.0/playwright.ps1 install chromium
```

CI does this via `--with-deps chromium`.

## Playwright fixture

`PlaywrightFixture.cs` defaults to launching the built DLL as a subprocess on a random loopback port:

```
dotnet exec SimuciokasUK.dll --urls http://127.0.0.1:0
```

It scrapes the bound URL from the JSON log line, then points Chromium at it. The fixture also:

- Sweeps stale `simuciokas-{e2e,tests}-*.db` files older than 1h from `%TEMP%` on init.
- Registers a default `Playwright.RouteAsync` mock for `api.gameslabs.net/**` returning `[]`, so unrelated tests don't make real network calls. The GE test installs its own mock on top.

### Pointing at a remote target

Set `E2E_BASE_URL=https://dev.simuciokas.uk`. The fixture skips the subprocess and points Chromium at the remote URL.

Caveats when `IsExternalTarget` is true:
- The suggestion-submit test hits the production rate limiter (5/IP/type/hr). It tolerates a "limit reached" response so re-runs still pass.
- The GE test stays valid because it mocks `api.gameslabs.net` at the browser network layer.

## Fixtures (images)

Test image fixtures for the Puzzle and Light tabs live under `tests/SimuciokasUK.Tests/fixtures/`. They are copied into `bin/.../fixtures/` at build time via `<None Include="fixtures/**" CopyToOutputDirectory="..." />`.

## Race conditions worth remembering

- **Light test**: The 9-step upload flow races on `lightIndex` if uploads are issued back-to-back. The test waits for the next file input to become visible OR for `LightSolution` to appear (via `Task.WhenAny`) between steps. Don't switch this back to a fixed sleep.
- **Top-level await + DOMContentLoaded**: see `client-bundle.md`. Tests that rely on solvers being initialized should wait for a solver-specific selector to appear, not just `DOMContentLoaded`.

## JS tests

`package.json`'s `test` script is a placeholder. No JS unit tests exist yet.
