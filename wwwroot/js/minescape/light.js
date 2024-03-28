var button = document.getElementById("solve-button-lb");
var matrices = Array.apply(null, Array(7)).map(function () { });

var debug = false;

var checkbox = document.getElementById("LightDebug");

checkbox.addEventListener('change', function () {
    debug = this.checked;
});

Array.prototype.forEach.call(document.getElementsByClassName("lights-input"), function (val, ind) {
    let id = val.id.replace("LightInput", "");
    if (val.id.replace("LightInput", "") == "1")
        return;
    document.getElementById("LightInput" + id).style.display = "none";
    document.getElementById("LightDescription" + id).style.display = "none";
    document.getElementById("LightTip" + id).style.display = "none";
    return;
});

Array.prototype.forEach.call(document.getElementsByClassName("lights-input"), function (val, ind) {
    val.addEventListener('change', function (event) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                let canvas = document.getElementById('canvas-lb-'+ind);
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);

                let preview = document.getElementById('canvas-preview-' + ind);
                preview.getContext('2d').drawImage(img, 0, 0);

                if (GetMatrix(ind))
                    // Loaded fine
                else
                    // issue
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
    });

});

function TopRightCorner(src) {
    for (let x = src.size().width-1; x > 0; x--) {
        for (let y = 0; y < src.size().height-1; y++) {
            let rgba = src.ucharPtr(y, x);
            if (rgba[0] == 136 && rgba[1] == 136 && rgba[2] == 122) {
                y--;
                console.log({ x, y });
                console.log(rgba);
                rgba = src.ucharPtr(y, x);
                while (rgba[0] == 0 && rgba[1] == 0 && rgba[2] == 1) {
                    y--;
                    rgba = src.ucharPtr(y, x);
                }
                y++;
                return { x, y };
            }
        }
    }
}

function GetTileSize(src, pos) {
    let i = 0;
    let rgba = src.ucharPtr(pos.y, pos.x);
    if (debug) console.log(rgba);
    while (i < 5 || (rgba[0] != 0 || rgba[1] != 0 || rgba[2] != 1)) {
        i++;
        pos.x--;
        pos.y++;
        rgba = src.ucharPtr(pos.y, pos.x);
    }
    if (debug) console.log("Passed top bottom left corner at: ")
    if (debug) console.log({ x: pos.x, y: pos.y });

    while (rgba[0] == 0 && rgba[1] == 0 && rgba[2] == 1) {
        i++;
        pos.x--;
        pos.y++;
        rgba = src.ucharPtr(pos.y, pos.x);
    }
    if (debug) console.log("Position after blacks")
    if (debug) console.log({ x: pos.x, y: pos.y });
    if (debug) console.log(rgba);

    let k = 0;
    while (rgba[0] != 0 && rgba[1] != 0 && rgba[2] != 1) {
        k++;
        pos.x--;
        pos.y++;
        rgba = src.ucharPtr(pos.y, pos.x);
    }

    if (debug) console.log("Position after colored")
    if (debug) console.log({ x: pos.x, y: pos.y });
    if (debug) console.log(rgba);

    if (debug) console.log("k: " + k);
    i += k;
    if (debug) console.log("i: " + i);

    return { i, k: k/2 };
}

function IsOn(src, size) {
    let rgba = src.ucharPtr(Math.floor(size / 2), Math.floor(size / 2));
    if (debug) console.log(rgba);
    if (rgba[0] < 60 && rgba[1] < 60)
        return 0;
    return 1;
}

button.addEventListener("click", function () {
    Solve();
});

var xor_matrix = function (m1, m2) {
    return range(0, 5).map(function (r) {
        return range(0, 5).map(function (c) {
            return m1[r][c] ^ m2[r][c]
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

function Solve() {
    let chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    let one_matrix = (function () {
        return range(1, 6).map(function (r) {
            return range(1, 6).map(function (c) {
                return 1;
            });
        })
    })();
    let data = {}
    let last_state;

    for (let i = 0; i < matrices.length-1; i++) {
        last_state = matrices[i];
        if (debug) console.log(last_state);
        data[chars[i]] = xor_matrix(last_state, matrices[i+1])
    }
    last_state = matrices[matrices.length-1];

    let combos = ['A', 'BA', 'B', 'CA', 'CBA', 'CB', 'C', 'DA', 'DBA', 'DB', 'DCA', 'DCBA', 'DCB', 'DC', 'D', 'EA', 'EBA', 'EB', 'ECA', 'ECBA', 'ECB', 'EC', 'EDA', 'EDBA', 'EDB', 'EDCA', 'EDCBA', 'EDCB', 'EDC', 'ED', 'E', 'FA', 'FBA', 'FB', 'FCA', 'FCBA', 'FCB', 'FC', 'FDA', 'FDBA', 'FDB', 'FDCA', 'FDCBA', 'FDCB', 'FDC', 'FD', 'FEA', 'FEBA', 'FEB', 'FECA', 'FECBA', 'FECB', 'FEC', 'FEDA', 'FEDBA', 'FEDB', 'FEDCA', 'FEDCBA', 'FEDCB', 'FEDC', 'FED', 'FE', 'F', 'GA', 'GBA', 'GB', 'GCA', 'GCBA', 'GCB', 'GC', 'GDA', 'GDBA', 'GDB', 'GDCA', 'GDCBA', 'GDCB', 'GDC', 'GD', 'GEA', 'GEBA', 'GEB', 'GECA', 'GECBA', 'GECB', 'GEC', 'GEDA', 'GEDBA', 'GEDB', 'GEDCA', 'GEDCBA', 'GEDCB', 'GEDC', 'GED', 'GE', 'GFA', 'GFBA', 'GFB', 'GFCA', 'GFCBA', 'GFCB', 'GFC', 'GFDA', 'GFDBA', 'GFDB', 'GFDCA', 'GFDCBA', 'GFDCB', 'GFDC', 'GFD', 'GFEA', 'GFEBA', 'GFEB', 'GFECA', 'GFECBA', 'GFECB', 'GFEC', 'GFEDA', 'GFEDBA', 'GFEDB', 'GFEDCA', 'GFEDCBA', 'GFEDCB', 'GFEDC', 'GFED', 'GFE', 'GF', 'G', 'HA', 'HBA', 'HB', 'HCA', 'HCBA', 'HCB', 'HC', 'HDA', 'HDBA', 'HDB', 'HDCA', 'HDCBA', 'HDCB', 'HDC', 'HD', 'HEA', 'HEBA', 'HEB', 'HECA', 'HECBA', 'HECB', 'HEC', 'HEDA', 'HEDBA', 'HEDB', 'HEDCA', 'HEDCBA', 'HEDCB', 'HEDC', 'HED', 'HE', 'HFA', 'HFBA', 'HFB', 'HFCA', 'HFCBA', 'HFCB', 'HFC', 'HFDA', 'HFDBA', 'HFDB', 'HFDCA', 'HFDCBA', 'HFDCB', 'HFDC', 'HFD', 'HFEA', 'HFEBA', 'HFEB', 'HFECA', 'HFECBA', 'HFECB', 'HFEC', 'HFEDA', 'HFEDBA', 'HFEDB', 'HFEDCA', 'HFEDCBA', 'HFEDCB', 'HFEDC', 'HFED', 'HFE', 'HF', 'HGA', 'HGBA', 'HGB', 'HGCA', 'HGCBA', 'HGCB', 'HGC', 'HGDA', 'HGDBA', 'HGDB', 'HGDCA', 'HGDCBA', 'HGDCB', 'HGDC', 'HGD', 'HGEA', 'HGEBA', 'HGEB', 'HGECA', 'HGECBA', 'HGECB', 'HGEC', 'HGEDA', 'HGEDBA', 'HGEDB', 'HGEDCA', 'HGEDCBA', 'HGEDCB', 'HGEDC', 'HGED', 'HGE', 'HGFA', 'HGFBA', 'HGFB', 'HGFCA', 'HGFCBA', 'HGFCB', 'HGFC', 'HGFDA', 'HGFDBA', 'HGFDB', 'HGFDCA', 'HGFDCBA', 'HGFDCB', 'HGFDC', 'HGFD', 'HGFEA', 'HGFEBA', 'HGFEB', 'HGFECA', 'HGFECBA', 'HGFECB', 'HGFEC', 'HGFEDA', 'HGFEDBA', 'HGFEDB', 'HGFEDCA', 'HGFEDCBA', 'HGFEDCB', 'HGFEDC', 'HGFED', 'HGFE', 'HGF', 'HG', 'H', '']

    var solution = combos.find(function (letters) {
        var m = last_state
        letters.split('').forEach(function (l) {
            m = xor_matrix(m, data[l])
        })
        return isEqual(m, one_matrix)
    })
    document.getElementById('solution-lb').innerText = "Solution: " + solution;
}

function GetMatrix(ind) {
    if (debug) console.log("canvas-lb-" + ind);
    let src = cv.imread('canvas-lb-' + ind);
    if (debug) console.log("src");
    if (debug) console.log(src);

    let topRightCorner = TopRightCorner(src);

    if (debug) console.log("topRightCorner");
    if (debug) console.log(topRightCorner);

    let tileSize = GetTileSize(src, { x: topRightCorner.x, y: topRightCorner.y });

    topRightCorner.x += tileSize.k;
    topRightCorner.y -= tileSize.k;

    if (debug) console.log("topRightCorner");
    if (debug) console.log(topRightCorner);

    if (debug) console.log(tileSize);

    let topLeftCornerOfLights = { x: topRightCorner.x - (tileSize.i * 9), y: topRightCorner.y };


    if (debug) console.log("topLeftCornerOfLights");
    if (debug) console.log(topLeftCornerOfLights);

    let matrix = [];
    for (let i = 0; i < 6; i++) {
        let y = topLeftCornerOfLights.y + (tileSize.i * i);
        let row = [];
        for (let k = 0; k < 6; k++) {
            let x = topLeftCornerOfLights.x + (tileSize.i * k);
            let rect = new cv.Rect(x, y, tileSize.i, tileSize.i);
            let isOn = IsOn(src.roi(rect), tileSize.i);
            row.push(isOn);
        }
        matrix.push(row);
    }

    console.log("matrix");
    console.log(matrix);

    matrices[ind] = matrix;
    return true;
}