import PuzzleSolver from './puzzle-algorithm'

onmessage = function (e) {
    let puzzle = new PuzzleSolver(...e.data);
    puzzle.solve().then(moves => postMessage(moves));
};