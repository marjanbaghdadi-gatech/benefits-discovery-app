const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");

searchBtn.addEventListener("click", async () => {

    const age = document.getElementById("age").value;
    const county = document.getElementById("county").value;
    const income = document.getElementById("income").value;
    const disability = document.getElementById("disability").value;
    const veteran = document.getElementById("veteran").value;

    resultsDiv.innerHTML = "<p>Searching...</p>";

    const response = await fetch(
        "https://mbaghdadi6g.app.n8n.cloud/webhook/benefits-search",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                age,
                county,
                income,
                disability,
                veteran
            })
        }
    );

    const data = await response.json();

    console.log("Response from n8n:", data);

    renderResults(data.programs);
});

function renderResults(programs) {

    resultsDiv.innerHTML = "";

    if (!programs || programs.length === 0) {
        resultsDiv.innerHTML = "<p>No matching programs found.</p>";
        return;
    }

    programs.forEach(program => {

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

            <a
                class="apply-link"
                href="${program.apply_url || "#"}"
                target="_blank"
            >
                Learn More →
            </a>
        `;

        resultsDiv.appendChild(card);
    });
}