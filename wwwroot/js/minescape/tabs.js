/*var puzzleNav = document.getElementById("rPuzzle");
var lightNav = document.getElementById("rLight");
var cypherNav = document.getElementById("rCypher");
var anagramNav = document.getElementById("rAnagram");
var chestNav = document.getElementById("rChest");
var hotColdNav = document.getElementById("rHotCold");*/

var radios = document.getElementById("Navigation").querySelectorAll("input")
var currentPage = "Puzzle"
resetPage();

function resetPage() {
    document.querySelectorAll(".main").forEach(x => x.style.display = "none");
    document.getElementById(currentPage).style.display = ""
    radios.forEach(x => x.checked = x.value == currentPage);
}

for (let i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', function () {
        changePage(this.value);
    });
}



function changePage(page) {
    if (currentPage == page)
        return;

    document.getElementById(currentPage).style.display = "none"
    document.getElementById(page).style.display = ""
    currentPage = page
}