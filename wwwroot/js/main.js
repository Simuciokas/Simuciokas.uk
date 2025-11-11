(() => {
    'use strict'

    const getStoredTheme = () => localStorage.getItem('theme')
    const setStoredTheme = theme => localStorage.setItem('theme', theme)

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme()
        if (storedTheme) {
            return storedTheme
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const setTheme = theme => {
        if (theme === 'auto') {
            document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme)
        }
    }

    setTheme(getPreferredTheme())

    const showActiveTheme = (theme, focus = false) => {
        const themeSwitcher = document.querySelector('#bd-theme')

        if (!themeSwitcher) {
            return
        }

        const themeSwitcherText = document.querySelector('#bd-theme-text')
        const activeThemeIcon = document.querySelector('.theme-icon-active use')
        const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`)
        const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href')

        document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
            element.classList.remove('active')
            element.setAttribute('aria-pressed', 'false')
        })

        btnToActive.classList.add('active')
        btnToActive.setAttribute('aria-pressed', 'true')
        activeThemeIcon.setAttribute('href', svgOfActiveBtn)
        const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`
        themeSwitcher.setAttribute('aria-label', themeSwitcherLabel)

        if (focus) {
            themeSwitcher.focus()
        }
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const storedTheme = getStoredTheme()
        if (storedTheme !== 'light' && storedTheme !== 'dark') {
            setTheme(getPreferredTheme())
        }
    })

    let fileList = []

    window.addEventListener('DOMContentLoaded', () => {
        showActiveTheme(getPreferredTheme())

        document.querySelectorAll('[data-bs-theme-value]')
            .forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const theme = toggle.getAttribute('data-bs-theme-value')
                    setStoredTheme(theme)
                    setTheme(theme)
                    showActiveTheme(theme, true)
                })
            })

        showFeedbackPopup();

        var selectedType = null;
        const suggestionModal = new bootstrap.Modal(document.getElementById('suggestionModal'));
        const messageBox = document.getElementById('suggestionMessage');

        var btn = document.querySelector('[data-suggestion]')
        btn.addEventListener('click', async () => {
            let hash = window.location.hash;
            if (!hash)
                hash = document.querySelector(".navRadio:checked")?.value

            if (!hash)
                hash = "Other"

            selectedType = hash.replace('#', '')

            document.querySelector('.modal-title').textContent = `Submit ${selectedType} Suggestion`
            document.getElementById('suggestionNote').value = ''

            const suggestionNoteID = document.getElementById('suggestionNoteID')
            suggestionNoteID.value = ''

            const suggestionIncludeAdditional = document.getElementById('suggestionIncludeAdditional')
            suggestionIncludeAdditional.checked = true
            suggestionIncludeAdditional.parentElement.hidden = true

            const suggestionIncludeAdditionalLabel = document.getElementById('suggestionIncludeAdditionalLabel')
            suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Data")

            switch (selectedType) {
                case "Puzzle": {
                    suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Include Uploaded Puzzle Image")
                    const canvas = document.getElementById("PuzzleCanvas")
                    fileList = [await canvasToFile(canvas, "Puzzle.png")]
                    suggestionIncludeAdditional.parentElement.hidden = fileList != null && fileList.length > 0
                    break
                }
                case "Light": {
                    suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Include Uploaded Light Images")
                    const visibleLights = Array.from(document.querySelectorAll('.light-preview'))
                        .filter(el => getComputedStyle(el).display !== 'none')

                    if (!visibleLights.length) break

                    const labels = ['Initial', 'A', 'B', 'C', 'D', 'E', 'F', 'G']

                    fileList = await Promise.all(
                        visibleLights.map(async (canvas, i) => {
                            const label = labels[i] || `?${i + 1}`
                            return await canvasToFile(canvas, `${label}.png`)
                        })
                    )

                    suggestionIncludeAdditional.parentElement.hidden = fileList != null && fileList.length > 0
                    break
                }
                case "Anagram": {
                    suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Include Search Value")
                    suggestionNoteID.value = document.getElementById("AnagramInput").value
                    console.log("Note: " + suggestionNoteID.value)
                    suggestionIncludeAdditional.parentElement.hidden = !suggestionNoteID.value
                    break
                }
                case "Cypher": {
                    suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Include Search Value")
                    suggestionNoteID.value = document.getElementById("CypherInput").value
                    suggestionIncludeAdditional.parentElement.hidden = !suggestionNoteID.value
                    break
                }
                case "Beacon": {
                    suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Include Search Value")
                    suggestionNoteID.value = document.getElementById("BeaconInput").value
                    suggestionIncludeAdditional.parentElement.hidden = !suggestionNoteID.value
                    break
                }
                case "Chest": {
                    suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Include Search Value")
                    suggestionNoteID.value = document.getElementById("ChestInput").value
                    suggestionIncludeAdditional.parentElement.hidden = !suggestionNoteID.value
                    break
                }
                case "HotCold": {
                    suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Include Map & Distance Value")
                    const mapNote = document.getElementById("HotColdMap").value
                    const distanceNote = document.getElementById("HotColdDistance").value
                    if (mapNote || distanceNote) suggestionNoteID.value = `${mapNote} ${distanceNote}`.trim()
                    suggestionIncludeAdditional.parentElement.hidden = !suggestionNoteID.value
                    break
                }
                case "Map": {
                    suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Include Selected Map")
                    const checkedMap = document.querySelector("input.mapRadio:checked")
                    if (checkedMap) {
                        const span = checkedMap.closest("label").querySelector("span")
                        suggestionNoteID.value = span?.innerText.trim() || ''
                    }
                    suggestionIncludeAdditional.parentElement.hidden = !suggestionNoteID.value
                    break
                }
                case "GE": {
                    suggestionIncludeAdditionalLabel.setAttribute("data-bs-title", "Include Search Value")
                    suggestionNoteID.value = document.getElementById("searchInput").value
                    suggestionIncludeAdditional.parentElement.hidden = !suggestionNoteID.value
                    break
                }
            }

            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
            const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

            messageBox.classList.add('d-none')
            suggestionModal.show()
        });

        const submitButton = document.getElementById('suggestionSubmit');
        submitButton.addEventListener('click', async () => {
            const noteID = document.getElementById('suggestionNoteID').value.trim();

            const suggestionIncludeAdditional = document.getElementById('suggestionIncludeAdditional')
            if (!suggestionIncludeAdditional.checked) noteID = null;

            let note = document.getElementById('suggestionNote').value.trim();
            if (!note) {
                showMessage("Please enter a suggestion.", "danger");
                return;
            }

            note = noteID ? `${note}\n\nID: ${noteID}` : note;

            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";

            try {
                const formData = new FormData();
                formData.append("Note", note);
                for (const file of fileList) {
                    formData.append("Attachments", file);
                }

                const response = await fetch(`/api/v2/suggestion/${selectedType}`, {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                showMessage(result.message, response.ok ? "success" : "danger");

                if (response.ok) {
                    submitButton.textContent = "Thank you!";
                    setTimeout(() => {
                        suggestionModal.hide();
                        resetButton()
                    }, 2150);
                }
                else {
                    resetButton()
                }
            } catch (error) {
                showMessage("Something went wrong. Try again later.", "danger")
                resetButton()
            }
        });
        function resetButton() {
            submitButton.disabled = false;
            submitButton.textContent = "Submit";
        }

        function showMessage(text, type) {
            messageBox.textContent = text;
            messageBox.className = `alert alert-${type}`;
            messageBox.classList.remove('d-none');
        }
    })
})()

function isCanvasBlank(canvas) {
    const context = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(
        context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );

    // Check if every pixel is fully transparent (0)
    return !pixelBuffer.some(color => color !== 0);
}

async function canvasToFile(canvas, filename, type = "image/png") {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type));
    return new File([blob], filename, { type });
}

async function showFeedbackPopup() {
    // Check if feedback is needed
    const check = await fetch('/api/feedback/needed').then(r => r.json());
    if (!check.feedbackNeeded) return;

    // Create toast container if not exists
    let container = document.getElementById('feedback-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'feedback-toast-container';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = 1055;
        document.body.appendChild(container);
    }

    // Build toast
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">Your Feedback</strong>
      <button type="button" class="btn-close" id="feedback-close"></button>
    </div>
    <div class="toast-body">
      <div class="mb-2">Rating:</div>
      <div class="mb-2" id="rating-options">
        ${[...Array(10)].map((_, i) => `
          <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="rating" id="rating${i + 1}" value="${i + 1}">
            <label class="form-check-label" for="rating${i + 1}">${i + 1}</label>
          </div>
        `).join('')}
      </div>
      <div class="mb-2">
        <textarea class="form-control" id="feedback-notes" rows="2" placeholder="Optional notes..."></textarea>
      </div>
      <button type="button" id="feedback-submit" class="btn btn-primary btn-sm w-100">Submit</button>
    </div>
  `;
    container.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, { autohide: false });
    bsToast.show();

    // Handle submit click
    toast.querySelector('#feedback-submit').onclick = async () => {
        const rating = toast.querySelector('input[name="rating"]:checked')?.value;
        const notes = toast.querySelector('#feedback-notes').value;

        if (!rating) {
            alert('Please select a rating.');
            return;
        }

        await sendFeedback(rating, notes);
        closeToast();
    };

    // ✅ Handle close button click -> submit rating 0
    toast.querySelector('#feedback-close').onclick = async () => {
        const notes = toast.querySelector('#feedback-notes').value || "";
        await sendFeedback(0, notes);
        closeToast();
    };

    // Helper: submit feedback
    async function sendFeedback(rating, notes) {
        await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, notes })
        });
    }

    // Helper: close toast
    function closeToast() {
        bsToast.hide();
        setTimeout(() => toast.remove(), 200);
    }

}