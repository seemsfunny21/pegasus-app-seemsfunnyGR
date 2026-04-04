window.PegasusInventory = {
    updateUI: function() {
        const s = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
        const pP = Math.min((s.prot / 2500) * 100, 100);
        const cP = Math.min((s.crea / 1000) * 100, 100);

        document.getElementById('protLevelText').textContent = `${Math.round(s.prot)} / 2500g`;
        document.getElementById('protBar').style.width = pP + '%';
        document.getElementById('creaLevelText').textContent = `${Math.round(s.crea)} / 1000g`;
        document.getElementById('creaBar').style.width = cP + '%';
        
        document.getElementById('homeProtTxt').textContent = Math.round(pP) + '%';
        document.getElementById('homeProtBar').style.width = pP + '%';
        document.getElementById('homeCreaTxt').textContent = Math.round(cP) + '%';
        document.getElementById('homeCreaBar').style.width = cP + '%';
    },

    consume: function(type, amount, push = true) {
        let s = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
        s[type] = Math.max(0, s[type] - amount);
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(s));
        this.updateUI();
        if(push && window.PegasusCloud) PegasusCloud.push();
    },

    refill: function(type, amount) {
        let s = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
        s[type] = amount;
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(s));
        this.updateUI();
        if(window.PegasusCloud) PegasusCloud.push();
    }
};