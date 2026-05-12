import database from './data.js';
import { renderMapIframe } from './_solution.js';

const MIN_CIPHER_LENGTH = 3;
const ALPHABET_SIZE = 26;

// The anagrams JSON has multiple entries per puzzle id; dedupe so each anagram
// id is considered once when matching shifts.
const uniqueAnagrams = (() => {
    const seen = new Set();
    return Object.values(database.anagrams).filter(val => {
        if (seen.has(val.id)) return false;
        seen.add(val.id);
        return true;
    });
})();

function caesarShift(str, amount) {
    if (amount < 0) return caesarShift(str, amount + ALPHABET_SIZE);

    let output = '';
    for (const c of str) {
        if (!/[a-z]/i.test(c)) {
            output += c;
            continue;
        }
        const code = c.codePointAt(0);
        if (code >= 65 && code <= 90) {
            output += String.fromCharCode(((code - 65 + amount) % ALPHABET_SIZE) + 65);
        } else if (code >= 97 && code <= 122) {
            output += String.fromCharCode(((code - 97 + amount) % ALPHABET_SIZE) + 97);
        } else {
            output += c;
        }
    }
    return output;
}

function findAnagramsForCipher(cipher) {
    if (cipher.length < MIN_CIPHER_LENGTH) return [];

    const matches = new Set();
    for (let shift = 0; shift < ALPHABET_SIZE; shift++) {
        const shifted = caesarShift(cipher, shift);
        for (const anagram of uniqueAnagrams) {
            if (anagram.id.startsWith(shifted)) matches.add(anagram);
        }
    }
    return [...matches];
}

const els = {
    name: document.getElementById('solution-cypher-name'),
    tip: document.getElementById('solution-cypher-tip'),
    url: document.getElementById('solution-cypher-url'),
    map: document.getElementById('solution-cypher-map'),
};

function renderNotFound() {
    els.name.innerText = 'not found';
    els.tip.innerText = 'not found';
    els.url.href = '';
    els.url.innerText = 'not found';
    els.map.replaceChildren();
}

function renderMultiple(list) {
    const names = list.map(x => x.id).join(', ');
    els.name.innerHTML = `Found multiple: <b></b>. Type more characters to get the right result`;
    els.name.querySelector('b').textContent = names; // avoid HTML injection via id text
    els.tip.innerText = 'not found';
    els.url.href = '';
    els.url.innerText = 'not found';
    els.map.replaceChildren();
}

function renderMatch(match) {
    els.name.innerText = match.id == null ? 'No name provided' : match.id;
    els.tip.innerText = match.tip;
    const url = renderMapIframe('solution-cypher-map', match.location);
    els.url.href = url;
    els.url.innerText = match.location;
}

document.getElementById('CypherInput').addEventListener('input', e => {
    const cipher = e.target.value.toLowerCase();
    const matches = findAnagramsForCipher(cipher);

    if (matches.length === 0) renderNotFound();
    else if (matches.length > 1) renderMultiple(matches);
    else renderMatch(matches[0]);
});
