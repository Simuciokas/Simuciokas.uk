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

    document.getElementById("solution-hotcold-map").innerHTML = ""
    const tier = document.querySelectorAll('#HotCold input.btn-check:checked')[0].value.toLowerCase()
    const data = database.hotcold.filter(x => { return x.id == tier })

    document.getElementById("solution-hotcold-header").innerHTML = `Possible Locations (${data.length})`
    let solutionDiv = document.getElementById("solution-hotcold")
    solutionDiv.innerHTML = ""
    data.forEach(function (item, ind) {
        const htmlContent =
            `
            <label class="col d-flex h-100">
                <input class="hotcoldRadio d-none" type="radio" name="hotcoldSelector"/>
                <div class="col d-flex">
                    <div class="card h-100 w-100">
                      <div class="card-body d-flex flex-column">
                        <p class="card-text">${item.tip}</p>
                        <p class="card-text">${item.location}</p>
                      </div>
                    </div>
                </div>
            </label>
            `
            //<btn class="btn btn-primary mt-auto" href="${GetMapURL(item.location)}" target="_blank">Select Map (${item.location})</btn>
        let temp = document.createElement('div')
        temp.innerHTML = htmlContent.trim()
        solutionDiv.appendChild(temp)
    });

    document.querySelectorAll("input.hotcoldRadio").forEach(function (x, ind) {
        x.addEventListener('change', function (e) {
            document.getElementById("solution-hotcold").querySelectorAll("div.card").forEach(y => y.classList.remove("border-primary"))
            x.nextElementSibling.querySelector("div").classList.add("border-primary")
            const anchor = x.closest('label').querySelectorAll('.card-text')[1]
            const url = GetMapURL(anchor.innerText)
            document.getElementById("solution-hotcold-map").innerHTML = ""
            document.getElementById("solution-hotcold-map").innerHTML = `<iframe id=\"\" style=\"width:100%; height:650px;\" src=\"${url}\"></iframe>`
        })
    })
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
            <label class="col d-flex h-100">
                <input class="hotcoldRadio d-none" type="radio" name="hotcoldSelector"/>
                <div class="col d-flex">
                    <div class="card h-100 w-100">
                      <div class="card-body d-flex flex-column">
                            <p class="card-text">${item.tip}</p>
                            <p class="card-text">${item.location}</p>
                        </div>
                    </div>
                </div>
            </label>
            `
        solutionDiv.innerHTML += htmlContent
    });

    if (items.length == 1) {
        document.getElementById("solution-hotcold").querySelectorAll("div.card").forEach(y => y.classList.remove("border-primary"))
        const x = document.querySelector("input.hotcoldRadio")
        x.nextElementSibling.querySelector("div").classList.add("border-primary")
        const anchor = x.closest('label').querySelectorAll('.card-text')[1]
        const url = GetMapURL(anchor.innerText)
        document.getElementById("solution-hotcold-map").innerHTML = ""
        document.getElementById("solution-hotcold-map").innerHTML = `<iframe id=\"\" style=\"width:100%; height:650px;\" src=\"${url}\"></iframe>`
    }

    document.querySelectorAll("input.hotcoldRadio").forEach(function (x, ind) {
        x.addEventListener('change', function (e) {
            document.getElementById("solution-hotcold").querySelectorAll("div.card").forEach(y => y.classList.remove("border-primary"))
            x.nextElementSibling.querySelector("div").classList.add("border-primary")
            const anchor = x.closest('label').querySelectorAll('.card-text')[1]
            const url = GetMapURL(anchor.innerText)
            document.getElementById("solution-hotcold-map").innerHTML = ""
            document.getElementById("solution-hotcold-map").innerHTML = `<iframe id=\"\" style=\"width:100%; height:650px;\" src=\"${url}\"></iframe>`
        })
    })
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
