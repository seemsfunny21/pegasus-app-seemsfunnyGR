/* ============================================================================
   🔐 PEGASUS MOBILE BIOMETRIC UNLOCK (v1.0)
   Protocol: WebAuthn / Platform Authenticator bridge for existing PIN vault
   Status: SEPARATE MODULE | NO FINGERPRINT DATA STORED | APPROVED-DEVICE GATE
   ============================================================================ */

(function() {
    "use strict";

    const STORAGE = {
        enabled: "pegasus_biometric_unlock_enabled_v1",
        credentialId: "pegasus_biometric_credential_id_v1",
        userId: "pegasus_biometric_user_id_v1",
        createdAt: "pegasus_biometric_created_at_v1",
        dismissedPrompt: "pegasus_biometric_prompt_dismissed_v1"
    };

    const GREEN = "#00ff41";
    const ERROR = "#ff4444";

    function log(...args) {
        console.log("🔐 PEGASUS BIOMETRIC:", ...args);
    }

    function isSecureEnough() {
        return !!(window.isSecureContext && navigator.credentials && window.PublicKeyCredential && crypto?.subtle);
    }

    function randomBytes(length = 32) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
    }

    function toBase64Url(buffer) {
        const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer || buffer);
        let binary = "";
        bytes.forEach(byte => binary += String.fromCharCode(byte));
        return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }

    function fromBase64Url(value) {
        const clean = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
        const padded = clean + "=".repeat((4 - clean.length % 4) % 4);
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
    }

    function hasCredential() {
        return localStorage.getItem(STORAGE.enabled) === "1" && !!localStorage.getItem(STORAGE.credentialId);
    }

    function canRestorePegasusVault() {
        return !!window.PegasusCloud?.canRestoreApprovedDevice?.();
    }

    function setMainError(message, color = ERROR) {
        const errorDiv = document.getElementById("pinError");
        if (errorDiv) {
            errorDiv.textContent = message || "";
            errorDiv.style.color = color;
        }
    }

    function setSocialError(message, color = ERROR) {
        const err = document.querySelector("#socialLockScreen #pinError") || document.getElementById("pinError");
        if (err) {
            err.textContent = message || "";
            err.style.display = message ? "block" : "none";
            err.style.color = color;
        }
    }

    async function createCredential() {
        if (!isSecureEnough()) throw new Error("UNSUPPORTED_BROWSER");

        const userId = randomBytes(32);
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: randomBytes(32),
                rp: { name: "Pegasus OS" },
                user: {
                    id: userId,
                    name: "pegasus-mobile-device",
                    displayName: "Pegasus Mobile Device"
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },
                    { type: "public-key", alg: -257 }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    residentKey: "preferred",
                    userVerification: "required"
                },
                timeout: 60000,
                attestation: "none"
            }
        });

        if (!credential?.rawId) throw new Error("NO_CREDENTIAL");

        localStorage.setItem(STORAGE.enabled, "1");
        localStorage.setItem(STORAGE.credentialId, toBase64Url(credential.rawId));
        localStorage.setItem(STORAGE.userId, toBase64Url(userId));
        localStorage.setItem(STORAGE.createdAt, String(Date.now()));
        localStorage.removeItem(STORAGE.dismissedPrompt);
        log("enabled");
        return true;
    }

    async function verifyCredential() {
        if (!isSecureEnough()) throw new Error("UNSUPPORTED_BROWSER");
        const credentialId = localStorage.getItem(STORAGE.credentialId);
        if (!credentialId) throw new Error("NOT_ENROLLED");

        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge: randomBytes(32),
                allowCredentials: [{
                    type: "public-key",
                    id: fromBase64Url(credentialId),
                    transports: ["internal"]
                }],
                userVerification: "required",
                timeout: 60000
            }
        });

        if (!assertion?.rawId) throw new Error("AUTH_FAILED");
        return true;
    }

    async function finalizeVaultUnlock(source) {
        if (window.PegasusMobileVault?.finishUnlock) {
            await window.PegasusMobileVault.finishUnlock(source || "biometric");
            return;
        }

        const modal = document.getElementById("pinModal");
        if (modal) modal.style.display = "none";
        try { window.refreshAllUI?.(); } catch (_) {}
    }

    async function biometricUnlockMain() {
        const button = document.getElementById("pegasusBiometricUnlockBtn");
        try {
            if (button) button.disabled = true;
            setMainError("ΑΝΑΜΟΝΗ ΓΙΑ ΔΑΧΤΥΛΙΚΟ...", GREEN);

            await verifyCredential();

            if (!canRestorePegasusVault()) {
                throw new Error("NO_APPROVED_DEVICE_MATERIAL");
            }

            setMainError("ΒΙΟΜΕΤΡΙΚΟ OK · ΑΝΟΙΓΜΑ VAULT...", GREEN);
            const success = await window.PegasusCloud.tryApprovedDeviceUnlock();

            if (!success) throw new Error("RESTORE_FAILED");

            await finalizeVaultUnlock("biometric");
            setTimeout(() => setMainError(""), 250);
        } catch (e) {
            console.warn("PEGASUS BIOMETRIC: main unlock failed.", e);
            if (String(e?.name || e?.message || "").includes("NotAllowed")) {
                setMainError("ΑΚΥΡΩΘΗΚΕ ΤΟ ΔΑΧΤΥΛΙΚΟ");
            } else if (String(e?.message || "") === "NO_APPROVED_DEVICE_MATERIAL") {
                setMainError("ΓΡΑΨΕ ΜΙΑ ΦΟΡΑ PIN + MASTER KEY ΓΙΑ ΝΑ ΔΕΘΕΙ Η ΣΥΣΚΕΥΗ");
            } else {
                setMainError("ΔΕΝ ΕΓΙΝΕ ΒΙΟΜΕΤΡΙΚΟ ΞΕΚΛΕΙΔΩΜΑ · ΒΑΛΕ PIN");
            }
        } finally {
            if (button) button.disabled = false;
        }
    }

    async function enableBiometricFromPrompt() {
        const button = document.getElementById("pegasusBiometricEnableBtn") || document.getElementById("pegasusBiometricPromptEnable");
        try {
            if (button) button.disabled = true;

            if (!window.PegasusCloud?.isUnlocked || !canRestorePegasusVault()) {
                alert("Πρώτα κάνε μία φορά απασφάλιση με PIN + MASTER KEY σε αυτή τη συσκευή.");
                return false;
            }

            await createCredential();
            renderAllBiometricButtons();
            hideEnrollmentPrompt();
            alert("✅ Ενεργοποιήθηκε. Από την επόμενη φορά θα μπορείς να ξεκλειδώνεις με δαχτυλικό.");
            return true;
        } catch (e) {
            console.warn("PEGASUS BIOMETRIC: enable failed.", e);
            alert("❌ Δεν ενεργοποιήθηκε το δαχτυλικό. Έλεγξε ότι το κινητό έχει δαχτυλικό/κλείδωμα οθόνης και ότι ανοίγεις το Pegasus από HTTPS/Chrome.");
            return false;
        } finally {
            if (button) button.disabled = false;
        }
    }

    function buildButton(id, label, onclickName, primary = true) {
        const btn = document.createElement("button");
        btn.id = id;
        btn.type = "button";
        btn.className = primary ? "primary-btn" : "secondary-btn";
        btn.textContent = label;
        btn.style.marginTop = "12px";
        btn.style.padding = "15px";
        btn.style.fontSize = "12px";
        btn.style.borderRadius = "14px";
        btn.style.letterSpacing = "1px";
        btn.style.borderColor = primary ? GREEN : "#333";
        btn.style.color = primary ? "#000" : GREEN;
        btn.style.background = primary ? GREEN : "transparent";
        btn.onclick = () => window.PegasusBiometricUnlock?.[onclickName]?.();
        return btn;
    }

    function renderMainButton() {
        const modal = document.getElementById("pinModal");
        if (!modal || !isSecureEnough()) return;
        const panel = modal.querySelector("div");
        if (!panel) return;

        const unlockBtn = document.getElementById("pegasusBiometricUnlockBtn");
        const enableBtn = document.getElementById("pegasusBiometricEnableBtn");
        const shouldShowUnlock = hasCredential() && canRestorePegasusVault();
        const shouldShowEnable = !hasCredential() && window.PegasusCloud?.isUnlocked && canRestorePegasusVault();

        if (shouldShowUnlock) {
            enableBtn?.remove();
            if (unlockBtn) return;
            const offlineButton = Array.from(panel.querySelectorAll("button")).find(btn => /OFFLINE/i.test(btn.textContent || ""));
            const anchor = offlineButton || panel.lastElementChild;
            const btn = buildButton("pegasusBiometricUnlockBtn", "🔐 ΞΕΚΛΕΙΔΩΜΑ ΜΕ ΔΑΧΤΥΛΙΚΟ", "unlockMain", true);
            panel.insertBefore(btn, anchor || null);
            return;
        }

        if (shouldShowEnable) {
            unlockBtn?.remove();
            if (enableBtn) return;
            const offlineButton = Array.from(panel.querySelectorAll("button")).find(btn => /OFFLINE/i.test(btn.textContent || ""));
            const anchor = offlineButton || panel.lastElementChild;
            const btn = buildButton("pegasusBiometricEnableBtn", "➕ ΕΝΕΡΓΟΠΟΙΗΣΗ ΔΑΧΤΥΛΙΚΟΥ", "enable", false);
            panel.insertBefore(btn, anchor || null);
            return;
        }

        unlockBtn?.remove();
        enableBtn?.remove();
    }

    async function biometricUnlockSocial() {
        try {
            setSocialError("ΑΝΑΜΟΝΗ ΓΙΑ ΔΑΧΤΥΛΙΚΟ...", GREEN);
            await verifyCredential();

            const savedPin = localStorage.getItem("pegasus_master_pin");
            const input = document.getElementById("socialPinInput");
            if (!savedPin || !input || !window.PegasusSocial?.verifyPin) {
                throw new Error("SOCIAL_PIN_NOT_READY");
            }

            input.value = savedPin;
            window.PegasusSocial.verifyPin();
            input.value = "";
            setSocialError("");
        } catch (e) {
            console.warn("PEGASUS BIOMETRIC: social unlock failed.", e);
            setSocialError("ΔΕΝ ΕΓΙΝΕ ΒΙΟΜΕΤΡΙΚΟ ΞΕΚΛΕΙΔΩΜΑ · ΒΑΛΕ PIN");
        }
    }

    function renderSocialButton() {
        const screen = document.getElementById("socialLockScreen");
        if (!screen || !isSecureEnough() || !hasCredential()) return;
        if (document.getElementById("pegasusBiometricSocialBtn")) return;

        const unlockButton = Array.from(screen.querySelectorAll("button")).find(btn => /ΞΕΚΛΕΙΔΩΜΑ/i.test(btn.textContent || ""));
        const btn = buildButton("pegasusBiometricSocialBtn", "🔐 ΔΑΧΤΥΛΙΚΟ", "unlockSocial", true);
        btn.style.width = "150px";
        btn.style.marginTop = "10px";

        if (unlockButton?.parentNode) {
            unlockButton.parentNode.insertBefore(btn, unlockButton.nextSibling);
        } else {
            screen.appendChild(btn);
        }
    }

    function renderAllBiometricButtons() {
        renderMainButton();
        renderSocialButton();
    }

    function hideEnrollmentPrompt() {
        document.getElementById("pegasusBiometricEnrollPrompt")?.remove();
    }

    function showEnrollmentPrompt() {
        if (!isSecureEnough() || hasCredential()) return;
        if (!window.PegasusCloud?.isUnlocked || !canRestorePegasusVault()) return;
        if (localStorage.getItem(STORAGE.dismissedPrompt) === "1") return;
        if (document.getElementById("pegasusBiometricEnrollPrompt")) return;

        const box = document.createElement("div");
        box.id = "pegasusBiometricEnrollPrompt";
        box.style.position = "fixed";
        box.style.left = "14px";
        box.style.right = "14px";
        box.style.bottom = "18px";
        box.style.zIndex = "9998";
        box.style.background = "rgba(0,0,0,0.96)";
        box.style.border = `1px solid ${GREEN}`;
        box.style.borderRadius = "18px";
        box.style.padding = "14px";
        box.style.boxShadow = "0 0 30px rgba(0,255,65,0.20)";
        box.style.color = "#ddd";
        box.style.textAlign = "center";
        box.innerHTML = `
            <div style="font-size:12px; font-weight:900; color:${GREEN}; letter-spacing:1px; margin-bottom:6px;">🔐 PEGASUS ΔΑΧΤΥΛΙΚΟ</div>
            <div style="font-size:11px; line-height:1.45; color:#aaa; margin-bottom:10px;">Ενεργοποίησέ το για να ξεκλειδώνει το mobile χωρίς να γράφεις PIN + MASTER KEY κάθε φορά.</div>
            <div style="display:flex; gap:8px;">
                <button id="pegasusBiometricPromptEnable" class="primary-btn" style="flex:1; margin:0; padding:12px; font-size:11px;">ΕΝΕΡΓΟΠΟΙΗΣΗ</button>
                <button id="pegasusBiometricPromptLater" class="secondary-btn" style="flex:1; margin:0; padding:12px; font-size:11px; color:#777; border-color:#333;">ΑΡΓΟΤΕΡΑ</button>
            </div>
        `;
        document.body.appendChild(box);
        document.getElementById("pegasusBiometricPromptEnable")?.addEventListener("click", enableBiometricFromPrompt);
        document.getElementById("pegasusBiometricPromptLater")?.addEventListener("click", () => {
            localStorage.setItem(STORAGE.dismissedPrompt, "1");
            hideEnrollmentPrompt();
        });
    }

    function afterSuccessfulUnlock(source = "manual") {
        renderAllBiometricButtons();
        if (source === "manual") {
            setTimeout(showEnrollmentPrompt, 500);
        }
    }

    function reset() {
        localStorage.removeItem(STORAGE.enabled);
        localStorage.removeItem(STORAGE.credentialId);
        localStorage.removeItem(STORAGE.userId);
        localStorage.removeItem(STORAGE.createdAt);
        localStorage.removeItem(STORAGE.dismissedPrompt);
        renderAllBiometricButtons();
        log("disabled locally");
    }

    function init() {
        renderAllBiometricButtons();
        const observer = new MutationObserver(() => renderAllBiometricButtons());
        observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
        window.addEventListener("pegasus_sync_complete", renderAllBiometricButtons);
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) renderAllBiometricButtons();
        });
        log(isSecureEnough() ? "ready" : "not supported in this context");
    }

    window.PegasusBiometricUnlock = {
        enable: enableBiometricFromPrompt,
        unlockMain: biometricUnlockMain,
        unlockSocial: biometricUnlockSocial,
        afterSuccessfulUnlock,
        render: renderAllBiometricButtons,
        reset,
        isEnabled: hasCredential,
        isSupported: isSecureEnough
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
