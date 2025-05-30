import database from './data.js'

var suggestions = []

var config = {
    "beginner": {
        "steps": [50, 50, 1],
        "thresholds": [Infinity, 100, 10],
        "limit": null
    },
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

    const tier = document.querySelectorAll('#HotCold input.btn-check:checked')[0].value.toLowerCase()
    const data = database.hotcold.filter(x => { return x.id == tier })
    document.getElementById("solution-hotcold-header").innerHTML = `Possible Locations (${data.length})`
    let solutionDiv = document.getElementById("solution-hotcold")
    solutionDiv.innerHTML = ""
    data.forEach(function (item, ind) {
        /*
            <span>#${ind + 1} CLICK Try Solve</span><br />
            <span><b>Tip: </b></span><span>${item.tip}</span><br />
            <span><b>Map location: </b></span><a id="solution-hotcold-url" href="${GetMapURL(item.location)}" target="_blank">${item.location}</a><br />
            <span><b>Distance: </b></span>CLICK Try Solve<br /><br />
         */
        const htmlContent =
            `
            <div class="card col" style="width: 18rem;">
              <div class="card-body">
                <h5 class="card-title">#${ind + 1}</h5>
                <p class="card-text">${item.tip}</p>
                <a class="btn btn-primary" href="${GetMapURL(item.location)}" target="_blank">Open Map (${item.location})</a>
              </div>
            </div>
            `
        const isRow = (ind % 3 == 0)
        if (isRow) {
            let div = document.createElement('div')
            div.classList.add('row')
            solutionDiv.appendChild(div)
        }
        let temp = document.createElement('div')
        temp.innerHTML = htmlContent.trim()
        let row = [...solutionDiv.querySelectorAll('div.row')].pop()
        row.appendChild(temp.firstElementChild)
            
    });
}

function UpdateLabels() {
    const map = document.getElementById("HotColdMap")
    const url = map.value
    if (url != "") {
        const regex = /#\/(-*\d+)\/-*\d+\/(-*\d+)/

        const matches = url.match(regex)
        if (matches && matches.length >= 3) {
            let x = matches[1]
            let z = matches[2]
            map.classList.remove('is-invalid')
            document.getElementById("hotcold-location").innerHTML = x + ', ' + z
        } else {
            map.classList.add('is-invalid')
            document.getElementById("hotcold-location").innerHTML = "not provided"
        }
    }
    else
        document.getElementById("hotcold-location").innerHTML = "not provided"

    const distance = document.getElementById("HotColdDistance").value

    if (distance == '' || distance == NaN || distance == 0)
        document.getElementById("hotcold-distance").innerHTML = "not provided"
    else
        document.getElementById("hotcold-distance").innerHTML = distance
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
    let skip = false
    document.getElementById("HotColdDistance").classList.remove('is-invalid')
    document.getElementById("HotColdMap").classList.remove('is-invalid')
    if (distance == undefined || distance == null || distance == '' || isNaN(distance) || distance == 'not provided') {
        document.getElementById("HotColdDistance").classList.add('is-invalid')
        skip = true
    }

    const location = document.getElementById("hotcold-location").innerText;

    if (location == undefined || location == null || location == '' || location == 'not provided') {
        document.getElementById("HotColdMap").classList.add('is-invalid')
        skip = true
    }

    if (skip) return

    if (database.hotcold == null) return

    const tier = document.querySelector('#HotCold input.btn-check:checked').value.toLowerCase()

    if (tier == undefined || tier == null || tier == '') return

    let items = []
    if (suggestions.length == 0) {
        items = GetClosestItems(database.hotcold, tier, location, distance)
    }
    else {
        items = GetClosestItems(suggestions, tier, location, distance)
    }
    suggestions = items

    document.getElementById("solution-hotcold-header").innerHTML = `Possible Locations (${items.length})`
    let solutionDiv = document.getElementById("solution-hotcold")
    solutionDiv.innerHTML = ""
    items.forEach(function(item, ind) {
        const htmlContent = 
            `
            <div class="card col" style="width: 18rem;">
              <div class="card-body">
                <h5 class="card-title">#${ind + 1}</h5>
                <p class="card-text">${item.tip}</p>
                <a class="btn btn-primary" href="${GetMapURL(item.location)}" target="_blank">Open Map (${item.location})</a>
              </div>
            </div>
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
    document.getElementById("HotColdMap").value = ''
    document.getElementById("HotColdDistance").value = ''
    UpdateLabels()
    Reset()
})

document.querySelectorAll("#HotCold input.btn-check").forEach(x => {
    x.addEventListener('change', function (e) {
        Reset()
    })
})
