
(function() {
    const esc = (value) => window.PegasusMobileSafe?.escapeHtml ? window.PegasusMobileSafe.escapeHtml(value) : String(value ?? '');

    function injectViewLayer() {
        if (document.getElementById('diet_variation')) return;
        const viewDiv = document.createElement('div');
        viewDiv.id = 'diet_variation';
        viewDiv.className = 'view';
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div class="section-title">ΑΛΛΑΓΗ ΔΙΑΤΡΟΦΗΣ</div>
            <div id="dietVariationSummary"></div>
            <div class="compact-grid" style="margin-bottom:12px;">
                <button class="secondary-btn" onclick="window.PegasusDietVariationMobile.render()">ΑΝΑΝΕΩΣΗ</button>
                <button class="secondary-btn" onclick="window.PegasusDietVariationMobile.resetPrefs()">RESET ΠΡΟΤΑΣΕΩΝ</button>
            </div>
            <div id="dietVariationList" style="width:100%;"></div>
        `;
        document.body.appendChild(viewDiv);
    }

    function renderSummaryBox(analysis) {
        const overused = (analysis.overusedFoods || []).slice(0, 4).map(item =>
            `<div class="variation-summary-item variation-warn">${esc(item.name)} · ${item.count}/7</div>`
        ).join('');

        const missing = (analysis.missingCategories || []).slice(0, 4).map(item =>
            `<div class="variation-summary-item variation-good">${esc(item.label)}</div>`
        ).join('');

        return `
            <div class="variation-panel">
                <div class="variation-title">🧠 WEEKLY LOGIC</div>
                <div class="variation-subtitle">Meal slots με σωστές κατηγορίες: αυγά, γιαούρτι, whey, τοστ, φρούτο, Κούκι, βραδινό</div>
                <div class="variation-mini-section">
                    <div class="variation-mini-title">ΤΙ ΠΑΙΖΕΙ ΠΟΛΥ</div>
                    <div class="variation-chip-row">${overused || `<div class="variation-summary-item variation-neutral">Δεν βρέθηκε έντονη μονοτονία.</div>`}</div>
                </div>
                <div class="variation-mini-section">
                    <div class="variation-mini-title">ΤΙ ΛΕΙΠΕΙ</div>
                    <div class="variation-chip-row">${missing || `<div class="variation-summary-item variation-neutral">Δεν βρέθηκε έντονο κενό.</div>`}</div>
                </div>
            </div>
        `;
    }

    function renderPlanCard(plan) {
        const toneClass = plan.severity === 'green' ? 'variation-plan-green' : 'variation-plan-orange';
        const optionsHtml = (plan.options || []).map(option => {
            const optionTone = option.state === 'accepted' ? 'variation-option-accepted' : 'variation-option-candidate';
            const note = option.note ? `<div class="variation-option-note">${esc(option.note)}</div>` : '';
            return `
                <div class="variation-option ${optionTone}">
                    <div class="variation-option-name">${esc(option.name)}</div>
                    ${note}
                    <div class="variation-option-actions">
                        <button class="variation-btn variation-btn-accept" onclick="window.PegasusDietVariationMobile.acceptOption('${esc(plan.topicKey)}', '${esc(option.name)}')">ΑΠΟΔΟΧΗ</button>
                        <button class="variation-btn variation-btn-reject" onclick="window.PegasusDietVariationMobile.rejectOption('${esc(plan.topicKey)}', '${esc(option.name)}')">ΑΠΟΡΡΙΨΗ</button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="variation-plan-card ${toneClass}">
                <div class="variation-plan-header">
                    <div class="variation-plan-title">${esc(plan.title)}</div>
                    <div class="variation-plan-reason">${esc(plan.reason)}</div>
                </div>
                <div class="variation-plan-options">${optionsHtml}</div>
            </div>
        `;
    }

    window.PegasusDietVariationMobile = {
        render: function() {
            const summaryBox = document.getElementById('dietVariationSummary');
            const list = document.getElementById('dietVariationList');
            if (!summaryBox || !list || !window.PegasusDietVariationEngine) return;
            const analysis = window.PegasusDietVariationEngine.analyzeWeeklyVariation();
            summaryBox.innerHTML = renderSummaryBox(analysis);
            list.innerHTML = (analysis.variationPlans || []).length
                ? analysis.variationPlans.map(renderPlanCard).join('')
                : `<div class="variation-panel"><div class="variation-title">✅ OK</div><div class="variation-subtitle">Δεν βρέθηκαν δυνατές ανάγκες αλλαγής αυτή την εβδομάδα.</div></div>`;
        },

        acceptOption: function(topicKey, optionName) {
            window.PegasusDietVariationEngine?.updateTopicPreference?.(topicKey, optionName, 'accept');
            this.render();
        },

        rejectOption: function(topicKey, optionName) {
            window.PegasusDietVariationEngine?.updateTopicPreference?.(topicKey, optionName, 'reject');
            this.render();
        },

        resetPrefs: function() {
            try { localStorage.removeItem('pegasus_diet_variation_prefs_v3'); } catch (_) {}
            this.render();
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer();
        window.PegasusDietVariationMobile.render();
        if (window.registerPegasusModule) {
            window.registerPegasusModule({
                id: 'diet_variation',
                label: 'Αλλαγή Διατροφής',
                icon: '🔁'
            });
        }
    });
})();
