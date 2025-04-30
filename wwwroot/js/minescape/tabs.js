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

window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1)
    if (!hash) return

    const radio = document.querySelector(`input.navRadio[value="${hash}"]`)
    if (radio) {
        radio.checked = true
        changePage(hash)
    }
});
