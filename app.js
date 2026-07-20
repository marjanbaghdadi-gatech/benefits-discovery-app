const searchBtn  = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const formCard   = document.querySelector(".form-card");

// ── Checkbox multi-select dropdowns ─────────────────────────────────────────
function setupMultiselect(containerId, toggleId, panelId, placeholder) {
    const toggle      = document.getElementById(toggleId);
    const panel       = document.getElementById(panelId);
    const checkboxes  = Array.from(panel.querySelectorAll("input[type='checkbox']"));

    function updateLabel() {
        const checked = checkboxes.filter(cb => cb.checked);
        toggle.textContent = checked.length
            ? checked.map(cb => cb.parentElement.textContent.trim()).join(", ")
            : placeholder;
    }

    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.hidden = !panel.hidden;
    });

    checkboxes.forEach(cb => cb.addEventListener("change", updateLabel));

    document.addEventListener("click", (e) => {
        if (!panel.hidden && !e.target.closest(`#${containerId}`)) {
            panel.hidden = true;
        }
    });

    return checkboxes;
}

const disabilityCheckboxes = setupMultiselect(
    "disabilityType", "disabilityTypeToggle", "disabilityTypePanel", "Select disability type(s)"
);
const needsCheckboxes = setupMultiselect(
    "needs", "needsToggle", "needsPanel", "Select need(s)"
);

// ── Show disability type only when disability status is "Yes" ─────────────
const disabilityStatusSelect = document.getElementById("disabilityStatus");
const disabilityTypeGroup    = document.getElementById("disabilityTypeGroup");

disabilityStatusSelect.addEventListener("change", () => {
    const showDisabilityType = disabilityStatusSelect.value === "yes";
    disabilityTypeGroup.hidden = !showDisabilityType;
    if (!showDisabilityType) {
        disabilityCheckboxes.forEach(cb => { cb.checked = false; });
        document.getElementById("disabilityTypeToggle").textContent = "Select disability type(s)";
        document.getElementById("disabilityTypePanel").hidden = true;
    }
});


// ── Search ───────────────────────────────────────────────────────────────────
searchBtn.addEventListener("click", async () => {

    const age          = document.getElementById("age").value;
    const zip          = document.getElementById("zip").value.trim();
    const incomeRaw    = document.getElementById("income").value.trim();
    const householdSizeRaw = document.getElementById("householdSize").value.trim();
    const veteranValue  = document.getElementById("veteran").value;
    const disStatusValue = document.getElementById("disabilityStatus").value;
    const disabilityTags = disabilityCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
    const needsTags       = needsCheckboxes.filter(cb => cb.checked).map(cb => cb.value);

    resultsDiv.innerHTML = "<p>Searching...</p>";

    // ── Parse income ──
    const annualIncome = incomeRaw !== "" ? Number(incomeRaw) : null;
    const householdSize = householdSizeRaw !== "" ? Number(householdSizeRaw) : null;

    // ── Build and send payload ──
    // veteran_status is the raw category; the backend derives eligibility from it.
    const payload = {
        age:             age ? Number(age) : null,
        zip_code:        zip,
        annual_income:   annualIncome,
        household_size:  householdSize,
        disability_status: disStatusValue,
        disability_tags: disabilityTags,
        need_tags:       needsTags,
        veteran_status:  veteranValue,
    };

    try {
        const response = await fetch(
            "https://mbaghdadi6g.app.n8n.cloud/webhook/benefits-search",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            resultsDiv.innerHTML = `<p class="error-msg">${data.message}</p>`;
            return;
        }

        renderResults(data.programs);

    } catch (err) {
        resultsDiv.innerHTML = `
            <p class="error-msg">
                Something went wrong while searching. Please check your connection and try again.
            </p>`;
    }
});


// ── Render ───────────────────────────────────────────────────────────────────
const PAGE_SIZE = 5;
let allPrograms  = [];
let currentPage  = 0;

function renderResults(programs) {
    resultsDiv.innerHTML = "";

    if (!programs || programs.length === 0) {
        resultsDiv.innerHTML = "<p>No matching programs found.</p>";
        return;
    }

    allPrograms = programs;
    currentPage = 0;

    const consumerCount = programs.filter(p =>
        String(p.consumer_facing || 'yes').toLowerCase() !== 'no'
    ).length;
    const referralCount = programs.length - consumerCount;

    let headerHtml = `<h2>${consumerCount} program${consumerCount !== 1 ? 's' : ''} found</h2>`;
    if (referralCount > 0) {
        headerHtml += `<p class="referral-note">
            + ${referralCount} additional program${referralCount !== 1 ? 's' : ''}
            shown for awareness only — accessible through referral, not self-application.
        </p>`;
    }

    resultsDiv.innerHTML = headerHtml;
    showNextPage();
}

function createCard(program) {
    const card = document.createElement("div");
    const isReferralOnly = String(program.consumer_facing || '').toLowerCase() === 'no';

    card.className = isReferralOnly ? "result-card referral-card" : "result-card";

    card.innerHTML = `
        ${isReferralOnly ? `
            <div class="referral-banner">
                📋 For Awareness Only — Referral Required
            </div>
        ` : ''}

        <div class="badge">${program.category || ""}</div>

        <h3>${program.program_name || ""}</h3>

        <p>${program.plain_language_summary || program.description || ""}</p>

        <p><strong>Agency:</strong> ${program.administering_agency || ""}</p>

        <p><strong>Confidence:</strong> ${program.confidence || ""}</p>

        ${
            program.match_reasons && program.match_reasons.length
            ? `<div class="match-reasons">
                <strong>${isReferralOnly ? 'Why this is shown:' : 'Why this was selected for you:'}</strong>
                <ul>
                    ${program.match_reasons.map(r => `<li>${r}</li>`).join('')}
                </ul>
               </div>`
            : ''
        }

        ${
            program.match_warnings && program.match_warnings.length
            ? `<div class="match-warnings">
                <strong>⚠️ Requirements to check:</strong>
                <ul>
                    ${program.match_warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
               </div>`
            : ''
        }

        ${
            program.apply_url
            ? `<a class="apply-link ${isReferralOnly ? 'referral-link' : ''}"
                    href="${program.apply_url}"
                    target="_blank"
                    rel="noopener noreferrer">
                    Learn More →
               </a>`
            : program.phone
            ? `<p><strong>Phone:</strong> ${program.phone}</p>`
            : `<p>Contact local AAA</p>`
        }
    `;

    return card;
}

function showNextPage() {
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) loadMoreBtn.remove();

    const start = currentPage * PAGE_SIZE;
    const slice = allPrograms.slice(start, start + PAGE_SIZE);

    slice.forEach(program => resultsDiv.appendChild(createCard(program)));

    currentPage++;

    const shown = currentPage * PAGE_SIZE;
    if (shown < allPrograms.length) {
        const btn = document.createElement("button");
        btn.id = "loadMoreBtn";
        btn.textContent = "Load More Benefits";
        btn.addEventListener("click", showNextPage);
        resultsDiv.appendChild(btn);
    }
}
