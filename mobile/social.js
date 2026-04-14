/* ==========================================================================
   💬 PEGASUS MODULE: BEHAVIORAL TRACKER (SOCIAL METRICS v1.2)
   Protocol: Search Integration, Smart Link Parsing & Edit Capabilities
   ========================================================================== */

(function() {
    const SOCIAL_DATA_KEY = 'pegasus_social_v1';
    let currentSearchTerm = ""; 

    window.PegasusSocial = {
        setRating: function(id, newRating) {
            let entities = JSON.parse(localStorage.getItem(SOCIAL_DATA_KEY)) || [];
            const idx = entities.findIndex(e => e.id === id);
            if (idx === -1) return;

            entities[idx].rating = newRating;
            this.saveAndRender(entities);
        },

        // ⚙️ ΝΕΑ ΛΕΙΤΟΥΡΓΙΑ: Επεξεργασία (Edit)
        editEntry: function(id) {
            let entities = JSON.parse(localStorage.getItem(SOCIAL_DATA_KEY)) || [];
            const idx = entities.findIndex(e => e.id === id);
            if (idx === -1) return;

            const newVal = prompt("Επεξεργασία (Όνομα & Link):", entities[idx].name);
            if (newVal !== null && newVal.trim() !== '') {
                entities[idx].name = newVal.trim();
                this.saveAndRender(entities);
            }
        },

        deleteEntry: function(id) {
            if(confirm('Οριστική διαγραφή αυτής της εγγραφής;')) {
                let entities = JSON.parse(localStorage.getItem(SOCIAL_DATA_KEY)) || [];
                entities = entities.filter(e => e.id !== id);
                this.saveAndRender(entities);
            }
        },

        toggleAddForm: function() {
            const form = document.getElementById('addSocialForm');
            const btn = document.getElementById('btnAddSocial');
            if(form.style.display === 'none') {
                form.style.display = 'block';
                btn.innerHTML = 'Χ ΚΛΕΙΣΙΜΟ';
                btn.style.background = '#ff4444';
            } else {
                form.style.display = 'none';
                btn.innerHTML = '+ ΝΕΑ ΕΓΓΡΑΦΗ';
                btn.style.background = 'var(--main)';
            }
        },

        addNewEntry: function() {
            const name = document.getElementById('newSocialName').value;
            if(!name || name.trim() === '') return;

            let entities = JSON.parse(localStorage.getItem(SOCIAL_DATA_KEY)) || [];
            
            const newEntry = {
                id: 'soc_' + Date.now(),
                name: name.trim(),
                rating: 0,
                dateAdded: new Date().toLocaleDateString('el-GR')
            };

            entities.unshift(newEntry);
            this.saveAndRender(entities);
            this.toggleAddForm();
            document.getElementById('newSocialName').value = '';
        },

        handleSearch: function(term) {
            currentSearchTerm = term.toLowerCase().trim();
            window.renderSocialContent();
        },

        saveAndRender: function(data) {
            localStorage.setItem(SOCIAL_DATA_KEY, JSON.stringify(data));
            window.renderSocialContent();
            if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') {
                window.PegasusCloud.push(); 
            }
        }
    };

    function injectViewLayer() {
        if (document.getElementById('social')) return;
        const viewDiv = document.createElement('div');
        viewDiv.id = 'social';
        viewDiv.className = 'view';
        
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            
            <div style="margin-bottom: 15px;">
                <input type="text" id="socialSearchInput" 
                       placeholder="🔍 Αναζήτηση επαφής..." 
                       onkeyup="window.PegasusSocial.handleSearch(this.value)"
                       style="width: 100%; background: #000; color: var(--main); border: 1px solid #333; padding: 12px; border-radius: 12px; font-family: inherit; box-sizing: border-box; text-align: center;">
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <button id="btnAddSocial" class="primary-btn" style="width: auto; margin: 0; padding: 8px 15px; font-size: 11px; border-radius: 8px;" onclick="window.PegasusSocial.toggleAddForm()">
                    + ΝΕΑ ΕΓΓΡΑΦΗ
                </button>
            </div>

            <div id="addSocialForm" class="mini-card" style="display: none; border-color: var(--main); margin-bottom: 20px; padding: 15px;">
                <input type="text" id="newSocialName" placeholder="Όνομα & Link Προφίλ..." style="margin-bottom: 15px; border: 2px solid #444;">
                <button class="primary-btn" onclick="window.PegasusSocial.addNewEntry()">ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>

            <div id="social-content" style="width: 100%; display: flex; flex-direction: column; gap: 15px; padding-bottom: 80px;"></div>
        `;
        document.body.appendChild(viewDiv);
    }

    window.renderSocialContent = function() {
        const container = document.getElementById('social-content');
        if (!container) return;

        let entities = JSON.parse(localStorage.getItem(SOCIAL_DATA_KEY)) || [];
        
        if (currentSearchTerm !== "") {
            entities = entities.filter(item => item.name.toLowerCase().includes(currentSearchTerm));
        }
        
        container.innerHTML = entities.map(item => {
            let activeColor = '#555';
            let labelText = 'ΑΞΙΟΛΟΓΗΣΤΕ';
            
            if (item.rating > 0) {
                if (item.rating <= 3) { activeColor = '#ff4444'; labelText = 'ΧΑΜΗΛΗ ΕΠΙΚΟΙΝΩΝΙΑ'; }
                else if (item.rating <= 7) { activeColor = '#ffbb33'; labelText = 'ΚΑΝΟΝΙΚΗ ΡΟΗ'; }
                else { activeColor = '#00ff41'; labelText = 'ΥΨΗΛΗ ΟΜΙΛΗΤΙΚΟΤΗΤΑ'; }
            }

// 🚀 SMART URL PARSING ENGINE (Multi-Platform Routing)
            let displayName = item.name;
            let linkIconHtml = '';
            const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
            const urlMatch = item.name.match(urlRegex);

            if (urlMatch) {
                let hrefUrl = urlMatch[0].startsWith('http') ? urlMatch[0] : 'https://' + urlMatch[0];
                let lowUrl = hrefUrl.toLowerCase();
                
                // --- Platform Routing Logic ---
                let platformName = "LINK";
                let platformBg = "#555"; // Default Γκρι
                let platformTxt = "#fff";

                if (lowUrl.includes("facebook.com") || lowUrl.includes("fb.com")) {
                    platformName = "FB PROFILE";
                    platformBg = "#1877F2";
                } else if (lowUrl.includes("instagram.com")) {
                    platformName = "INSTA PROFILE";
                    platformBg = "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";
                } else if (lowUrl.includes("tiktok.com")) {
                    platformName = "TIKTOK PROFILE";
                    platformBg = "#000000";
                    platformTxt = "#00f2fe"; // TikTok Cyan Text για αντίθεση
                } else if (lowUrl.includes("linkedin.com")) {
                    platformName = "LINKEDIN";
                    platformBg = "#0A66C2";
                }

                displayName = item.name.replace(urlMatch[0], '').trim(); 
                if (displayName === '') displayName = "Άγνωστη Επαφή"; 
                
                linkIconHtml = `
                    <a href="${hrefUrl}" target="_blank" onclick="event.stopPropagation()" 
                       style="margin-left: 10px; background: ${platformBg}; color: ${platformTxt}; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px; text-decoration: none; display: inline-flex; align-items: center; vertical-align: middle; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);">
                        🔗 ${platformName}
                    </a>
                `;
            }

            let scaleHtml = '<div style="display: flex; gap: 4px; margin-top: 12px;">';
            for (let i = 1; i <= 10; i++) {
                let isActive = i <= item.rating;
                let bg = isActive ? activeColor : 'rgba(255,255,255,0.03)';
                let textCol = isActive ? '#000' : '#666';
                let border = isActive ? 'none' : '1px solid #333';
                scaleHtml += `
                    <div onclick="window.PegasusSocial.setRating('${item.id}', ${i})" 
                         style="flex: 1; height: 35px; display: flex; align-items: center; justify-content: center; 
                                background: ${bg}; color: ${textCol}; border: ${border}; border-radius: 6px; 
                                font-weight: 900; font-size: 14px; cursor: pointer; transition: 0.2s;">
                        ${i}
                    </div>
                `;
            }
            scaleHtml += '</div>';

            return `
                <div class="mini-card" style="border-left: 4px solid ${activeColor}; padding: 15px; background: rgba(15,15,15,0.95);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-weight: 900; font-size: 18px; color: #fff; display: flex; align-items: center; flex-wrap: wrap;">
                                ${displayName} ${linkIconHtml}
                            </div>
                            <div style="font-size: 10px; color: ${activeColor}; font-weight: 900; margin-top: 4px; letter-spacing: 1px;">
                                [ ${labelText} ]
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 6px;">
                            <button onclick="window.PegasusSocial.editEntry('${item.id}')" 
                                    style="background: rgba(255,255,255,0.05); border: 1px solid #444; color: #ccc; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer;">
                                ⚙️
                            </button>
                            <button onclick="window.PegasusSocial.deleteEntry('${item.id}')" 
                                    style="background: rgba(255,68,68,0.1); border: 1px solid #ff4444; color: #ff4444; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer;">
                                🗑️
                            </button>
                        </div>
                    </div>
                    ${scaleHtml}
                </div>
            `;
        }).join('');
        
        if (entities.length === 0) {
            container.innerHTML = `<div style="color:#555; font-size:12px; text-align:center; margin-top:30px; font-weight:800;">
                ${currentSearchTerm === "" ? "ΚΑΜΙΑ ΕΓΓΡΑΦΗ ΣΤΗ ΒΑΣΗ" : "ΔΕΝ ΒΡΕΘΗΚΑΝ ΑΠΟΤΕΛΕΣΜΑΤΑ"}
            </div>`;
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer();
        window.renderSocialContent();
        if (window.registerPegasusModule) {
            window.registerPegasusModule({ id: 'social', label: 'Επαφές', icon: '💬' });
        }
    });
})();
