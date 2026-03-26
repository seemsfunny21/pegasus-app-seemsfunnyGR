/* ==========================================================================
   PEGASUS SETTINGS ENGINE - v5.2 (STRICT UI & DATA AUDIT)
   Protocol: Cumulative Restoration - Hardcoded Biometric Defaults
   ========================================================================== */

const PegasusSettings = (function() {
    
    // 1. HARDCODED DEFAULTS (Strict Data Analyst Protocol)
    const DEFAULTS = {
        weight: 74, height: 187, age: 38, gender: 'male',
        kcal: 2672, prot: 160, ex: 45, rest: 60,
        targets: { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 }
    };

    // 2. RENDERING ENGINE (Matches Screenshot 085945)
    const render = () => {
        const panel = document.getElementById("settingsPanel");
        if (!panel) return;

        const s = {
            w: localStorage.getItem("pegasus_weight") || DEFAULTS.weight,
            h: localStorage.getItem("pegasus_height") || DEFAULTS.height,
            a: localStorage.getItem("pegasus_age") || DEFAULTS.age,
            g: localStorage.getItem("pegasus_gender") || DEFAULTS.gender,
            k: localStorage.getItem("pegasus_goal_kcal") || DEFAULTS.kcal,
            p: localStorage.getItem("pegasus_goal_protein") || DEFAULTS.prot,
            ex: localStorage.getItem("pegasus_ex_time") || DEFAULTS.ex,
            re: localStorage.getItem("pegasus_rest_time") || DEFAULTS.rest
        };

        panel.innerHTML = `
            <h3 style="text-align: center; color: #4CAF50; border-bottom: 1px solid #4CAF50; padding-bottom: 10px; margin-bottom: 15px;">ΡΥΘΜΙΣΕΙΣ PEGASUS</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div class="s-row"><span>Βάρος (kg)</span><input type="number" id="set_w" value="${s.w}"></div>
                <div class="s-row"><span>Ύψος (cm)</span><input type="number" id="set_h" value="${s.h}"></div>
                <div class="s-row"><span>Ηλικία</span><input type="number" id="set_a" value="${s.a}"></div>
                <div class="s-row"><span>Φύλο</span>
                    <select id="set_g">
                        <option value="male" ${s.g === 'male' ? 'selected' : ''}>Άνδρας</option>
                        <option value="female" ${s.g === 'female' ? 'selected' : ''}>Γυναίκα</option>
                    </select>
                </div>
                <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                <div class="s-row"><span style="color:#4CAF50;">Στόχος Kcal</span><input type="number" id="set_k" value="${s.k}"></div>
                <div class="s-row"><span style="color:#4CAF50;">Πρωτεΐνη (g)</span><input type="number" id="set_p" value="${s.p}"></div>
                <div class="s-row"><span>Άσκηση (s)</span><input type="number" id="set_ex" value="${s.ex}"></div>
                <div class="s-row"><span>Διάλειμμα (s)</span><input type="number" id="set_re" value="${s.re}"></div>
                
                <div style="margin-top: 10px; background: rgba(76, 175, 80, 0.05); border: 1px solid #222; border-radius: 8px; padding: 10px;">
                    <p style="color: #4CAF50; font-size: 11px; font-weight: bold; margin-bottom: 10px; text-align: center;">WEEKLY SET TARGETS</p>
                    <div id="targetsGrid">
                        ${Object.keys(DEFAULTS.targets).map(m => `
                            <div class="s-row" style="background:none;">
                                <span style="font-size: 12px;">${m}</span>
                                <input type="number" class="t-input" data-m="${m}" value="${localStorage.getItem('target_'+m) || DEFAULTS.targets[m]}" style="width:50px;">
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button id="btnSaveSetInternal" class="p-btn" style="width: 100%; margin-top: 15px; background: #4CAF50; color: #000; font-weight: bold;">ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>
        `;

        document.getElementById("btnSaveSetInternal").onclick = save;
    };

    // 3. SAVE LOGIC
    const save = () => {
        localStorage.setItem("pegasus_weight", document.getElementById("set_w").value);
        localStorage.setItem("pegasus_height", document.getElementById("set_h").value);
        localStorage.setItem("pegasus_age", document.getElementById("set_a").value);
        localStorage.setItem("pegasus_gender", document.getElementById("set_g").value);
        localStorage.setItem("pegasus_goal_kcal", document.getElementById("set_k").value);
        localStorage.setItem("pegasus_goal_protein", document.getElementById("set_p").value);
        localStorage.setItem("pegasus_ex_time", document.getElementById("set_ex").value);
        localStorage.setItem("pegasus_rest_time", document.getElementById("set_re").value);

        document.querySelectorAll(".t-input").forEach(i => {
            localStorage.setItem(`target_${i.dataset.m}`, i.value);
        });

        alert("PEGASUS: Ρυθμίσεις Αποθηκεύτηκαν!");
        location.reload();
    };

    return {
        open: () => {
            document.querySelectorAll('.pegasus-panel').forEach(p => p.style.display = 'none');
            const panel = document.getElementById("settingsPanel");
            if (panel) {
                panel.style.display = "block";
                render(); // ΚΡΙΣΙΜΟ: Σχεδίαση κατά το άνοιγμα
            }
        }
    };
})();

// GLOBAL EXPOSURE
window.openSettings = PegasusSettings.open;
