/* ==========================================================================
   🏋️‍♂️ PEGASUS MODULE: TACTICAL LIFTING LOGGER (v1.0)
   Protocol: Progressive Overload & PR Tracking
   ========================================================================== */

(function() {
    const LIFTING_DATA_KEY = 'pegasus_lifting_v1';

    function getPegasusLiftingDateStr() {
        if (typeof window.getPegasusTodayDateStr === "function") {
            return window.getPegasusTodayDateStr();
        }

        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    window.PegasusLifting = {
        isLocked: false, // 🛡️ API SPAM GUARD

        addSet: function() {
            if (this.isLocked) return;
            this.isLocked = true;
            setTimeout(() => this.isLocked = false, 1200); // Κλείδωμα για 1.2 δευτερόλεπτα

            const exercise = document.getElementById('liftName').value.trim();
            const weight = parseFloat(document.getElementById('liftWeight').value);
            const reps = parseInt(document.getElementById('liftReps').value);

            if (!exercise || isNaN(weight) || isNaN(reps)) {
                alert("ΣΦΑΛΜΑ: Συμπλήρωσε Άσκηση, Κιλά και Επαναλήψεις.");
                return;
            }

            let logs = (window.PegasusMobileSafe?.safeReadStorage(LIFTING_DATA_KEY, [], { repairOnFailure: true })) || [];

            const newEntry = {
                id: 'lift_' + Date.now(),
                date: getPegasusLiftingDateStr(),
                timestamp: Date.now(),
                exercise: exercise.toUpperCase(), // Κεφαλαία για ομοιομορφία
                weight: weight,
                reps: reps
            };

            logs.unshift(newEntry);
            logs = logs.slice(0, 200);
            document.getElementById('liftWeight').value = '';
            document.getElementById('liftReps').value = '';
            // Κρατάμε το όνομα της άσκησης στο input γιατί συνήθως κάνουμε πολλαπλά σετ

            this.saveAndRender(logs);
        },

        deleteSet: function(id) {
            if (confirm('Διαγραφή αυτού του σετ;')) {
                let logs = (window.PegasusMobileSafe?.safeReadStorage(LIFTING_DATA_KEY, [], { repairOnFailure: true })) || [];
                logs = logs.filter(l => l.id !== id);
                this.saveAndRender(logs);
            }
        },

        saveAndRender: function(data) {
            localStorage.setItem(LIFTING_DATA_KEY, JSON.stringify(data));
            window.renderLiftingContent();

            // ☁️ REAL-TIME CLOUD TRIGGER
            if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') {
                window.PegasusCloud.push(true);
            }
        }
    };

    function injectViewLayer() {
        if (document.getElementById('lifting')) return;
        const viewDiv = document.createElement('div');
        viewDiv.id = 'lifting';
        viewDiv.className = 'view';

        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div class="section-title">ΠΡΟΟΔΕΥΤΙΚΗ ΥΠΕΡΦΟΡΤΩΣΗ</div>

            <div class="mini-card" style="background: rgba(15,15,15,0.95); padding: 20px; border: 1px solid var(--main); box-shadow: 0 0 15px rgba(0,255,65,0.1);">
                <input type="text" id="liftName" placeholder="Άσκηση (π.χ. ΠΙΕΣΕΙΣ ΣΤΗΘΟΥΣ)" style="border: 2px solid #444; margin-bottom: 15px; text-transform: uppercase;">
                <div class="compact-grid" style="margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 10px; color: #777; font-weight: 800; margin-bottom: 5px;">ΚΙΛΑ (KG)</div>
                        <input type="number" id="liftWeight" placeholder="0.0" inputmode="decimal" style="border: 2px solid #444; font-size: 20px; font-weight: 900; text-align: center;">
                    </div>
                    <div>
                        <div style="font-size: 10px; color: #777; font-weight: 800; margin-bottom: 5px;">ΕΠΑΝΑΛΗΨΕΙΣ</div>
                        <input type="number" id="liftReps" placeholder="0" inputmode="numeric" style="border: 2px solid #444; font-size: 20px; font-weight: 900; text-align: center;">
                    </div>
                </div>
                <button class="primary-btn" onclick="window.PegasusLifting.addSet()" style="font-size: 14px; padding: 15px;">+ ΚΑΤΑΓΡΑΦΗ ΣΕΤ</button>
            </div>

            <div class="section-title" style="margin-top: 25px; color: var(--main);">🔥 ΣΗΜΕΡΙΝΗ ΠΡΟΠΟΝΗΣΗ</div>
            <div id="lift-today" style="width: 100%; display: flex; flex-direction: column; gap: 8px; margin-bottom: 25px;"></div>

            <div class="section-title" style="color: #555;">📊 ΠΡΟΗΓΟΥΜΕΝΕΣ ΕΠΙΔΟΣΕΙΣ</div>
            <div id="lift-history" style="width: 100%; display: flex; flex-direction: column; gap: 8px; padding-bottom: 80px;"></div>
        `;
        document.body.appendChild(viewDiv);
    }

    window.renderLiftingContent = function() {
        const todayContainer = document.getElementById('lift-today');
        const historyContainer = document.getElementById('lift-history');
        if (!todayContainer || !historyContainer) return;

        const logs = (window.PegasusMobileSafe?.safeReadStorage(LIFTING_DATA_KEY, [], { repairOnFailure: true })) || [];
        const todayStr = getPegasusLiftingDateStr();

        let todayHtml = '';
        let historyHtml = '';

        // Dictionary για να βρούμε την καλύτερη/τελευταία επίδοση ανά άσκηση στο παρελθόν
        let bestLifts = {};

        logs.forEach(log => {
            if (log.date === todayStr) {
                // RENDER: TODAY'S SETS
                todayHtml += `
                    <div class="mini-card" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-left: 3px solid var(--main);">
                        <div style="flex: 1;">
                            <div style="font-size: 13px; font-weight: 900; color: #fff;">${(window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? "")))(log.exercise)}</div>
                        </div>
                        <div style="font-size: 16px; font-weight: 900; color: var(--main); margin-right: 15px;">
                            ${log.weight}kg <span style="color:#777; font-size:12px;">x</span> ${log.reps}
                        </div>
                        <button onclick="window.PegasusLifting.deleteSet('${log.id}')" 
                                style="background: transparent; border: none; color: #ff4444; font-size: 14px; cursor: pointer;">🗑️</button>
                    </div>
                `;
            } else {
                // RENDER: HISTORY (Κρατάμε το πιο βαρύ σετ ανά άσκηση)
                if (!bestLifts[log.exercise]) {
                    bestLifts[log.exercise] = log;
                } else if (log.weight > bestLifts[log.exercise].weight) {
                    bestLifts[log.exercise] = log;
                }
            }
        });

        // Δημιουργία HTML για το Ιστορικό
        Object.values(bestLifts).forEach(pr => {
            historyHtml += `
                <div class="mini-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-color: #222; background: rgba(20,20,20,0.8);">
                    <div>
                        <div style="font-size: 12px; font-weight: 900; color: #aaa; margin-bottom: 2px;">${(window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? "")))(pr.exercise)}</div>
                        <div style="font-size: 9px; color: #555;">Τελευταίο Ρεκόρ: ${(window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? "")))(pr.date)}</div>
                    </div>
                    <div style="font-size: 14px; font-weight: 900; color: #fff;">
                        ${pr.weight}kg <span style="color:#777; font-size:10px;">x</span> ${pr.reps}
                    </div>
                </div>
            `;
        });

        todayContainer.innerHTML = todayHtml || '<div style="color:#555; font-size:11px; text-align:center;">ΚΑΝΕΝΑ ΣΕΤ ΣΗΜΕΡΑ</div>';
        historyContainer.innerHTML = historyHtml || '<div style="color:#333; font-size:11px; text-align:center;">ΚΑΝΕΝΑ ΙΣΤΟΡΙΚΟ ΔΕΔΟΜΕΝΟ</div>';
    };

    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer();
        window.renderLiftingContent();

        if (window.registerPegasusModule) {
            window.registerPegasusModule({
                id: 'lifting',
                label: 'Βάρη',
                icon: '🏋️‍♂️'
            });
        }
    });
})();
