/* ==========================================================================
   PEGASUS WEIGHT STATE
   Active lifter and per-exercise saved weight persistence.
   ========================================================================== */

window.getActiveLifter = function() {
    if (window.partnerData && window.partnerData.isActive && window.partnerData.currentPartner !== "") {
        return window.partnerData.currentPartner;
    }
    return "ΑΓΓΕΛΟΣ";
};

window.getSavedWeight = function(exerciseName) {
    const cleanName = exerciseName.trim();
    const lifter = window.getActiveLifter();
    let allWeights = JSON.parse(localStorage.getItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights") || "{}");

    if (allWeights[lifter] && allWeights[lifter][cleanName] !== undefined) return allWeights[lifter][cleanName];

    if (lifter === "ΑΓΓΕΛΟΣ") {
        let old1 = localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`);
        let old2 = localStorage.getItem(`weight_${cleanName}`);
        if (old1) return old1;
        if (old2) return old2;
    }
    return "";
};

window.saveWeight = function(name, val) {
    const cleanName = name.trim();
    const lifter = window.getActiveLifter();
    let allWeights = JSON.parse(localStorage.getItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights") || "{}");

    if (!allWeights[lifter]) allWeights[lifter] = {};
    allWeights[lifter][cleanName] = val;
    localStorage.setItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights", JSON.stringify(allWeights));

    if (lifter === "ΑΓΓΕΛΟΣ") {
        localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`, val);
    }

    syncPegasusUserRuntime();

    if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render();
    if (window.PegasusCloud?.push) window.PegasusCloud.push();
};
