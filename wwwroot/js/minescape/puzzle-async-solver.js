let puzzleWorker = new Worker(new URL('./puzzle-solver.worker', import.meta.url));

class Puzzle {

    static solve(tiles, emptyPos, partitions, dbs, timeout = 120000) {

        return new Promise((resolve, reject) => {
            let timeoutID;
            if (timeout !== null) {
                timeoutID = setTimeout(() => {

                    puzzleWorker.terminate();
                    puzzleWorker = new Worker(new URL('./puzzle-solver.worker', import.meta.url));

                    console.error(`Time limit (${timeout / 1000} seconds) exceeded`);
                }, timeout);
            }

            puzzleWorker.onmessage = e => {
                if (timeoutID) clearTimeout(timeoutID);
                resolve(e.data);
            }

            puzzleWorker.postMessage([tiles, emptyPos, partitions, dbs]);
        });
        
    }
}

export default Puzzle;