// Shared search-as-you-type widget used by anagram/beacon/chest.
//
// Wires an <input> to a results container, doing fuzzy search over a
// pre-built array of candidate strings on every keystroke, with keyboard
// navigation (ArrowUp/Down, Enter) and outside-click dismissal.
//
// Usage:
//   attachTypeahead({
//       inputId: 'AnagramInput',
//       resultsId: 'searchResultsAnagram',
//       candidates: Object.keys(database.anagrams),
//       onSelect: item => { ... },
//   });

import { fuzzyMatch } from './_search.js';

export function attachTypeahead({ inputId, resultsId, candidates, onSelect }) {
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    if (!input || !results) return;

    let currentIndex = -1;

    function renderResults(matches) {
        results.replaceChildren();
        if (matches.length === 0) {
            results.style.display = 'none';
            return;
        }
        results.style.display = 'block';
        for (const item of matches) {
            const div = document.createElement('div');
            div.textContent = item;
            div.addEventListener('click', () => {
                input.value = item;
                results.style.display = 'none';
                onSelect(item);
            });
            results.appendChild(div);
        }
    }

    function runSearch(query) {
        const lowered = query.toLowerCase();
        const matches = candidates.filter(c =>
            fuzzyMatch(lowered, c.toLowerCase())
        );
        renderResults(matches);
    }

    function updateHighlight() {
        const items = results.querySelectorAll('div');
        items.forEach(el => el.classList.remove('highlight'));
        if (currentIndex >= 0 && items[currentIndex]) {
            items[currentIndex].classList.add('highlight');
            items[currentIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    input.addEventListener('input', e => runSearch(e.target.value));

    input.addEventListener('click', e => {
        runSearch(e.target.value);
        currentIndex = -1;
    });

    input.addEventListener('keydown', e => {
        const items = results.querySelectorAll('div');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % items.length;
            updateHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            updateHighlight();
        } else if (e.key === 'Enter' && currentIndex >= 0) {
            e.preventDefault();
            items[currentIndex].click();
        }
    });

    window.addEventListener('click', e => {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.style.display = 'none';
        }
    });
}
