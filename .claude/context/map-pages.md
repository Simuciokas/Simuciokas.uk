# Map pages (Leaflet + Overviewer)

Read this when changing `Pages/Map/Index.cshtml` or `Pages/MapNoOverlay/Index.cshtml`.

## Anatomy

Two near-identical pages render a Minecraft-style tile map via [Overviewer](https://overviewer.org/) + Leaflet:
- `/Map` — full map with overlay control visible.
- `/MapNoOverlay` — same map, but `overviewerConfig.map.hideOverlayControl = true`. Used as the iframe src by solver pages (so users see the location pin but not the overlay sidebar).

Both pages set `Layout = null` (no site chrome), inline `<head>` markup, and a `<div id="mcmap">` body.

The `<head>` scripts (all `defer`, all `asp-append-version="true"`):
1. `jquery.min.js`
2. `leaflet.js`
3. `overviewerConfig.js` — defines `overviewerConfig` global with tileset configs
4. `overviewer.js` — defines `overviewer.util.initialize`, `injectMarkerScript`, etc.
5. `baseMarkers.js` — calls `overviewer.util.injectMarkerScript('data/map/markersDB.js')` (and `markers.js`, `regions.js`)
6. `labels.js`
7. `MovingMarker.js`

Static data files (markers, tiles) live under `wwwroot/databases/map/` and are mounted at `/Data/map/...` and `/Map/Data/map/...`. Case-insensitive on the live host. See `static-files.md`.

## Critical timing detail (do NOT regress this)

`baseMarkers.js` runs at module load (after all `defer` scripts finish) and calls:

```js
overviewer.util.injectMarkerScript('data/map/markersDB.js');
overviewer.util.injectMarkerScript('data/map/markers.js');
overviewer.util.injectMarkerScript('data/map/regions.js');
```

`injectMarkerScript` dynamically creates `<script>` elements with `async = false` and appends them. These execute AFTER all `defer` scripts AND AFTER `DOMContentLoaded`, but **delay the `window.load` event** until they finish (per the HTML spec — dynamically-inserted scripts with `async=false` are added to the document's in-order list, which delays `load`).

Consequence: `overviewer.util.initialize()` MUST be called on `window.load`, not on `DOMContentLoaded`. If called earlier, the global `markers` / `markersDB` variables those scripts define aren't there yet, and `initialize()` silently skips the marker-rendering loop (`if (typeof markers !== 'undefined')`).

```html
<script>
    window.addEventListener('load', () => overviewer.util.initialize());
</script>
```

This was broken once already (changed to `DOMContentLoaded` during a refactor — markers vanished). Don't repeat it.

`MapNoOverlay/Index.cshtml` additionally sets `overviewerConfig.map.hideOverlayControl = true` on `DOMContentLoaded` (so it runs once `overviewerConfig.js` has executed, but before `initialize()`).

## Don't replace `<body onload>` blindly

The original code used `<body onload="overviewer.util.initialize()">` — which is equivalent to `window.addEventListener('load', ...)`. Both work. Don't change to `DOMContentLoaded`.
