import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

const outDir = 'wwwroot/dist';

await rm(outDir, { recursive: true, force: true });

// Main bundle. Code-splitting on so dynamic imports (e.g. chart.js inside
// ge.js) land in their own chunks loaded only when the GE tab renders.
await build({
    entryPoints: ['wwwroot/js/minescape/_entry.js'],
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: outDir,
    entryNames: 'minescape-solvers',
    chunkNames: 'chunks/[name]-[hash]',
    assetNames: 'chunks/[name]-[hash]',
    sourcemap: 'external',                 // .map emitted, no //# sourceMappingURL comment
    minify: true,
    target: ['es2022'],
    legalComments: 'none',
    logLevel: 'info',
});

// Puzzle worker. esbuild doesn't bundle `new Worker(new URL(...))` references
// automatically, so we build the worker as its own entry next to the main
// bundle. puzzle-async-solver.js references it via a relative URL that
// resolves to /dist/puzzle-solver.worker.js at runtime.
await build({
    entryPoints: ['wwwroot/js/minescape/puzzle-solver.worker.js'],
    bundle: true,
    format: 'esm',
    outfile: `${outDir}/puzzle-solver.worker.js`,
    sourcemap: 'external',
    minify: true,
    target: ['es2022'],
    legalComments: 'none',
    logLevel: 'info',
});

console.log(`built ${outDir}/minescape-solvers.js + puzzle-solver.worker.js`);
