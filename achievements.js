/* ==========================================================================
   PEGASUS ACHIEVEMENTS ENGINE - v5.0 (STRICT DATA HANDLING)
   Protocol: Null-Safe Rendering & Muscle Credit Logic
   ========================================================================== */

const PegasusAchievements = (function() {
    
    // 1. DATA RETRIEVAL (Null-Safe)
    const getHistory = () => {
        try {
            const data = localStorage.getItem('pegasus_weekly_history');
            return data ? JSON.parse(data) : { 
                "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
            };
        } catch (e) {
            return { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
        }
    };

    // 2. RENDERING ENGINE (Fixed Line 98)
    const render = () => {
        const container = document.getElementById("achPanelContent");
        if (!container) return;

        const history = getHistory();
        const targets = { 
            "Στήθος": 24, "Πλάτη": 24, "Ώμοι": 16, "Χέρια": 16, "Κορμός": 12, "Πόδια": 24 
        };

        let html = `<div class="achievements-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">`;

        // Διόρθωση: Διασφάλιση ότι το history είναι αντικείμενο πριν το Object.entries
        Object.entries(targets).forEach(([muscle, target]) => {
            const current = history[muscle] || 0;
            const progress = Math.min(100, (current / target) * 100);
            const color = progress >= 100 ? "#4CAF50" : "#888";

            html += `
                <div class="ach-item" style="background: #111; padding: 10px; border-radius: 8px; border: 1px solid ${color};">
                    <div style="font-size: 11px; color: ${color}; font-weight: bold;">${muscle.toUpperCase()}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 5px 0;">
                        <span style="font-size: 14px; color: #fff;">${current} / ${target}</span>
                        <span style="font-size: 10px; color: #666;">ΣΕΤ</span>
                    </div>
                    <div style="width: 100%; height: 4px; background: #222; border-radius: 2px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background: ${color}; transition: width 0.5s;"></div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        
        // Level Calculation Logic
        const totalSets = Object.values(history).reduce((a, b) => a + b, 0);
        const level = Math.floor(totalSets / 10) + 1;
        
        const headerHtml = `
            <div style="text-align: center; margin-bottom: 20px; padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 12px; border: 1px solid #4CAF50;">
                <div style="font-size: 12px; color: #4CAF50;">PEGASUS RANK</div>
                <div style="font-size: 28px; font-weight: bold; color: #fff;">LEVEL ${level}</div>
                <div style="font-size: 11px; color: #888; margin-top: 5px;">ΣΥΝΟΛΙΚΑ ΣΕΤ ΕΒΔΟΜΑΔΑΣ: ${totalSets}</div>
            </div>
        `;

        container.innerHTML = headerHtml + html;
    };

    // 3. LOGGING (Global Bridge)
    const update = (muscleGroup) => {
        if (!muscleGroup) return;
        let history = getHistory();
        history[muscleGroup] = (history[muscleGroup] || 0) + 1;
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
        render();
    };

    return {
        render: render,
        update: update
    };
})();

// GLOBAL EXPOSURE
window.renderAchievements = PegasusAchievements.render;
window.logPegasusSet = PegasusAchievements.update;
