import database from './data.js';
import { attachTypeahead } from './_typeahead.js';
import { renderMapIframe } from './_solution.js';

function selectChest(item) {
    const dbItem = database.chests[item];
    if (!dbItem) return;

    document.getElementById('solution-chest-tip').innerText = dbItem.tip;

    const url = renderMapIframe('solution-chest-map', dbItem.location);
    const link = document.getElementById('solution-chest-url');
    link.href = url;
    link.innerText = dbItem.location;
}

attachTypeahead({
    inputId: 'ChestInput',
    resultsId: 'searchResultsChest',
    candidates: Object.keys(database.chests),
    onSelect: selectChest,
});
