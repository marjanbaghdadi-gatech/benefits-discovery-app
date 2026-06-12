const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");

searchBtn.addEventListener("click", async () => {

    const age = document.getElementById("age").value;
    const county = document.getElementById("county").value;
    const income = document.getElementById("income").value;
    const disability = document.getElementById("disability").value;
    const veteran = document.getElementById("veteran").value;
    const needHelpWith = document.getElementById("needHelpWith").value;

    resultsDiv.innerHTML = "<p>Searching...</p>";

    const response = await fetch(
        "https://mbaghdadi6g.app.n8n.cloud/webhook/benefits-search",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                age:             age,
                county:          county,
                monthly_income:  income,
                disability_tags: disability ? disability.split(",").map(d => d.trim()) : [],
                is_veteran:      veteran,
                need_tags:       needHelpWith ? needHelpWith.split(",").map(n => n.trim()) : []
            })
        }
    );

    const data = await response.json();

    renderResults(data.programs);
});

const PAGE_SIZE = 5;
let allPrograms = [];
let currentPage = 0;

function renderResults(programs) {

    resultsDiv.innerHTML = "";

    if (!programs || programs.length === 0) {
        resultsDiv.innerHTML = "<p>No matching programs found.</p>";
        return;
    }

    allPrograms = programs;
    currentPage = 0;

    resultsDiv.innerHTML = `<h2>${programs.length} programs found</h2>`;

    showNextPage();
}

function createCard(program) {

    const card = document.createElement("div");
    card.className = "result-card";

    card.innerHTML = `
        <div class="badge">
            ${program.category || ""}
        </div>

        <h3>
            ${program.program_name || ""}
        </h3>

        <p>
            ${program.description || ""}
        </p>

        <p>
            <strong>Agency:</strong>
            ${program.administering_agency || ""}
        </p>

        <p>
            <strong>Confidence:</strong>
            ${program.confidence || ""}
        </p>

        ${
            program.apply_url
            ? `<a class="apply-link" href="${program.apply_url}" target="_blank"
                rel="noopener noreferrer">
                Learn More →
               </a>`
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