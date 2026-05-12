const urls = [
    `../Data/anagrams.json`,
    `../Data/beacons.json`,
    `../Data/chests.json`,
    `../Data/hotcold.json`,
    `../Data/maps.json`
];

const keyFromUrl = (url) => url.split("/").pop().split(".")[0];

const fetchOne = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
};

export const fetchMultipleUrls = async (urls) => {
    const settled = await Promise.allSettled(urls.map(fetchOne));
    const result = {};
    const failures = [];

    settled.forEach((outcome, index) => {
        const key = keyFromUrl(urls[index]);
        if (outcome.status === 'fulfilled') {
            result[key] = outcome.value;
        } else {
            result[key] = {};
            failures.push({ key, reason: outcome.reason });
            console.error(`Failed to load ${urls[index]}:`, outcome.reason);
        }
    });

    if (failures.length > 0 && typeof document !== 'undefined') {
        showLoadWarning(failures.map(f => f.key));
    }

    return result;
};

import { onDomReady } from './_dom.js';

const showLoadWarning = (failedKeys) => {
    onDomReady(() => {
        if (document.getElementById('minescape-data-warning')) return;
        const banner = document.createElement('div');
        banner.id = 'minescape-data-warning';
        banner.className = 'alert alert-warning m-3';
        banner.setAttribute('role', 'alert');
        banner.textContent =
            `Some lookup data failed to load (${failedKeys.join(', ')}). ` +
            `Search results for those features will be empty. Try refreshing.`;
        const target = document.querySelector('.continer-fluid') || document.body;
        target.prepend(banner);
    });
};

const data = await fetchMultipleUrls(urls);

export default data;
