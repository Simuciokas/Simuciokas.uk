// Shared fuzzy/exact text search primitives used by the typeahead solvers
// (anagram, beacon, chest) and by the GE search box.

export function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + 1
                );
            }
        }
    }

    return matrix[a.length][b.length];
}

export function fuzzyMatch(query, text) {
    const queryWords = query.split(' ');
    const textWords = text.split(' ');

    return queryWords.every(qWord =>
        textWords.some(tWord =>
            tWord.includes(qWord) || levenshteinDistance(qWord, tWord) <= 1
        )
    );
}

export function exactMatch(query, text) {
    const queryWords = query.split(' ');
    const textWords = text.split(' ');

    return queryWords.every(qWord =>
        textWords.some(tWord => tWord.includes(qWord))
    );
}

export function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[_\s]+/g, ' ')
        .trim();
}
