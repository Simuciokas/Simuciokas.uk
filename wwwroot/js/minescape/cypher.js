var anagrams = null;

Startup();

async function Startup() {

    let response = await fetch(`../Data/anagrams.json`)

    if (response.ok)
        anagrams = await response.json()

    document.getElementById("CypherInput").addEventListener("input", function (e, val) {
        let cipher = e.target.value.toLowerCase()
        let ciphers = Object.keys(anagrams).filter(function (val) {
            return anagrams[val].id.length == cipher.length && anagrams[val].id.length > 0
        })

        let found = null;
        for (let i = 1; i <= 26; i++) {
            let shifted = caesarShift(cipher, i)
            for (let j = 0; j < ciphers.length; j++) {
                if (anagrams[ciphers[j]].id == shifted) {
                    found = anagrams[ciphers[j]]
                    break
                }
            }
        }

        if (found == null) {
            document.getElementById("solution-cypher-name").innerText = "not found"
            document.getElementById("solution-cypher-tip").innerText = "not found"
            document.getElementById("solution-cypher-url").href = ""
            document.getElementById("solution-cypher-url").innerText = "not found"
            document.getElementById("solution-cypher-map").innerHTML = ""
        }
        else {


            let name = found.id
            let location = found.location
            let x = location.split(", ")[0]
            let y = location.split(", ")[1]
            let z = location.split(", ")[2]
            let tip = found.tip

            let text = `https://map.minescape.net/#/${x}/${y}/${z}/-2/minescape/minescape`
            document.getElementById("solution-cypher-tip").innerText = tip
            document.getElementById("solution-cypher-name").innerText = name == undefined ? "No name provided" : name
            document.getElementById("solution-cypher-url").href = text
            document.getElementById("solution-cypher-url").innerText = location
            document.getElementById("solution-cypher-map").innerHTML = ""
            document.getElementById("solution-cypher-map").innerHTML = `<iframe id=\"\" style=\"width:100%; height:650px;\" src=\"${text}\"></iframe>`
        }
    });
}

function caesarShift(str, amount) {
    if (amount < 0) {
        return caesarShift(str, amount + 26);
    }

    var output = "";

    for (var i = 0; i < str.length; i++) {
        var c = str[i];

        if (c.match(/[a-z]/i)) {
            var code = c.codePointAt();

            if (code >= 65 && code <= 90) {
                c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
            }

            else if (code >= 97 && code <= 122) {
                c = String.fromCharCode(((code - 97 + amount) % 26) + 97);
            }
        }

        output += c;
    }
    return output;
};

