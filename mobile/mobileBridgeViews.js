/* ==========================================================================
   PEGASUS MOBILE BRIDGE VIEWS - v19.3
   Protocol: Mobile-only UI surfaces for shared bridge intelligence.
   Scope: lifting autofill, diet context, preview context, supplies bridge box.
   Status: TARGETED FEATURE LAYER | SEPARATE MOBILE FILE
   ========================================================================== */

(function () {
    function esc(value) {
        if (window.PegasusMobileSafe?.escapeHtml) return window.PegasusMobileSafe.escapeHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function ensureNode(parent, id, beforeNode = null) {
        let node = document.getElementById(id);
        if (node) return node;
        node = document.createElement('div');
        node.id = id;
        if (beforeNode) parent.insertBefore(node, beforeNode); else parent.appendChild(node);
        return node;
    }

    function formatSeconds(sec) {
        const total = Math.max(0, Math.round(Number(sec || 0)));
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function renderLiftingBridge() {
        const input = document.getElementById('liftName');
        if (!input || !window.PegasusBridgeHub) return;
        const parentCard = input.closest('.mini-card') || input.parentElement;
        if (!parentCard) return;
        const weightInput = document.getElementById('liftWeight');
        const helper = ensureNode(parentCard, 'liftingBridgeHint');
        helper.style.cssText = 'margin-top:10px; padding:10px 12px; border:1px dashed rgba(0,255,65,0.35); border-radius:12px; background:rgba(0,255,65,0.04); font-size:11px; color:var(--main); font-weight:800; letter-spacing:0.5px;';

        const suggestion = window.PegasusBridgeHub.getExerciseWeightBridge(input.value);
        if (!input.value.trim()) {
            helper.textContent = 'BRIDGE: ΓΡΑΨΕ ΑΣΚΗΣΗ ΚΑΙ ΤΟ PEGASUS ΘΑ ΤΡΑΒΗΞΕΙ ΤΑ ΤΕΛΕΥΤΑΙΑ ΚΙΛΑ ΑΠΟ DESKTOP / HISTORY.';
            return;
        }

        if (!suggestion || isNaN(suggestion.value)) {
            helper.textContent = 'BRIDGE: ΔΕΝ ΒΡΕΘΗΚΑΝ ΑΠΟΘΗΚΕΥΜΕΝΑ ΚΙΛΑ ΓΙΑ ΑΥΤΗ ΤΗΝ ΑΣΚΗΣΗ.';
            return;
        }

        if (weightInput && !String(weightInput.value || '').trim()) {
            window.PegasusBridgeHub.prefillMobileLiftingWeight(input.value, { force: false });
        }

        helper.textContent = `BRIDGE: ${suggestion.source === 'desktop' ? 'DESKTOP' : 'ΙΣΤΟΡΙΚΟ ΒΑΡΩΝ'} → ${suggestion.matchedName} · ${suggestion.value}kg`;
    }

    function attachLiftingListeners() {
        const input = document.getElementById('liftName');
        if (!input || input.dataset.bridgeBound === 'true') return;
        input.dataset.bridgeBound = 'true';
        ['input', 'change', 'blur'].forEach(evt => input.addEventListener(evt, () => {
            setTimeout(renderLiftingBridge, 20);
        }));
    }

    function renderDietBridge() {
        const dietView = document.getElementById('diet');
        if (!dietView || !window.PegasusBridgeHub) return;
        const advisorBtn = dietView.querySelector('.secondary-btn');
        const box = ensureNode(dietView, 'mobileDietBridgeBox', advisorBtn ? advisorBtn.nextSibling : null);
        box.className = 'mini-card';
        box.style.cssText = 'margin: 12px 0 16px 0; padding: 14px; border-color: var(--main); background: rgba(0,255,65,0.05);';

        const state = window.PegasusBridgeHub.getDietBridgeStatus();
        const n = state.nutrition;
        const c = state.cardio;
        box.innerHTML = `
            <div style="font-size:10px; color:var(--main); font-weight:900; letter-spacing:1px; margin-bottom:8px;">BRIDGE · ΠΡΟΠΟΝΗΣΗ / ΔΙΑΤΡΟΦΗ</div>
            <div style="font-size:12px; color:#fff; font-weight:800; line-height:1.45; margin-bottom:10px;">${esc(state.headline)}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11px;">
                <div style="padding:10px; border:1px solid #173b1c; border-radius:10px; background:rgba(255,255,255,0.02);">
                    <div style="color:#777; font-weight:800; margin-bottom:4px;">ΥΠΟΛΕΙΠΟ ΚCAL</div>
                    <div style="color:#fff; font-weight:900;">${n.remainingKcal}</div>
                </div>
                <div style="padding:10px; border:1px solid #173b1c; border-radius:10px; background:rgba(255,255,255,0.02);">
                    <div style="color:#777; font-weight:800; margin-bottom:4px;">ΥΠΟΛΕΙΠΟ ΠΡΩΤΕΙΝΗΣ</div>
                    <div style="color:#fff; font-weight:900;">${n.remainingProtein}g</div>
                </div>
            </div>
            <div style="margin-top:10px; font-size:11px; color:#9adf9e; font-weight:700;">ΚΑΡΔΙΟ ΣΗΜΕΡΑ: ${c.km}km · ${Math.round(c.kcal)} kcal</div>
        `;
    }

    function renderPreviewBridge() {
        const previewView = document.getElementById('preview');
        const anchor = document.getElementById('muscle-container');
        if (!previewView || !anchor || !window.PegasusBridgeHub) return;

        const workoutBox = ensureNode(previewView, 'mobilePreviewWorkoutBridgeBox');
        const bodyBox = ensureNode(previewView, 'mobilePreviewBodyBridgeBox');
        workoutBox.className = 'mini-card';
        bodyBox.className = 'mini-card';
        workoutBox.style.cssText = 'margin-top:15px; padding:16px; border-color: var(--main); background: rgba(0,255,65,0.05);';
        bodyBox.style.cssText = 'margin-top:12px; padding:16px; border-color: var(--main); background: rgba(0,255,65,0.04);';

        const workout = window.PegasusBridgeHub.getWorkoutContext();
        const body = window.PegasusBridgeHub.getBodyContext();
        const cardio = window.PegasusBridgeHub.getTodayCardioContext();
        const planLines = workout.plan.slice(0, 6).map(item => `
            <div style="display:flex; justify-content:space-between; gap:10px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                <span style="color:#fff; font-size:11px; font-weight:800;">${esc(item.name)}</span>
                <span style="color:var(--main); font-size:11px; font-weight:900;">${item.savedWeight ? `${item.savedWeight}kg` : '--'}</span>
            </div>
        `).join('');

        workoutBox.innerHTML = `
            <div style="font-size:10px; color:var(--main); font-weight:900; letter-spacing:1px; margin-bottom:8px;">BRIDGE · DESKTOP ΠΡΟΓΡΑΜΜΑ / ΚΙΛΑ</div>
            <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:8px;">
                <div style="font-size:12px; color:#fff; font-weight:900;">ΣΗΜΕΡΑ: ${esc(workout.todayDayName)}</div>
                <div style="font-size:11px; color:#9adf9e; font-weight:800;">${workout.completedToday ? 'ΟΛΟΚΛΗΡΩΜΕΝΟ' : (workout.hasRemainingWork ? `${workout.remainingSetsCount} σετ υπολοιπο` : 'χωρις runtime υπολοιπο')}</div>
            </div>
            <div style="font-size:11px; color:#aaa; margin-bottom:8px;">ΧΡΟΝΟΣ ΥΠΟΛΟΙΠΟΥ: ${formatSeconds(workout.remainingSeconds)} · SESSION KCAL: ${Math.round(workout.sessionKcal || 0)}</div>
            <div style="font-size:11px; color:#777; font-weight:800; margin-bottom:6px;">ΣΗΜΕΡΙΝΑ ΑΠΟΘΗΚΕΥΜΕΝΑ ΚΙΛΑ ΑΣΚΗΣΕΩΝ</div>
            <div>${planLines || '<div style="color:#555; font-size:11px;">ΔΕΝ ΥΠΑΡΧΟΥΝ ΑΣΚΗΣΕΙΣ ΓΙΑ ΣΗΜΕΡΑ.</div>'}</div>
        `;

        const bioText = body.latestBio
            ? `ΥΠΝΟΣ ${Number(body.latestBio.sleep || 0)}/10 · ΕΝΕΡΓΕΙΑ ${Number(body.latestBio.energy || 0)}/10 · ΑΝΑΡΡΩΣΗ ${Number(body.latestBio.recovery || 0)}/10`
            : 'ΔΕΝ ΥΠΑΡΧΕΙ ΣΗΜΕΡΙΝΗ / ΤΕΛΕΥΤΑΙΑ ΒΙΟΜΕΤΡΙΚΗ ΚΑΤΑΓΡΑΦΗ.';

        bodyBox.innerHTML = `
            <div style="font-size:10px; color:var(--main); font-weight:900; letter-spacing:1px; margin-bottom:8px;">BRIDGE · ΣΩΜΑ / ΑΝΑΡΡΩΣΗ / CARDIO</div>
            <div style="font-size:12px; color:#fff; font-weight:900; margin-bottom:6px;">ΒΑΡΟΣ: ${body.currentWeight || '--'}kg · M.O. 7ΗΜ: ${body.averageWeight || '--'}kg</div>
            <div style="font-size:11px; color:#aaa; margin-bottom:6px;">${esc(bioText)}</div>
            <div style="font-size:11px; color:#9adf9e; margin-bottom:6px;">ΚΑΡΔΙΟ ΣΗΜΕΡΑ: ${cardio.km}km · ${Math.round(cardio.kcal)} kcal</div>
            <div style="font-size:11px; color:#fff; font-weight:800;">ΟΔΗΓΙΑ: ${esc(body.guidance || cardio.nextDayGuidance)}</div>
        `;
    }

    function renderSuppsBridge() {
        const suppsView = document.getElementById('supps');
        if (!suppsView || !window.PegasusBridgeHub) return;
        const box = ensureNode(suppsView, 'mobileSuppsBridgeBox');
        box.className = 'mini-card';
        box.style.cssText = 'margin-top:14px; padding:16px; border-color: var(--main); background: rgba(0,255,65,0.05);';

        const supplies = window.PegasusBridgeHub.getSupplyContext();
        const alertLines = supplies.alerts.map(item => `<div style="color:#ffb74d; font-weight:800; font-size:11px; margin-top:6px;">• ${esc(item.title)}</div>`).join('');
        box.innerHTML = `
            <div style="font-size:10px; color:var(--main); font-weight:900; letter-spacing:1px; margin-bottom:8px;">BRIDGE · SUPPLEMENTS / STOCK / MISSIONS</div>
            <div style="font-size:11px; color:#fff; line-height:1.5;">
                ΣΗΜΕΡΙΝΗ ΚΑΤΑΝΑΛΩΣΗ: WHEY ${supplies.wheyHits}x · ΚΡΕΑΤΙΝΗ ${supplies.creatineHits}x
            </div>
            <div style="font-size:11px; color:#9adf9e; line-height:1.5; margin-top:6px;">
                ΑΠΟΘΕΜΑ: ${Math.round(supplies.inventory?.prot || 0)}g WHEY · ${Math.round(supplies.inventory?.crea || 0)}g CREA
            </div>
            ${alertLines || '<div style="color:#777; font-size:11px; margin-top:6px;">ΧΩΡΙΣ ΕΝΕΡΓΕΣ ΥΠΕΝΘΥΜΙΣΕΙΣ ΑΠΟΘΕΜΑΤΟΣ.</div>'}
        `;
    }

    function renderAll() {
        renderLiftingBridge();
        renderDietBridge();
        renderPreviewBridge();
        renderSuppsBridge();
    }

    function patchOpenView() {
        if (typeof window.openView !== 'function' || window.openView.__pegasusBridgeWrapped) return;
        const original = window.openView;
        window.openView = function patchedOpenView() {
            const result = original.apply(this, arguments);
            setTimeout(renderAll, 60);
            return result;
        };
        window.openView.__pegasusBridgeWrapped = true;
    }

    function boot() {
        attachLiftingListeners();
        patchOpenView();
        renderAll();
    }

    window.addEventListener('pegasus:bridge:update', () => {
        setTimeout(boot, 40);
    });

    document.addEventListener('DOMContentLoaded', () => {
        boot();
        setTimeout(boot, 250);
        setTimeout(boot, 1200);
    }, { once: true });

    console.log('📲 PEGASUS MOBILE BRIDGE VIEWS: Active.');
})();
