const searchBtn    = document.getElementById("searchBtn");
const resultsDiv   = document.getElementById("results");
const hasDisField  = document.getElementById("has_disability");
const formError    = document.getElementById("formError");



// ── Search ───────────────────────────────────────────────────────────────────
searchBtn.addEventListener("click", async () => {

    const age          = document.getElementById("age").value.trim();
    // const county       = document.getElementById("county").value;
    const incomeRaw    = document.getElementById("income").value;
    const hasDisValue  = hasDisField.value;
    const veteranValue = document.getElementById("veteran").value;

    // ── Validation ──
    let valid = true;

    if (!age || Number(age) <= 0) valid = false;
    if (!incomeRaw)               valid = false;

    if (!valid) {
        formError.style.display = "block";
        return;
    }

    formError.style.display = "none";
    resultsDiv.innerHTML = "<p>Searching...</p>";

    // ── Parse income range ──
    // incomeRaw is "floor|ceiling" e.g. "1000|2000" or "5000|null"
    const incomeParts = incomeRaw.split("|");
    const incomeMin   = Number(incomeParts[0]);
    const incomeMax   = incomeParts[1] === "null" ? null : Number(incomeParts[1]);

    // ── Parse disability ──
    const disabilityTags = hasDisValue === "yes" ? ["yes"] : [];

    // ── Build and send payload ──
    const payload = {
        age:             Number(age),
        // county:          county,
        income_min:      incomeMin,
        income_max:      incomeMax,
        disability_tags: disabilityTags,
        is_veteran:      veteranValue,
    };

    const response = await fetch(
        "https://mbaghdadi6g.app.n8n.cloud/webhook/benefits-search",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }
    );

    const data = await response.json();
    renderResults(data.programs);
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
                <strong>${isReferralOnly ? 'Why this is shown:' : 'Why this matches you:'}</strong>
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
