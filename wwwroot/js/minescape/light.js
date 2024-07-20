var matrices = Array.apply(null, Array(7)).map(function () { })
var combos = ['A', 'BA', 'B', 'CA', 'CBA', 'CB', 'C', 'DA', 'DBA', 'DB', 'DCA', 'DCBA', 'DCB', 'DC', 'D', 'EA', 'EBA', 'EB', 'ECA', 'ECBA', 'ECB', 'EC', 'EDA', 'EDBA', 'EDB', 'EDCA', 'EDCBA', 'EDCB', 'EDC', 'ED', 'E', 'FA', 'FBA', 'FB', 'FCA', 'FCBA', 'FCB', 'FC', 'FDA', 'FDBA', 'FDB', 'FDCA', 'FDCBA', 'FDCB', 'FDC', 'FD', 'FEA', 'FEBA', 'FEB', 'FECA', 'FECBA', 'FECB', 'FEC', 'FEDA', 'FEDBA', 'FEDB', 'FEDCA', 'FEDCBA', 'FEDCB', 'FEDC', 'FED', 'FE', 'F', 'GA', 'GBA', 'GB', 'GCA', 'GCBA', 'GCB', 'GC', 'GDA', 'GDBA', 'GDB', 'GDCA', 'GDCBA', 'GDCB', 'GDC', 'GD', 'GEA', 'GEBA', 'GEB', 'GECA', 'GECBA', 'GECB', 'GEC', 'GEDA', 'GEDBA', 'GEDB', 'GEDCA', 'GEDCBA', 'GEDCB', 'GEDC', 'GED', 'GE', 'GFA', 'GFBA', 'GFB', 'GFCA', 'GFCBA', 'GFCB', 'GFC', 'GFDA', 'GFDBA', 'GFDB', 'GFDCA', 'GFDCBA', 'GFDCB', 'GFDC', 'GFD', 'GFEA', 'GFEBA', 'GFEB', 'GFECA', 'GFECBA', 'GFECB', 'GFEC', 'GFEDA', 'GFEDBA', 'GFEDB', 'GFEDCA', 'GFEDCBA', 'GFEDCB', 'GFEDC', 'GFED', 'GFE', 'GF', 'G', 'HA', 'HBA', 'HB', 'HCA', 'HCBA', 'HCB', 'HC', 'HDA', 'HDBA', 'HDB', 'HDCA', 'HDCBA', 'HDCB', 'HDC', 'HD', 'HEA', 'HEBA', 'HEB', 'HECA', 'HECBA', 'HECB', 'HEC', 'HEDA', 'HEDBA', 'HEDB', 'HEDCA', 'HEDCBA', 'HEDCB', 'HEDC', 'HED', 'HE', 'HFA', 'HFBA', 'HFB', 'HFCA', 'HFCBA', 'HFCB', 'HFC', 'HFDA', 'HFDBA', 'HFDB', 'HFDCA', 'HFDCBA', 'HFDCB', 'HFDC', 'HFD', 'HFEA', 'HFEBA', 'HFEB', 'HFECA', 'HFECBA', 'HFECB', 'HFEC', 'HFEDA', 'HFEDBA', 'HFEDB', 'HFEDCA', 'HFEDCBA', 'HFEDCB', 'HFEDC', 'HFED', 'HFE', 'HF', 'HGA', 'HGBA', 'HGB', 'HGCA', 'HGCBA', 'HGCB', 'HGC', 'HGDA', 'HGDBA', 'HGDB', 'HGDCA', 'HGDCBA', 'HGDCB', 'HGDC', 'HGD', 'HGEA', 'HGEBA', 'HGEB', 'HGECA', 'HGECBA', 'HGECB', 'HGEC', 'HGEDA', 'HGEDBA', 'HGEDB', 'HGEDCA', 'HGEDCBA', 'HGEDCB', 'HGEDC', 'HGED', 'HGE', 'HGFA', 'HGFBA', 'HGFB', 'HGFCA', 'HGFCBA', 'HGFCB', 'HGFC', 'HGFDA', 'HGFDBA', 'HGFDB', 'HGFDCA', 'HGFDCBA', 'HGFDCB', 'HGFDC', 'HGFD', 'HGFEA', 'HGFEBA', 'HGFEB', 'HGFECA', 'HGFECBA', 'HGFECB', 'HGFEC', 'HGFEDA', 'HGFEDBA', 'HGFEDB', 'HGFEDCA', 'HGFEDCBA', 'HGFEDCB', 'HGFEDC', 'HGFED', 'HGFE', 'HGF', 'HG', 'H', '']

var debug = false

var checkbox = document.getElementById("LightDebug")

var lightIndex = 0

function resetLightPuzzle() {
    lightIndex = 0
    matrices = Array.apply(null, Array(7)).map(function () { })

    document.getElementById("LightPreview").querySelectorAll("label").forEach(x => x.style.display = "none")

    for (let i = 0; i < 9; i++) {
        document.getElementById('LightInput' + i).value = null
        document.getElementById('LightInput' + i).style.display = "none"
        let tip = document.getElementById('LightTip' + i)
        tip.innerHTML = ""
        tip.style.display = "none"
        document.getElementById('LightDescription' + i).style.display = "none"

        let canvas = document.getElementById('canvas-lb-' + i)
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        canvas.style.display = "none"

        let preview = document.getElementById('canvas-preview-' + i)
        preview.getContext('2d').clearRect(0, 0, preview.width, preview.height)
        canvas.style.display = "none"
    }

    let solution = document.getElementById('LightSolution')
    solution.style.display = "none"
    solution.innerHTML = ""

    document.getElementById('LightInput0').style.display = ""
    let tip = document.getElementById('LightTip0')
    tip.innerHTML = ""
    tip.style.display = ""
    document.getElementById('LightDescription0').style.display = ""
}

document.getElementById("LightReset").addEventListener('click', function (e) {
    resetLightPuzzle()
});

document.getElementById("LightInputZone").addEventListener('click', function (e) {
    if (document.getElementById("LightSolution").innerHTML.includes("reset")) resetLightPuzzle()
});

document.getElementById("LightSolution").addEventListener('click', function (e) {
    if (this.innerHTML.includes("reset")) resetLightPuzzle()
});

checkbox.addEventListener('change', function () {
    debug = this.checked
});

function imageOnLoad(img) {
    let canvas = document.getElementById('canvas-lb-' + lightIndex)
    canvas.width = img.width
    canvas.height = img.height
    canvas.getContext('2d').drawImage(img, 0, 0)

    let preview = document.getElementById('canvas-preview-' + lightIndex)
    preview.height = img.height
    preview.width = img.width
    preview.getContext('2d').drawImage(img, 0, 0)
    let previewLabel = document.getElementById("LightPreview").querySelectorAll("label")[lightIndex].style.display = ""
    var result = GetMatrix(lightIndex)
    if (result == "") {
        preview.style.display = "";
        document.getElementById('LightTip' + lightIndex).style.display = "none"
        document.getElementById('LightInput' + lightIndex).style.display = "none"
        document.getElementById('LightDescription' + lightIndex).style.display = "none"

        if (lightIndex < 8) {
            if (TrySolveMidWay()) {
                lightIndex = 9
            }
            else {
                document.getElementById('LightInput' + (lightIndex + 1)).style.display = ""
                document.getElementById('LightDescription' + (lightIndex + 1)).style.display = ""
                lightIndex++
            }
        }
        else {
            lightIndex = 9
            Solve()
        }
    }
    // Loaded fine
    else {
        document.getElementById('LightTip' + lightIndex).innerText = "Couldn't process the image, try again with a new screenshot: " + result
        document.getElementById('LightTip' + lightIndex).style.display = ""
    }
}

window.addEventListener("paste", function (e) {
    if (currentPage != "Light" || lightIndex > 8) return;
    let item = Array.from(e.clipboardData.items).find(x => /^image\//.test(x.type));

    let blob = item.getAsFile();

    let img = new Image();

    img.onload = function () {
        imageOnLoad(img)
    };

    img.src = URL.createObjectURL(blob);
});

Array.prototype.forEach.call(document.getElementsByClassName("lights-input"), function (val, ind) {
    val.addEventListener('change', function (event) {
        let reader = new FileReader();
        reader.onload = function (event) {
            let img = new Image();
            img.onload = function () {
                imageOnLoad(img)
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
    });

});

Array.prototype.forEach.call(document.getElementsByClassName("lights-input"), function (val, ind) {
    let id = val.id.replace("LightInput", "");
    if (val.id.replace("LightInput", "") == "0")
        return;
    document.getElementById("LightInput" + id).style.display = "none";
    document.getElementById("LightDescription" + id).style.display = "none";
    document.getElementById("LightTip" + id).style.display = "none";
    return;
});



function GetMatrix(index) {
    if (debug) console.log("canvas-lb-" + index)
    let src = cv.imread('canvas-lb-' + index)

    if (debug) console.log("src")
    if (debug) console.log(src)

    let topLeftBlack = TopLeftBlack(src)

    if (debug) console.log("topLeftBlack")
    if (debug) console.log(topLeftBlack)

    if (topLeftBlack == undefined) return "Invalid Photo"

    let nextLeftBlack = GetNextTopLeftBlack(src, { x: topLeftBlack.x, y: topLeftBlack.y })

    if (debug) console.log("nextLeftBlack")
    if (debug) console.log(nextLeftBlack)

    let distanceBetween = GetDistanceBetweenPos(topLeftBlack.x, nextLeftBlack.x)

    if (debug) console.log("distanceBetween")
    if (debug) console.log(distanceBetween)

    if (distanceBetween == undefined) return "Invalid Photo"

    let matrix = [];
    for (let i = 0; i < 6; i++) {
        let y = topLeftBlack.y + (distanceBetween * i);
        let row = [];
        for (let k = 0; k < 6; k++) {
            let x = topLeftBlack.x + (distanceBetween * k);
            let isOn = IsOn(src, x, y + 1);
            row.push(isOn);
        }
        matrix.push(row);
    }

    if (index > 0 && JSON.stringify(matrices[index - 1]) == JSON.stringify(matrix)) {
        return "Matches Previous Image";
    }

    matrices[index] = matrix;
    return "";
}

function TopLeftBlack(src) {
    for (let y = 0; y < src.size().height - 1; y++) {
        for (let x = 0; x < src.size().width - 1; x++) {
            let rgba = src.ucharPtr(y, x)
            if (rgba[0] < 5 && rgba[1] < 5 && rgba[2] < 5)
                return { x, y }
        }
    }
}

function GetNextTopLeftBlack(src, pos) {
    let x = pos.x
    pos.x += 10
    let rgba = src.ucharPtr(pos.y, pos.x)
    while (rgba[0] > 5 || rgba[1] > 5 || rgba[2] > 5) {
        pos.x++
        rgba = src.ucharPtr(pos.y, pos.x)
        if (pos.x - x > 200)
            return undefined
    }
    return pos
}

function GetDistanceBetweenPos(x1, x2) {
    return Math.abs(x1 - x2)
}

function IsOn(src, x, y) {
    let rgba = src.ucharPtr(y, x);
    if (debug) console.log("IsOn:");
    if (debug) console.log(y, x);
    if (debug) console.log(rgba);
    if (rgba[0] < 100 && rgba[1] < 100)
        return 0;
    return 1;
}

var xor_matrix = function (m1, m2) {
    return range(0, 5).map(function (row) {
        return range(0, 5).map(function (col) {
            return m1[row][col] ^ m2[row][col]
        })
    })
}

function range(start, end) {
    if (start === end) return [start];
    return [start, ...range(start + 1, end)];
}

function isEqual(a, b) {
    for (let i = 0; i < 5; i++)
        for (let j = 0; j < 5; j++)
            if (a[i][j] != b[i][j]) return false
    return true
}

function TrySolveMidWay() {
    if (lightIndex < 3) return false

    let temp = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    let chars = []
    for (let i = 0; i < lightIndex; i++) {
        chars.push(temp[i])
    }

    let one_matrix = (function () {
        return range(0, 5).map(function (row) {
            return range(0, 5).map(function (col) {
                return 1
            });
        })
    })();

    let data = {}
    let last_state
    let copyMatrices = { ...matrices }
    for (let i = 0; i < chars.length; i++) {
        last_state = copyMatrices[i];
        if (debug) console.log(last_state);
        data[chars[i]] = xor_matrix(last_state, copyMatrices[i + 1])
    }
    last_state = copyMatrices[chars.length]

    let combosByChars = getAllUniqueStrings(chars)
    let solution = combosByChars.find(function (letters) {
        let m = last_state
        letters.split('').forEach(function (l) {
            m = xor_matrix(m, data[l])
        })
        return isEqual(m, one_matrix)
    })

    if (solution != "" && solution != undefined) {
        document.getElementById('LightSolution').innerText = "Solution found early: " + solution
        document.getElementById('LightSolution').style.display = ""
        return true
    }
    return false
}

function permute(arr, size) {
    if (size === 1) {
        return arr.map(element => [element]);
    }

    const permutations = [];

    for (let i = 0; i < arr.length; i++) {
        const current = arr[i];
        const remaining = arr.slice(0, i).concat(arr.slice(i + 1));

        const remainingPermutations = permute(remaining, size - 1);

        for (const permutation of remainingPermutations) {
            permutations.push([current].concat(permutation));
        }
    }

    return permutations;
}

function getAllUniqueStrings(arr) {
    const uniqueStrings = new Set();

    for (let size = 1; size <= arr.length; size++) {
        const permutations = permute(arr, size);
        for (const permutation of permutations) {
            uniqueStrings.add(permutation.join(''));
        }
    }

    return [...uniqueStrings];
}


function Solve() {
    let chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

    let one_matrix = (function () {
        return range(0, 5).map(function (row) {
            return range(0, 5).map(function (col) {
                return 1;
            });
        })
    })();

    let data = {}
    let last_state

    for (let i = 0; i < matrices.length-1; i++) {
        last_state = matrices[i]
        if (debug) console.log(last_state)
        data[chars[i]] = xor_matrix(last_state, matrices[i+1])
    }

    last_state = matrices[matrices.length - 1]

    let solution = combos.find(function (letters) {
        let m = last_state
        letters.split('').forEach(function (l) {
            m = xor_matrix(m, data[l])
        })
        return isEqual(m, one_matrix)
    })
    if (solution != "" && solution != undefined)
        document.getElementById('LightSolution').innerText = "Solution: " + solution;
    else
        document.getElementById('LightSolution').innerText = "No solution found. Click me to reset";
    document.getElementById('LightSolution').style.display = "";
    if (debug) console.log(solution);
}