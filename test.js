function toggleDisType(val) {
    document.getElementById("dis_type_group").style.display = val === "yes" ? "block" : "none";
}

function toggleDisTypeB(val) {
    document.getElementById("dis_type_group_b").style.display = val === "yes" ? "block" : "none";
}

const sliderLabels = [
    "Under $1,000 / month",
    "$1,000 – $2,000 / month",
    "$2,000 – $3,500 / month",
    "$3,500 – $5,000 / month",
    "Over $5,000 / month"
];

function updateSlider(val) {
    document.getElementById("slider_display").textContent = sliderLabels[val];
}

function toggleBtn(clicked) {
    const group = clicked.parentElement;
    group.querySelectorAll(".toggle-btn").forEach(btn => btn.classList.remove("active"));
    clicked.classList.add("active");
}

function selectPill(clicked) {
    const group = clicked.parentElement;
    group.querySelectorAll(".pill-btn").forEach(btn => btn.classList.remove("active"));
    clicked.classList.add("active");
}

function selectRadio(clicked) {
    const group = clicked.closest(".radio-group");
    group.querySelectorAll(".radio-option").forEach(opt => opt.classList.remove("selected"));
    clicked.classList.add("selected");
}

function submitRecommendation() {
    const votedBtn = document.querySelector(".section .vote-btn.voted");
    const preferredStyle = votedBtn ? votedBtn.textContent.trim() : "No vote selected";

    const disTypeA = document.getElementById("dis_type")?.value || "Not selected";
    const disTypeB = document.getElementById("dis_type_b")?.value || "Not selected";
    const recommendation = document.getElementById("recommendations").value.trim() || "None";

    const summary = document.getElementById("response_summary");
    summary.innerHTML = `
        <li><strong>Preferred Style:</strong> ${preferredStyle}</li>
        <li><strong>Disability Type (Style A):</strong> ${disTypeA}</li>
        <li><strong>Disability Type (Style B):</strong> ${disTypeB}</li>
        <li><strong>Additional Recommendation:</strong> ${recommendation}</li>
    `;

    document.getElementById("rec_confirm").style.display = "block";
}

function loadCounts() {
    document.getElementById("count_a").textContent = localStorage.getItem("votes_a") || 0;
    document.getElementById("count_b").textContent = localStorage.getItem("votes_b") || 0;
}

function resetCounts() {
    localStorage.setItem("votes_a", 0);
    localStorage.setItem("votes_b", 0);
    loadCounts();
}

function vote(btn, field) {
    const card = btn.closest(".style-card");
    const section = card.closest(".section");
    section.querySelectorAll(".vote-btn").forEach(b => {
        b.classList.remove("voted");
        b.textContent = b.textContent.replace("✓ Selected", "").trim();
    });
    btn.classList.add("voted");
    btn.textContent = "✓ Selected";

    const isA = btn.textContent.includes("A") || btn.closest(".style-card").querySelector(".style-label").textContent.includes("Style A");
    const key = btn.closest(".style-card").querySelector(".style-label").textContent.includes("A") ? "votes_a" : "votes_b";
    const current = parseInt(localStorage.getItem(key) || 0);
    localStorage.setItem(key, current + 1);
    loadCounts();
}

loadCounts();
