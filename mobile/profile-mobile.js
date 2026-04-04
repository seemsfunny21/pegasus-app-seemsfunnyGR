/* ==========================================================================
   PEGASUS OS - NOTES MODULE (MOBILE EDITION v13.8)
   Protocol: Tactical Daily Notes (Replaced Emergency Contacts)
   ========================================================================== */

window.PegasusProfile = {
    addNote: async function() {
        // Η ημερομηνία μπαίνει αυτόματα από το mobile.html (readonly input)
        const dateVal = document.getElementById('nDate').value;
        const textVal = document.getElementById('nText').value;
        
        if(!textVal || textVal.trim() === "") return;
        
        let list = JSON.parse(localStorage.getItem("pegasus_notes")) || [];
        // unshift: Βάζει τη νέα σημείωση πρώτη (πάνω-πάνω)
        list.unshift({ d: dateVal, t: textVal }); 
        localStorage.setItem("pegasus_notes", JSON.stringify(list));
        
        document.getElementById('nText').value = "";
        this.renderNotes();
        
        if(window.PegasusCloud) await window.PegasusCloud.push();
    },

    deleteNote: async function(idx) {
        let list = JSON.parse(localStorage.getItem("pegasus_notes")) || [];
        list.splice(idx, 1);
        localStorage.setItem("pegasus_notes", JSON.stringify(list));
        
        this.renderNotes();
        if(window.PegasusCloud) await window.PegasusCloud.push();
    },

    // Σχεδιασμός UI των Σημειώσεων με Tactical Look
    renderNotes: function() {
        const list = JSON.parse(localStorage.getItem("pegasus_notes")) || [];
        const container = document.getElementById("notesList");
        if(!container) return;
        
        container.innerHTML = list.map((i, idx) => `
            <div class="log-item" style="border-left: 4px solid var(--main); margin-bottom: 12px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <span style="font-size:11px; color:var(--main); font-weight:900; letter-spacing:1px;">📅 ${i.d}</span>
                    <button onclick="window.PegasusProfile.deleteNote(${idx})" style="background:none; border:none; color:var(--danger); font-size:16px; font-weight:bold; cursor:pointer;">✕</button>
                </div>
                <div style="font-size:15px; color:#fff; line-height:1.5;">${i.t}</div>
            </div>
        `).join('');
    }
};
