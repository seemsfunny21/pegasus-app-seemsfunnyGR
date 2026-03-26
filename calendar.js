/* ==========================================================================
   PEGASUS CALENDAR SYSTEM - v5.0 (MODULAR / NUTRITION INTEGRATED)
   Protocol: Strict State Management & Cross-Module Communication
   ========================================================================== */

const PegasusCalendar = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        render();
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        render();
    };

    // 2. RENDERING ENGINE (Matches Screenshot 2026-03-26 085455)
    const render = () => {
        const el = document.getElementById("calendarContent");
        if (!el) return;

        const data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
        const now = new Date();
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

            // ΛΟΓΙΚΗ STRICT RECOVERY: Δευτέρα (1) & Πέμπτη (4)
            const isRecoveryDay = (dayOfWeek === 1 || dayOfWeek === 4);

            if (data[workoutKey]) {
                bg = "#4CAF50"; // Πράσινο: Έγινε προπόνηση
                border = "1px solid #4CAF50";
                color = "#000";
            } else if (isRecoveryDay) {
                bg = "#1e3a5f"; // Μπλε: Recovery
                border = "1px solid #64B5F6";
            } else if (loopDateTime < todayStart) {
                bg = "#b71c1c"; // Κόκκινο: Χαμένη προπόνηση
                border = "1px solid #ff5252";
            }

            if (loopDateTime === todayStart) {
                border = "2px solid #FFD700"; // Χρυσό: Σήμερα
            }

            html += `<div style="background:${bg};border:${border};color:${color};padding:8px 0;text-align:center;border-radius:6px;font-size:13px;cursor:pointer;font-weight:bold;" 
                        onclick="window.viewFoodFromCalendar('${foodDateString}')">
                        ${day}
                     </div>`;
        }

        html += `</div>`;
        el.innerHTML = html;

        document.getElementById("prevMonth").addEventListener("click", handlePrevMonth);
        document.getElementById("nextMonth").addEventListener("click", handleNextMonth);
    };

    // 3. ΣΥΝΔΕΣΗ ΜΕ ΔΙΑΤΡΟΦΗ
    const viewFood = (dateStr) => {
        const parts = dateStr.split('/');
        // Δημιουργία ημερομηνίας (Προσοχή: ο μήνας στο JS Date ξεκινά από 0)
        const selectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
        
        // Ενημέρωση της Global μεταβλητής που χρησιμοποιεί το food.js
        window.currentFoodDate = selectedDate;
        
        // Κλείσιμο όλων των πάνελ και άνοιγμα της Διατροφής
        document.querySelectorAll(".pegasus-panel").forEach(p => p.style.display = "none");
        
        const foodPanel = document.getElementById("foodPanel");
        if (foodPanel) {
            foodPanel.style.display = "block";
            
            // Κλήση της συνάρτησης render του food.js
            if (typeof window.renderFood === 'function') {
                window.renderFood();
            }
        }
    };

    return {
        render: render,
        viewFood: viewFood
    };
})();

// GLOBAL EXPOSURE
window.renderCalendar = PegasusCalendar.render;
window.viewFoodFromCalendar = PegasusCalendar.viewFood;
