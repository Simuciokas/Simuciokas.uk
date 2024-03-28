var puzzleNav = document.getElementById("rPuzzle");
var lightNav = document.getElementById("rLight");
var cypherNav = document.getElementById("rCypher");
var anagramNav = document.getElementById("rAnagram");

var radios = document.getElementsByClassName("radio");
var currentPage = "Light";
for (let i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', function () {
        changePage(this.value);
    });
}

function changePage(page) {
    if (currentPage == page)
        return;

    document.getElementById(currentPage).style.display = "none";
    document.getElementById(page).style.display = "";
    currentPage = page;
}