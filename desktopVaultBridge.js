/* ==========================================================================
   PEGASUS DESKTOP VAULT BRIDGE - v1.0
   Protocol: Restores the global desktop unlock handlers expected by index.html
             and routes them through PegasusCloud.
   ========================================================================== */

(function () {
    const VERSION = 'v1.0';

    function getModal() {
        return document.getElementById('pinModal');
    }

    function getErrorBox() {
        return document.getElementById('pinError');
    }

    function getUnlockButton() {
        return document.querySelector('#pinModal button[onclick*="attemptVaultUnlock"]');
    }

    function setError(text, color = '#ff4444') {
        const el = getErrorBox();
        if (!el) return;
        el.style.color = color;
        el.textContent = text || '';
    }

    function setUnlockButtonBusy(isBusy) {
        const btn = getUnlockButton();
        if (!btn) return;
        btn.disabled = !!isBusy;
        btn.style.opacity = isBusy ? '0.7' : '1';
        btn.textContent = isBusy ? 'ΕΛΕΓΧΟΣ...' : 'ΑΠΑΣΦΑΛΙΣΗ ΣΥΣΤΗΜΑΤΟΣ';
    }

    function showModal() {
        const modal = getModal();
        if (modal) modal.style.display = 'flex';
        setError('');
        setTimeout(() => {
            const pinInput = document.getElementById('pinInput');
            if (pinInput) pinInput.focus();
        }, 50);
    }

    function hideModal() {
        const modal = getModal();
        if (modal) modal.style.display = 'none';
        setError('');
    }

    async function runPostUnlockSync() {
        try {
            if (window.PegasusCloud?.syncNow && navigator.onLine) {
                await window.PegasusCloud.syncNow(true);
            }
        } catch (e) {
            console.warn('PEGASUS DESKTOP VAULT: Post-unlock sync deferred.', e);
        }
    }

    window.handleDesktopSyncOpen = async function handleDesktopSyncOpen() {
        const cloud = window.PegasusCloud;
        if (!cloud) {
            showModal();
            setError('CLOUD ENGINE OFFLINE');
            return;
        }

        if (cloud.isUnlocked) {
            setError('ΣΥΓΧΡΟΝΙΣΜΟΣ...', '#00bcd4');
            await runPostUnlockSync();
            hideModal();
            console.log('🔐 PEGASUS DESKTOP VAULT: Already unlocked. Sync requested.');
            return;
        }

        try {
            const canDailyAutoUnlock = !!cloud.canAutoUnlock?.();
            const canApprovedRestore = !!cloud.canRestoreApprovedDevice?.();
            if (canDailyAutoUnlock || canApprovedRestore) {
                showModal();
                setError('ΑΝΑΚΤΗΣΗ ΕΓΚΕΚΡΙΜΕΝΗΣ ΣΥΣΚΕΥΗΣ...', '#ffb300');
                const restored = canDailyAutoUnlock
                    ? await cloud.tryAutoUnlock()
                    : await cloud.tryApprovedDeviceUnlock();
                if (restored) {
                    setError('ΣΥΝΔΕΔΕΜΕΝΟ', '#00ff41');
                    await runPostUnlockSync();
                    setTimeout(hideModal, 350);
                    console.log('🔐 PEGASUS DESKTOP VAULT: Approved desktop restored.');
                    return;
                }
            }
        } catch (e) {
            console.warn('PEGASUS DESKTOP VAULT: Approved restore failed; manual unlock required.', e);
        }

        showModal();
    };

    window.attemptVaultUnlock = async function attemptVaultUnlock() {
        window.PegasusRuntimeMonitor?.trace?.('desktopUnlock', 'attemptVaultUnlock', 'START');
        if (window._pegasusDesktopUnlockBusy) return;

        const pinInput = document.getElementById('pinInput');
        const masterInput = document.getElementById('masterKeyInput');
        const pin = pinInput ? pinInput.value.trim() : '';
        const masterKey = masterInput ? masterInput.value.trim() : '';

        if (!pin || !masterKey) {
            setError('ΣΥΜΠΛΗΡΩΣΕ PIN ΚΑΙ MASTER KEY');
            return;
        }

        if (!window.PegasusCloud?.unlock) {
            setError('CLOUD ENGINE OFFLINE');
            return;
        }

        window._pegasusDesktopUnlockBusy = true;
        setUnlockButtonBusy(true);
        setError('ΣΥΝΔΕΣΗ...', '#ffb300');

        try {
            const success = await window.PegasusCloud.unlock(pin, masterKey, { deferPostUnlockSync: true });
            if (success) {
                setError('ΣΥΝΔΕΔΕΜΕΝΟ', '#00ff41');
                if (pinInput) pinInput.value = '';
                if (masterInput) masterInput.value = '';
                await runPostUnlockSync();
                setTimeout(hideModal, 350);
                console.log('🔐 PEGASUS DESKTOP VAULT: Manual unlock successful.');
            } else {
                setError('ΛΑΘΟΣ PIN / MASTER KEY');
                if (pinInput) pinInput.value = '';
                if (masterInput) masterInput.value = '';
                window.PegasusRuntimeMonitor?.warn?.('desktopUnlock', 'attemptVaultUnlock', 'INVALID_PIN_OR_MASTER');
            }
        } catch (e) {
            console.error('PEGASUS DESKTOP VAULT: Unlock error.', e);
            setError('ΣΦΑΛΜΑ ΣΥΝΔΕΣΗΣ');
        } finally {
            window._pegasusDesktopUnlockBusy = false;
            setUnlockButtonBusy(false);
        }
    };

    window.skipVault = function skipVault() {
        hideModal();
    };

    document.addEventListener('keydown', event => {
        const modal = getModal();
        if (!modal || modal.style.display === 'none') return;
        if (event.key === 'Enter') {
            event.preventDefault();
            window.attemptVaultUnlock();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            window.skipVault();
        }
    });

    console.log(`🔐 PEGASUS DESKTOP VAULT BRIDGE: Active (${VERSION}).`);
})();
