/* ==========================================================================
   PEGASUS OS - SUPPLEMENT INVENTORY GUARD (PC MODULE v1.2)
   Protocol: Hybrid Data Mapping & Real-Time Label Rendering
   Status: FINAL STABLE | FIX: LABEL SYNC & KEY REDUNDANCY
   ========================================================================== */

(function() {
    const DEFAULTS = { prot: 2500, crea: 1000 };
    const OBJECT_KEY = 'pegasus_supp_inventory';
    const LEGACY_PROT_KEY = 'pegasus_prot_stock';
    const LEGACY_CREA_KEY = 'pegasus_crea_stock';

    function safeParse(raw, fallback) {
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function normalizeStock(stock, previous = null, options = {}) {
        const now = Date.now();
        const oldProt = Number(previous?.prot);
        const oldCrea = Number(previous?.crea);
        const nextProt = Math.max(0, parseFloat(stock?.prot) || 0);
        const nextCrea = Math.max(0, parseFloat(stock?.crea) || 0);
        const protTouched = options.touchAll === true || options.touchKey === 'prot';
        const creaTouched = options.touchAll === true || options.touchKey === 'crea';
        const protChanged = protTouched || (Number.isFinite(oldProt) ? oldProt !== nextProt : false);
        const creaChanged = creaTouched || (Number.isFinite(oldCrea) ? oldCrea !== nextCrea : false);
        const baseUpdatedAt = Math.max(0, Number(stock?.updatedAt) || 0, Number(previous?.updatedAt) || 0);

        return {
            prot: nextProt,
            crea: nextCrea,
            updatedAt: protChanged || creaChanged ? now : baseUpdatedAt,
            protUpdatedAt: protChanged
                ? now
                : Math.max(0, Number(stock?.protUpdatedAt) || 0, Number(previous?.protUpdatedAt) || 0, baseUpdatedAt),
            creaUpdatedAt: creaChanged
                ? now
                : Math.max(0, Number(stock?.creaUpdatedAt) || 0, Number(previous?.creaUpdatedAt) || 0, baseUpdatedAt),
            syncVersion: 2
        };
    }

    function persistLegacyKeys(stock) {
        localStorage.setItem(LEGACY_PROT_KEY, String(stock.prot));
        localStorage.setItem(LEGACY_CREA_KEY, String(stock.crea));
    }

    function ensureStockObject() {
        let stock = safeParse(localStorage.getItem(OBJECT_KEY), null);

        if (!stock) {
            const p = parseFloat(localStorage.getItem(LEGACY_PROT_KEY));
            const c = parseFloat(localStorage.getItem(LEGACY_CREA_KEY));

            stock = {
                prot: !isNaN(p) ? p : DEFAULTS.prot,
                crea: !isNaN(c) ? c : DEFAULTS.crea
            };
        }

        stock = normalizeStock(stock, safeParse(localStorage.getItem(OBJECT_KEY), null), { touchAll: false });
        localStorage.setItem(OBJECT_KEY, JSON.stringify(stock));
        persistLegacyKeys(stock);
        return stock;
    }

    function updateInventoryBars(stock) {
        const protBar = document.getElementById('protBarPC');
        const creaBar = document.getElementById('creaBarPC');
        const protVal = document.getElementById('pcProtValue');
        const creaVal = document.getElementById('pcCreaValue');

        if (protBar) protBar.style.width = Math.max(0, Math.min(100, (stock.prot / DEFAULTS.prot) * 100)) + '%';
        if (creaBar) creaBar.style.width = Math.max(0, Math.min(100, (stock.crea / DEFAULTS.crea) * 100)) + '%';

        if (protVal) protVal.textContent = `${Math.round(stock.prot)} / ${DEFAULTS.prot}g`;
        if (creaVal) creaVal.textContent = `${Math.round(stock.crea)} / ${DEFAULTS.crea}g`;

        console.log(`📊 INVENTORY STATUS: Prot: ${stock.prot}g | Crea: ${stock.crea}g`);
    }

    const baseInventoryPC = window.PegasusInventoryPC || {};

    window.PegasusInventoryPC = {
        ...baseInventoryPC,

        defaults: DEFAULTS,

        getStock: function() {
            return ensureStockObject();
        },

        setStock: function(stock, options = {}) {
            const previous = safeParse(localStorage.getItem(OBJECT_KEY), null);
            const normalized = normalizeStock(stock, previous, options);
            localStorage.setItem(OBJECT_KEY, JSON.stringify(normalized));
            persistLegacyKeys(normalized);
            return normalized;
        },

        processEntry: function(name) {
            // Χρησιμοποιούμε πρώτα το core logic από inventoryHandler.js
            if (typeof baseInventoryPC.processEntry === "function") {
                const result = baseInventoryPC.processEntry(name);

                // Μετά το core process, κρατάμε συγχρονισμένα τα legacy keys + UI
                const stock = ensureStockObject();
                updateInventoryBars(stock);
                return result;
            }

            // Fallback μόνο αν για κάποιο λόγο δεν υπάρχει core handler
            const stock = ensureStockObject();
            const cleanName = String(name || "").toLowerCase();
            let changed = false;

            if (
                cleanName.includes("whey") ||
                cleanName.includes("πρωτεΐνη") ||
                cleanName.includes("πρωτεινη")
            ) {
                stock.prot = Math.max(0, stock.prot - 30);
                changed = true;
                console.log("🥤 INVENTORY GUARD: Whey consumed (-30g).");
            }

            if (
                cleanName.includes("κρεατίνη") ||
                cleanName.includes("κρεατινη") ||
                cleanName.includes("creatine")
            ) {
                stock.crea = Math.max(0, stock.crea - 5);
                changed = true;
                console.log("💊 INVENTORY GUARD: Creatine consumed (-5g).");
            }

            if (changed) {
                this.setStock(stock);
                this.updateUI();
                if (window.PegasusCloud?.push) window.PegasusCloud.push(true);
            }

            return stock;
        },

        updateUI: function() {
            const stock = ensureStockObject();
            updateInventoryBars(stock);
        }
    };

    // Κρατάμε συμβατότητα και για mobile/global inventory bridge
    window.PegasusInventory = window.PegasusInventory || {};
    if (typeof window.PegasusInventory.getInventory !== "function") {
        window.PegasusInventory.getInventory = function() {
            return window.PegasusInventoryPC.getStock();
        };
    }

    window.addEventListener('load', () => {
        if (window.PegasusInventoryPC) window.PegasusInventoryPC.updateUI();
    });

    document.addEventListener('DOMContentLoaded', () => {
        if (window.PegasusInventoryPC) window.PegasusInventoryPC.updateUI();
    });
})();
