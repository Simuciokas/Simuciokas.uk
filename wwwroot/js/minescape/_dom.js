// Run `fn` when the DOM is ready. With ESM bundles and top-level await in
// data.js, the rest of the bundle's modules may not finish their synchronous
// init until AFTER DOMContentLoaded has already fired — in which case a fresh
// `addEventListener('DOMContentLoaded')` would never run. Always check the
// current readyState first.

export function onDomReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
        fn();
    }
}
