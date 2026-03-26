/* ==========================================================================
   PEGASUS ULTIMATE ENGINE - v13.0 (THE RESTORATION)
   Protocol: Strict Data Analyst - ALL-IN-ONE CONNECTOR
   ========================================================================== */

// --- GLOBAL STATE ---
var exercises = [];
var remainingSets = [];
var currentIdx = 0;
var phase = 0; 
var running = false;
var timer = null;
var totalSeconds = 0;
var remainingSeconds = 0;
var muted = false;
var SPEED = 1;
var userWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 74;

// --- AUDIO ENGINE ---
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', () => {
    if (!audioUnlocked) {
        sysAudio.play().then(() => { sysAudio.pause(); sysAudio.currentTime = 0; audioUnlocked = true; });
    }
}, { once: true });

// --- CORE FUNCTIONS ---
window.selectDay = function(btn, day) {
    document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    clearInterval(timer);
    running = false;
    phase = 0;
    currentIdx = 0;
    document.getElementById("btnStart").innerHTML = "Έναρξη";

    // Ανάκτηση προγράμματος
    let rawData = (typeof getFinalProgram !== 'undefined') ? [...getFinalProgram(day)] : [];
    let mappedData = (window.PegasusOptimizer) ? PegasusOptimizer.apply(day, rawData) : rawData;

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; exercises = []; remainingSets = [];

    mappedData.forEach((e, idx) => {
        const d = document.createElement("div");
        d.className = "exercise";
        d.innerHTML = `
            <div class="exercise-info">
                <div class="set-counter">0/${e.adjustedSets}</div>
                <div class="exercise-name">${e.name}</div>
                <input type="number" class="weight-input" value="${localStorage.getItem('weight_'+e.name)||''}" onchange="localStorage.setItem('weight_'+'${e.name}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(e.adjustedSets));
    });
};

function togglePanel(id, callback) {
    const p = document.getElementById(id);
    if (!p) return;
    const isVis = p.style.display === "block";
    document.querySelectorAll(".pegasus-panel").forEach(panel => panel.style.display = "none");
    p.style.display = isVis ? "none" : "block";
    if (!isVis && callback) callback();
}

// --- MASTER INITIALIZATION ---
window.onload = () => {
    console.log("🚀 PEGASUS: HARD REBOOT...");

    // 1. Navbar Generation
    const nav = document.getElementById("navbar");
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    nav.innerHTML = "";
    days.forEach(d => {
        const b = document.createElement("button");
        b.textContent = d;
        b.id = `nav-${d}`;
        b.onclick = () => window.selectDay(b, d);
        nav.appendChild(b);
    });

    // 2. Auto-Select Today
    const today = days[(new Date().getDay() + 6) % 7]; // Fix για εβδομάδα που ξεκινά Δευτέρα
    const targetBtn = document.getElementById(`nav-${today}`);
    if (targetBtn) window.selectDay(targetBtn, today);

    // 3. Button Mapping (The "Fix")
// 3. Smart Button Mapping (The "Resurrector")
    const map = {
        "btnFoodUI": () => {
            // Δοκιμάζει όλα τα πιθανά ονόματα για τη διατροφή
            const updateFn = window.updateFoodUI || window.updateDietUI || window.renderFood;
            togglePanel("foodPanel", updateFn);
        },
        "btnSettingsUI": () => {
            const loadFn = window.loadSettings || window.loadSpecs || window.initSettings;
            togglePanel("settingsPanel", loadFn);
        },
        "btnCalendarUI": () => {
            togglePanel("calendarPanel", window.renderCalendar);
        },
        "btnAchUI": () => {
            const achFn = window.updateAchievements || window.renderAchievements;
            togglePanel("achievementsPanel", achFn);
        },
        "btnPreviewUI": () => {
            togglePanel("previewPanel", window.showPreview);
        },
        "btnToolsUI": () => togglePanel("toolsPanel"),
        "btnOpenGallery": () => togglePanel("galleryPanel", () => window.GalleryEngine?.render()),
        "btnEMS": () => { 
            if (typeof window.logEMSData === 'function') window.logEMSData();
            else if (typeof window.openEMS === 'function') window.openEMS();
        }
    };

    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onclick = map[id];
    });

    // 4. Special Click for KCAL container
    const kcalBtn = document.getElementById("kcalBtn");
    if (kcalBtn) kcalBtn.onclick = () => togglePanel("foodPanel", window.updateFoodUI);

    console.log("✅ PEGASUS: System Revived.");
};
