import database from './data.js'

Startup();

async function Startup() {

    let seenIds = new Set();
    let objects = Object.values(database.anagrams).filter(val => {
        if (seenIds.has(val.id)) {
            return false;
        }
        seenIds.add(val.id);
        return true;
    });

    document.getElementById("CypherInput").addEventListener("input", function (e, val) {
        let cipher = e.target.value.toLowerCase()
        /*let ciphers = Object.keys(database.anagrams).filter(function (val) {
            return database.anagrams[val].id.length == cipher.length && database.anagrams[val].id.length > 0
        })*/

        let foundList = []
        if (cipher.length >= 3) {
            for (let i = 0; i < 26; i++) {
                let shifted = caesarShift(cipher, i);
                let results = objects.filter(val =>
                    val.id.startsWith(shifted)
                );

                for (let item of results) {
                    if (!foundList.includes(item)) {
                        foundList.push(item);
                    }
                }
            }
        }

        if (foundList != null && foundList.length > 1) {
            let listOfResults = foundList.map(x => x.id).join(", ")
            document.getElementById("solution-cypher-name").innerHTML = `Found multiple: <b>${listOfResults}</b>. Type more characters to get the right result`
            document.getElementById("solution-cypher-tip").innerText = "not found"
            document.getElementById("solution-cypher-url").href = ""
            document.getElementById("solution-cypher-url").innerText = "not found"
            document.getElementById("solution-cypher-map").innerHTML = ""
        }
        else {
            if (foundList == null || foundList.length == 0) {
                document.getElementById("solution-cypher-name").innerText = "not found"
                document.getElementById("solution-cypher-tip").innerText = "not found"
                document.getElementById("solution-cypher-url").href = ""
                document.getElementById("solution-cypher-url").innerText = "not found"
                document.getElementById("solution-cypher-map").innerHTML = ""
            }
            else {

                let found = foundList[0]
                let name = found.id
                let location = found.location
                let x = location.split(", ")[0]
                let y = location.split(", ")[1]
                let z = location.split(", ")[2]
                let tip = found.tip

                let text = `MapNoOverlay/#/${x}/${y}/${z}/-2/minescape/minescape`
                document.getElementById("solution-cypher-tip").innerText = tip
                document.getElementById("solution-cypher-name").innerText = name == undefined ? "No name provided" : name
                document.getElementById("solution-cypher-url").href = text
                document.getElementById("solution-cypher-url").innerText = location
                document.getElementById("solution-cypher-map").innerHTML = ""
                document.getElementById("solution-cypher-map").innerHTML = `<iframe id=\"\" style=\"width:100%; height:650px;\" src=\"${text}\"></iframe>`
            }
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

