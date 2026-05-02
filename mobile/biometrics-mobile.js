/* ==========================================================================
   🧬 PEGASUS MODULE: BIO-METRICS & RECOVERY TRACKER (v1.2)
   Protocol: Daily Tri-Metric Heatmap & Cloud Sync
   Status: MEMORY PROTECTED | SYNTAX VERIFIED
   ========================================================================== */

(function() {
    const BIO_DATA_KEY = 'pegasus_biometrics_v1';

    // 1. Μηχανή Δεδομένων
    window.PegasusBio = {
        setMetric: function(id, metricType, value) {
            let entries = JSON.parse(localStorage.getItem(BIO_DATA_KEY)) || [];
            const idx = entries.findIndex(e => e.id === id);
            if (idx === -1) return;

            entries[idx][metricType] = value;
            this.saveAndRender(entries);
        },

        addNewEntry: function() {
            let entries = JSON.parse(localStorage.getItem(BIO_DATA_KEY)) || [];
            const today = new Date().toLocaleDateString('el-GR');

            // Έλεγχος αν υπάρχει ήδη εγγραφή για σήμερα
            if (entries.some(e => e.date === today)) {
                alert('Υπάρχει ήδη καταγραφή για σήμερα. Μπορείς να την επεξεργαστείς.');
                return;
            }

            const newEntry = {
                id: 'bio_' + Date.now(),
                date: today,
                sleep: 0,
                energy: 0,
                recovery: 0
            };

            entries.unshift(newEntry);
            this.saveAndRender(entries);
        },

        deleteEntry: function(id) {
            if(confirm('Διαγραφή της βιομετρικής καταγραφής;')) {
                let entries = JSON.parse(localStorage.getItem(BIO_DATA_KEY)) || [];
                entries = entries.filter(e => e.id !== id);
                this.saveAndRender(entries);
            }
        },

        saveAndRender: function(data) {
            // 🛡️ MEMORY CAP: Αποτροπή QuotaExceededError (Κρατάει τις τελευταίες 100 εγγραφές)
            if (Array.isArray(data)) {
                data = data.slice(0, 100);
            }

            localStorage.setItem(BIO_DATA_KEY, JSON.stringify(data));
            window.renderBioContent();

            // ☁️ REAL-TIME CLOUD TRIGGER (Immediate Sync)
            if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') {
                window.PegasusCloud.push(true);
            }
        }
    };

    // 2. Κατασκευαστής Οθόνης (View Injector)
    function injectViewLayer() {
        if (document.getElementById('biometrics')) return;
        const viewDiv = document.createElement('div');
        viewDiv.id = 'biometrics';
        viewDiv.className = 'view';

        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <button class="primary-btn" style="width: auto; margin: 0; padding: 5px 10px; font-size: 10px; border-radius: 8px;" onclick="window.PegasusBio.addNewEntry()">
                    + ΣΗΜΕΡΙΝΗ ΜΕΤΡΗΣΗ
                </button>
            </div>
            <div id="bio-content" style="width: 100%; display: flex; flex-direction: column; gap: 15px; padding-bottom: 80px;"></div>
        `;
        document.body.appendChild(viewDiv);
    }

    // 3. Rendering Engine & Nexus Data Correlation
    window.renderBioContent = function() {
        const container = document.getElementById('bio-content');
        if (!container) return;

        const entries = JSON.parse(localStorage.getItem(BIO_DATA_KEY)) || [];
        let html = '';

        // --- 🧠 PEGASUS NEXUS: Cross-Data Correlation ---
        try {
            const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
            const targets = { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };

            let currentLoad = 0;
            let totalCapacity = 116;

            Object.keys(targets).forEach(k => { currentLoad += (history[k] || 0); });
            let strainPct = Math.min(100, Math.round((currentLoad / totalCapacity) * 100));

            let sleepSum = 0;
            let days = Math.min(3, entries.length);
            for(let i=0; i<days; i++) sleepSum += entries[i].sleep;
            let avgSleep = days > 0 ? (sleepSum / days).toFixed(1) : 0;

            if (days > 0) {
                let color = "var(--main)";
                let msg = "ΒΕΛΤΙΣΤΗ ΑΝΑΛΟΓΙΑ ΠΡΟΠΟΝΗΣΗΣ / ΑΠΟΘΕΡΑΠΕΙΑΣ.";

                if (strainPct > 65 && avgSleep < 6) {
                    color = "#ff4444";
                    msg = "🚨 ΚΡΙΣΙΜΟ: Υψηλό μυϊκό φορτίο με κακή ποιότητα ύπνου. Αυξημένος κίνδυνος τραυματισμού.";
                } else if (strainPct < 30 && avgSleep >= 7) {
                    color = "#00bcd4";
                    msg = "⚡ ΠΛΗΡΗΣ ΑΝΑΡΡΩΣΗ: Το ΚΝΣ είναι έτοιμο για μέγιστη υπερφόρτωση.";
                }

                html += `
                    <div class="mini-card" style="border: 1px solid ${color}; background: rgba(15,15,15,0.95); margin-bottom: 25px;">
                        <div style="font-size: 10px; color: ${color}; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px;">🧠 PEGASUS NEXUS INSIGHT</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px; color: #fff; font-weight: 900;">
                            <div>ΜΥΪΚΗ ΚΟΠΩΣΗ: <span style="color:#ffbb33;">${strainPct}%</span></div>
                            <div>M.O. ΥΠΝΟΥ: <span style="color:#00bcd4;">${avgSleep}/10</span></div>
                        </div>
                        <div style="font-size: 11px; color: #aaa; line-height: 1.5; font-weight: 600;">${msg}</div>
                    </div>
                `;
            }
        } catch (e) { console.error("Nexus Failed:", e); }

        // --- Bio-Cards Generation ---
        html += entries.map(item => {
            let totalScore = 0, divisor = 0;
            if(item.sleep > 0) { totalScore += item.sleep; divisor++; }
            if(item.energy > 0) { totalScore += item.energy; divisor++; }
            if(item.recovery > 0) { totalScore += item.recovery; divisor++; }

            let avg = divisor > 0 ? (totalScore / divisor).toFixed(1) : '0.0';
            let avgColor = avg >= 7 ? '#00ff41' : (avg >= 4 ? '#ffbb33' : '#ff4444');

            const buildScale = (metricName, currentValue, colorHex) => {
                let scaleHtml = '<div style="display: flex; gap: 4px; margin-top: 8px; margin-bottom: 12px;">';
                for (let i = 1; i <= 10; i++) {
                    let isActive = i <= currentValue;
                    let bg = isActive ? colorHex : 'rgba(255,255,255,0.03)';
                    let textCol = isActive ? '#000' : '#666';
                    scaleHtml += `
                        <div onclick="window.PegasusBio.setMetric('${item.id}', '${metricName}', ${i})"
                             style="flex: 1; height: 30px; display: flex; align-items: center; justify-content: center;
                                    background: ${bg}; color: ${textCol}; border: 1px solid #333; border-radius: 4px;
                                    font-weight: 900; font-size: 12px; cursor: pointer;">
                            ${i}
                        </div>`;
                }
                scaleHtml += '</div>';
                return scaleHtml;
            };

            return `
                <div class="mini-card" style="border-left: 4px solid ${avgColor}; padding: 15px; background: rgba(15,15,15,0.95);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <div>
                            <div style="font-weight: 900; font-size: 18px; color: #fff;">${item.date}</div>
                            <div style="font-size: 10px; color: ${avgColor}; font-weight: 900; margin-top: 4px;">MO ΑΠΟΔΟΣΗΣ: ${avg}/10</div>
                        </div>
                        <button onclick="window.PegasusBio.deleteEntry('${item.id}')"
                                style="background: rgba(255,68,68,0.1); border: 1px solid #ff4444; color: #ff4444; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer;">🗑️</button>
                    </div>
                    <div style="font-size: 10px; color: #00bcd4; font-weight: 900;">💤 ΠΟΙΟΤΗΤΑ ΥΠΝΟΥ</div>
                    ${buildScale('sleep', item.sleep, '#00bcd4')}
                    <div style="font-size: 10px; color: #ffbb33; font-weight: 900;">⚡ ΕΠΙΠΕΔΑ ΕΝΕΡΓΕΙΑΣ</div>
                    ${buildScale('energy', item.energy, '#ffbb33')}
                    <div style="font-size: 10px; color: #00ff41; font-weight: 900;">🛡️ ΑΠΟΘΕΡΑΠΕΙΑ (DOMS)</div>
                    ${buildScale('recovery', item.recovery, '#00ff41')}
                </div>
            `;
        }).join('');

        container.innerHTML = html || '<div style="color:#555; text-align:center; margin-top:30px;">ΚΑΜΙΑ ΚΑΤΑΓΡΑΦΗ</div>';
    };

    // 4. Boot Sequence
    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer();
        window.renderBioContent();
        if (window.registerPegasusModule) {
            window.registerPegasusModule({ id: 'biometrics', label: 'Σώμα', icon: '🧬' });
        }
    });
})();
