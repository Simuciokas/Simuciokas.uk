# Client JS bundle

Read this before editing anything under `wwwroot/js/minescape/` or touching `build.mjs`.

## Build

```powershell
npm run build
```

Drives esbuild via its Node API (`build.mjs`). Output:

- `wwwroot/dist/minescape-solvers.js` (~47 KB, ES module, minified, hidden source maps)
- `wwwroot/dist/chunks/*` — auto-split chunks. `chart.js` + plugins land here (~310 KB total), only fetched when the GE tab actually renders a chart.
- `wwwroot/dist/puzzle-solver.worker.js` — built as a **separate entry**. esbuild doesn't auto-bundle workers; the second `build()` call in `build.mjs` handles it.

`dotnet watch run` does **NOT** rebuild this. Run `npm run build` manually after editing JS.

Target is `es2022` for top-level await support.

## Strict mode (important)

The Razor page loads the bundle with `<script type="module">`. ES modules **run in strict mode unconditionally**. Implicit globals (`i = 1` without `let`/`var`) throw `ReferenceError`. There has been at least one of these bugs in `light.js` — watch for it when porting old code into new modules.

## Module init timing

`data.js` uses top-level `await` to fetch the JSON lookup tables before the rest of the modules import it. Because of this, `DOMContentLoaded` may fire BEFORE the rest of the modules finish their synchronous init.

**Always use the `onDomReady(fn)` helper in [`_dom.js`](wwwroot/js/minescape/_dom.js) for any module-init code that needs the DOM** — it inspects `document.readyState` and either attaches a listener or invokes the function directly. Don't write bare `document.addEventListener('DOMContentLoaded', ...)` inside a feature module — by the time it runs, the event may already have fired.

## Page wiring

The Minescape page is a single Razor page (`Pages/Minescape/Index.cshtml`) with one `<div class="main">` per feature. `tabs.js` swaps visibility based on radio buttons and syncs `location.hash`. The bundle loads via `<script type="module" src="~/dist/minescape-solvers.js" asp-append-version="true">`.

`_entry.js` aggregates all feature modules — imports happen at module load, before any DOM is touched. Order matters only for `data.js` (must be imported first by anything depending on `database`).

## Worker

`puzzle-async-solver.js` instantiates the worker:

```js
new Worker(new URL('./puzzle-solver.worker.js', import.meta.url), { type: 'module' })
```

The `.js` extension and `{ type: 'module' }` are both required for esbuild's worker output to load correctly. The worker uses `fflate` to decompress pre-computed pattern DBs.

## Chart.js lazy load

`ge.js`'s `loadChartLibrary()` does `await import('./_chart.js')` on first chart render. `_chart.js` uses static named imports (`Chart`, `TimeScale`, `LinearScale`, `CategoryScale`, `Title`, `Tooltip`, `Legend` + `CandlestickController`, `CandlestickElement`, zoom plugin) so esbuild can tree-shake. Keep these as static imports — switching to `Chart from 'chart.js/auto'` would pull in every controller and balloon the chunk back to ~500 KB.

## CDN cache busting

`asp-append-version="true"` appends `?v=<contenthash>` to every bundle/asset URL the Razor pages emit. Combined with `Cache-Control: immutable` from `SetCacheControl` (see `static-files.md`), this gives one-fetch-forever per content hash and instant invalidation on deploy. Don't drop `asp-append-version` on `~/dist/minescape-solvers.js` or the `~/lib/...` script/CSS tags.
