/* ==========================================================================
   PEGASUS CALENDAR SYSTEM - STRICT VERSION (FINAL)
   ========================================================================== */

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

window.renderCalendar = function() {
    const el = document.getElementById("calendarContent");
    if (!el) return;

    // Λήψη δεδομένων προπόνησης από το LocalStorage
    const data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const now = new Date();
    // Σημερινή ημερομηνία χωρίς ώρες για σύγκριση
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;color:#4CAF50;background:#111;padding:8px;border-radius:5px;border:1px solid #333;">
        <span id="prevMonth" style="cursor:pointer;padding:0 10px; font-weight:bold;">&#8592;</span>
        <span style="text-transform: capitalize; font-weight:bold;">${new Date(currentYear, currentMonth).toLocaleString("el-GR", { month: "long" })} ${currentYear}</span>
        <span id="nextMonth" style="cursor:pointer;padding:0 10px; font-weight:bold;">&#8594;</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
    `;

    const weekHeaders = ["Κ","Δ","Τ","Τ","Π","Π","Σ"];
    weekHeaders.forEach(d => html += `<div style="text-align:center;opacity:.6;color:#4CAF50;font-size:12px;font-weight:bold;">${d}</div>`);

    // Κενά για τις μέρες πριν την 1η του μηνός
    for (let i = 0; i < firstDayOfMonth; i++) html += `<div></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const loopDate = new Date(currentYear, currentMonth, day);
        const loopDateTime = loopDate.getTime();
        const dayOfWeek = loopDate.getDay(); 
        
        const workoutKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const foodDateString = `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
        
        let bg = "#1a1a1a";
        let border = "1px solid #333";
        let color = "#fff";

        // ΛΟΓΙΚΗ STRICT: 
        // Δευτέρα (1) & Πέμπτη (4) = Recovery Days (Μπλε)
        const isRecoveryDay = (dayOfWeek === 1 || dayOfWeek === 4);

        if (isRecoveryDay) {
            bg = "#1e3a5f"; 
            border = "1px solid #64B5F6";
        } 
        else if (data[workoutKey]) {
            // ΕΓΙΝΕ ΠΡΟΠΟΝΗΣΗ: ΠΡΑΣΙΝΟ
            bg = "#4CAF50";
            border = "1px solid #4CAF50";
            color = "#000";
        } 
        else if (loopDateTime < todayStart) {
            // ΠΑΡΕΛΘΟΝ & ΟΧΙ ΠΡΟΠΟΝΗΣΗ (Και όχι Recovery): ΚΟΚΚΙΝΟ
            bg = "#b71c1c";
            border = "1px solid #ff5252";
        }

        // Highlight Σήμερα (Χρυσό περίγραμμα)
        if (loopDateTime === todayStart) {
            border = "2px solid #FFD700";
        }

        html += `<div style="background:${bg};border:${border};color:${color};padding:8px 0;text-align:center;border-radius:6px;font-size:13px;cursor:pointer;font-weight:bold;" 
                    onclick="window.viewFoodFromCalendar('${foodDateString}')">
                    ${day}
                 </div>`;
    }

    html += `</div>`;
    el.innerHTML = html;

    // Listeners για την πλοήγηση
    document.getElementById("prevMonth").onclick = (e) => { 
        e.stopPropagation(); currentMonth--; 
        if(currentMonth < 0){ currentMonth = 11; currentYear--; } 
        renderCalendar(); 
    };
    document.getElementById("nextMonth").onclick = (e) => { 
        e.stopPropagation(); currentMonth++; 
        if(currentMonth > 11){ currentMonth = 0; currentYear++; } 
        renderCalendar(); 
    };
};

/* --- ΣΥΝΔΕΣΗ ΗΜΕΡΟΛΟΓΙΟΥ ΜΕ DIET PANEL (STRICT SYNC) --- */
window.viewFoodFromCalendar = function(dateStr) {
    const parts = dateStr.split('/');
    const selectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
    
    // Ενημέρωση της global μεταβλητής ημερομηνίας για το food.js
    window.currentFoodDate = selectedDate;
    
    // Κλείσιμο όλων των panels και άνοιγμα του Food
    document.querySelectorAll(".pegasus-panel").forEach(p => p.style.display = "none");
    
    const foodPanel = document.getElementById("foodPanel");
    if (foodPanel) {
        foodPanel.style.display = "block";
        
        // Σημαντικό: Καλούμε το render του φαγητού για τη συγκεκριμένη μέρα
        if (window.renderFood) {
            window.renderFood();
        } else if (window.updateFoodUI) {
            window.updateFoodUI();
        }
        
        // UI Fix για το κουμπί προσθήκης (διασφάλιση Pegasus Green)
        setTimeout(() => {
            const crossBtn = document.getElementById("btnAddFood");
            if (crossBtn) {
                crossBtn.style.setProperty('color', '#4CAF50', 'important');
                crossBtn.style.setProperty('border-color', '#4CAF50', 'important');
            }
        }, 10);
    }
};