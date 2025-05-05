import {
    Chart,
    TimeScale,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import 'chartjs-adapter-luxon';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import ZoomPlugin from 'chartjs-plugin-zoom';

Chart.register(
    TimeScale,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
    CandlestickController,
    CandlestickElement,
    ZoomPlugin
);

const units = [
    { value: 1e15, symbol: 'P' },  // Peta
    { value: 1e12, symbol: 'T' },  // Tera
    { value: 1e9, symbol: 'B' },  // Billion
    { value: 1e6, symbol: 'M' },  // Million
    { value: 1e3, symbol: 'k' }   // Thousand
];
let initialOffers = [];
let items = [];
const userCache = {};
let candleChart, volumeChart;
const buyIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4caf50" width="20" height="20">
  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10-6V5H6v7H4v2h2v7h2v-7h8v7h2v-7h2v-2h-2zm-2 0H8V7h8v5z"/>
</svg>`;

const sellIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f44336" width="20" height="20">
  <path d="M19 13H5v-2h14v2z"/>
</svg>`;

const select = document.getElementById('geItemsPerType');
for (let i = 10; i <= 300; i += 10) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    if (i === 10) option.selected = true;
        select.appendChild(option);
}

let showingInitial = true;

Startup();

async function ViewInitialOffers() {
    try {
        showingInitial = true
        const settings = GetSettings()
        const pages = Array.from({ length: settings.pageRange }, (_, i) => settings.page + i)

        const sellRequests = (settings.mode === 'sell' || settings.mode === 'both')
            ? pages.map(p => fetch(`https://api.gameslabs.net/1.0.0/exchange/orders/MS.*/sell?page=${p}`))
            : []

        const buyRequests = (settings.mode === 'buy' || settings.mode === 'both')
            ? pages.map(p => fetch(`https://api.gameslabs.net/1.0.0/exchange/orders/MS.*/buy?page=${p}`))
            : []
        

        const allRequests = [...sellRequests, ...buyRequests];
        const responses = await Promise.all(allRequests);
        const jsonData = await Promise.all(responses.map(res => res.json()));

        const combinedOffers = jsonData.flat().map(entry => ({
            symbol: entry.symbol,
            type: entry.type,
            price: entry.price,
            amount: entry.amount,
            user: entry.user,
            timestamp: entry.timestamp
        }));

        initialOffers = combinedOffers.sort((a, b) => b.timestamp - a.timestamp);

        await displayInitial();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function Startup() {
    try {
        const [exchangeRes, sellRes, buyRes] = await Promise.all([
            fetch('https://api.gameslabs.net/1.0.0/exchange/'),
            fetch('https://api.gameslabs.net/1.0.0/exchange/orders/MS.*/sell'),
            fetch('https://api.gameslabs.net/1.0.0/exchange/orders/MS.*/buy')
        ]);

        const [exchangeData, sellData, buyData] = await Promise.all([
            exchangeRes.json(),
            sellRes.json(),
            buyRes.json()
        ]);

        items = exchangeData.map(entry => ({
            symbol: entry.symbol,
            name: entry.buy.name
        }));

        initialOffers = [...sellData, ...buyData].map(entry => ({
            symbol: entry.symbol,
            type: entry.type,
            price: entry.price,
            amount: entry.amount,
            user: entry.user,
            timestamp: entry.timestamp
        })).sort((a, b) => b.timestamp - a.timestamp);

        await displayInitial();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[_\s]+/g, ' ')
        .trim();
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

function exactMatch(query, text) {
    const queryWords = query.split(' ');
    const textWords = text.split(' ');

    return queryWords.every(qWord =>
        textWords.some(tWord => tWord.includes(qWord))
    );
}

function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + 1
                );
            }
        }
    }

    return matrix[a.length][b.length];
}

function searchItems(query) {
    const normalizedQuery = normalize(query);
    const useFuzzy = document.getElementById('fuzzySearchToggle').checked;

    const results = items.filter(item => {
        const normalizedSymbol = normalize(item.symbol);
        const normalizedName = normalize(item.name);

        if (useFuzzy) {
            return fuzzyMatch(normalizedQuery, normalizedSymbol) || fuzzyMatch(normalizedQuery, normalizedName);
        } else {
            return exactMatch(normalizedQuery, normalizedSymbol) || exactMatch(normalizedQuery, normalizedName);
        }
    });

    displaySearchResults(results);
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';

    if (results.length > 0) {
        searchResults.style.display = 'block';
        results.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item.name;
            div.addEventListener('click', () => {
                selectItem(item);
            });
            searchResults.appendChild(div);
        });
    } else {
        searchResults.style.display = 'none';
    }
}


async function selectItem(item) {
    document.getElementById('searchInput').value = item.name;
    document.getElementById('searchResults').style.display = 'none';

    try {
        const [detailsRes, candlesRes] = await Promise.all([
            fetch(`https://api.gameslabs.net/1.0.0/exchange/symbol/${item.symbol}`),
            fetch(`https://api.gameslabs.net/1.0.0/exchange/symbol/${item.symbol}/candles?timeFrame=day`)
        ]);

        const detailsData = await detailsRes.json();
        const candlesData = await candlesRes.json();

        await displayDetails(detailsData);
        displayCandlestickChart(candlesData, item.name);

    } catch (error) {
        console.error('Error fetching item details or candles:', error);
    }
}

async function resolveUser(userId) {
    if (userCache[userId]) {
        return userCache[userId];
    }
    try {
        const response = await fetch(`https://api.gameslabs.net/1.0.0/users/${userId}`);
        const data = await response.json();
        userCache[userId] = data.name;
        return data.name;
    } catch (error) {
        console.error('Error resolving user:', error);
        return userId;
    }
}

function formatNumber(num) {

    for (let i = 0; i < units.length; i++) {
        if (num >= units[i].value) {
            return (num / units[i].value).toFixed(2).replace(/\.0$/, '') + units[i].symbol;
        }
    }

    return num.toString();
}

async function displayInitial() {
    document.getElementById('candlesChart').style.display = 'none';
    document.getElementById('volumeChart').style.display = 'none';
    const table = document.getElementById('detailsTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    await Promise.all(
        [...new Set(initialOffers.map(entry => entry.user))].map(entry => resolveUser(entry))
    );

    for (const entry of initialOffers) {
        const row = document.createElement('tr');
        const username = await resolveUser(entry.user);
        const typeIcon = entry.type === 'buy' ? buyIcon : sellIcon;
        const item = items.find(i => i.symbol === entry.symbol);
        const itemName = item ? item.name : entry.symbol;
        row.innerHTML = `
          <td>
                ${typeIcon}
                <span>${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</span>
            </td>
          <td>${itemName}</td>
          <td>${formatNumber(entry.amount)}</td>
          <td>${formatNumber(entry.price)}</td>
          <td>${username}</td>
          <td data-timestamp="${entry.timestamp}">${new Date(entry.timestamp).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    }

    table.style.display = 'table';
}

async function displayDetails(data) {
    showingInitial = false
    document.getElementById('detailsTableItem').style.display = 'none'
    document.getElementById('geLatestFilter').style.display = 'none'
    document.getElementById('geNavigation').classList.remove("d-flex")
    document.getElementById('geNavigation').classList.add("d-none")
    document.getElementById('viewLatestOffers').style.display = ''
    const table = document.getElementById('detailsTable')
    const tbody = table.querySelector('tbody')
    tbody.innerHTML = ''

    const combined = [...data.buy, ...data.sell]

    await Promise.all(
        [...new Set(initialOffers.map(entry => entry.user))].map(entry => resolveUser(entry))
    )

    for (const entry of combined) {
        const row = document.createElement('tr')
        const username = await resolveUser(entry.user)
        const typeIcon = entry.type === 'buy' ? buyIcon : sellIcon
        row.innerHTML = `
          <td style="display: flex; align-items: center; gap: 6px;">
                ${typeIcon}
                <span>${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</span>
            </td>
          <td>${formatNumber(entry.amount)}</td>
          <td>${formatNumber(entry.price)}</td>
          <td>${username}</td>
          <td data-timestamp="${entry.timestamp}">${new Date(entry.timestamp).toLocaleString()}</td>
        `
        tbody.appendChild(row)
    }

    table.style.display = 'table'
}

const observer = new MutationObserver(() => {
    const newColors = getThemeColors();

    if (candleChart) {
        candleChart.options.scales.x.ticks.color = newColors.textColor;
        candleChart.options.scales.x.grid.color = newColors.gridColor;
        candleChart.options.scales.y.ticks.color = newColors.textColor;
        candleChart.options.scales.y.grid.color = newColors.gridColor;
        candleChart.options.plugins.tooltip.bodyColor = newColors.textColor;
        candleChart.options.plugins.tooltip.titleColor = newColors.textColor;
        candleChart.update();
    }

    if (volumeChart) {
        volumeChart.options.scales.x.ticks.color = newColors.textColor;
        volumeChart.options.scales.x.grid.color = newColors.gridColor;
        volumeChart.options.scales.y.ticks.color = newColors.textColor;
        volumeChart.options.scales.y.grid.color = newColors.gridColor;
        volumeChart.options.scales.y.title.color = newColors.textColor;
        volumeChart.options.plugins.tooltip.bodyColor = newColors.textColor;
        volumeChart.options.plugins.tooltip.titleColor = newColors.textColor;
        volumeChart.update();
    }
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme']
});

function isDarkTheme() {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark';
}

function getThemeColors() {
    const isDark = isDarkTheme();
    return {
        textColor: isDark ? '#ffffff' : '#000000',
        textColorPopup: isDark ? '#ffffff' : '#ffffff',
        gridColor: isDark ? '#444444' : '#dddddd',
        bgColor: isDark ? '#1e1e1e' : '#ffffff'
    };
}

function displayCandlestickChart(candles, name) {
    const colors = getThemeColors();

    const ctx = document.getElementById('candlesChart').getContext('2d');

    const formattedData = candles.map(candle => {
        let open = candle.open;
        let close = candle.close;

        let adjustedOpen = open;
        let adjustedClose = close;
        if (open === close) {
            adjustedOpen += 0.5;
            adjustedClose -= 0.5;
        }

        return {
            x: candle.timestamp,
            o: adjustedOpen,
            h: candle.high,
            l: candle.low,
            c: adjustedClose,
            realO: open,
            realC: close
        };
    });

    if (candleChart) {
        candleChart.destroy();
    }

    candleChart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: ``,
                data: formattedData,
                color: {
                    up: '#00ff00',
                    down: '#ff0000',
                    unchanged: '#999'
                }
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                },
                y: {
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const dataPoint = context.raw;
                            return [
                                `Open: ${dataPoint.realO}`,
                                `High: ${dataPoint.h}`,
                                `Low: ${dataPoint.l}`,
                                `Close: ${dataPoint.realC}`
                            ];
                        }
                    },
                    bodyColor: colors.textColorPopup,
                    titleColor: colors.textColorPopup
                }
            },
            elements: {
                candlestick: {
                    borderWidth: {
                        top: 2,
                        bottom: 2
                    }
                }
            }
        }
    });

    document.getElementById('candlesChart').style.display = 'block';

    const volumectx = document.getElementById('volumeChart').getContext('2d');

    const formattedVolumeData = candles.map(candle => ({
        x: candle.timestamp,
        y: candle.volume
    }));

    if (volumeChart) {
        volumeChart.destroy();
    }

    volumeChart = new Chart(volumectx, {
        type: 'bar',
        data: {
            datasets: [{
                label: `Volume`,
                data: formattedVolumeData,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        color: colors.textColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume'
                    },
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                }
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        mode: 'x',
                        onZoom: syncZoom
                    },
                    pan: {
                        enabled: true,
                        mode: 'x',
                        onPan: syncZoom
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    bodyColor: colors.textColor,
                    titleColor: colors.textColor
                }
            }
        }
    });

    document.getElementById('volumeChart').style.display = 'block';
}

function syncZoom({ chart }) {
    const min = chart.scales.x.min;
    const max = chart.scales.x.max;

    if (chart === candleChart) {
        volumeChart.options.scales.x.min = min;
        volumeChart.options.scales.x.max = max;
        volumeChart.update('none');
    } else if (chart === volumeChart) {
        candleChart.options.scales.x.min = min;
        candleChart.options.scales.x.max = max;
        candleChart.update('none');
    }
}

function GetSettings() {
    const page = parseInt(document.querySelector('#geNavigation button:not(.generic).active')?.textContent) || 1
    const pageRange = parseInt(document.getElementById('geItemsPerType')?.value) / 10 || 1
    const selectedRadio = document.querySelector('input[name="GE"]:checked')
    let mode = 'both';
    if (selectedRadio) {
        if (selectedRadio.id === 'geSell') mode = 'sell'
        else if (selectedRadio.id === 'geBuy') mode = 'buy'
    }
    return { page, pageRange, mode }
}

function UpdateLabels() {
    const genericButtons = document.querySelectorAll('#geNavigation .generic')
    let currentPage = parseInt(document.querySelector('#geNavigation button:not(.generic).active')?.textContent) || 1
    const firstButton = genericButtons[0]
    const previousButton = genericButtons[1]

    firstButton.disabled = currentPage <= 1
    previousButton.disabled = currentPage <= 1
}

const genericButtons = document.querySelectorAll('#geNavigation .generic');
genericButtons.forEach(button => {
    button.addEventListener('click', function () {
        const buttonText = this.textContent

        let currentPage = parseInt(document.querySelector('#geNavigation button:not(.generic).active')?.textContent) || 1

        if (buttonText === 'First')
            currentPage = 1
        else if (buttonText === 'Previous' && currentPage > 1)
            currentPage--
        else if (buttonText === 'Next')
            currentPage++

        let startPage = currentPage <= 3 ? 1 : currentPage - 2

        numberedButtons.forEach((button, index) => {
            const pageNum = startPage + index

            if (pageNum === currentPage)
                button.classList.add('active')
            else
                button.classList.remove('active')

            button.textContent = pageNum
        });

        UpdateLabels()
        ViewInitialOffers()
    });
});

const numberedButtons = document.querySelectorAll('#geNavigation button:not(.generic)');
numberedButtons.forEach(button => {
    button.addEventListener('click', function () {
        //let currentPage = parseInt(document.querySelector('#geNavigation button:not(.generic).active')?.textContent) || 1;
        numberedButtons.forEach(btn => btn.classList.remove('active'))

        const newPage = parseInt(this.textContent) || 1
        let startPage = newPage <= 3 ? 1 : newPage - 2

        numberedButtons.forEach((button, index) => {
            const pageNum = startPage + index

            if (pageNum === newPage)
                button.classList.add('active')

            button.textContent = pageNum
        });

        UpdateLabels()
        ViewInitialOffers()
    });
});

const radioButtons = document.querySelectorAll('input[name="GE"]');
radioButtons.forEach(button => {
    button.addEventListener('change', function () {
        ViewInitialOffers();
    });
});

document.getElementById('geItemsPerType').addEventListener('change', function () {
    ViewInitialOffers();
});

document.getElementById('viewLatestOffers').addEventListener("click", function () {
    document.getElementById('geLatestFilter').style.display = '';
    document.getElementById('geNavigation').classList.remove("d-none")
    document.getElementById('geNavigation').classList.add("d-flex")
    document.getElementById('viewLatestOffers').style.display = 'none';
    ViewInitialOffers();
});

document.getElementById('searchInput').addEventListener('input', (e) => {
    searchItems(e.target.value);
});

window.addEventListener('click', function (e) {
    if (!document.getElementById('searchInput').contains(e.target) &&
        !document.getElementById('searchResults').contains(e.target)) {
        document.getElementById('searchResults').style.display = 'none';
    }
});

document.getElementById('fuzzySearchToggle').addEventListener('change', () => {
    const currentQuery = document.getElementById('searchInput').value;
    document.getElementById('searchInput').focus();
    searchItems(currentQuery);
});

document.addEventListener('DOMContentLoaded', function () {
    const table = document.getElementById('detailsTable');
    const headers = table.querySelectorAll('th');
    let sortDirection = {};

    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            sortTableByColumn(table, index);
            updateSortIcons(index);
        });
    });

    function sortTableByColumn(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        const rowsArray = Array.from(tbody.querySelectorAll('tr'));

        const isNumericColumn = showingInitial ? (columnIndex === 2 || columnIndex === 3) : (columnIndex === 1 || columnIndex === 2);
        const isDateColumn = showingInitial ? (columnIndex === 5) : (columnIndex === 4);

        // Determine sort direction
        sortDirection[columnIndex] = !sortDirection[columnIndex];

        rowsArray.sort((a, b) => {
            const aText = a.children[columnIndex].innerText.trim();
            const bText = b.children[columnIndex].innerText.trim();

            if (isNumericColumn) {
                const aNum = parseAbbreviatedNumber(aText);
                const bNum = parseAbbreviatedNumber(bText);
                return sortDirection[columnIndex] ? aNum - bNum : bNum - aNum;
            } else if (isDateColumn) {

                const aTimestamp = parseInt(a.children[columnIndex].getAttribute('data-timestamp'), 10);
                const bTimestamp = parseInt(b.children[columnIndex].getAttribute('data-timestamp'), 10);

                return sortDirection[columnIndex]
                    ? aTimestamp - bTimestamp
                    : bTimestamp - aTimestamp;
            } else {
                return sortDirection[columnIndex]
                    ? aText.localeCompare(bText)
                    : bText.localeCompare(aText);
            }
        });

        rowsArray.forEach(row => tbody.appendChild(row));
    }
    function updateSortIcons(activeIndex) {
        headers.forEach((header, index) => {
            header.querySelector('.sort-icon')?.remove(); // Remove any existing icons

            if (index === activeIndex) {
                const icon = document.createElement('span');
                icon.className = 'sort-icon';
                icon.style.marginLeft = '5px';
                icon.style.position = 'absolute';
                icon.textContent = sortDirection[index] ? '▲' : '▼';
                header.appendChild(icon);
            }
        });
    }
});

function parseAbbreviatedNumber(value) {
    const multipliers = {
        k: 1_000,
        m: 1_000_000,
        b: 1_000_000_000,
        t: 1_000_000_000_000,
        p: 1_000_000_000_000_000
    };

    const match = value.toLowerCase().match(/^([\d,.]+)([kmbtpe]?)$/);

    if (!match) return parseFloat(value.replace(/,/g, '')) || 0;

    const [, num, suffix] = match;
    const cleanNum = parseFloat(num.replace(/,/g, ''));

    return cleanNum * (multipliers[suffix] || 1);
}