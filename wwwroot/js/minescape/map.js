import database from './data.js'

var suggestions = []

Startup();

async function Startup() {

    document.getElementById('rBeginnerM').checked = true

    Reset()
}

function Reset() {

    suggestions = []

    const tier = document.querySelectorAll('input.mapTierRadio:checked')[0].value.toLowerCase()
    const data = database.maps.filter(x => { return x.id == tier })
    document.getElementById("solution-map-header").innerHTML = `<b>Select your map (${data.length}):</b>`
    let solutionDiv = document.getElementById("solution-map")
    solutionDiv.innerHTML = ""
    data.forEach(function (item, ind) {
        solutionDiv.innerHTML += `
            <div style="display: flex; align-items: flex-start;">
                <image style="max-width: 300px; margin-right: 20px;" src="/MapImages/${item.name}.webp"></image>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <span><b>Tip: </b> ${item.tip}</span>
                    <span><b>Map location: </b><a id="solution-map-url-${ind + 1}" href="${GetMapURL(item.location)}" target="_blank">${item.location}</a></span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input style="margin: 0;" class="mapRadio" id="${ind + 1}-map" type="radio" name="mapSelector"/>
                        <label for="${ind + 1}-map">Select to show map position</label>
                    </div>
                </div>
            </div><br />
            `
    });

    document.querySelectorAll("input.mapRadio").forEach(x => {
        x.addEventListener('change', function (e) {
            const index = x.id.replace("-map", "")
            const url = document.getElementById(`solution-map-url-${index}`).href
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

document.querySelectorAll("input.mapTierRadio").forEach(x => {
    x.addEventListener('change', function (e) {
        Reset()
    })
})

