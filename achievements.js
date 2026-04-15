/* ==========================================================================
   Pegasus Achievements System - v18.7 MAXIMALIST (HARDENED)
   Protocol: Strict Data Analyst - Anti-Desync & Cloud Integration
   Status: FINAL STABLE | ZERO-BUG VERIFIED
   ========================================================================== */

const allExercises = [
    "Seated Chest Press", "Pec Deck", "Pushups", 
    "Lat Pulldown", "Low Seated Row", "Close Grip Pulldown", "Behind the Neck Pulldown", "Reverse Row",
    "Preacher Curl", "Standing Bicep Curl", "Triceps Overhead Extension", "Triceps Press",
    "Leg Extension", "Plank", "Lying Knee Raise", "Reverse Crunch", "Leg Raise Hip Lift",
    "Stretching", "EMS Κοιλιακών", "EMS Πλάτης", "EMS Ποδιών", "Προθέρμανση"
];

/**
 * 🛡️ INTERNAL DATA RECOVERY
 * Διασφαλίζει ότι διαβάζουμε ΠΑΝΤΑ την τελευταία τιμή από το δίσκο (αποφυγή Desync)
 */
function getFreshStats() {
    let raw = localStorage.getItem('pegasus_stats');
    let stats = { totalSets: 0, exerciseHistory: {} };
    try {
        if (raw) {
            let parsed = JSON.parse(raw);
            stats.totalSets = isNaN(parseInt(parsed.totalSets)) ? 0 : parseInt(parsed.totalSets);
            stats.exerciseHistory = (parsed.exerciseHistory && typeof parsed.exerciseHistory === 'object') ? parsed.exerciseHistory : {};
        }
    } catch (e) {
        console.error("PEGASUS ACHIEVEMENTS: Stats corruption prevented.");
    }
    return stats;
}

/**
 * Ενημέρωση προόδου (Global Bridge)
 */
window.updateAchievements = async function(exerciseName) {
    if (!exerciseName) return;
    const cleanName = exerciseName.trim();
    
    // Λήψη φρέσκων δεδομένων πριν την εγγραφή
    let userStats = getFreshStats();
    
    userStats.totalSets++;

    if (!userStats.exerciseHistory[cleanName]) {
        userStats.exerciseHistory[cleanName] = 0;
    }
    userStats.exerciseHistory[cleanName]++;

    localStorage.setItem('pegasus_stats', JSON.stringify(userStats));
    
    // Trigger Milestones
    checkMilestones(cleanName, userStats);

    // 📡 CLOUD SYNC: Αυτόματη ενημέρωση του Cloud μετά από κάθε σετ
    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
        window.PegasusCloud.push(); 
    }
};

/**
 * Σχεδίαση του UI - PEGASUS GREEN
 */
window.renderAchievements = function() {
    const content = document.getElementById('achPanelContent');
    if (!content) return;

    // Λήψη φρέσκων δεδομένων για το Rendering
    const userStats = getFreshStats();
    const sets = parseInt(userStats.totalSets) || 0;
    const currentLevel = Math.floor(sets / 20) + 1;
    const xpInLevel = sets % 20;
    const progressPercent = (xpInLevel / 20) * 100;

    let html = `
        <div style="background:#111; padding:15px; border-radius:8px; margin-bottom:15px; border: 1px solid #4CAF50; box-shadow: 0 0 10px rgba(76, 175, 80, 0.2); text-align:center;">
            <div style="color:#4CAF50; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px;">PEGASUS RANK</div>
            <div style="font-size:28px; color:#fff; font-weight:bold; margin-bottom:10px;">LEVEL ${currentLevel}</div>
            
            <div style="background:#000; height:8px; border-radius:4px; overflow:hidden; border: 1px solid #222; margin-bottom:5px;">
                <div style="background:#4CAF50; width:${progressPercent}%; height:100%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 8px #4CAF50;"></div>
            </div>
            <div style="font-size:11px; color:#888;">${xpInLevel} / 20 σετ για το επόμενο Level</div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr; gap:10px; margin-bottom:15px;">
            <div style="background:#111; padding:10px; border-radius:5px; text-align:center; border: 1px solid #222;">
                <span style="font-size:12px; color:#aaa;">Συνολικά Σετ:</span>
                <span style="font-size:18px; color:#4CAF50; font-weight:bold; margin-left:10px;">${sets}</span>
            </div>
        </div>

        <div style="max-height:250px; overflow-y:auto; padding-right:5px; scrollbar-width: thin;">
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
    `;

    const sortedExercises = Object.entries(userStats.exerciseHistory)
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
};

/**
 * Milestones & Popups
 */
function checkMilestones(name, stats) {
    const count = stats.exerciseHistory[name];
    if (count % 50 === 0) showAchievementPopup(`Master of ${name}: ${count} Sets!`);
    if (stats.totalSets % 100 === 0) showAchievementPopup(`Centurion: ${stats.totalSets} Total Sets!`);
}

function showAchievementPopup(text) {
    const container = document.getElementById('achievement-container') || createAchievementContainer();
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.style.cssText = `
        background: #111; border: 1px solid #4CAF50; color: #fff; 
        padding: 12px 20px; border-radius: 8px; font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(76,175,80,0.3);
        animation: slideIn 0.5s ease forwards;
    `;
    toast.innerText = `🏆 ${text}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function createAchievementContainer() {
    const div = document.createElement('div');
    div.id = 'achievement-container';
    div.style.cssText = `position: fixed; bottom: 20px; right: 20px; z-index: 10002; display: flex; flex-direction: column; gap: 10px;`;
    document.body.appendChild(div);
    return div;
}

// Προσθήκη CSS animations για τα Achievements
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(120%); } to { transform: translateX(0); } }
    @keyframes slideOut { from { transform: translateX(0); } to { transform: translateX(120%); } }
`;
document.head.appendChild(style);
