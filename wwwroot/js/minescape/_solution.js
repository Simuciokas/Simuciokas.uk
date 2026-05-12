// Helpers for rendering clue-solution map iframes.
//
// The location string in the JSON DB is the format "x, y, z" (Minescape world
// coords). renderMapIframe builds the safe MapNoOverlay URL and replaces the
// target container's contents with a single <iframe>.

export function parseLocation(location) {
    const parts = location.split(', ');
    return { x: parts[0], y: parts[1], z: parts[2] };
}

export function buildMapUrl(location) {
    const { x, y, z } = parseLocation(location);
    return `MapNoOverlay/#/${encodeURIComponent(x)}/${encodeURIComponent(y)}/${encodeURIComponent(z)}/-2/minescape/minescape`;
}

// Replace the contents of `containerId` with an iframe pointing at the map.
// Uses DOM APIs rather than innerHTML interpolation so location data can't
// inject markup, even if a future DB row contains an unexpected character.
export function renderMapIframe(containerId, location) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const url = buildMapUrl(location);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('style', 'width:100%; height:650px;');
    iframe.setAttribute('src', url);

    container.replaceChildren(iframe);
    return url;
}
