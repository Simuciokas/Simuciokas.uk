/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./wwwroot/js/minescape/puzzle-algorithm.js":
/*!**************************************************!*\
  !*** ./wwwroot/js/minescape/puzzle-algorithm.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var ndarray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ndarray */ \"./node_modules/ndarray/ndarray.js\");\n/* harmony import */ var ndarray__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(ndarray__WEBPACK_IMPORTED_MODULE_0__);\n\n\nconst REVERSE_MOVE_MAP = {\n    'r': 'l',\n    'l': 'r',\n    'd': 'u',\n    'u': 'd'\n}\n\nclass PatternDatabaseHeuristic {\n\n    constructor(grid) {\n        this.numRows = grid.numRows;\n        this.numCols = grid.numCols;\n        this.numTiles = grid.numRows * grid.numCols;\n        this.emptyPos = grid.tiles[grid.emptyPos];\n\n        this.partitions = grid.partitions;\n        let dbsNew = []\n        this.partitions.forEach((partition, index) => {\n            dbsNew.push(ndarray__WEBPACK_IMPORTED_MODULE_0___default()(new Uint8Array(grid.dbs[index]), new Uint8Array(partition.length).fill(this.numTiles)));\n        });\n        this.dbs = dbsNew;\n\n        this.goalMap = new Uint8Array(this.numTiles);\n\n        grid.tiles.forEach((goalInd, ind) => {\n            this.goalMap[goalInd] = ind;\n        });\n    }\n\n    calculate(grid) {\n\n        let heuristicValue = 0;\n        this.partitions.forEach((partition, ind) => {\n            let indices = partition.map(goalInd => this.goalMap[goalInd]);\n            heuristicValue += this.dbs[ind].get(...indices);\n        });\n\n        return heuristicValue;\n    }\n\n    update(newGrid, startInd, endInd, move) {\n        this.goalMap[newGrid.tiles[endInd]] = endInd;\n        this.goalMap[newGrid.tiles[startInd]] = startInd;\n\n        return this.calculate(newGrid);\n    }\n\n    reverseUpdate(newGrid, {emptyPos: oldEmptyPos}) {\n        let goalInd = newGrid.tiles[oldEmptyPos];\n        let emptyGoalInd = newGrid.tiles[newGrid.emptyPos];\n\n        this.goalMap[goalInd] = newGrid.emptyPos;\n        this.goalMap[emptyGoalInd] = oldEmptyPos;\n    }\n\n    isSolved(heuristicValue) {\n        return heuristicValue === 0;\n    }\n}\n\nclass PuzzleSolver {\n    \n    constructor(tiles, emptyPos, partitions, dbs) {\n        this.numRows = 4;\n        this.numCols = 4;\n        this.tiles = Uint8Array.from(tiles);\n        this.emptyPos = emptyPos;\n        this.partitions = partitions;\n        this.dbs = dbs;\n        this.heuristic = new PatternDatabaseHeuristic(this);\n        this.solver = 'IDA*';\n    };\n\n    async solve(maxNodesExpanded = 1000000000) {\n\n        return this.solveIDAStar(maxNodesExpanded);\n    }\n\n    solveIDAStar(maxNodesExpanded) {\n        let grid = new Grid(this.numRows, this.numCols, this.tiles, this.emptyPos, this.heuristic);\n\n        let bound = grid.heuristicValue;\n        let path = [];\n\n        while (true) {\n            let output = this._searchIDAStar(grid, path, 0, bound);\n            if (output === true) {\n                return path;\n            } else if (output === Infinity) {\n                return null;\n            }\n            bound = output;\n        }\n        return null;\n    }\n\n    _searchIDAStar(grid, path, traveledDist, bound) {\n\n        let totalDist = traveledDist + grid.heuristicValue;\n\n        if (totalDist > bound) return totalDist;\n        if (grid.isSolved()) return true;\n\n        let minTotalDist = Infinity;\n        for (let move of grid.getValidMoves()) {\n            if (move !== Grid.getReversedMove(path[path.length - 1])) {\n                let moveRecord = grid.applyMove(move);\n                path.push(move);\n\n                let output = this._searchIDAStar(grid, path, traveledDist + 1, bound);\n                if (output === true) return true;\n                if (output < minTotalDist) minTotalDist = output;\n\n                path.pop();\n                grid.reverseMove(moveRecord);\n            }\n        }\n        return minTotalDist;\n    } \n\n}\n\n\nclass Grid {\n\n    constructor(numRows, numCols, tiles, emptyPos, heuristic, traveledDist = 0,\n        heuristicValue = null, validMoves = null) {\n        this.numRows = numRows;\n        this.numCols = numCols;\n        this.tiles = tiles;\n        this.emptyPos = emptyPos;\n\n        this.heuristic = heuristic;\n        this.traveledDist = traveledDist;\n        this.heuristicValue = heuristicValue === null ? heuristic.calculate(this) : heuristicValue;\n\n        this.validMoves = validMoves === null ? this._precomputeValidMoves() : validMoves;\n    }\n\n    getTileCol(ind) {\n        return ind % this.numCols;\n    }\n\n    getTileRow(ind) {\n        return Math.floor(ind / this.numCols);\n    }\n\n    getIndex(row, col) {\n        return row * this.numCols + col;\n    }\n\n    getMoveDelta(move) {\n        const moveDeltaMap = {\n            'r': 1,\n            'l': -1,\n            'u': -this.numCols,\n            'd': this.numCols\n        }\n        return moveDeltaMap[move];\n    }\n\n    getMovedInd(move) {\n        return this.emptyPos - this.getMoveDelta(move);\n    }\n\n    static getReversedMove(move) {\n        return REVERSE_MOVE_MAP[move];\n    }\n\n    getTileDist(tile1, tile2) {\n        return Math.abs(this.getTileRow(tile1) - this.getTileRow(tile2)) +\n            Math.abs(this.getTileCol(tile1) - this.getTileCol(tile2));\n    }\n\n    applyMove(move) {\n        let oldHeuristicValue = this.heuristicValue;\n        let oldEmptyPos = this.emptyPos;\n\n        let movedInd = this.getMovedInd(move);\n        let endInd = this.emptyPos;\n\n        this.swap(endInd, movedInd);\n        this.emptyPos = movedInd;\n\n        this.traveledDist++;\n\n        this.heuristicValue = this.heuristic.update(this, movedInd, endInd, move);\n\n        return {heuristicValue: oldHeuristicValue, emptyPos: oldEmptyPos};\n    }\n\n    reverseMove(moveRecord) {\n        this.heuristic.reverseUpdate(this, moveRecord);\n        this.traveledDist--;\n\n        this.heuristicValue = moveRecord.heuristicValue;\n\n        this.swap(this.emptyPos, moveRecord.emptyPos);\n        this.emptyPos = moveRecord.emptyPos;\n    }\n\n    swap(pos1, pos2) {\n        [this.tiles[pos1], this.tiles[pos2]] = [this.tiles[pos2], this.tiles[pos1]];\n    }\n\n    _precomputeValidMoves() {\n        let moves;\n        let validMoves = [];\n        for (let emptyPos = 0; emptyPos < this.tiles.length; emptyPos++) {\n            moves = [];\n\n            let row = this.getTileRow(emptyPos);\n            let col = this.getTileCol(emptyPos);\n\n            if (row < this.numRows - 1) moves.push('u');\n            \n            if (row > 0) moves.push('d');\n            \n            if (col < this.numCols - 1) moves.push('l');\n            \n            if (col > 0) moves.push('r');\n\n            validMoves[emptyPos] = moves;\n        }\n        return validMoves;\n    }\n\n    getValidMoves() {\n        return this.validMoves[this.emptyPos];\n    }\n\n    isSolved() {\n        let solved = this.heuristic.isSolved(this.heuristicValue);\n        if (solved === undefined) {\n            return this.tiles.every((goalInd, ind) => goalInd === ind);\n        } else {\n            return solved;\n        }\n    }\n}\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PuzzleSolver);//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi93d3dyb290L2pzL21pbmVzY2FwZS9wdXp6bGUtYWxnb3JpdGhtLmpzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUE2Qjs7QUFFN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLDhDQUFPO0FBQy9CLFNBQVM7QUFDVDs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsU0FBUztBQUNUOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLDRCQUE0QixzQkFBc0I7QUFDbEQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7O0FBR0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUEsZ0JBQWdCO0FBQ2hCOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQiw4QkFBOEI7QUFDN0Q7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaUVBQWUsWUFBWSIsInNvdXJjZXMiOlsid2VicGFjazovL3dlYmFwcGxpY2F0aW9uMS8uL3d3d3Jvb3QvanMvbWluZXNjYXBlL3B1enpsZS1hbGdvcml0aG0uanM/ZDZiNCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbmRhcnJheSBmcm9tICduZGFycmF5J1xuXG5jb25zdCBSRVZFUlNFX01PVkVfTUFQID0ge1xuICAgICdyJzogJ2wnLFxuICAgICdsJzogJ3InLFxuICAgICdkJzogJ3UnLFxuICAgICd1JzogJ2QnXG59XG5cbmNsYXNzIFBhdHRlcm5EYXRhYmFzZUhldXJpc3RpYyB7XG5cbiAgICBjb25zdHJ1Y3RvcihncmlkKSB7XG4gICAgICAgIHRoaXMubnVtUm93cyA9IGdyaWQubnVtUm93cztcbiAgICAgICAgdGhpcy5udW1Db2xzID0gZ3JpZC5udW1Db2xzO1xuICAgICAgICB0aGlzLm51bVRpbGVzID0gZ3JpZC5udW1Sb3dzICogZ3JpZC5udW1Db2xzO1xuICAgICAgICB0aGlzLmVtcHR5UG9zID0gZ3JpZC50aWxlc1tncmlkLmVtcHR5UG9zXTtcblxuICAgICAgICB0aGlzLnBhcnRpdGlvbnMgPSBncmlkLnBhcnRpdGlvbnM7XG4gICAgICAgIGxldCBkYnNOZXcgPSBbXVxuICAgICAgICB0aGlzLnBhcnRpdGlvbnMuZm9yRWFjaCgocGFydGl0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgZGJzTmV3LnB1c2gobmRhcnJheShuZXcgVWludDhBcnJheShncmlkLmRic1tpbmRleF0pLCBuZXcgVWludDhBcnJheShwYXJ0aXRpb24ubGVuZ3RoKS5maWxsKHRoaXMubnVtVGlsZXMpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRicyA9IGRic05ldztcblxuICAgICAgICB0aGlzLmdvYWxNYXAgPSBuZXcgVWludDhBcnJheSh0aGlzLm51bVRpbGVzKTtcblxuICAgICAgICBncmlkLnRpbGVzLmZvckVhY2goKGdvYWxJbmQsIGluZCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nb2FsTWFwW2dvYWxJbmRdID0gaW5kO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjYWxjdWxhdGUoZ3JpZCkge1xuXG4gICAgICAgIGxldCBoZXVyaXN0aWNWYWx1ZSA9IDA7XG4gICAgICAgIHRoaXMucGFydGl0aW9ucy5mb3JFYWNoKChwYXJ0aXRpb24sIGluZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGluZGljZXMgPSBwYXJ0aXRpb24ubWFwKGdvYWxJbmQgPT4gdGhpcy5nb2FsTWFwW2dvYWxJbmRdKTtcbiAgICAgICAgICAgIGhldXJpc3RpY1ZhbHVlICs9IHRoaXMuZGJzW2luZF0uZ2V0KC4uLmluZGljZXMpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaGV1cmlzdGljVmFsdWU7XG4gICAgfVxuXG4gICAgdXBkYXRlKG5ld0dyaWQsIHN0YXJ0SW5kLCBlbmRJbmQsIG1vdmUpIHtcbiAgICAgICAgdGhpcy5nb2FsTWFwW25ld0dyaWQudGlsZXNbZW5kSW5kXV0gPSBlbmRJbmQ7XG4gICAgICAgIHRoaXMuZ29hbE1hcFtuZXdHcmlkLnRpbGVzW3N0YXJ0SW5kXV0gPSBzdGFydEluZDtcblxuICAgICAgICByZXR1cm4gdGhpcy5jYWxjdWxhdGUobmV3R3JpZCk7XG4gICAgfVxuXG4gICAgcmV2ZXJzZVVwZGF0ZShuZXdHcmlkLCB7ZW1wdHlQb3M6IG9sZEVtcHR5UG9zfSkge1xuICAgICAgICBsZXQgZ29hbEluZCA9IG5ld0dyaWQudGlsZXNbb2xkRW1wdHlQb3NdO1xuICAgICAgICBsZXQgZW1wdHlHb2FsSW5kID0gbmV3R3JpZC50aWxlc1tuZXdHcmlkLmVtcHR5UG9zXTtcblxuICAgICAgICB0aGlzLmdvYWxNYXBbZ29hbEluZF0gPSBuZXdHcmlkLmVtcHR5UG9zO1xuICAgICAgICB0aGlzLmdvYWxNYXBbZW1wdHlHb2FsSW5kXSA9IG9sZEVtcHR5UG9zO1xuICAgIH1cblxuICAgIGlzU29sdmVkKGhldXJpc3RpY1ZhbHVlKSB7XG4gICAgICAgIHJldHVybiBoZXVyaXN0aWNWYWx1ZSA9PT0gMDtcbiAgICB9XG59XG5cbmNsYXNzIFB1enpsZVNvbHZlciB7XG4gICAgXG4gICAgY29uc3RydWN0b3IodGlsZXMsIGVtcHR5UG9zLCBwYXJ0aXRpb25zLCBkYnMpIHtcbiAgICAgICAgdGhpcy5udW1Sb3dzID0gNDtcbiAgICAgICAgdGhpcy5udW1Db2xzID0gNDtcbiAgICAgICAgdGhpcy50aWxlcyA9IFVpbnQ4QXJyYXkuZnJvbSh0aWxlcyk7XG4gICAgICAgIHRoaXMuZW1wdHlQb3MgPSBlbXB0eVBvcztcbiAgICAgICAgdGhpcy5wYXJ0aXRpb25zID0gcGFydGl0aW9ucztcbiAgICAgICAgdGhpcy5kYnMgPSBkYnM7XG4gICAgICAgIHRoaXMuaGV1cmlzdGljID0gbmV3IFBhdHRlcm5EYXRhYmFzZUhldXJpc3RpYyh0aGlzKTtcbiAgICAgICAgdGhpcy5zb2x2ZXIgPSAnSURBKic7XG4gICAgfTtcblxuICAgIGFzeW5jIHNvbHZlKG1heE5vZGVzRXhwYW5kZWQgPSAxMDAwMDAwMDAwKSB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc29sdmVJREFTdGFyKG1heE5vZGVzRXhwYW5kZWQpO1xuICAgIH1cblxuICAgIHNvbHZlSURBU3RhcihtYXhOb2Rlc0V4cGFuZGVkKSB7XG4gICAgICAgIGxldCBncmlkID0gbmV3IEdyaWQodGhpcy5udW1Sb3dzLCB0aGlzLm51bUNvbHMsIHRoaXMudGlsZXMsIHRoaXMuZW1wdHlQb3MsIHRoaXMuaGV1cmlzdGljKTtcblxuICAgICAgICBsZXQgYm91bmQgPSBncmlkLmhldXJpc3RpY1ZhbHVlO1xuICAgICAgICBsZXQgcGF0aCA9IFtdO1xuXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBsZXQgb3V0cHV0ID0gdGhpcy5fc2VhcmNoSURBU3RhcihncmlkLCBwYXRoLCAwLCBib3VuZCk7XG4gICAgICAgICAgICBpZiAob3V0cHV0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dCA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJvdW5kID0gb3V0cHV0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIF9zZWFyY2hJREFTdGFyKGdyaWQsIHBhdGgsIHRyYXZlbGVkRGlzdCwgYm91bmQpIHtcblxuICAgICAgICBsZXQgdG90YWxEaXN0ID0gdHJhdmVsZWREaXN0ICsgZ3JpZC5oZXVyaXN0aWNWYWx1ZTtcblxuICAgICAgICBpZiAodG90YWxEaXN0ID4gYm91bmQpIHJldHVybiB0b3RhbERpc3Q7XG4gICAgICAgIGlmIChncmlkLmlzU29sdmVkKCkpIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGxldCBtaW5Ub3RhbERpc3QgPSBJbmZpbml0eTtcbiAgICAgICAgZm9yIChsZXQgbW92ZSBvZiBncmlkLmdldFZhbGlkTW92ZXMoKSkge1xuICAgICAgICAgICAgaWYgKG1vdmUgIT09IEdyaWQuZ2V0UmV2ZXJzZWRNb3ZlKHBhdGhbcGF0aC5sZW5ndGggLSAxXSkpIHtcbiAgICAgICAgICAgICAgICBsZXQgbW92ZVJlY29yZCA9IGdyaWQuYXBwbHlNb3ZlKG1vdmUpO1xuICAgICAgICAgICAgICAgIHBhdGgucHVzaChtb3ZlKTtcblxuICAgICAgICAgICAgICAgIGxldCBvdXRwdXQgPSB0aGlzLl9zZWFyY2hJREFTdGFyKGdyaWQsIHBhdGgsIHRyYXZlbGVkRGlzdCArIDEsIGJvdW5kKTtcbiAgICAgICAgICAgICAgICBpZiAob3V0cHV0ID09PSB0cnVlKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAob3V0cHV0IDwgbWluVG90YWxEaXN0KSBtaW5Ub3RhbERpc3QgPSBvdXRwdXQ7XG5cbiAgICAgICAgICAgICAgICBwYXRoLnBvcCgpO1xuICAgICAgICAgICAgICAgIGdyaWQucmV2ZXJzZU1vdmUobW92ZVJlY29yZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1pblRvdGFsRGlzdDtcbiAgICB9IFxuXG59XG5cblxuY2xhc3MgR3JpZCB7XG5cbiAgICBjb25zdHJ1Y3RvcihudW1Sb3dzLCBudW1Db2xzLCB0aWxlcywgZW1wdHlQb3MsIGhldXJpc3RpYywgdHJhdmVsZWREaXN0ID0gMCxcbiAgICAgICAgaGV1cmlzdGljVmFsdWUgPSBudWxsLCB2YWxpZE1vdmVzID0gbnVsbCkge1xuICAgICAgICB0aGlzLm51bVJvd3MgPSBudW1Sb3dzO1xuICAgICAgICB0aGlzLm51bUNvbHMgPSBudW1Db2xzO1xuICAgICAgICB0aGlzLnRpbGVzID0gdGlsZXM7XG4gICAgICAgIHRoaXMuZW1wdHlQb3MgPSBlbXB0eVBvcztcblxuICAgICAgICB0aGlzLmhldXJpc3RpYyA9IGhldXJpc3RpYztcbiAgICAgICAgdGhpcy50cmF2ZWxlZERpc3QgPSB0cmF2ZWxlZERpc3Q7XG4gICAgICAgIHRoaXMuaGV1cmlzdGljVmFsdWUgPSBoZXVyaXN0aWNWYWx1ZSA9PT0gbnVsbCA/IGhldXJpc3RpYy5jYWxjdWxhdGUodGhpcykgOiBoZXVyaXN0aWNWYWx1ZTtcblxuICAgICAgICB0aGlzLnZhbGlkTW92ZXMgPSB2YWxpZE1vdmVzID09PSBudWxsID8gdGhpcy5fcHJlY29tcHV0ZVZhbGlkTW92ZXMoKSA6IHZhbGlkTW92ZXM7XG4gICAgfVxuXG4gICAgZ2V0VGlsZUNvbChpbmQpIHtcbiAgICAgICAgcmV0dXJuIGluZCAlIHRoaXMubnVtQ29scztcbiAgICB9XG5cbiAgICBnZXRUaWxlUm93KGluZCkge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihpbmQgLyB0aGlzLm51bUNvbHMpO1xuICAgIH1cblxuICAgIGdldEluZGV4KHJvdywgY29sKSB7XG4gICAgICAgIHJldHVybiByb3cgKiB0aGlzLm51bUNvbHMgKyBjb2w7XG4gICAgfVxuXG4gICAgZ2V0TW92ZURlbHRhKG1vdmUpIHtcbiAgICAgICAgY29uc3QgbW92ZURlbHRhTWFwID0ge1xuICAgICAgICAgICAgJ3InOiAxLFxuICAgICAgICAgICAgJ2wnOiAtMSxcbiAgICAgICAgICAgICd1JzogLXRoaXMubnVtQ29scyxcbiAgICAgICAgICAgICdkJzogdGhpcy5udW1Db2xzXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1vdmVEZWx0YU1hcFttb3ZlXTtcbiAgICB9XG5cbiAgICBnZXRNb3ZlZEluZChtb3ZlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVtcHR5UG9zIC0gdGhpcy5nZXRNb3ZlRGVsdGEobW92ZSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFJldmVyc2VkTW92ZShtb3ZlKSB7XG4gICAgICAgIHJldHVybiBSRVZFUlNFX01PVkVfTUFQW21vdmVdO1xuICAgIH1cblxuICAgIGdldFRpbGVEaXN0KHRpbGUxLCB0aWxlMikge1xuICAgICAgICByZXR1cm4gTWF0aC5hYnModGhpcy5nZXRUaWxlUm93KHRpbGUxKSAtIHRoaXMuZ2V0VGlsZVJvdyh0aWxlMikpICtcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMuZ2V0VGlsZUNvbCh0aWxlMSkgLSB0aGlzLmdldFRpbGVDb2wodGlsZTIpKTtcbiAgICB9XG5cbiAgICBhcHBseU1vdmUobW92ZSkge1xuICAgICAgICBsZXQgb2xkSGV1cmlzdGljVmFsdWUgPSB0aGlzLmhldXJpc3RpY1ZhbHVlO1xuICAgICAgICBsZXQgb2xkRW1wdHlQb3MgPSB0aGlzLmVtcHR5UG9zO1xuXG4gICAgICAgIGxldCBtb3ZlZEluZCA9IHRoaXMuZ2V0TW92ZWRJbmQobW92ZSk7XG4gICAgICAgIGxldCBlbmRJbmQgPSB0aGlzLmVtcHR5UG9zO1xuXG4gICAgICAgIHRoaXMuc3dhcChlbmRJbmQsIG1vdmVkSW5kKTtcbiAgICAgICAgdGhpcy5lbXB0eVBvcyA9IG1vdmVkSW5kO1xuXG4gICAgICAgIHRoaXMudHJhdmVsZWREaXN0Kys7XG5cbiAgICAgICAgdGhpcy5oZXVyaXN0aWNWYWx1ZSA9IHRoaXMuaGV1cmlzdGljLnVwZGF0ZSh0aGlzLCBtb3ZlZEluZCwgZW5kSW5kLCBtb3ZlKTtcblxuICAgICAgICByZXR1cm4ge2hldXJpc3RpY1ZhbHVlOiBvbGRIZXVyaXN0aWNWYWx1ZSwgZW1wdHlQb3M6IG9sZEVtcHR5UG9zfTtcbiAgICB9XG5cbiAgICByZXZlcnNlTW92ZShtb3ZlUmVjb3JkKSB7XG4gICAgICAgIHRoaXMuaGV1cmlzdGljLnJldmVyc2VVcGRhdGUodGhpcywgbW92ZVJlY29yZCk7XG4gICAgICAgIHRoaXMudHJhdmVsZWREaXN0LS07XG5cbiAgICAgICAgdGhpcy5oZXVyaXN0aWNWYWx1ZSA9IG1vdmVSZWNvcmQuaGV1cmlzdGljVmFsdWU7XG5cbiAgICAgICAgdGhpcy5zd2FwKHRoaXMuZW1wdHlQb3MsIG1vdmVSZWNvcmQuZW1wdHlQb3MpO1xuICAgICAgICB0aGlzLmVtcHR5UG9zID0gbW92ZVJlY29yZC5lbXB0eVBvcztcbiAgICB9XG5cbiAgICBzd2FwKHBvczEsIHBvczIpIHtcbiAgICAgICAgW3RoaXMudGlsZXNbcG9zMV0sIHRoaXMudGlsZXNbcG9zMl1dID0gW3RoaXMudGlsZXNbcG9zMl0sIHRoaXMudGlsZXNbcG9zMV1dO1xuICAgIH1cblxuICAgIF9wcmVjb21wdXRlVmFsaWRNb3ZlcygpIHtcbiAgICAgICAgbGV0IG1vdmVzO1xuICAgICAgICBsZXQgdmFsaWRNb3ZlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBlbXB0eVBvcyA9IDA7IGVtcHR5UG9zIDwgdGhpcy50aWxlcy5sZW5ndGg7IGVtcHR5UG9zKyspIHtcbiAgICAgICAgICAgIG1vdmVzID0gW107XG5cbiAgICAgICAgICAgIGxldCByb3cgPSB0aGlzLmdldFRpbGVSb3coZW1wdHlQb3MpO1xuICAgICAgICAgICAgbGV0IGNvbCA9IHRoaXMuZ2V0VGlsZUNvbChlbXB0eVBvcyk7XG5cbiAgICAgICAgICAgIGlmIChyb3cgPCB0aGlzLm51bVJvd3MgLSAxKSBtb3Zlcy5wdXNoKCd1Jyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyb3cgPiAwKSBtb3Zlcy5wdXNoKCdkJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjb2wgPCB0aGlzLm51bUNvbHMgLSAxKSBtb3Zlcy5wdXNoKCdsJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjb2wgPiAwKSBtb3Zlcy5wdXNoKCdyJyk7XG5cbiAgICAgICAgICAgIHZhbGlkTW92ZXNbZW1wdHlQb3NdID0gbW92ZXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbGlkTW92ZXM7XG4gICAgfVxuXG4gICAgZ2V0VmFsaWRNb3ZlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRNb3Zlc1t0aGlzLmVtcHR5UG9zXTtcbiAgICB9XG5cbiAgICBpc1NvbHZlZCgpIHtcbiAgICAgICAgbGV0IHNvbHZlZCA9IHRoaXMuaGV1cmlzdGljLmlzU29sdmVkKHRoaXMuaGV1cmlzdGljVmFsdWUpO1xuICAgICAgICBpZiAoc29sdmVkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRpbGVzLmV2ZXJ5KChnb2FsSW5kLCBpbmQpID0+IGdvYWxJbmQgPT09IGluZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc29sdmVkO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQdXp6bGVTb2x2ZXI7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./wwwroot/js/minescape/puzzle-algorithm.js\n");

/***/ }),

/***/ "./wwwroot/js/minescape/puzzle-solver.worker.js":
/*!******************************************************!*\
  !*** ./wwwroot/js/minescape/puzzle-solver.worker.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _puzzle_algorithm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./puzzle-algorithm */ \"./wwwroot/js/minescape/puzzle-algorithm.js\");\n\n\nonmessage = function (e) {\n    let puzzle = new _puzzle_algorithm__WEBPACK_IMPORTED_MODULE_0__[\"default\"](...e.data);\n    puzzle.solve().then(moves => postMessage(moves));\n};//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi93d3dyb290L2pzL21pbmVzY2FwZS9wdXp6bGUtc29sdmVyLndvcmtlci5qcyIsIm1hcHBpbmdzIjoiOztBQUE2Qzs7QUFFN0M7QUFDQSxxQkFBcUIseURBQVk7QUFDakM7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3dlYmFwcGxpY2F0aW9uMS8uL3d3d3Jvb3QvanMvbWluZXNjYXBlL3B1enpsZS1zb2x2ZXIud29ya2VyLmpzP2Y5YTMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFB1enpsZVNvbHZlciBmcm9tICcuL3B1enpsZS1hbGdvcml0aG0nXG5cbm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgbGV0IHB1enpsZSA9IG5ldyBQdXp6bGVTb2x2ZXIoLi4uZS5kYXRhKTtcbiAgICBwdXp6bGUuc29sdmUoKS50aGVuKG1vdmVzID0+IHBvc3RNZXNzYWdlKG1vdmVzKSk7XG59OyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./wwwroot/js/minescape/puzzle-solver.worker.js\n");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_ndarray_ndarray_js"], () => (__webpack_require__("./wwwroot/js/minescape/puzzle-solver.worker.js")))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".minescape.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"wwwroot_js_minescape_puzzle-solver_worker_js-_f9a30": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkwebapplication1"] = self["webpackChunkwebapplication1"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			return __webpack_require__.e("vendors-node_modules_ndarray_ndarray_js").then(next);
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ })()
;
//# sourceMappingURL=wwwroot_js_minescape_puzzle-solver_worker_js-_f9a30.minescape.js.map