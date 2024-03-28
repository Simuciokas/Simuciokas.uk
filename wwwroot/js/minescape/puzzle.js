import Puzzle from './puzzle-async-solver'

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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
    console.log(input.files);
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
                + '.db';

            promises.push(fetch(`../Data/15/${fileName}`)
                .then(response => {
                    if (response.ok) {
                        return response.arrayBuffer();
                    } else {
                        throw new Error('Database could not be loaded');
                    }
                }).then(buffer => {
                    this.partitions.push(partition);

                    this.dbs.push(buffer);
                }));
        }

        await Promise.all(promises);

    }
}

var partitionData = new PartitionData();

function Solve() {
    let src = cv.imread('canvas');

    let debug = document.getElementById("PuzzleDebug").checked;

    let sTopLeftPos = SolvedTopLeftCorner(src);

    let tileSize = GetTileSize(src, { x: sTopLeftPos.x, y: sTopLeftPos.y });

    console.log(tileSize);

    let uTopLeftPos = { x: (sTopLeftPos.x - (tileSize * 5)), y: sTopLeftPos.y }

    let solvedTiles = [];
    for (let i = 0; i < 4; i++) {
        let y = sTopLeftPos.y + (i * tileSize);
        for (let k = 0; k < 4; k++) {
            let x = sTopLeftPos.x +(k * tileSize);
            let rect = new cv.Rect(x, y, tileSize, tileSize);
            solvedTiles.push(src.roi(rect));
            if (debug)
                cv.imshow(`scanvas${i}-${k}`, src.roi(rect));
        }
    }

    let unsolvedTiles = [];
    for (let i = 0; i < 4; i++) {
        let y = uTopLeftPos.y + (i * tileSize);
        for (let k = 0; k < 4; k++) {
            let x = uTopLeftPos.x + (k * tileSize);
            let rect = new cv.Rect(x, y, tileSize, tileSize);
            let pos = FindPos(solvedTiles, src.roi(rect));
            unsolvedTiles.push(pos == null ? 15 : pos);
            if (debug)
                cv.imshow(`canvas${i}-${k}`, src.roi(rect));
        }
    }
    src.delete();

    const goalState = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const initialState = unsolvedTiles;

    console.log(initialState);
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
        document.getElementById('solution').innerText = "Solution: \n\n" + ans + "\n\nInstructions: \n\nu - tile goes up\nd - tile goes down\nr - tile goes right\nl - tile goes left";
    }).catch(e => {
        console.error(e.message);
    });
}

function SolvedTopLeftCorner(src) {
    for (let x = src.size().width / 2; x <= src.size().width; x++) {
        for (let y = 0; y < src.size().height; y++) {
            let rgba = src.ucharPtr(y, x);
            if (rgba[0] == 0 && rgba[1] == 0 && rgba[2] == 0)
                return { x, y };
        }
    }
}

function GetTileSize(src, pos) {
    let i = 0;
    let rgba = src.ucharPtr(pos.y, pos.x);
    while (i < 5 || (rgba[0] != 0 || rgba[1] != 0 || rgba[2] != 0)) {
        i++;
        pos.x++;
        pos.y++;
        rgba = src.ucharPtr(pos.y, pos.x);
    }

    let k = 0;
    while (rgba[0] == 0 && rgba[1] == 0 && rgba[2] == 0) {
        k++;
        pos.x++;
        pos.y++;
        rgba = src.ucharPtr(pos.y, pos.x);
    }
    k = Math.floor(k / 2);
    return i+k;
}

function CompareMats(mat1, mat2) {
    if (mat1.rows !== mat2.rows || mat1.cols !== mat2.cols) {
        console.error("Dimensions of the Mats are different.");
        return false;
    }

    for (let i = 0; i < mat1.rows; i++) {
        for (let j = 0; j < mat1.cols; j++) {
            let pixel1 = mat1.ucharPtr(j, i);
            let pixel2 = mat2.ucharPtr(j, i);
            if (pixel1[0] != pixel2[0] || pixel1[1] != pixel2[1] || pixel1[2] != pixel2[2]) {
                return false;
            }
        }
    }

    return true;
}

function FindPos(solvedTiles, mat2) {
    let found = null;
    solvedTiles.forEach(function (val, index) {
        if (CompareMats(val, mat2))
            found = index;
    });
    return found;
}