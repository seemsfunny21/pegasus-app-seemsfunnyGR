    /* PEGASUS SECURITY PROTOCOL - DESKTOP ON-DEMAND SYNC (v18.3) */
    function updateVaultButton(isConnected) {
        const vaultBtn = document.getElementById("btnMasterVault");
        if (!vaultBtn) return;

        if (isConnected) {
            vaultBtn.textContent = "☁️ CLOUD: ΣΥΝΔΕΔΕΜΕΝΟ";
            vaultBtn.style.borderColor = "#00ff41";
            vaultBtn.style.color = "#00ff41";
        } else {
            vaultBtn.textContent = "🔐 ΣΥΓΧΡΟΝΙΣΜΟΣ";
            vaultBtn.style.borderColor = "#00bcd4";
            vaultBtn.style.color = "#00bcd4";
        }
    }

    function openVaultModal(message = "") {
        const modal = document.getElementById("pinModal");
        if (!modal) return;
        modal.style.display = "flex";
        const errorDiv = document.getElementById("pinError");
        if (errorDiv) errorDiv.textContent = message || "";
        const pinInput = document.getElementById("pinInput");
        if (pinInput) setTimeout(() => pinInput.focus(), 60);
    }

    async function handleDesktopSyncOpen() {
        window.PegasusRuntimeMonitor?.trace?.("desktopSync", "handleOpen", "START");
        try {
            if (window.PegasusCloud?.isUnlocked) {
                updateVaultButton(true);
                if (window.PegasusCloud?.needsPinBindingRepair?.()) {
                    window.PegasusRuntimeMonitor?.trace?.("desktopSync", "handleOpen", "PROMPT_REQUIRED", "PIN_BINDING_REPAIR");
                    openVaultModal("ΕΠΑΛΗΘΕΥΣΗ PIN / MASTER KEY ΓΙΑ ΕΠΙΣΚΕΥΗ ΕΓΚΡΙΣΗΣ ΣΥΣΚΕΥΗΣ");
                    return;
                }
                if (navigator.onLine && typeof window.PegasusCloud.syncNow === "function") {
                    await window.PegasusCloud.syncNow(true);
                }
                if (typeof refreshAllUI === 'function') refreshAllUI();
                window.PegasusRuntimeMonitor?.trace?.("desktopSync", "handleOpen", "ALREADY_UNLOCKED");
                return;
            }

            if (window.PegasusCloud?.canAutoUnlock?.()) {
                const ok = await window.PegasusCloud.tryAutoUnlock();
                updateVaultButton(!!ok);
                if (ok) {
                    updateVaultButton(true);
                    if (window.PegasusCloud?.needsPinBindingRepair?.()) {
                        window.PegasusRuntimeMonitor?.trace?.("desktopSync", "handleOpen", "PROMPT_REQUIRED", "PIN_BINDING_REPAIR_AFTER_AUTO_UNLOCK");
                        openVaultModal("ΕΠΑΛΗΘΕΥΣΗ PIN / MASTER KEY ΓΙΑ ΕΠΙΣΚΕΥΗ ΕΓΚΡΙΣΗΣ ΣΥΣΚΕΥΗΣ");
                        return;
                    }
                    if (navigator.onLine && typeof window.PegasusCloud.syncNow === "function") {
                        await window.PegasusCloud.syncNow(true);
                    }
                    if (typeof refreshAllUI === 'function') refreshAllUI();
                    window.PegasusRuntimeMonitor?.trace?.("desktopSync", "handleOpen", "AUTO_UNLOCK_OK");
                    return;
                }
            }

            if (window.PegasusCloud?.canRestoreApprovedDevice?.()) {
                const ok = await window.PegasusCloud.tryApprovedDeviceUnlock();
                updateVaultButton(!!ok);
                if (ok) {
                    updateVaultButton(true);
                    if (window.PegasusCloud?.needsPinBindingRepair?.()) {
                        window.PegasusRuntimeMonitor?.trace?.("desktopSync", "handleOpen", "PROMPT_REQUIRED", "PIN_BINDING_REPAIR_AFTER_APPROVED_RESTORE");
                        openVaultModal("ΕΠΑΛΗΘΕΥΣΗ PIN / MASTER KEY ΓΙΑ ΕΠΙΣΚΕΥΗ ΕΓΚΡΙΣΗΣ ΣΥΣΚΕΥΗΣ");
                        return;
                    }
                    if (navigator.onLine && typeof window.PegasusCloud.syncNow === "function") {
                        await window.PegasusCloud.syncNow(true);
                    }
                    if (typeof refreshAllUI === 'function') refreshAllUI();
                    window.PegasusRuntimeMonitor?.trace?.("desktopSync", "handleOpen", "APPROVED_RESTORE_OK");
                    return;
                }
            }

            window.PegasusRuntimeMonitor?.trace?.("desktopSync", "handleOpen", "PROMPT_REQUIRED");
            openVaultModal();
        } catch (e) {
            window.PegasusRuntimeMonitor?.capture?.("desktopSync", "handleOpen", e);
            console.error("Desktop Vault Open Error:", e);
            updateVaultButton(false);
            openVaultModal();
        }
    }

    async function attemptVaultUnlock() {
        window.PegasusRuntimeMonitor?.trace?.("desktopSync", "manualUnlock", "START");
        const pinInput = document.getElementById("pinInput");
        const masterInput = document.getElementById("masterKeyInput");
        const errorDiv = document.getElementById("pinError");
        const pin = pinInput ? pinInput.value.trim() : "";
        const masterKey = masterInput ? masterInput.value.trim() : "";

        if (errorDiv) errorDiv.textContent = "";
        if (!pin || !masterKey) {
            window.PegasusRuntimeMonitor?.warn?.("desktopSync", "manualUnlock", "MISSING_CREDENTIALS");
            if (errorDiv) errorDiv.textContent = "ΣΥΜΠΛΗΡΩΣΕ PIN ΚΑΙ MASTER KEY";
            return;
        }

        const success = await window.PegasusCloud?.unlock(pin, masterKey);

        if (success) {
            window.PegasusRuntimeMonitor?.trace?.("desktopSync", "manualUnlock", "SUCCESS");
            document.getElementById("pinModal").style.display = "none";
            updateVaultButton(true);
            if (navigator.onLine && typeof window.PegasusCloud?.syncNow === "function") {
                await window.PegasusCloud.syncNow(true);
            }
            if (typeof refreshAllUI === 'function') refreshAllUI();
        } else {
            window.PegasusRuntimeMonitor?.warn?.("desktopSync", "manualUnlock", "INVALID_PIN_OR_MASTER");
            if (errorDiv) errorDiv.textContent = "ΑΡΝΗΣΗ ΠΡΟΣΒΑΣΗΣ: ΛΑΘΟΣ PIN / MASTER KEY";
            if (pinInput) pinInput.value = "";
            if (masterInput) masterInput.value = "";
        }
    }

    function skipVault() {
        document.getElementById("pinModal").style.display = "none";
        updateVaultButton(false);
    }

    async function restoreDesktopApprovedSyncOnLoad() {
        window.PegasusRuntimeMonitor?.trace?.("desktopSync", "restoreOnLoad", "START");
        updateVaultButton(false);

        try {
            if (!window.PegasusCloud) return;

            let ok = !!window.PegasusCloud.isUnlocked;
            if (!ok && window.PegasusCloud.canRestoreApprovedDevice?.()) {
                ok = await window.PegasusCloud.tryApprovedDeviceUnlock();
            } else if (!ok && window.PegasusCloud.canAutoUnlock?.()) {
                ok = await window.PegasusCloud.tryAutoUnlock();
            }

            updateVaultButton(!!ok);
            window.PegasusRuntimeMonitor?.trace?.("desktopSync", "restoreOnLoad", ok ? "RESTORED" : "NOT_RESTORED");

            if (ok) {
                if (navigator.onLine && typeof window.PegasusCloud.syncNow === "function") {
                    await window.PegasusCloud.syncNow(true);
                }
                if (typeof refreshAllUI === 'function') refreshAllUI();
            }
        } catch (e) {
            window.PegasusRuntimeMonitor?.capture?.("desktopSync", "restoreOnLoad", e);
            console.warn("⚠️ DESKTOP: Approved sync restore failed.", e);
            updateVaultButton(false);
        }
    }

    window.addEventListener("load", () => {
        restoreDesktopApprovedSyncOnLoad();
    });

    window.addEventListener("pegasus_sync_status", (e) => {
        const status = e?.detail?.status || "";
        updateVaultButton(status === "online" || status === "syncing");
    });
