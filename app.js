const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");

searchBtn.addEventListener("click", async () => {

    const age = document.getElementById("age").value;
    const county = document.getElementById("county").value;
    const income = document.getElementById("income").value;
    const disability = document.getElementById("disability").value;
    const veteran = document.getElementById("veteran").value;

    resultsDiv.innerHTML = "<p>Searching...</p>";

    // Replace later with n8n webhook
    /*
    const response = await fetch("YOUR_N8N_WEBHOOK_URL", {
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
    });

    const data = await response.json();
    renderResults(data.programs);
    */

    const mockPrograms = [
        {
            name: "Medicare Savings Program",
            category: "Healthcare",
            explanation:
                "May help pay Medicare premiums and other healthcare costs.",
            url: "#"
        },
        {
            name: "Meals on Wheels",
            category: "Nutrition",
            explanation:
                "Provides home-delivered meals to eligible older adults.",
            url: "#"
        },
        {
            name: "Senior Transportation Services",
            category: "Transportation",
            explanation:
                "Transportation assistance for medical appointments and errands.",
            url: "#"
        }
    ];

    renderResults(mockPrograms);
});

function renderResults(programs) {

    resultsDiv.innerHTML = "";

    programs.forEach(program => {

        const card = document.createElement("div");
        card.className = "result-card";

        card.innerHTML = `
            <div class="badge">${program.category}</div>
            <h3>${program.name}</h3>
            <p>${program.explanation}</p>
            <a class="apply-link" href="${program.url}" target="_blank">
                Learn More →
            </a>
        `;

        resultsDiv.appendChild(card);
    });
}