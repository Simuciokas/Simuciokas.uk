import database from './data.js'

var suggestions = []

Startup();

async function Startup() {

    document.getElementById('rBeginnerM').checked = true

    Reset()
}

function Reset() {

    suggestions = []

    document.getElementById("solution-map-map").innerHTML = ""
    const tier = document.querySelector('#Map input.btn-check:checked').value.toLowerCase()
    const data = database.maps.filter(x => { return x.id == tier })
    let solutionDiv = document.getElementById("solution-map")
    solutionDiv.innerHTML = ""
    data.forEach(function (item, ind) {
        solutionDiv.innerHTML += `
            <label>
                <input class="mapRadio d-none" type="radio" name="mapSelector"/>
                <div class="card mb-3" style="width: 350px; height: 160px;">
                    <div class="row g-0">
                        <div class="col-md-4">
                            <img src="/MapImages/${item.name}.webp" class="img-fluid rounded-start" alt="${item.name}.webp" width="166" height="166"/>
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <p class="card-text">${item.tip} <span id="map${ind + 1}">${item.location}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </label>
            `
    });
    //<a id="solution-map-url-${ind + 1}" href="${GetMapURL(item.location)}" target="_blank">${item.location}</a>

    document.querySelectorAll("input.mapRadio").forEach(function(x, ind) {
        x.addEventListener('change', function (e) {
            
            document.querySelectorAll("#solution-map div.card").forEach(y => y.classList.remove("border-primary"))
            x.nextElementSibling.classList.add("border-primary")
            const url = GetMapURL(document.querySelector(`#map${ind + 1}`).innerText)
            document.getElementById("solution-map-map").innerHTML = ""
            document.getElementById("solution-map-map").innerHTML = `<iframe id=\"\" style=\"width:100%; height:650px;\" src=\"${url}\"></iframe>`
        })
    })

}

function GetMapURL(location) {
    let x = location.split(", ")[0]
    let y = location.split(", ")[1]
    let z = location.split(", ")[2]

    return `https://map.minescape.net/#/${x}/${y}/${z}/-2/minescape/minescape`;
}

document.querySelectorAll("#Map input.btn-check").forEach(x => {
    x.addEventListener('change', function (e) {
        Reset()
    })
})

