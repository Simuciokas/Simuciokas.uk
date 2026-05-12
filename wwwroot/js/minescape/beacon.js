import database from './data.js';
import { attachTypeahead } from './_typeahead.js';
import { renderMapIframe } from './_solution.js';

function selectBeacon(item) {
    const dbItem = database.beacons[item];
    if (!dbItem) return;

    document.getElementById('solution-beacon-tip').innerText = dbItem.tip;

    const url = renderMapIframe('solution-beacon-map', dbItem.location);
    const link = document.getElementById('solution-beacon-url');
    link.href = url;
    link.innerText = dbItem.location;
}

attachTypeahead({
    inputId: 'BeaconInput',
    resultsId: 'searchResultsBeacon',
    candidates: Object.keys(database.beacons),
    onSelect: selectBeacon,
});
