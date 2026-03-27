/* ==========================================================================
   PEGASUS AI HANDLER - CLEAN SWEEP v17.0
   Protocol: Context-Aware Intelligence | Logic: Dynamic Data Extraction
   ========================================================================== */

const PegasusAI = {
    /**
     * Εξαγωγή πλήρους πλαισίου (Context) για την AI
     * Συγχρονισμένο με τα Master Profile δεδομένα (1.87m, 74kg)
     */
    getContext: function() {
        return {
            profile: window.USER_PROFILE || { weight: 74, height: 187, age: 38, gender: "male" },
            nutrition: {
                todayKcal: parseFloat(localStorage.getItem("pegasus_diet_kcal")) || 0,
                todayProtein: parseFloat(localStorage.getItem("pegasus_today_protein")) || 0,
                targetKcal: 2800,
                targetProtein: 160
            },
            workout: {
                burnedKcal: parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0,
                weeklyHistory: JSON.parse(localStorage.getItem("pegasus_weekly_history")) || {},
                muscleTargets: JSON.parse(localStorage.getItem("pegasus_muscle_targets")) || {}
            },
            system: {
                lastSync: localStorage.getItem("pegasus_last_push") || "Never",
                version: "17.0 - Clean Sweep"
            }
        };
    },

    /**
     * Κύρια συνάρτηση ερωτήματος
     * Προετοιμάζει το payload για την API γέφυρα
     */
    async ask(userQuery) {
        if (!userQuery) return;

        const context = this.getContext();
        
        // Καταγραφή στο Pegasus Logger για debugging
        if (window.PegasusLogger) {
            window.PegasusLogger.log(`AI Query Initiated: ${userQuery.substring(0, 30)}...`, "INFO");
        }

        console.log("[PEGASUS AI ANALYTICS]: Context Extracted", context);

        /* ΣΗΜΕΙΩΣΗ: Εδώ συνδέεται η κλήση προς το API (π.χ. Gemini/OpenAI) 
           μέσω του ασφαλούς Proxy που έχει οριστεί στο Πρωτόκολλο Ανάπτυξης.
        */
        
        return {
            status: "ready_for_dispatch",
            data: context,
            query: userQuery
        };
    }
};

// Global Export
window.PegasusAI = PegasusAI;