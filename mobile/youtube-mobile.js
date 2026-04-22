(function() {
    const YOUTUBE_DATA_KEY = 'pegasus_youtube_v1';
    let currentSearch = '';

    function sanitizeHTML(str) {
        return String(str || '').replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }

    function normalizeUrl(url) {
        const raw = String(url || '').trim();
        if (!raw) return '';
        return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    }

    function isYoutubeUrl(url) {
        try {
            const parsed = new URL(normalizeUrl(url));
            const host = parsed.hostname.toLowerCase();
            return host.includes('youtube.com') || host === 'youtu.be' || host.endsWith('.youtube.com');
        } catch (e) {
            return false;
        }
    }

    function getYoutubeEntries() {
        const items = JSON.parse(localStorage.getItem(YOUTUBE_DATA_KEY) || '[]');
        return Array.isArray(items) ? items : [];
    }

    function saveYoutubeEntries(items) {
        localStorage.setItem(YOUTUBE_DATA_KEY, JSON.stringify(items));
        if (window.PegasusCloud?.push) window.PegasusCloud.push();
    }

    function inferTitleFromUrl(url) {
        try {
            const parsed = new URL(normalizeUrl(url));
            if (parsed.hostname.toLowerCase() === 'youtu.be') {
                return `YouTube ${parsed.pathname.replace(/^\//, '')}`;
            }
            const v = parsed.searchParams.get('v');
            if (v) return `YouTube ${v}`;
            return parsed.pathname && parsed.pathname !== '/' ? `YouTube ${parsed.pathname}` : 'YouTube Link';
        } catch (e) {
            return 'YouTube Link';
        }
    }

    function ensureYoutubeCoreTile() {
        if (!window.PegasusMobileUI?.coreModules) return;
        const exists = window.PegasusMobileUI.coreModules.some(module => module.id === 'youtube');
        if (exists) return;

        window.PegasusMobileUI.coreModules.splice(2, 0, {
            id: 'youtube',
            icon: '▶️',
            label: 'YouTube'
        });
    }

    function injectViewLayer() {
        if (document.getElementById('youtube')) return;

        const viewDiv = document.createElement('div');
        viewDiv.id = 'youtube';
        viewDiv.className = 'view';
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div class="section-title">YOUTUBE</div>

            <div class="mini-card" style="border-left: 4px solid #ff0000; padding: 15px; margin-bottom: 15px;">
                <div style="font-size: 11px; font-weight: 900; color: #ff0000; margin-bottom: 10px; text-align: center; letter-spacing: 1px;">ΚΑΤΑΧΩΡΗΣΗ YOUTUBE ΣΕΛΙΔΑΣ</div>
                <input type="text" id="youtubeUrlInput" placeholder="https://www.youtube.com/..." style="margin-bottom: 10px; border: 2px solid #444;">
                <input type="text" id="youtubeTitleInput" placeholder="Τίτλος ή σύντομο όνομα..." style="margin-bottom: 10px; border: 2px solid #444;">
                <input type="text" id="youtubeTagInput" placeholder="Λέξη-κλειδί / σημείωση..." style="margin-bottom: 12px; border: 2px solid #444;">
                <button class="primary-btn" style="background:#ff0000; border-color:#ff0000; color:#fff; box-shadow:none;" onclick="window.PegasusYouTube.addEntry()">ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>

            <input type="text" id="youtubeSearchInput" placeholder="🔍 Αναζήτηση YouTube link..." oninput="window.PegasusYouTube.handleSearch(this.value)" autocomplete="off">
            <div id="youtubeCounter" style="font-size: 10px; color: #777; font-weight: 800; margin: 12px 0; text-align: center;"></div>
            <div id="youtubeList" style="width: 100%; display: flex; flex-direction: column; gap: 10px; padding-bottom: 80px;"></div>
        `;

        document.body.appendChild(viewDiv);
    }

    window.PegasusYouTube = {
        addEntry: function() {
            const urlInput = document.getElementById('youtubeUrlInput');
            const titleInput = document.getElementById('youtubeTitleInput');
            const tagInput = document.getElementById('youtubeTagInput');

            const rawUrl = urlInput?.value || '';
            const normalizedUrl = normalizeUrl(rawUrl);
            const title = String(titleInput?.value || '').trim();
            const tag = String(tagInput?.value || '').trim();

            if (!normalizedUrl) {
                alert('Βάλε ένα YouTube link.');
                return;
            }

            if (!isYoutubeUrl(normalizedUrl)) {
                alert('Επιτρέπονται μόνο YouTube links.');
                return;
            }

            const items = getYoutubeEntries();
            const duplicate = items.some(item => item.url === normalizedUrl);
            if (duplicate) {
                alert('Αυτό το YouTube link υπάρχει ήδη.');
                return;
            }

            items.unshift({
                id: `yt_${Date.now()}`,
                url: normalizedUrl,
                title: sanitizeHTML(title || inferTitleFromUrl(normalizedUrl)),
                tag: sanitizeHTML(tag),
                dateAdded: new Date().toLocaleDateString('el-GR')
            });

            saveYoutubeEntries(items);
            if (urlInput) urlInput.value = '';
            if (titleInput) titleInput.value = '';
            if (tagInput) tagInput.value = '';
            this.renderContent();
        },

        deleteEntry: function(id) {
            if (!confirm('Διαγραφή αυτού του YouTube link;')) return;
            const items = getYoutubeEntries().filter(item => item.id !== id);
            saveYoutubeEntries(items);
            this.renderContent();
        },

        handleSearch: function(term) {
            currentSearch = String(term || '').trim().toLowerCase();
            this.renderContent();
        },

        renderContent: function() {
            const list = document.getElementById('youtubeList');
            const counter = document.getElementById('youtubeCounter');
            if (!list) return;

            let items = getYoutubeEntries();
            if (currentSearch) {
                items = items.filter(item => {
                    const haystack = `${item.title || ''} ${item.tag || ''} ${item.url || ''}`.toLowerCase();
                    return haystack.includes(currentSearch);
                });
            }

            if (counter) {
                counter.textContent = items.length === 0
                    ? 'ΚΑΝΕΝΑ YOUTUBE LINK'
                    : `${items.length} YOUTUBE LINK${items.length === 1 ? '' : 'S'}`;
            }

            list.innerHTML = items.length ? items.map(item => `
                <div class="mini-card" style="border-left: 4px solid #ff0000; padding: 14px; background: rgba(15,15,15,0.95);">
                    <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:10px;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-size: 14px; font-weight: 900; color: #fff; word-break: break-word;">${item.title || 'YOUTUBE LINK'}</div>
                            ${item.tag ? `<div style="font-size: 10px; color: #ff8080; font-weight: 800; margin-top: 4px; word-break: break-word;">${item.tag}</div>` : ''}
                            <div style="font-size: 9px; color: #777; margin-top: 5px; word-break: break-all;">${item.url}</div>
                            <div style="font-size: 9px; color: #555; margin-top: 4px;">Προστέθηκε: ${item.dateAdded}</div>
                        </div>
                        <button onclick="window.PegasusYouTube.deleteEntry('${item.id}')" style="background: transparent; border: none; color: #ff4444; font-size: 16px; padding: 0 5px; cursor: pointer;">🗑️</button>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <a href="${item.url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="primary-btn" style="flex:1; margin:0; text-decoration:none; text-align:center; background:#ff0000; border-color:#ff0000; color:#fff; box-shadow:none;">ΑΝΟΙΓΜΑ</a>
                    </div>
                </div>
            `).join('') : '<div style="color:#555; font-size:11px; text-align:center;">ΔΕΝ ΥΠΑΡΧΟΥΝ ΑΠΟΘΗΚΕΥΜΕΝΑ YOUTUBE LINKS</div>';
        }
    };

    window.renderYoutubeContent = function() {
        window.PegasusYouTube.renderContent();
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectViewLayer();
        ensureYoutubeCoreTile();
        window.PegasusMobileUI?.render?.();
        window.PegasusYouTube.renderContent();
    });
})();
