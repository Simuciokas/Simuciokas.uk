import ndarray from 'ndarray'

const REVERSE_MOVE_MAP = {
    'r': 'l',
    'l': 'r',
    'd': 'u',
    'u': 'd'
}

class PatternDatabaseHeuristic {

    constructor(grid) {
        this.numRows = grid.numRows;
        this.numCols = grid.numCols;
        this.numTiles = grid.numRows * grid.numCols;
        this.emptyPos = grid.tiles[grid.emptyPos];

        this.partitions = grid.partitions;
        let dbsNew = []
        this.partitions.forEach((partition, index) => {
            dbsNew.push(ndarray(new Uint8Array(grid.dbs[index]), new Uint8Array(partition.length).fill(this.numTiles)));
        });
        this.dbs = dbsNew;

        this.goalMap = new Uint8Array(this.numTiles);

        grid.tiles.forEach((goalInd, ind) => {
            this.goalMap[goalInd] = ind;
        });
    }

    calculate(grid) {

        let heuristicValue = 0;
        this.partitions.forEach((partition, ind) => {
            let indices = partition.map(goalInd => this.goalMap[goalInd]);
            heuristicValue += this.dbs[ind].get(...indices);
        });

        return heuristicValue;
    }

    update(newGrid, startInd, endInd, move) {
        this.goalMap[newGrid.tiles[endInd]] = endInd;
        this.goalMap[newGrid.tiles[startInd]] = startInd;

        return this.calculate(newGrid);
    }

    reverseUpdate(newGrid, {emptyPos: oldEmptyPos}) {
        let goalInd = newGrid.tiles[oldEmptyPos];
        let emptyGoalInd = newGrid.tiles[newGrid.emptyPos];

        this.goalMap[goalInd] = newGrid.emptyPos;
        this.goalMap[emptyGoalInd] = oldEmptyPos;
    }

    isSolved(heuristicValue) {
        return heuristicValue === 0;
    }
}

class PuzzleSolver {
    
    constructor(tiles, emptyPos, partitions, dbs) {
        this.numRows = 4;
        this.numCols = 4;
        this.tiles = Uint8Array.from(tiles);
        this.emptyPos = emptyPos;
        this.partitions = partitions;
        this.dbs = dbs;
        this.heuristic = new PatternDatabaseHeuristic(this);
        this.solver = 'IDA*';
    };

    async solve(maxNodesExpanded = 1000000000) {

        return this.solveIDAStar(maxNodesExpanded);
    }

    solveIDAStar(maxNodesExpanded) {
        let grid = new Grid(this.numRows, this.numCols, this.tiles, this.emptyPos, this.heuristic);

        let bound = grid.heuristicValue;
        let path = [];

        while (true) {
            let output = this._searchIDAStar(grid, path, 0, bound);
            if (output === true) {
                return path;
            } else if (output === Infinity) {
                return null;
            }
            bound = output;
        }
        return null;
    }

    _searchIDAStar(grid, path, traveledDist, bound) {

        let totalDist = traveledDist + grid.heuristicValue;

        if (totalDist > bound) return totalDist;
        if (grid.isSolved()) return true;

        let minTotalDist = Infinity;
        for (let move of grid.getValidMoves()) {
            if (move !== Grid.getReversedMove(path[path.length - 1])) {
                let moveRecord = grid.applyMove(move);
                path.push(move);

                let output = this._searchIDAStar(grid, path, traveledDist + 1, bound);
                if (output === true) return true;
                if (output < minTotalDist) minTotalDist = output;

                path.pop();
                grid.reverseMove(moveRecord);
            }
        }
        return minTotalDist;
    } 

}


class Grid {

    constructor(numRows, numCols, tiles, emptyPos, heuristic, traveledDist = 0,
        heuristicValue = null, validMoves = null) {
        this.numRows = numRows;
        this.numCols = numCols;
        this.tiles = tiles;
        this.emptyPos = emptyPos;

        this.heuristic = heuristic;
        this.traveledDist = traveledDist;
        this.heuristicValue = heuristicValue === null ? heuristic.calculate(this) : heuristicValue;

        this.validMoves = validMoves === null ? this._precomputeValidMoves() : validMoves;
    }

    getTileCol(ind) {
        return ind % this.numCols;
    }

    getTileRow(ind) {
        return Math.floor(ind / this.numCols);
    }

    getIndex(row, col) {
        return row * this.numCols + col;
    }

    getMoveDelta(move) {
        const moveDeltaMap = {
            'r': 1,
            'l': -1,
            'u': -this.numCols,
            'd': this.numCols
        }
        return moveDeltaMap[move];
    }

    getMovedInd(move) {
        return this.emptyPos - this.getMoveDelta(move);
    }

    static getReversedMove(move) {
        return REVERSE_MOVE_MAP[move];
    }

    getTileDist(tile1, tile2) {
        return Math.abs(this.getTileRow(tile1) - this.getTileRow(tile2)) +
            Math.abs(this.getTileCol(tile1) - this.getTileCol(tile2));
    }

    applyMove(move) {
        let oldHeuristicValue = this.heuristicValue;
        let oldEmptyPos = this.emptyPos;

        let movedInd = this.getMovedInd(move);
        let endInd = this.emptyPos;

        this.swap(endInd, movedInd);
        this.emptyPos = movedInd;

        this.traveledDist++;

        this.heuristicValue = this.heuristic.update(this, movedInd, endInd, move);

        return {heuristicValue: oldHeuristicValue, emptyPos: oldEmptyPos};
    }

    reverseMove(moveRecord) {
        this.heuristic.reverseUpdate(this, moveRecord);
        this.traveledDist--;

        this.heuristicValue = moveRecord.heuristicValue;

        this.swap(this.emptyPos, moveRecord.emptyPos);
        this.emptyPos = moveRecord.emptyPos;
    }

    swap(pos1, pos2) {
        [this.tiles[pos1], this.tiles[pos2]] = [this.tiles[pos2], this.tiles[pos1]];
    }

    _precomputeValidMoves() {
        let moves;
        let validMoves = [];
        for (let emptyPos = 0; emptyPos < this.tiles.length; emptyPos++) {
            moves = [];

            let row = this.getTileRow(emptyPos);
            let col = this.getTileCol(emptyPos);

            if (row < this.numRows - 1) moves.push('u');
            
            if (row > 0) moves.push('d');
            
            if (col < this.numCols - 1) moves.push('l');
            
            if (col > 0) moves.push('r');

            validMoves[emptyPos] = moves;
        }
        return validMoves;
    }

    getValidMoves() {
        return this.validMoves[this.emptyPos];
    }

    isSolved() {
        let solved = this.heuristic.isSolved(this.heuristicValue);
        if (solved === undefined) {
            return this.tiles.every((goalInd, ind) => goalInd === ind);
        } else {
            return solved;
        }
    }
}

export default PuzzleSolver;