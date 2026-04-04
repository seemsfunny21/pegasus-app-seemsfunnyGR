/* ===== PEGASUS OS - NOTES MODULE (MOBILE v13.4) ===== */
window.PegasusProfile = {
    addNote: function() {
        const d = document.getElementById('nDate').value;
        const t = document.getElementById('nText').value;
        if(!t) return;
        
        let list = JSON.parse(localStorage.getItem("pegasus_notes")) || [];
        list.unshift({ d: d, t: t });
        localStorage.setItem("pegasus_notes", JSON.stringify(list));
        
        document.getElementById('nText').value = "";
        this.renderNotes();
        if(window.PegasusCloud) PegasusCloud.push();
    },

    deleteNote: function(idx) {
        let list = JSON.parse(localStorage.getItem("pegasus_notes")) || [];
        list.splice(idx, 1);
        localStorage.setItem("pegasus_notes", JSON.stringify(list));
        this.renderNotes();
        if(window.PegasusCloud) PegasusCloud.push();
    },

    renderNotes: function() {
        const list = JSON.parse(localStorage.getItem("pegasus_notes")) || [];
        const container = document.getElementById("notesList");
        if(!container) return;
        
        container.innerHTML = list.map((i, idx) => `
            <div class="log-item" style="border-left: 4px solid var(--main);">
                <button class="btn-del" onclick="PegasusProfile.deleteNote(${idx})">✕</button>
                <div style="font-size:10px; color:var(--main); font-weight:800; margin-bottom:5px;">${i.d}</div>
                <div style="font-size:14px; color:#fff; line-height:1.4;">${i.t}</div>
            </div>`).join('');
    }
};
