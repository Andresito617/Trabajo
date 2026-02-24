const denominations = [2000, 5000, 10000, 20000, 50000, 100000];
const generalContainer = document.getElementById("generalContainer");
const weeklyContainer = document.getElementById("weeklyContainer");
const transferBtn = document.getElementById("transferBtn");
const resetBtn = document.getElementById("resetBtn");
const globalDisplay = document.getElementById("globalTotalDisplay");

let state = { general: {}, weekly: {} };

function formatCOP(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency", currency: "COP", minimumFractionDigits: 0
    }).format(value);
}

function save() {
    localStorage.setItem("moneyApp", JSON.stringify(state));
}

function load() {
    const data = localStorage.getItem("moneyApp");
    if (data) state = JSON.parse(data);
}

function updateGlobalSummary() {
    let tg = 0, tw = 0;
    denominations.forEach(d => {
        tg += (parseInt(state.general[d]) || 0) * d;
        tw += (parseInt(state.weekly[d]) || 0) * d;
    });

    const grandTotal = tg + tw;
    globalDisplay.textContent = formatCOP(grandTotal);

    // Efecto de color y brillo
    if (grandTotal > 2000000) {
        globalDisplay.style.color = "#ff00ff"; // Fucsia
        globalDisplay.classList.add("glow-active");
    } else if (grandTotal > 500000) {
        globalDisplay.style.color = "#ffcc00"; // Dorado
        globalDisplay.classList.add("glow-active");
    } else {
        globalDisplay.style.color = "#00ffcc"; // Cian
        globalDisplay.classList.remove("glow-active");
    }

    // Gráfico de barras
    const totalPos = grandTotal || 1;
    document.getElementById("barGeneral").style.width = (tg / totalPos * 100) + "%";
    document.getElementById("barWeekly").style.width = (tw / totalPos * 100) + "%";
}

function calculate(type) {
    let total = 0;
    denominations.forEach(den => {
        const qty = parseInt(state[type][den]) || 0;
        const sub = qty * den;
        const subEl = document.getElementById(`${type}-sub-${den}`);
        if (subEl) subEl.textContent = formatCOP(sub);
        total += sub;
    });
    document.getElementById(`${type}Total`).textContent = formatCOP(total);
    updateGlobalSummary();
}

function render(type, container) {
    container.innerHTML = "";
    denominations.forEach(den => {
        const row = document.createElement("div");
        row.className = "row";
        const val = state[type][den] || "";

        row.innerHTML = `
            <img src="img/${den}.jpg" class="bill-thumb" alt="${den}" onerror="this.src='https://via.placeholder.com/70x35?text=${den}'">
            <span>${formatCOP(den)}</span>
            <input type="number" min="0" value="${val}" data-type="${type}" data-den="${den}" placeholder="0">
            <span id="${type}-sub-${den}">$0</span>
        `;
        container.appendChild(row);
    });

    container.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", e => {
            if (e.target.value < 0) e.target.value = 0;
            state[e.target.dataset.type][e.target.dataset.den] = e.target.value;
            calculate(e.target.dataset.type);
            save();
        });
        input.addEventListener("focus", e => e.target.select());
    });
    calculate(type);
}

// Atajo Enter para saltar de casilla
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const inputs = Array.from(document.querySelectorAll('input'));
        const idx = inputs.indexOf(e.target);
        if (idx < inputs.length - 1) inputs[idx + 1].focus();
    }
});

transferBtn.addEventListener("click", () => {
    if(confirm("¿Pasar Semanal al General?")) {
        denominations.forEach(d => {
            state.general[d] = (parseInt(state.general[d]) || 0) + (parseInt(state.weekly[d]) || 0);
            state.weekly[d] = "";
        });
        save(); render("general", generalContainer); render("weekly", weeklyContainer);
    }
});

resetBtn.addEventListener("click", () => {
    if(confirm("¿Borrar TODO?")) {
        state = { general: {}, weekly: {} };
        save(); render("general", generalContainer); render("weekly", weeklyContainer);
    }
});

const privacyBtn = document.getElementById("privacyBtn");
let privacyMode = false;

privacyBtn.addEventListener("click", () => {
    privacyMode = !privacyMode;

    const elements = [
        globalDisplay,
        document.getElementById("generalTotal"),
        document.getElementById("weeklyTotal")
    ];

    elements.forEach(el => {
        el.classList.toggle("hidden-money");
    });

    privacyBtn.textContent = privacyMode ? "🙈 Mostrar" : "👁 Ocultar";
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
        .then(() => console.log("Service Worker registrado"))
        .catch(err => console.log("Error SW:", err));
}

load();
render("general", generalContainer);
render("weekly", weeklyContainer);