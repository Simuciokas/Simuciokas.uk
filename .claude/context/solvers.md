# Solver modules

Read this when adding/editing a clue solver under `wwwroot/js/minescape/`.

Each solver is an independent feature module imported by `_entry.js`. The only shared mutable state is the `database` object exported from `data.js`.

## Module table

| Module | What it does |
|---|---|
| [`anagram.js`](../../wwwroot/js/minescape/anagram.js) | Typeahead over `anagrams.json` keys. Fuzzy match against an anagram phrase (e.g. "Lilal" → matches "lalli"). On select, looks up the decoded NPC id, location, tip; renders an iframe MapNoOverlay pin and a clickable link. Uses the shared `_typeahead.js` widget. |
| [`beacon.js`](../../wwwroot/js/minescape/beacon.js) | Typeahead over `beacons.json` keys. Same widget as anagram — selecting an entry renders the location iframe + tip. |
| [`chest.js`](../../wwwroot/js/minescape/chest.js) | Typeahead over `chests.json`. Same widget, same output shape. |
| [`cypher.js`](../../wwwroot/js/minescape/cypher.js) | Caesar-cipher decoder. As user types, runs all 26 shifts against the unique anagram ids; if exactly one matches, renders the solution (name, location, iframe). Multi-match shows "type more characters". Pre-computes the unique-anagrams array once at module load. |
| [`map.js`](../../wwwroot/js/minescape/map.js) | Difficulty-tier radio (Beginner / Easy / Medium / Hard / Master). Renders one card per matching `maps.json` entry; clicking a card swaps in the corresponding MapNoOverlay iframe. |
| [`hotcold.js`](../../wwwroot/js/minescape/hotcold.js) | Iterative narrowing. User pastes a `/Map/#/x/y/z/...` URL and a "feet to target" number; clicking Solve filters `hotcold.json` to entries within step-distance of the given distance (tiered thresholds per difficulty). Each subsequent solve narrows the suggestions set. Renders cards; selecting one drops a MapNoOverlay iframe. |
| [`puzzle.js`](../../wwwroot/js/minescape/puzzle.js) | Puzzle-box (15-tile sliding-puzzle) solver. Accepts an image via file input, drag-drop, or clipboard paste. Decodes the screenshot into a 4×4 grid via canvas pixel inspection, then dispatches to a web worker that runs an IDA* search with pattern-database heuristics (see `puzzle-algorithm.js` and `puzzle-solver.worker.js`). The worker uses `fflate` to load pre-computed pattern DBs. Solution moves are drawn step-by-step on a result canvas. |
| [`light.js`](../../wwwroot/js/minescape/light.js) | Light-box (light/dark grid) solver. Sequential 9-step upload flow: Initial view, then one screenshot per labelled button A–H. After each upload, OCRs the 5×5 light grid by sampling pixel positions. Computes XOR matrices, then searches a precomputed list of button-combination strings for one that XORs the final state into the all-on matrix. May short-circuit via `TrySolveMidWay` once enough state is captured (often after 6–7 inputs). |
| [`ge.js`](../../wwwroot/js/minescape/ge.js) | Grand Exchange browser. Hits `https://api.gameslabs.net/1.0.0/exchange/` (item list), `/exchange/orders/MS.*/sell`, `/exchange/orders/MS.*/buy` at startup, using `Promise.allSettled` — any failed endpoint surfaces a banner inside the GE tab and the rest still works. Renders the merged buy+sell list, sortable by clicking the column header. Search box does fuzzy or exact match (toggle) over symbol+name. Selecting an item fetches the per-item buy/sell history and renders **candlestick + volume charts** via `chart.js` + `chartjs-chart-financial` — these libraries are **dynamic-imported on first chart render** so the main bundle stays ~47 KB instead of 350+. The theme observer recolors charts when the user flips between light/dark via a `MutationObserver`. |
| [`tabs.js`](../../wwwroot/js/minescape/tabs.js) | Visibility state machine for the radio nav. Hides all `.main` divs except the current one, syncs `window.location.hash` on tab change, and on initial load applies the hash if present. |
| [`data.js`](../../wwwroot/js/minescape/data.js) | Fetches the five JSON lookup tables at module init (`Promise.allSettled`), exports `database` object keyed by name. Shows a top-of-page warning banner on partial failures. Module init uses **top-level await** — see `client-bundle.md`. |

## Shared helper modules

- [`_search.js`](../../wwwroot/js/minescape/_search.js) — `levenshteinDistance`, `fuzzyMatch`, `exactMatch`, `normalize`. Used by anagram/beacon/chest typeaheads and by `ge.js`.
- [`_typeahead.js`](../../wwwroot/js/minescape/_typeahead.js) — `attachTypeahead({inputId, resultsId, candidates, onSelect})`. Wires input + results + keyboard nav + outside-click for the 3 simple typeahead solvers.
- [`_solution.js`](../../wwwroot/js/minescape/_solution.js) — `renderMapIframe(containerId, location)` builds a safe MapNoOverlay iframe (`createElement` + `setAttribute` + `encodeURIComponent`, never `innerHTML` interpolation). Use this rather than building iframe markup by hand.
- [`_dom.js`](../../wwwroot/js/minescape/_dom.js) — `onDomReady(fn)` (handles top-level-await timing, see `client-bundle.md`).
- [`_chart.js`](../../wwwroot/js/minescape/_chart.js) — isolated Chart.js setup with static named imports for tree-shaking. Only imported via `await import(...)` from `ge.js`.

## Pattern for new typeahead-style solvers

`anagram.js` (~30 lines) is the template:

1. Build a `candidates` array from the relevant slice of `database`.
2. Call `attachTypeahead({...})` with an `onSelect` callback.
3. In `onSelect`, call `renderMapIframe(containerId, location)` and set the solution DOM fields.

`anagram.js`, `beacon.js`, and `chest.js` are nearly identical and would collapse into a single factory call cleanly — flagged for future refactor.
