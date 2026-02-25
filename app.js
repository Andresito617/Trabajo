const denominations = [2000, 5000, 10000, 20000, 50000, 100000];
const generalContainer = document.getElementById("generalContainer");
const weeklyContainer = document.getElementById("weeklyContainer");
const transferBtn = document.getElementById("transferBtn");
const resetBtn = document.getElementById("resetBtn");
const globalDisplay = document.getElementById("globalTotalDisplay");
const privacyBtn = document.getElementById("privacyBtn");

let state = { general: {}, weekly: {} };
let privacyMode = false;
let saveTimeout;

function formatCOP(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0
    }).format(value);
}

function autoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem("moneyApp", JSON.stringify(state));
    }, 250);
}

function load() {
    const data = localStorage.getItem("moneyApp");
    if (data) {
        state = JSON.parse(data);

        // Asegurar números
        denominations.forEach(d => {
            state.general[d] = Number(state.general[d]) || 0;
            state.weekly[d] = Number(state.weekly[d]) || 0;
        });
    }
}

function updateGlobalSummary() {
    let totalGeneral = 0;
    let totalWeekly = 0;

    denominations.forEach(d => {
        totalGeneral += (state.general[d] || 0) * d;
        totalWeekly += (state.weekly[d] || 0) * d;
    });

    const grandTotal = totalGeneral + totalWeekly;
    globalDisplay.textContent = formatCOP(grandTotal);

    // 🎨 Colores dinámicos
    globalDisplay.classList.remove("glow-active");

    if (grandTotal > 2000000) {
        globalDisplay.style.color = "#ff00ff";
        globalDisplay.classList.add("glow-active");
    } else if (grandTotal > 500000) {
        globalDisplay.style.color = "#ffcc00";
        globalDisplay.classList.add("glow-active");
    } else {
        globalDisplay.style.color = "#00ffcc";
    }

    // 📊 Barras proporcionales
    const safeTotal = grandTotal || 1;

    document.getElementById("barGeneral").style.width =
        (totalGeneral / safeTotal) * 100 + "%";

    document.getElementById("barWeekly").style.width =
        (totalWeekly / safeTotal) * 100 + "%";
}

function calculate(type) {
    let total = 0;

    denominations.forEach(den => {
        const qty = state[type][den] || 0;
        const subtotal = qty * den;

        const subEl = document.getElementById(`${type}-sub-${den}`);
        if (subEl) subEl.textContent = formatCOP(subtotal);

        total += subtotal;
    });

    document.getElementById(`${type}Total`).textContent = formatCOP(total);

    updateGlobalSummary();
}

function render(type, container) {
    container.innerHTML = "";

    denominations.forEach(den => {
        const row = document.createElement("div");
        row.className = "row";

        const value = state[type][den] || "";

        row.innerHTML = `
            <img src="img/${den}.jpg"
                 class="bill-thumb"
                 alt="${den}"
                 onerror="this.src='https://via.placeholder.com/70x35?text=${den}'">

            <span>${formatCOP(den)}</span>

            <input type="number"
                   min="0"
                   value="${value}"
                   data-type="${type}"
                   data-den="${den}"
                   placeholder="0">

            <span id="${type}-sub-${den}">$0</span>
        `;

        container.appendChild(row);
    });

    container.querySelectorAll("input").forEach(input => {

        input.addEventListener("input", e => {
            const type = e.target.dataset.type;
            const den = e.target.dataset.den;

            let val = Number(e.target.value);
            if (val < 0) val = 0;

            state[type][den] = val;

            calculate(type);
            autoSave();
        });

        input.addEventListener("focus", e => e.target.select());
    });

    calculate(type);
}

privacyBtn.addEventListener("click", () => {

    privacyMode = !privacyMode;

    const elements = [
        globalDisplay,
        document.getElementById("generalTotal"),
        document.getElementById("weeklyTotal")
    ];

    elements.forEach(el => el.classList.toggle("hidden-money"));

    privacyBtn.textContent = privacyMode ? "🙈 Mostrar" : "👁 Ocultar";
});

document.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") {
        const inputs = Array.from(document.querySelectorAll("input"));
        const index = inputs.indexOf(e.target);
        if (index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    }
});

transferBtn.addEventListener("click", () => {

    if (confirm("¿Pasar Semanal al General?")) {

        denominations.forEach(d => {
            state.general[d] =
                (state.general[d] || 0) + (state.weekly[d] || 0);

            state.weekly[d] = 0;
        });

        autoSave();
        render("general", generalContainer);
        render("weekly", weeklyContainer);
    }
});

resetBtn.addEventListener("click", () => {

    if (confirm("¿Borrar TODO?")) {

        state = { general: {}, weekly: {} };
        autoSave();

        render("general", generalContainer);
        render("weekly", weeklyContainer);
    }
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js")
            .then(() => console.log("Service Worker registrado"))
            .catch(err => console.log("Error SW:", err));
    });
}

load();
render("general", generalContainer);
render("weekly", weeklyContainer);