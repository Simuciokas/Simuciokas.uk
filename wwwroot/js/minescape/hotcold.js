import database from './data.js'

var suggestions = []

var config = {
    "easy": {
        "steps": [50, 50, 1],
        "thresholds": [Infinity, 100, 10],
        "limit": null
    },
    "master": {
        "steps": [100, 100, 50],
        "thresholds": [Infinity, 100, 50],
        "limit": 600
    },
}

Startup();

async function Startup() {

    document.getElementById('rBeginner').checked = true

    Reset()

    UpdateLabels()
}

function Reset() {

    suggestions = []

    const tier = document.querySelectorAll('input.selRadio:checked')[0].value.toLowerCase()
    const data = database.hotcold.filter(x => { return x.id == tier })
    document.getElementById("solution-hotcold-header").innerHTML = `<b>Possible Locations (${data.length}):</b>`
    let solutionDiv = document.getElementById("solution-hotcold")
    solutionDiv.innerHTML = ""
    data.forEach(function (item, ind) {
        const htmlContent =
            `
            <span>#${ind + 1}</span><br />
            <span><b>Tip: </b></span><span>${item.tip}</span><br />
            <span><b>Map location: </b></span><a id="solution-hotcold-url" href="${GetMapURL(item.location)}" target="_blank">${item.location}</a><br />
            <span><b>Distance: </b></span>CLICK Try Solve<br /><br />
            `
        solutionDiv.innerHTML += htmlContent
    });
}

function UpdateLabels() {
    const url = document.getElementById("HotColdMap").value
    if (url != "") {
        const regex = /#\/(-*\d+)\/-*\d+\/(-*\d+)/

        const matches = url.match(regex)
        let tip = document.getElementById("HotColdMapTip")
        if (matches && matches.length >= 3) {
            let x = matches[1]
            let z = matches[2]
            tip.style.display = "none"
            document.getElementById("hotcold-location").innerHTML = x + ', ' + z
        } else {
            tip.innerHTML = "Invalid URL"
            tip.style.display = ""
            document.getElementById("hotcold-location").innerHTML = "not provided"
        }
    }

    document.getElementById("hotcold-distance").innerHTML = document.getElementById("HotColdDistance").value
}

function GetSteps(thresholds, steps, distance) {
    let threshold, step
    thresholds.forEach(function(val, ind) {
        if (distance <= val) {
            threshold = val
            step = steps[ind]
        }
    });
    return [threshold, step]
}

function GetClosestItems(locations, tier, location, distance) {
    const [targetX, targetZ] = location.split(', ').map(Number)
    let itemsWithDistances = []
    const thresholds = config[tier].thresholds;
    const steps = config[tier].steps;
    const limit = config[tier].limit;
    locations.filter(x => { return x.id == tier }).forEach(item => {
        if (item.id == tier) {

            const [itemX, , itemZ] = item.location.split(', ').map(Number)
            item.distance = Math.floor(Math.sqrt(Math.pow(targetX - itemX, 2) + Math.pow(targetZ - itemZ, 2)))
            const [threshold, step] = GetSteps(thresholds, steps, distance)
            if ((Math.abs(item.distance - distance) <= step) || (limit != null && distance == limit && ((item.distance + step) >= limit))) {
                itemsWithDistances.push(item)
            }
        }
    });

    return itemsWithDistances
}

function GetMapURL(location) {
    let x = location.split(", ")[0]
    let y = location.split(", ")[1]
    let z = location.split(", ")[2]

    return `https://map.minescape.net/#/${x}/${y}/${z}/-2/minescape/minescape`;
}

function TrySolve() {

    const distance = parseInt(document.getElementById("HotColdDistance").value);

    if (distance == undefined || distance == null || distance == '') return

    const location = document.getElementById("hotcold-location").innerText;

    if (location == undefined || location == null || location == '') return

    if (database.hotcold == null) return

    const tier = document.querySelectorAll('input.selRadio:checked')[0].value.toLowerCase()

    if (tier == undefined || tier == null || tier == '') return

    let items = []
    if (suggestions.length == 0) {
        items = GetClosestItems(database.hotcold, tier, location, distance)
    }
    else {
        items = GetClosestItems(suggestions, tier, location, distance)
    }
    suggestions = items

    document.getElementById("solution-hotcold-header").innerHTML = `<b>Possible Locations (${items.length}):</b>`
    let solutionDiv = document.getElementById("solution-hotcold")
    solutionDiv.innerHTML = ""
    items.forEach(function(item, ind) {
        const htmlContent = 
            `
            <span>#${ind+1}</span><br />
            <span><b>Tip: </b></span><span>${item.tip}</span><br />
            <span><b>Map location: </b></span><a id="solution-hotcold-url" href="${GetMapURL(item.location)}" target="_blank">${item.location}</a><br />
            <span><b>Distance: </b></span>${item.distance}<br /><br />
            `
        solutionDiv.innerHTML += htmlContent
    });
}

document.getElementById("HotColdDistance").addEventListener('change', function (e) {
    UpdateLabels()
})

document.getElementById("HotColdMap").addEventListener('input', function (e) {
    UpdateLabels()
})

document.getElementById("HotColdSolve").addEventListener('click', function (e) {
    TrySolve()
})

document.getElementById("HotColdReset").addEventListener('click', function (e) {
    Reset()
})

document.querySelectorAll("input.selRadio").forEach(x => {
    x.addEventListener('change', function (e) {
        Reset()
    })
})

/*document.getElementById("HotColdX").addEventListener('change', function (e) {
    hotColdX = e.target.value
    hotColdZ = document.getElementById("HotColdZ").value
    UpdateLabels()
});

document.getElementById("HotColdZ").addEventListener('change', function (e) {
    hotColdZ = e.target.value
    hotColdX = document.getElementById("HotColdX").value
    UpdateLabels()
});*/


