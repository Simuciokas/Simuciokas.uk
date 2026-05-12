import database from './data.js';
import { attachTypeahead } from './_typeahead.js';
import { renderMapIframe } from './_solution.js';

function capitalizeWords(str) {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function selectAnagram(item) {
    const dbItem = database.anagrams[item];
    if (!dbItem) return;

    document.getElementById('solution-anagram-tip').innerText = dbItem.tip;
    document.getElementById('solution-anagram-name').innerText =
        dbItem.id == null ? 'Name not set in database' : capitalizeWords(dbItem.id);

    const url = renderMapIframe('solution-anagram-map', dbItem.location);
    const link = document.getElementById('solution-anagram-url');
    link.href = url;
    link.innerText = dbItem.location;
}

attachTypeahead({
    inputId: 'AnagramInput',
    resultsId: 'searchResultsAnagram',
    candidates: Object.keys(database.anagrams),
    onSelect: selectAnagram,
});
