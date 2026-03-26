/* ==========================================================================
   PEGASUS SETTINGS ENGINE - v5.1 (CUMULATIVE & DYNAMIC UI)
   Protocol: Strict Data Analyst - Full Screenshot Restoration (085945)
   ========================================================================== */

const PegasusSettings = (function() {
    // 1. ΣΤΑΘΕΡΕΣ & ΠΡΟΕΠΙΛΟΓΕΣ (Base Profile: 1.87m, 74kg, 38y)
    const DEFAULTS = {
        weight: 74, height: 187, age: 38, gender: 'male',
        kcal: 2672, prot: 160, ex: 45, rest: 60,
        targets: { "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0 }
    };

    // 2. RENDERING ENGINE (Ανακατασκευή UI βάσει Screenshot)
    const renderUI = () => {
        const panel = document.getElementById("settingsPanel");
        if (!panel) return;

        // Φόρτωση τρεχουσών τιμών
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
            <h3 style="text-align: center; color: #4CAF50; border-bottom: 1px solid #4CAF50; padding-bottom: 10px; margin-bottom: 15px; letter-spacing: 2px;">ΡΥΘΜΙΣΕΙΣ PEGASUS</h3>
            
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <div class="s-row"><span>Βάρος (kg)</span><input type="number" id="inp_w" value="${s.w}"></div>
                <div class="s-row"><span>Ύψος (cm)</span><input type="number" id="inp_h" value="${s.h}"></div>
                <div class="s-row"><span>Ηλικία</span><input type="number" id="inp_a" value="${s.a}"></div>
                <div class="s-row"><span>Φύλο</span>
                    <select id="inp_g">
                        <option value="male" ${s.g === 'male' ? 'selected' : ''}>Άνδρας</option>
                        <option value="female" ${s.g === 'female' ? 'selected' : ''}>Γυναίκα</option>
                    </select>
                </div>

                <hr style="border:0; border-top:1px solid #333; margin: 10px 0;">

                <div class="s-row"><span style="color:#4CAF50; font-weight:bold;">Στόχος Kcal</span><input type="number" id="inp_k" value="${s.k}" style="border-color:#4CAF50;"></div>
                <div class="s-row"><span style="color:#4CAF50; font-weight:bold;">Πρωτεΐνη (g)</span><input type="number" id="inp_p" value="${s.p}" style="border-color:#4CAF50;"></div>
                <div class="s-row"><span style="color:#888;">Άσκηση (s)</span><input type="number" id="inp_ex" value="${s.ex}"></div>
                <div class="s-row"><span style="color:#888;">Διάλειμμα (s)</span><input type="number" id="inp_re" value="${s.re}"></div>

                <div style="margin-top: 10px; background: rgba(76, 175, 80, 0.05); border: 1px solid #222; border-radius: 8px; padding: 10px;">
                    <p style="color: #4CAF50; font-size: 11px; font-weight: bold; margin-bottom: 10px; text-align: center; letter-spacing: 1px;">WEEKLY SET TARGETS</p>
                    <div id="m_targets" style="display: flex; flex-direction: column; gap: 5px;">
                        ${Object.keys(DEFAULTS.targets).map(m => `
                            <div class="s-row" style="background:none; padding:0;">
                                <span style="font-size: 12px; color: #eee;">${m}</span>
                                <input type="number" class="t-inp" data-m="${m}" value="${localStorage.getItem('target_'+m) || 0}" style="width: 50px; background: #000; border: 1px solid #444; color: #4CAF50; text-align: center; border-radius: 4px;">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button id="btnSaveSet" class="p-btn" style="width: 100%; margin-top: 15px; background: #4CAF50; color: #000; font-weight: bold; height: 40px; border-radius: 8px;">ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>
        `;

        document.getElementById("btnSaveSet").onclick = save;
    };

    // 3. STORAGE PROTOCOL (NaN Guard Included)
    const save = () => {
        const getValue = (id) => document.getElementById(id).value;
        
        localStorage.setItem("pegasus_weight", getValue("inp_w"));
        localStorage.setItem("pegasus_height", getValue("inp_h"));
        localStorage.setItem("pegasus_age", getValue("inp_a"));
        localStorage.setItem("pegasus_gender", getValue("inp_g"));
        localStorage.setItem("pegasus_goal_kcal", getValue("inp_k"));
        localStorage.setItem("pegasus_goal_protein", getValue("inp_p"));
        localStorage.setItem("pegasus_ex_time", getValue("inp_ex"));
        localStorage.setItem("pegasus_rest_time", getValue("inp_re"));

        document.querySelectorAll(".t-inp").forEach(input => {
            localStorage.setItem(`target_${input.dataset.m}`, input.value);
        });

        if (window.PegasusCloud) window.PegasusCloud.push(true);
        
        alert("PEGASUS: Ρυθμίσεις Αποθηκεύτηκαν!");
        location.reload();
    };

    return {
        open: () => {
            document.querySelectorAll('.pegasus-panel').forEach(p => p.style.display = 'none');
            const p = document.getElementById("settingsPanel");
            if (p) { p.style.display = "block"; renderUI(); }
        },
        init: () => {
            const btn = document.getElementById("btnSettingsUI");
            if (btn) btn.onclick = PegasusSettings.open;
        }
    };
})();

// GLOBAL ACCESS
window.addEventListener('DOMContentLoaded', PegasusSettings.init);
window.openSettings = PegasusSettings.open;
