/* ==========================================================================
   Pegasus Achievements System - v17.2 (STRICT ANTI-CORRUPTION)
   Protocol: Data Validation, Auto-Repair & Zero-Null Rendering
   ========================================================================== */

// 1. GLOBAL STATE INITIALIZATION
let userStats = { totalSets: 0, exerciseHistory: {} };

/**
 * Λειτουργία Ανάκτησης & Επιδιόρθωσης Δεδομένων
 */
function getSanitizedStats() {
    try {
        let rawData = localStorage.getItem('pegasus_stats');
        if (!rawData) return { totalSets: 0, exerciseHistory: {} };
        
        let parsed = JSON.parse(rawData);
        
        // Έλεγχος για NaN ή corrupt δεδομένα
        if (isNaN(parsed.totalSets) || typeof parsed.exerciseHistory !== 'object' || parsed.exerciseHistory === null) {
            console.error("PEGASUS: Corrupt Data Detected. Resetting stats to safe state.");
            return { totalSets: 0, exerciseHistory: {} };
        }
        return parsed;
    } catch (e) {
        return { totalSets: 0, exerciseHistory: {} };
    }
}

/**
 * Ενημέρωση προόδου - Καλείται από το app.js
 */
window.updateAchievements = function(exerciseName) {
    if (!exerciseName) return;
    const cleanName = exerciseName.trim();
    
    // Πάντα τράβηγμα των τελευταίων δεδομένων πριν την εγγραφή
    userStats = getSanitizedStats();
    
    userStats.totalSets++;

    if (!userStats.exerciseHistory[cleanName]) {
        userStats.exerciseHistory[cleanName] = 0;
    }
    userStats.exerciseHistory[cleanName]++;

    localStorage.setItem('pegasus_stats', JSON.stringify(userStats));
    checkMilestones(cleanName);
};

/**
 * Σχεδίαση του UI - Protected & Fixed
 */
window.renderAchievements = function() {
    const content = document.getElementById('achPanelContent');
    if (!content) return;

    // Επιδιόρθωση πριν το render
    const stats = getSanitizedStats();
    
    // Υπολογισμός Level με προστασία από NaN
    const total = stats.totalSets || 0;
    const currentLevel = Math.floor(total / 20) + 1;
    const xpInLevel = total % 20;
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

        <div style="background:#111; padding:10px; border-radius:5px; text-align:center; border: 1px solid #222; margin-bottom:15px;">
            <span style="font-size:12px; color:#aaa;">Συνολικά Σετ:</span>
            <span style="font-size:18px; color:#4CAF50; font-weight:bold; margin-left:10px;">${total}</span>
        </div>

        <div style="max-height:250px; overflow-y:auto; padding-right:5px;">
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
    `;

    const sortedExercises = Object.entries(stats.exerciseHistory).sort((a, b) => b[1] - a[1]);

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

function checkMilestones(name) {
    const stats = getSanitizedStats();
    const count = stats.exerciseHistory[name] || 0;
    if (count > 0 && count % 50 === 0) showAchievementPopup(`Master of ${name}: ${count} Sets!`);
    if (stats.totalSets > 0 && stats.totalSets % 100 === 0) showAchievementPopup(`Centurion: ${stats.totalSets} Total Sets!`);
}

function showAchievementPopup(text) {
    const container = document.getElementById('achievement-container') || createAchievementContainer();
    const toast = document.createElement('div');
    toast.className = 'achievement-toast'; 
    toast.style.cssText = `background:#111; color:#4CAF50; border:1px solid #4CAF50; padding:15px; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.5); font-weight:bold; margin-bottom:10px;`;
    toast.innerText = `🏆 ${text}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function createAchievementContainer() {
    const div = document.createElement('div');
    div.id = 'achievement-container';
    div.style.cssText = `position: fixed; bottom: 20px; right: 20px; z-index: 10002; display: flex; flex-direction: column; gap: 10px;`;
    document.body.appendChild(div);
    return div;
}

// Initialization on load
userStats = getSanitizedStats();
