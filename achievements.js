/* ==========================================================================
   Pegasus Achievements System - CLEAN SWEEP v17.0
   Protocol: Strict Green (#4CAF50) | Logic: volume-based leveling
   ========================================================================== */

const allExercises = [
    "Seated Chest Press", "Pec Deck", "Pushups", 
    "Lat Pulldown", "Low Seated Row", "Close Grip Pulldown", "Behind the Neck Pulldown", "Reverse Row",
    "Preacher Curl", "Standing Bicep Curl", "Triceps Overhead Extension", "Triceps Press",
    "Leg Extension", "Plank", "Lying Knee Raise", "Reverse Crunch", "Leg Raise Hip Lift",
    "Stretching", "EMS Κοιλιακών", "EMS Πλάτης", "EMS Ποδιών", "Προθέρμανση"
];

let userStats = JSON.parse(localStorage.getItem('pegasus_stats')) || {
    totalSets: 0,
    exerciseHistory: {}
};

/**
 * Ενημέρωση προόδου και Milestones
 */
window.updateAchievements = function(exerciseName) {
    if (!exerciseName) return;
    const cleanName = exerciseName.trim();
    userStats.totalSets++;

    if (!userStats.exerciseHistory[cleanName]) {
        userStats.exerciseHistory[cleanName] = 0;
    }
    userStats.exerciseHistory[cleanName]++;

    localStorage.setItem('pegasus_stats', JSON.stringify(userStats));
    checkMilestones(cleanName);
};

/**
 * Σχεδίαση του UI - Επιβολή Strict Green Protocol
 */
window.renderAchievements = function() {
    const content = document.getElementById('achPanelContent');
    if (!content) return;

    const currentLevel = Math.floor(userStats.totalSets / 20) + 1;
    const xpInLevel = userStats.totalSets % 20;
    const progressPercent = (xpInLevel / 20) * 100;

    let html = `
        <div style="background:#0a0a0a; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #4CAF50; text-align:center; box-shadow: 0 0 15px rgba(74, 175, 80, 0.1);">
            <div style="color:#4CAF50; font-size:10px; font-weight:900; letter-spacing:2px; margin-bottom:5px; text-transform:uppercase;">PEGASUS RANK</div>
            <div style="font-size:32px; color:#fff; font-weight:900; margin-bottom:10px;">LEVEL ${currentLevel}</div>
            
            <div style="background:#000; height:8px; border-radius:10px; overflow:hidden; border: 1px solid #222; margin-bottom:8px; position:relative;">
                <div style="background:#4CAF50; width:${progressPercent}%; height:100%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px #4CAF50;"></div>
            </div>
            <div style="font-size:10px; color:#888; font-weight:bold; letter-spacing:1px;">${xpInLevel} / 20 ΣΕΤ ΓΙΑ ΤΟ ΕΠΟΜΕΝΟ LEVEL</div>
        </div>

        <div style="background:#111; padding:12px; border-radius:8px; text-align:center; border: 1px solid #222; margin-bottom:15px;">
            <span style="font-size:11px; color:#aaa; text-transform:uppercase; letter-spacing:1px;">Συνολική Ένταση:</span>
            <span style="font-size:20px; color:#4CAF50; font-weight:900; margin-left:10px;">${userStats.totalSets} <small style="font-size:10px; color:#666;">ΣΕΤ</small></span>
        </div>

        <div style="max-height:280px; overflow-y:auto; padding-right:5px; scrollbar-width: thin; scrollbar-color: #4CAF50 #111;">
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
    `;

    const sortedExercises = Object.entries(userStats.exerciseHistory)
        .sort((a, b) => b[1] - a[1]);

    if (sortedExercises.length === 0) {
        html += `<tr><td style="text-align:center; padding:40px; color:#444; font-weight:bold; letter-spacing:1px;">ΑΝΑΜΟΝΗ ΓΙΑ ΔΕΔΟΜΕΝΑ...</td></tr>`;
    } else {
        sortedExercises.forEach(([name, count]) => {
            html += `
                <tr style="border-bottom:1px solid #1a1a1a;">
                    <td style="padding:10px 0; color:#eee; font-weight:600; text-transform:uppercase; font-size:11px;">${name}</td>
                    <td style="padding:10px 0; text-align:right; color:#4CAF50; font-weight:900; font-size:14px;">${count} <span style="font-size:9px; color:#666; font-weight:normal;">SET</span></td>
                </tr>
            `;
        });
    }

    html += `</table></div>`;
    content.innerHTML = html;
};

/**
 * Milestones Logic
 */
function checkMilestones(name) {
    const count = userStats.exerciseHistory[name];
    if (count % 50 === 0) showAchievementPopup(`MASTER OF ${name.toUpperCase()}: ${count} SETS!`);
    if (userStats.totalSets % 100 === 0) showAchievementPopup(`CENTURION: ${userStats.totalSets} TOTAL SETS!`);
}

/**
 * Unified Toast Notification
 */
function showAchievementPopup(text) {
    const container = document.getElementById('achievement-container') || createAchievementContainer();
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #000; 
        color: #4CAF50; 
        border: 1px solid #4CAF50; 
        padding: 15px 20px; 
        border-radius: 8px; 
        font-weight: 900; 
        font-size: 12px; 
        box-shadow: 0 0 20px rgba(74, 175, 80, 0.3); 
        text-transform: uppercase;
        letter-spacing: 1px;
        animation: slideIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    `;
    toast.innerHTML = `<span style="margin-right:10px;">🏆</span> ${text}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100px)";
        toast.style.transition = "0.4s";
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function createAchievementContainer() {
    const div = document.createElement('div');
    div.id = 'achievement-container';
    div.style.cssText = `position: fixed; bottom: 30px; right: 30px; z-index: 20000; display: flex; flex-direction: column; gap: 10px;`;
    document.body.appendChild(div);
    return div;
}