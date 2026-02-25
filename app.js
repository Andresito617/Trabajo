const denominations = [2000, 5000, 10000, 20000, 50000, 100000];

const generalContainer = document.getElementById("generalContainer");
const weeklyContainer = document.getElementById("weeklyContainer");
const transferBtn = document.getElementById("transferBtn");
const resetBtn = document.getElementById("resetBtn");
const globalDisplay = document.getElementById("globalTotalDisplay");
const privacyBtn = document.getElementById("privacyBtn");
const historyContainer = document.getElementById("historyContainer");

const lockScreen = document.getElementById("lockScreen");
const pinInput = document.getElementById("pinInput");
const pinBtn = document.getElementById("pinBtn");
const pinError = document.getElementById("pinError");
const lockTitle = document.getElementById("lockTitle");

let state = {
    general: {},
    weekly: {},
    history: [],
    pin: null
};

let privacyMode = false;

/* ================= LOAD ================= */

function load() {
    const data = localStorage.getItem("moneyApp");
    if (data) state = JSON.parse(data);

    state.general = state.general || {};
    state.weekly = state.weekly || {};
    state.history = state.history || [];
    state.pin = state.pin || null;

    denominations.forEach(d => {
        state.general[d] = Number(state.general[d]) || 0;
        state.weekly[d] = Number(state.weekly[d]) || 0;
    });
}

function save() {
    localStorage.setItem("moneyApp", JSON.stringify(state));
}

function formatCOP(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0
    }).format(value);
}

/* ================= CALCULOS ================= */

function calculate(type) {
    let total = 0;

    denominations.forEach(den => {
        const qty = state[type][den] || 0;
        const subtotal = qty * den;
        total += subtotal;
    });

    document.getElementById(`${type}Total`).textContent = formatCOP(total);
    updateGlobal();
}

function updateGlobal() {
    let tg = 0, tw = 0;

    denominations.forEach(d => {
        tg += (state.general[d] || 0) * d;
        tw += (state.weekly[d] || 0) * d;
    });

    globalDisplay.textContent = formatCOP(tg + tw);
}

/* ================= RENDER ================= */

function render(type, container) {
    container.innerHTML = "";

    denominations.forEach(den => {
        const input = document.createElement("input");
        input.type = "number";
        input.min = 0;
        input.value = state[type][den] || "";

        input.addEventListener("input", e => {
            state[type][den] = Number(e.target.value) || 0;
            calculate(type);
            save();
        });

        container.appendChild(document.createTextNode(formatCOP(den) + " "));
        container.appendChild(input);
        container.appendChild(document.createElement("br"));
    });

    calculate(type);
}

/* ================= HISTORIAL ================= */

function addToHistory(amount) {
    const date = new Date().toLocaleDateString("es-CO");
    state.history.unshift({ date, amount });
    save();
    renderHistory();
}

function renderHistory() {
    historyContainer.innerHTML = "";
    state.history.forEach(item => {
        const div = document.createElement("div");
        div.textContent = `${item.date} — ${formatCOP(item.amount)}`;
        historyContainer.appendChild(div);
    });
}

/* ================= TRANSFER ================= */

transferBtn.addEventListener("click", () => {

    let weeklyTotal = 0;

    denominations.forEach(d => {
        weeklyTotal += (state.weekly[d] || 0) * d;
    });

    if (weeklyTotal === 0) return;

    denominations.forEach(d => {
        state.general[d] += state.weekly[d] || 0;
        state.weekly[d] = 0;
    });

    addToHistory(weeklyTotal);
    save();
    render("general", generalContainer);
    render("weekly", weeklyContainer);
});

/* ================= RESET ================= */

resetBtn.addEventListener("click", () => {
    state = { general: {}, weekly: {}, history: [], pin: state.pin };
    save();
    render("general", generalContainer);
    render("weekly", weeklyContainer);
    renderHistory();
});

/* ================= PRIVACY ================= */

privacyBtn.addEventListener("click", () => {
    privacyMode = !privacyMode;
    globalDisplay.style.filter = privacyMode ? "blur(8px)" : "none";
});

/* ================= PIN ================= */

function initPin() {
    if (!state.pin) {
        lockTitle.textContent = "🔐 Crear PIN de 6 dígitos";
        pinBtn.textContent = "Guardar PIN";
    }

    pinBtn.addEventListener("click", () => {
        const value = pinInput.value;

        if (!/^\d{6}$/.test(value)) {
            pinError.textContent = "Debe tener 6 números.";
            return;
        }

        if (!state.pin) {
            state.pin = value;
            save();
            unlock();
        } else if (value === state.pin) {
            unlock();
        } else {
            pinError.textContent = "PIN incorrecto.";
            pinInput.value = "";
        }
    });
}

function unlock() {
    lockScreen.style.display = "none";
}

/* ================= INIT ================= */

load();
render("general", generalContainer);
render("weekly", weeklyContainer);
renderHistory();
initPin();