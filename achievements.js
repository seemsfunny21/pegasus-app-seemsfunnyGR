/* ==========================================================================
   PEGASUS ACHIEVEMENTS SYSTEM - v3.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict State Management - Independent LocalStorage Tracking
   ========================================================================== */

const PegasusAchievements = (function() {
    const STATS_KEY = 'pegasus_stats';

    // 1. ΑΥΤΟΝΟΜΗ ΔΙΑΧΕΙΡΙΣΗ ΔΕΔΟΜΕΝΩΝ (State Encapsulation)
    const getStats = () => {
        return JSON.parse(localStorage.getItem(STATS_KEY)) || {
            totalSets: 0,
            exerciseHistory: {}
        };
    };

    const saveStats = (stats) => {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    };

    // 2. ΔΙΑΧΕΙΡΙΣΗ UI (Toasts & DOM Elements)
    const createAchievementContainer = () => {
        let div = document.getElementById('achievement-container');
        if (!div) {
            div = document.createElement('div');
            div.id = 'achievement-container';
            div.style.cssText = `position: fixed; bottom: 20px; right: 20px; z-index: 10002; display: flex; flex-direction: column; gap: 10px;`;
            document.body.appendChild(div);
        }
        return div;
    };

    const showAchievementPopup = (text) => {
        const container = createAchievementContainer();
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        // Fallback CSS σε περίπτωση που λείπει από το style.css
        toast.style.cssText = `background: #111; border: 1px solid #4CAF50; color: #4CAF50; padding: 10px 20px; border-radius: 5px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.5);`;
        toast.innerText = `🏆 ${text}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    };

    const checkMilestones = (stats, name) => {
        const count = stats.exerciseHistory[name];
        if (count && count % 50 === 0) showAchievementPopup(`Master of ${name}: ${count} Sets!`);
        if (stats.totalSets > 0 && stats.totalSets % 100 === 0) showAchievementPopup(`Centurion: ${stats.totalSets} Total Sets!`);
    };

    // 3. PUBLIC API
    return {
        update: function(exerciseName) {
            if (!exerciseName) return;
            const cleanName = exerciseName.trim();
            const stats = getStats();

            stats.totalSets++;
            if (!stats.exerciseHistory[cleanName]) {
                stats.exerciseHistory[cleanName] = 0;
            }
            stats.exerciseHistory[cleanName]++;

            saveStats(stats);
            checkMilestones(stats, cleanName);
        },

        render: function() {
            const content = document.getElementById('achPanelContent');
            if (!content) return;

            const stats = getStats();
            const currentLevel = Math.floor(stats.totalSets / 20) + 1;
            const xpInLevel = stats.totalSets % 20;
            const progressPercent = (xpInLevel / 20) * 100;

            let html = `
                <div style="background:#111; padding:15px; border-radius:8px; margin-bottom:15px; border: 1px solid #4CAF50; text-align:center;">
                    <div style="color:#4CAF50; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px;">PEGASUS RANK</div>
                    <div style="font-size:28px; color:#fff; font-weight:bold; margin-bottom:10px;">LEVEL ${currentLevel}</div>
                    
                    <div style="background:#000; height:8px; border-radius:4px; overflow:hidden; border: 1px solid #222; margin-bottom:5px;">
                        <div style="background:#4CAF50; width:${progressPercent}%; height:100%; transition: width 0.5s ease;"></div>
                    </div>
                    <div style="font-size:11px; color:#888;">${xpInLevel} / 20 σετ για το επόμενο Level</div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr; gap:10px; margin-bottom:15px;">
                    <div style="background:#111; padding:10px; border-radius:5px; text-align:center; border: 1px solid #222;">
                        <span style="font-size:12px; color:#aaa;">Συνολικά Σετ:</span>
                        <span style="font-size:18px; color:#4CAF50; font-weight:bold; margin-left:10px;">${stats.totalSets}</span>
                    </div>
                </div>

                <div style="max-height:250px; overflow-y:auto; padding-right:5px;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
            `;

            const sortedExercises = Object.entries(stats.exerciseHistory)
                .sort((a, b) => b[1] - a[1]);

            if (sortedExercises.length === 0) {
                html += `<tr><td style="text-align:center; padding:20px; color:#666;">Ολοκλήρωσε το πρώτο σου σετ!</td></tr>`;
            } else {
                sortedExercises.forEach(([name, count]) => {
                    html += `
                        <tr style="border-bottom:1px solid #222;">
                            <td style="padding:10px 0; color:#eee;">${name}</td>
                            <td style="padding:10px 0; text-align:right; color:#4CAF50; font-weight:bold;">${count} <small style="color:#666">σετ</small></td>
                        </tr>
                    `;
                });
            }

            html += `</table></div>`;
            content.innerHTML = html;
        }
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με το κεντρικό UI (Entry Point)
window.updateAchievements = PegasusAchievements.update;
window.renderAchievements = PegasusAchievements.render;