const searchBtn  = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const formCard   = document.querySelector(".form-card");

// ── Disability Type multi-select dropdown ──────────────────────────────────
const disabilityToggle     = document.getElementById("disabilityTypeToggle");
const disabilityPanel      = document.getElementById("disabilityTypePanel");
const disabilityCheckboxes = Array.from(disabilityPanel.querySelectorAll("input[type='checkbox']"));

function updateDisabilityToggleLabel() {
    const checked = disabilityCheckboxes.filter(cb => cb.checked);
    disabilityToggle.textContent = checked.length
        ? checked.map(cb => cb.parentElement.textContent.trim()).join(", ")
        : "Select disability type(s)";
}

disabilityToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    disabilityPanel.hidden = !disabilityPanel.hidden;
});

disabilityCheckboxes.forEach(cb => {
    cb.addEventListener("change", updateDisabilityToggleLabel);
});

document.addEventListener("click", (e) => {
    if (!disabilityPanel.hidden && !e.target.closest("#disabilityType")) {
        disabilityPanel.hidden = true;
    }
});


// ── Search ───────────────────────────────────────────────────────────────────
searchBtn.addEventListener("click", async () => {

    const ageRaw       = document.getElementById("age").value;
    const zip          = document.getElementById("zip").value.trim();
    const householdSize = document.getElementById("householdSize").value.trim();
    const incomeRaw    = document.getElementById("income").value;
    const veteranValue  = document.getElementById("veteran").value;
    const disStatusValue = document.getElementById("disabilityStatus").value;
    const disabilityTags = disabilityCheckboxes.filter(cb => cb.checked).map(cb => cb.value);

    resultsDiv.innerHTML = "<p>Searching...</p>";

    // ── Parse age range ──
    // ageRaw is "floor|ceiling" e.g. "18|21" or "85|null"
    const ageParts = ageRaw.split("|");
    const ageMin   = Number(ageParts[0]);
    const ageMax   = ageParts[1] === "null" ? null : Number(ageParts[1]);

    // ── Parse income range ──
    // incomeRaw is "floor|ceiling" e.g. "1000|2000" or "5000|null"
    const incomeParts = incomeRaw.split("|");
    const incomeMin   = Number(incomeParts[0]);
    const incomeMax   = incomeParts[1] === "null" ? null : Number(incomeParts[1]);

    // ── Build and send payload ──
    const payload = {
        min_age:         ageMin,
        max_age:         ageMax,
        zip_code:        zip,
        household_size:  householdSize ? Number(householdSize) : null,
        income_min:      incomeMin,
        income_max:      incomeMax,
        disability_status: disStatusValue,
        disability_tags: disabilityTags,
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
