/* ==========================================================================
   PEGASUS CALENDAR SYSTEM - CLEAN SWEEP v17.0
   Protocol: Strict Recovery Monitoring | Logic: Integrated Diet Sync
   ========================================================================== */

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

/**
 * Κύρια συνάρτηση σχεδίασης ημερολογίου
 */
window.renderCalendar = function() {
    const el = document.getElementById("calendarContent");
    if (!el) return;

    // Ανάκτηση δεδομένων από το LocalStorage
    const workoutData = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; color:#4CAF50; background:#0a0a0a; padding:10px; border-radius:8px; border:1px solid #222;">
        <span id="prevMonth" style="cursor:pointer; padding:5px 15px; font-weight:900; font-size:18px;">&larr;</span>
        <span style="text-transform: uppercase; font-weight:900; letter-spacing:2px; font-size:14px;">
            ${new Date(currentYear, currentMonth).toLocaleString("el-GR", { month: "long" })} ${currentYear}
        </span>
        <span id="nextMonth" style="cursor:pointer; padding:5px 15px; font-weight:900; font-size:18px;">&rarr;</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:6px;">
    `;

    const weekHeaders = ["Κ", "Δ", "Τ", "Τ", "Π", "Π", "Σ"];
    weekHeaders.forEach(d => {
        html += `<div style="text-align:center; color:#4CAF50; font-size:11px; font-weight:900; opacity:0.5; padding-bottom:5px;">${d}</div>`;
    });

    // Padding για τις κενές ημέρες στην αρχή του μήνα
    for (let i = 0; i < firstDayOfMonth; i++) html += `<div></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const loopDate = new Date(currentYear, currentMonth, day);
        const loopDateTime = loopDate.getTime();
        const dayOfWeek = loopDate.getDay(); 
        
        const workoutKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const foodDateString = `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
        
        let bg = "#111";
        let border = "1px solid #222";
        let color = "#fff";
        let glow = "none";

        // Λογική Strict Recovery (Δευτέρα=1, Πέμπτη=4)
        const isRecoveryDay = (dayOfWeek === 1 || dayOfWeek === 4);

        if (isRecoveryDay) {
            bg = "#0d1a2b"; 
            border = "1px solid #2196F3";
            color = "#2196F3";
        } 
        
        if (workoutData[workoutKey]) {
            // Ολοκληρωμένη προπόνηση: PEGASUS GREEN
            bg = "#4CAF50";
            border = "1px solid #4CAF50";
            color = "#000";
            glow = "0 0 10px rgba(74, 175, 80, 0.4)";
        } else if (loopDateTime < todayStart && !isRecoveryDay) {
            // Παρελθόν χωρίς προπόνηση: RED ALERT
            bg = "#2b0d0d";
            border = "1px solid #f44336";
            color = "#f44336";
        }

        // Highlight Σήμερα
        if (loopDateTime === todayStart) {
            border = "2px solid #FFD700";
        }

        html += `
            <div style="background:${bg}; border:${border}; color:${color}; padding:10px 0; text-align:center; border-radius:6px; font-size:12px; cursor:pointer; font-weight:900; box-shadow:${glow}; transition:transform 0.2s;" 
                 onclick="window.viewFoodFromCalendar('${foodDateString}')"
                 onmouseover="this.style.transform='scale(1.1)'"
                 onmouseout="this.style.transform='scale(1)'">
                ${day}
            </div>`;
    }

    html += `</div>`;
    el.innerHTML = html;

    // Event Listeners πλοήγησης
    document.getElementById("prevMonth").onclick = (e) => { 
        e.stopPropagation(); 
        currentMonth--; 
        if(currentMonth < 0){ currentMonth = 11; currentYear--; } 
        window.renderCalendar(); 
    };
    document.getElementById("nextMonth").onclick = (e) => { 
        e.stopPropagation(); 
        currentMonth++; 
        if(currentMonth > 11){ currentMonth = 0; currentYear++; } 
        window.renderCalendar(); 
    };
};

/**
 * Σύνδεση με το Diet Panel (Strict Sync)
 */
window.viewFoodFromCalendar = function(dateStr) {
    const parts = dateStr.split('/');
    const selectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
    
    // Ενημέρωση της παγκόσμιας μεταβλητής ημερομηνίας
    window.currentFoodDate = selectedDate;
    
    // Πρωτόκολλο Clean Sweep: Κλείσιμο όλων των panels πριν το άνοιγμα του Food
    if (window.PegasusUI && window.PegasusUI.panels) {
        window.PegasusUI.panels.forEach(p => {
            const el = document.getElementById(p);
            if (el) el.style.display = "none";
        });
    }

    const foodPanel = document.getElementById("foodPanel");
    if (foodPanel) {
        foodPanel.style.display = "block";
        if (window.updateFoodUI) window.updateFoodUI();
    }
};