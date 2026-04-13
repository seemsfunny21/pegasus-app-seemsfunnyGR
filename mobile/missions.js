/* ==========================================================================
   🎯 PEGASUS MODULE: DAILY MISSION CONTROL (v1.0)
   Protocol: Habit Tracking & Daily Reset Engine
   ========================================================================== */

(function() {
    const MISSIONS_DATA_KEY = 'pegasus_missions_v1';
    const MISSIONS_DATE_KEY = 'pegasus_missions_date';

    // 1. Μηχανή Δεδομένων & Ημερήσιο Reset
    window.PegasusMissions = {
        checkDailyReset: function() {
            const today = new Date().toLocaleDateString('el-GR');
            const lastSavedDate = localStorage.getItem(MISSIONS_DATE_KEY);

            if (lastSavedDate !== today) {
                // Είναι νέα μέρα! Ξε-τσεκάρουμε όλους τους στόχους
                let missions = JSON.parse(localStorage.getItem(MISSIONS_DATA_KEY)) || [];
                missions.forEach(m => m.completed = false);
                
                localStorage.setItem(MISSIONS_DATA_KEY, JSON.stringify(missions));
                localStorage.setItem(MISSIONS_DATE_KEY, today);
                // Δεν κάνουμε Cloud Sync εδώ για να μην το βαραίνουμε στο boot, 
                // θα γίνει με το πρώτο κλικ της ημέρας.
            }
        },

        toggleMission: function(id) {
            let missions = JSON.parse(localStorage.getItem(MISSIONS_DATA_KEY)) || [];
            const idx = missions.findIndex(m => m.id === id);
            if (idx === -1) return;

            missions[idx].completed = !missions[idx].completed;
            this.saveAndRender(missions);
        },

        toggleAddForm: function() {
            const form = document.getElementById('addMissionForm');
            const btn = document.getElementById('btnAddMission');
            if(form.style.display === 'none') {
                form.style.display = 'block';
                btn.innerHTML = 'Χ ΚΛΕΙΣΙΜΟ';
                btn.style.background = '#ff4444';
            } else {
                form.style.display = 'none';
                btn.innerHTML = '+ ΝΕΟΣ ΣΤΟΧΟΣ';
                btn.style.background = 'var(--main)';
            }
        },

        addNewMission: function() {
            const title = document.getElementById('newMissionTitle').value;

            if(!title || title.trim() === '') {
                alert('Παρακαλώ εισάγετε τον τίτλο του στόχου.');
                return;
            }

            let missions = JSON.parse(localStorage.getItem(MISSIONS_DATA_KEY)) || [];
            
            const newEntry = {
                id: 'mis_' + Date.now(),
                title: title.trim(),
                completed: false
            };

            missions.push(newEntry); // Προσθήκη στο τέλος
            this.saveAndRender(missions);
            this.toggleAddForm();

            document.getElementById('newMissionTitle').value = '';
        },

        deleteMission: function(id) {
            if(confirm('Διαγραφή αυτού του Ημερήσιου Στόχου;')) {
                let missions = JSON.parse(localStorage.getItem(MISSIONS_DATA_KEY)) || [];
                missions = missions.filter(m => m.id !== id);
                this.saveAndRender(missions);
            }
        },

        saveAndRender: function(data) {
            localStorage.setItem(MISSIONS_DATA_KEY, JSON.stringify(data));
            localStorage.setItem(MISSIONS_DATE_KEY, new Date().toLocaleDateString('el-GR')); // Ανανέωση ημερομηνίας
            
            window.renderMissionsContent();

            // ☁️ REAL-TIME CLOUD TRIGGER
            if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') {
                window.PegasusCloud.push(); 
            }
        }
    };

    // 2. Κατασκευαστής Οθόνης (View Injector)
    function injectViewLayer() {
        if (document.getElementById('missions')) return;
        const viewDiv = document.createElement('div');
        viewDiv.id = 'missions';
        viewDiv.className = 'view';
        
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div class="section-title" style="margin: 0;">ΗΜΕΡΗΣΙΟΙ ΣΤΟΧΟΙ</div>
                <button id="btnAddMission" class="primary-btn" style="width: auto; margin: 0; padding: 5px 10px; font-size: 10px; border-radius: 8px;" onclick="window.PegasusMissions.toggleAddForm()">
                    + ΝΕΟΣ ΣΤΟΧΟΣ
                </button>
            </div>

            <div id="addMissionForm" class="mini-card" style="display: none; border-color: var(--main); margin-bottom: 20px; padding: 15px;">
                <div style="font-size: 11px; font-weight: 900; color: var(--main); margin-bottom: 10px; text-align: center;">ΝΕΑ ΣΥΝΗΘΕΙΑ</div>
                <input type="text" id="newMissionTitle" placeholder="π.χ. Διάβασμα 30 Λεπτά..." style="margin-bottom: 15px; border: 2px solid #444;">
                <button class="primary-btn" onclick="window.PegasusMissions.addNewMission()">ΠΡΟΣΘΗΚΗ</button>
            </div>

            <div class="mini-card" style="padding: 20px; text-align: center; border-color: #222; background: rgba(20,20,20,0.8); margin-bottom: 20px;">
                <div id="missionDate" style="font-size: 10px; color: #777; font-weight: 800; letter-spacing: 2px; margin-bottom: 5px;">ΣΗΜΕΡΑ</div>
                <div id="missionPctTxt" style="font-size: 32px; font-weight: 900; color: var(--main); margin-bottom: 10px; text-shadow: 0 0 10px rgba(0,255,65,0.2);">0%</div>
                <div class="bar-bg" style="height: 8px;"><div id="missionProgressBar" class="bar-fill" style="width: 0%;"></div></div>
            </div>

            <div id="missions-content" style="width: 100%; display: flex; flex-direction: column; gap: 8px; padding-bottom: 80px;"></div>
        `;
        document.body.appendChild(viewDiv);
    }

    // 3. Rendering Engine
    window.renderMissionsContent = function() {
        const container = document.getElementById('missions-content');
        const pctTxt = document.getElementById('missionPctTxt');
        const progressBar = document.getElementById('missionProgressBar');
        const dateTxt = document.getElementById('missionDate');
        
        if (!container) return;

        window.PegasusMissions.checkDailyReset(); // Έλεγχος αν άλλαξε η μέρα πριν σχεδιάσουμε

        const missions = JSON.parse(localStorage.getItem(MISSIONS_DATA_KEY)) || [];
        
        if (dateTxt) dateTxt.textContent = new Date().toLocaleDateString('el-GR');

        let completedCount = 0;
        let html = '';

        missions.forEach(mission => {
            if (mission.completed) completedCount++;
            
            const isDone = mission.completed;
            const bgColor = isDone ? 'rgba(0,255,65,0.1)' : 'rgba(15,15,15,0.95)';
            const borderColor = isDone ? 'var(--main)' : '#333';
            const icon = isDone ? '✅' : '⬜';
            const textStyle = isDone ? 'text-decoration: line-through; color: #777;' : 'color: #fff;';

            html += `
                <div class="mini-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-color: ${borderColor}; background: ${bgColor}; transition: all 0.3s ease;">
                    <div style="display: flex; align-items: center; gap: 15px; flex: 1; cursor: pointer;" onclick="window.PegasusMissions.toggleMission('${mission.id}')">
                        <div style="font-size: 20px;">${icon}</div>
                        <div style="font-size: 14px; font-weight: 800; ${textStyle}">${mission.title}</div>
                    </div>
                    <button onclick="window.PegasusMissions.deleteMission('${mission.id}')" 
                            style="background: transparent; border: none; color: #555; font-size: 14px; padding: 5px; cursor: pointer;">
                        🗑️
                    </button>
                </div>
            `;
        });

        // Υπολογισμός Ποσοστού
        const total = missions.length;
        let percentage = 0;
        if (total > 0) {
            percentage = Math.round((completedCount / total) * 100);
        }

        if (pctTxt) pctTxt.textContent = `${percentage}%`;
        if (progressBar) progressBar.style.width = `${percentage}%`;
        
        // Αλλαγή χρώματος αν φτάσει το 100%
        if (percentage === 100 && total > 0) {
            pctTxt.style.color = '#00ff41';
            pctTxt.style.textShadow = '0 0 20px rgba(0,255,65,0.6)';
        } else {
            pctTxt.style.color = 'var(--main)';
            pctTxt.style.textShadow = '0 0 10px rgba(0,255,65,0.2)';
        }

        container.innerHTML = html || '<div style="color:#555; font-size:11px; text-align:center; margin-top:20px;">ΔΕΝ ΕΧΕΙΣ ΟΡΙΣΕΙ ΣΤΟΧΟΥΣ</div>';
    };

    // 4. Boot Sequence
    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer();
        window.renderMissionsContent();
        
        if (window.registerPegasusModule) {
            window.registerPegasusModule({ 
                id: 'missions', 
                label: 'Στόχοι', 
                icon: '🎯' 
            });
        }
    });
})();
