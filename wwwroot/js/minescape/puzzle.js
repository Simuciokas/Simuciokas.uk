import Puzzle from './puzzle-async-solver'
//import unzipSync from 'fflate'
const { unzipSync } = require('fflate')

const colors = {
    tile: '#ccc',
    highlight: '#f00',
    empty: '#000'
};


const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
var solutionContext = null
var solutionCanvas = null
var solutionTileSize = 75
var solutionInitial = null
var solutionStep = 0
var solutionSteps = null

let showDebug = false
let showDebug2 = false
let debug = false //document.getElementById("PuzzleDebug").checked;
function getCurrentPage() {
    return document.getElementById("Navigation").querySelectorAll("input:checked")[0].value
}

window.addEventListener("paste", function (e) {
    if (getCurrentPage() != "Puzzle") return;
    var item = Array.from(e.clipboardData.items).find(x => /^image\//.test(x.type));

    var blob = item.getAsFile();

    var img = new Image();

    img.onload = function () {
        document.getElementById("PuzzleInputZone").classList.remove('dragover');
        document.getElementById("PuzzleInputDescription").innerText = "Got another puzzle? Choose or drag it here";
        document.getElementById("PuzzleInputDescription").style.textAlign = "right";
        document.getElementById("PuzzleInputDescription").style.paddingRight = "5px";
        let puzzleCanvas = document.getElementById("PuzzleCanvas");
        puzzleCanvas.width = img.width;
        puzzleCanvas.height = img.height;
        document.getElementById("PuzzleInputZone").style.height = `${img.height + 6}px`;

        let obj = puzzleCanvas.getContext('2d');
        obj.drawImage(img, 0, 0);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        Solve();
    };

    img.src = URL.createObjectURL(blob);
});

document.getElementById("PuzzleDebug").addEventListener('change', function () {
    debug = document.getElementById("PuzzleDebug").checked;
});

document.getElementById("PuzzleInput").addEventListener('change', function () {
    readFile(this);
});

document.getElementById("PuzzleInputZone").addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('dragover');
});

document.getElementById("PuzzleInputZone").addEventListener('dragleave', function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('dragover');
});

function readFile(input) {
    if (debug) console.log(input.files);
    if (input.files && input.files[0]) {
        document.getElementById("PuzzleInputZone").classList.remove('dragover');
        document.getElementById("PuzzleInputDescription").innerText = "Got another puzzle? Choose or drag it here";
        document.getElementById("PuzzleInputDescription").style.textAlign = "right";
        document.getElementById("PuzzleInputDescription").style.paddingRight = "5px";

        var reader = new FileReader();

        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                let puzzleCanvas = document.getElementById("PuzzleCanvas");
                puzzleCanvas.width = img.width;
                puzzleCanvas.height = img.height;
                document.getElementById("PuzzleInputZone").style.height = `${img.height + 6}px`;
                
                let obj = puzzleCanvas.getContext('2d');
                obj.drawImage(img, 0, 0);

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                Solve();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

class PartitionData {
    constructor(tiles) {
        this.dbs = [];
        this.partitions = [];
        this.numTiles = 16;
        this._loadDatabase();
    }

    async _loadDatabase() {
        let response = await fetch(`../Data/15/info.json`);
        let json;
        if (response.ok) {
            json = await response.json();
        } else {
            throw new Error('Database info json could not be loaded');
        }

        let promises = [];

        for (let partition of json['partitions']) {
            let fileName = `15_`
                + partition.join(',')
                + '.zip';

            promises.push(fetch(`../Data/15/${fileName}`)
                .then(response => {
                    if (response.ok) {
                        return response.arrayBuffer();
                    } else {
                        throw new Error('Database could not be loaded');
                    }
                }).then(buffer => {

                    let decompressedData;
                    try {
                        let uint8Array = new Uint8Array(buffer);
                        decompressedData = unzipSync(uint8Array);
                    } catch (error) {
                        throw new Error(`Decompression failed: ${error}`);
                    }

                    let fileContent = decompressedData[Object.keys(decompressedData)[0]];

                    this.partitions.push(partition);
                    this.dbs.push(fileContent);
                }));
        }

        await Promise.all(promises);

    }
}

var partitionData = new PartitionData();

function Solve() {
    const width = canvas.width
    const height = canvas.height
    const imageData = ctx.getImageData(0, 0, width, height).data

    let sTopLeftPos = SolvedTopLeftCorner(imageData, width, height);

    if (debug) console.log("sTopLeftPos");
    if (debug) console.log(sTopLeftPos);

    if (sTopLeftPos == undefined) {
        document.getElementById('solution').innerText = "Bad image. Include a picture that contains Unsolved and Solved puzzle";
        return;
    }


    let tileSize = GetTileSize(imageData, width, height, { x: sTopLeftPos.x, y: sTopLeftPos.y });

    if (debug) console.log("tileSize");
    if (debug) console.log(tileSize);

    if (tileSize == undefined) {
        document.getElementById('solution').innerText = "Bad image. Include a picture that contains Unsolved and Solved puzzle";
        return;
    }


    let uTopLeftPos = { x: (sTopLeftPos.x - (tileSize * 5)), y: sTopLeftPos.y }
    if (debug) console.log("uTopLeftPos");
    if (debug) console.log(uTopLeftPos);

    let solvedTiles = []
    for (let i = 0; i < 4; i++) {
        const y = sTopLeftPos.y + (i * tileSize)
        for (let k = 0; k < 4; k++) {
            const x = sTopLeftPos.x +(k * tileSize)
            const rect = getRectangleImageData(imageData, width, x, y, tileSize, tileSize)
            solvedTiles.push({ rect, tileSize })
            //if (debug) console.log(rect)
        }
    }
    if (debug) console.log("solvedTiles")
    if (debug) console.log(solvedTiles)

    let unsolvedTiles = []
    for (let i = 0; i < 4; i++) {
        const y = uTopLeftPos.y + (i * tileSize)
        for (let k = 0; k < 4; k++) {
            const x = uTopLeftPos.x + (k * tileSize)
            if (debug) console.log("x")
            if (debug) console.log(x)
            if (debug) console.log("y")
            if (debug) console.log(y)
            const rect = getRectangleImageData(imageData, width, x, y, tileSize, tileSize)
            if (debug && x == 68 && y == 33) {
                const debugCanvas = document.createElement("canvas")
                debugCanvas.width = tileSize
                debugCanvas.height = tileSize
                document.body.appendChild(debugCanvas)
                const debugCtx = debugCanvas.getContext('2d')
                const debugImageData = new ImageData(rect, tileSize, tileSize);
                debugCtx.putImageData(debugImageData, 0, 0);
            }
            if (debug && x == 68 && y == 33) {
                showDebug = true
            }
            const pos = FindPos(solvedTiles, { rect, tileSize })
            unsolvedTiles.push(pos == null ? 15 : pos)
            showDebug = false
            //if (debug) console.log(rect)
        }
    }
    if (debug) console.log("unsolvedTiles")
    if (debug) console.log(unsolvedTiles)

    if (debug) { 
        const debugCanvas = document.createElement("canvas")
        debugCanvas.width = tileSize
        debugCanvas.height = tileSize
        document.body.appendChild(debugCanvas)
        const debugCtx = debugCanvas.getContext('2d')
        const debugImageData = new ImageData(solvedTiles[4].rect, tileSize, tileSize);
        debugCtx.putImageData(debugImageData, 0, 0);
    }
    //
    //solvedTiles[12]

    const goalState = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const initialState = unsolvedTiles;

    let sum = 0;
    for (const num of initialState) {
        sum += num;
    }
    for (const num of goalState) {
        sum -= num;
    }

    if (sum != 0) {
        document.getElementById('solution').innerText = "Bad image. Include a picture that contains Unsolved and Solved puzzle";
        return;
    }

    
    Puzzle.solve(
        initialState,
        initialState.indexOf(15),
        partitionData.partitions,
        partitionData.dbs
    ).then(ans => {
        solutionInitial = initialState
        solutionSteps = ans
        ResetSolution()
        //document.getElementById('solution').innerText = "Solution: \n\n" + ans + "\n\nInstructions: \n\nu - tile goes up\nd - tile goes down\nr - tile goes right\nl - tile goes left";
    }).catch(e => {
        if (debug) console.error(e.message);
    });
}

function ResetSolution() {
    let solutionDiv = document.getElementById('solution')
    solutionDiv.innerHTML = "<br /><span>Click on the drawing to show the next step</span><br />"
    solutionStep = 0
    let resetButton = document.createElement("button")
    resetButton.innerText = "Reset to beginning"

    resetButton.addEventListener('click', () => {
        ResetSolution()
    })

    solutionCanvas = document.createElement("canvas")
    solutionCanvas.width = 300
    solutionCanvas.height = 300
    solutionDiv.appendChild(solutionCanvas)
    //solutionDiv.appendChild(resetButton)
    solutionContext = solutionCanvas.getContext('2d');

    DrawSolution()

    solutionCanvas.addEventListener('click', () => {
        const direction = solutionSteps[solutionStep]
        moveTile(direction)
        solutionStep++
        DrawSolution()
    });
}

function DrawSolution() {
    solutionContext.clearRect(0, 0, solutionCanvas.width, solutionCanvas.height);
    // Draw each tile
    for (let i = 0; i < solutionInitial.length; i++) {
        const tile = solutionInitial[i];
        const x = (i % 4) * solutionTileSize;
        const y = Math.floor(i / 4) * solutionTileSize;
        if (tile === 15) {
            // Draw the empty tile
            solutionContext.fillStyle = colors.empty;
        } else {
            solutionContext.fillStyle = colors.tile;
        }
        solutionContext.fillRect(x, y, solutionTileSize, solutionTileSize);

        // Draw tile numbers
        if (tile !== 15) {
            solutionContext.fillStyle = '#000';
            solutionContext.font = '24px Arial';
            solutionContext.textAlign = 'center';
            solutionContext.textBaseline = 'middle';
            solutionContext.fillText(tile, x + solutionTileSize / 2, y + solutionTileSize / 2);
        }
    }

    // Highlight the tile to move
    highlightMove();
}

// Function to highlight the tile to move
function highlightMove() {
    const emptyIndex = solutionInitial.indexOf(15);
    const direction = solutionSteps[solutionStep];
    let tileToMoveIndex;

    switch (direction) {
        case 'u':
            tileToMoveIndex = emptyIndex + 4;
            break;
        case 'd':
            tileToMoveIndex = emptyIndex - 4;
            break;
        case 'l':
            tileToMoveIndex = emptyIndex + 1;
            break;
        case 'r':
            tileToMoveIndex = emptyIndex - 1;
            break;
    }

    if (tileToMoveIndex !== undefined && tileToMoveIndex >= 0 && tileToMoveIndex < solutionInitial.length) {
        const x = (tileToMoveIndex % 4) * solutionTileSize;
        const y = Math.floor(tileToMoveIndex / 4) * solutionTileSize;

        solutionContext.fillStyle = colors.highlight;
        solutionContext.fillRect(x, y, solutionTileSize, solutionTileSize);

        // Draw number on highlighted tile
        solutionContext.fillStyle = '#fff';
        solutionContext.fillText(solutionInitial[tileToMoveIndex], x + solutionTileSize / 2, y + solutionTileSize / 2);
    }
}

// Function to move the tile in the specified direction
function moveTile(direction) {
    const emptyIndex = solutionInitial.indexOf(15);
    let tileToMoveIndex;

    switch (direction) {
        case 'u':
            tileToMoveIndex = emptyIndex + 4;
            break;
        case 'd':
            tileToMoveIndex = emptyIndex - 4;
            break;
        case 'l':
            tileToMoveIndex = emptyIndex + 1;
            break;
        case 'r':
            tileToMoveIndex = emptyIndex - 1;
            break;
    }

    if (tileToMoveIndex !== undefined && tileToMoveIndex >= 0 && tileToMoveIndex < solutionInitial.length) {
        // Swap the tiles
        [solutionInitial[emptyIndex], solutionInitial[tileToMoveIndex]] = [solutionInitial[tileToMoveIndex], solutionInitial[emptyIndex]];
    }
}

function SolvedTopLeftCorner(imageData, width, height) {
    for (let x = parseInt(width / 2); x <= width; x++) {
        for (let y = 0; y < height; y++) {
            let rgba = getRGBA(imageData, width, x, y)
            if (rgba[0] == 0 && rgba[1] == 0 && rgba[2] == 0)
                return { x, y };
        }
    }
}

function GetTileSize(imageData, width, height, pos) {
    try {
        let i = 0;
        let rgba = getRGBA(imageData, width, pos.x, pos.y)
        while (i < 5 || (rgba[0] != 0 || rgba[1] != 0 || rgba[2] != 0)) {
            i++;
            pos.x++;
            pos.y++;
            rgba = getRGBA(imageData, width, pos.x, pos.y)
        }

        let k = 0;
        while (rgba[0] == 0 && rgba[1] == 0 && rgba[2] == 0) {
            k++;
            pos.x++;
            pos.y++;
            rgba = getRGBA(imageData, width, pos.x, pos.y)
        }
        k = Math.floor(k / 2);
        return i + k;
    }
    catch {
        return undefined;
    }
}

function CompareMats(mat1, mat2) {
    if (mat1.rect.length !== mat2.rect.length) {
        if (debug) console.error("Dimensions of the Mats are different.")
        return false
    }

    for (let x = 0; x < mat1.tileSize; x++) {
        for (let y = 0; y < mat1.tileSize; y++) {
            let rgbaMat1 = getRGBA(mat1.rect, mat1.tileSize, x, y)
            let rgbaMat2 = getRGBA(mat2.rect, mat1.tileSize, x, y)
            if (Math.abs(rgbaMat1[0] - rgbaMat2[0]) > 1
                || Math.abs(rgbaMat1[1] - rgbaMat2[1]) > 1
                || Math.abs(rgbaMat1[2] - rgbaMat2[2]) > 1) {
                if (showDebug2) console.log("x")
                if (showDebug2) console.log(x)
                if (showDebug2) console.log("y")
                if (showDebug2) console.log(y)
                if (showDebug2) console.log("rgbaMat1")
                if (showDebug2) console.log(rgbaMat1)
                if (showDebug2) console.log("rgbaMat2")
                if (showDebug2) console.log(rgbaMat2)
                return false
            }
        }
    }

    return true
}

function FindPos(solvedTiles, mat2) {
    let found = null
    solvedTiles.forEach(function (val, index) {
        if (index == 4 && showDebug) {
            console.log(val)
            showDebug2 = true
        }
        if (index == 4 && showDebug) console.log(mat2)
        if (CompareMats(val, mat2))
            found = index
        showDebug2 = false
    });
    return found
}

function getRGBA(imageData, width, x, y) {
    const index = (y * width + x) * 4;
    const r = imageData[index];
    const g = imageData[index + 1];
    const b = imageData[index + 2];
    const a = imageData[index + 3];
    return [r, g, b, a];
}

function getRectangleImageData(imageData, imageWidth, x, y, width, height) {
    const rectangleData = [];

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const pixelIndex = ((y + row) * imageWidth + (x + col)) * 4;
            rectangleData.push(imageData[pixelIndex], imageData[pixelIndex + 1], imageData[pixelIndex + 2], imageData[pixelIndex + 3]);
        }
    }

    return new Uint8ClampedArray(rectangleData);
}