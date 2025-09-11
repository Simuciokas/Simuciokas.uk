import database from './data.js'

function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + 1
                )
            }
        }
    }

    return matrix[a.length][b.length]
}

function fuzzyMatch(query, text) {
    const queryWords = query.split(' ');
    const textWords = text.split(' ');

    return queryWords.every(qWord =>
        textWords.some(tWord => {
            return tWord.includes(qWord) || levenshteinDistance(qWord, tWord) <= 1;
        })
    );
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResultsChest')
    searchResults.innerHTML = ''

    if (results.length > 0) {
        searchResults.style.display = 'block'
        results.forEach(item => {
            const div = document.createElement('div')
            div.innerHTML = item
            div.addEventListener('click', () => {
                selectItem(item)
            });
            searchResults.appendChild(div)
        });
    } else {
        searchResults.style.display = 'none'
    }
}

function searchItems(query) {
    query = query.toLowerCase()
    let results = []
    let arr = Object.keys(database.chests)

    for (let i = 0; i < arr.length; i++) {
        const matches = fuzzyMatch(query, arr[i].toLowerCase());
        if (matches)
            results.push(arr[i])
    }

    displaySearchResults(results)
}

async function selectItem(item) {
    document.getElementById('ChestInput').value = item;
    document.getElementById('searchResultsChest').style.display = 'none';
    let dbItem = database.chests[item];
    let x = dbItem.location.split(", ")[0]
    let y = dbItem.location.split(", ")[1]
    let z = dbItem.location.split(", ")[2]

    let text = `https://map.minescape.net/#/${x}/${y}/${z}/-2/minescape/minescape`
    document.getElementById("solution-chest-tip").innerText = dbItem.tip;
    document.getElementById("solution-chest-url").href = text;
    document.getElementById("solution-chest-url").innerText = dbItem.location;
    document.getElementById("solution-chest-map").innerHTML = ""
    document.getElementById("solution-chest-map").innerHTML = `<iframe id=\"\" style=\"width:100%; height:650px;\" src=\"${text}\"></iframe>`
}

let currentIndex = -1;

document.getElementById('ChestInput').addEventListener('input', (e) => {
    searchItems(e.target.value);
});

document.getElementById('ChestInput').addEventListener('click', (e) => {
    searchItems(e.target.value);
    currentIndex = -1;
});

window.addEventListener('click', function (e) {
    if (!document.getElementById('ChestInput').contains(e.target) &&
        !document.getElementById('searchResultsChest').contains(e.target)) {
        document.getElementById('searchResultsChest').style.display = 'none';
    }
});

function updateHighlight(items) {
    items.forEach(item => item.classList.remove('highlight'));
    if (currentIndex >= 0) {
        items[currentIndex].classList.add('highlight');
        items[currentIndex].scrollIntoView({ block: 'nearest' });
    }
}

document.getElementById('ChestInput').addEventListener('keydown', (e) => {
    const items = document.getElementById('searchResultsChest').querySelectorAll("div");
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentIndex = (currentIndex + 1) % items.length;
        updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateHighlight(items);
    } else if (e.key === 'Enter') {
        if (currentIndex >= 0) {
            e.preventDefault();
            document.getElementById('ChestInput').value = items[currentIndex].textContent;
            items[currentIndex].click();
        }
    }
});