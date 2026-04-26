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

    function extractYoutubeId(url) {
        try {
            const parsed = new URL(normalizeUrl(url));
            const host = parsed.hostname.toLowerCase();
            const pathParts = parsed.pathname.split('/').filter(Boolean);

            if (host === 'youtu.be') return cleanYoutubeId(pathParts[0]);

            const v = parsed.searchParams.get('v');
            if (v) return cleanYoutubeId(v);

            const knownPathIds = ['embed', 'shorts', 'live', 'v'];
            const markerIndex = pathParts.findIndex(part => knownPathIds.includes(part.toLowerCase()));
            if (markerIndex !== -1 && pathParts[markerIndex + 1]) {
                return cleanYoutubeId(pathParts[markerIndex + 1]);
            }

            return '';
        } catch (e) {
            return '';
        }
    }

    function cleanYoutubeId(value) {
        const id = String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
        return id.length >= 6 ? id.slice(0, 32) : '';
    }

    function getThumbnailUrl(url, storedThumbnailUrl) {
        if (storedThumbnailUrl) return String(storedThumbnailUrl);
        const videoId = extractYoutubeId(url);
        return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
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

    function registerYoutubeModule() {
        if (!window.PegasusMobileUI) return;
        const existsInCore = Array.isArray(window.PegasusMobileUI.coreModules) && window.PegasusMobileUI.coreModules.some(module => module.id === 'youtube');
        if (existsInCore) {
            window.PegasusMobileUI.coreModules = window.PegasusMobileUI.coreModules.filter(module => module.id !== 'youtube');
        }

        if (typeof window.registerPegasusModule === 'function') {
            window.registerPegasusModule({ id: 'youtube', icon: '▶️', label: 'YouTube' });
        }
    }

    function bindYoutubeListEvents(list) {
        if (!list || list.dataset.youtubeEventsBound === '1') return;
        list.dataset.youtubeEventsBound = '1';

        list.addEventListener('click', event => {
            const deleteBtn = event.target.closest('[data-youtube-delete-id]');
            if (deleteBtn) {
                event.preventDefault();
                event.stopPropagation();
                window.PegasusYouTube.deleteEntry(deleteBtn.dataset.youtubeDeleteId || '');
                return;
            }

            const openCard = event.target.closest('[data-youtube-open-url]');
            if (openCard) {
                event.preventDefault();
                window.PegasusYouTube.openUrl(openCard.dataset.youtubeOpenUrl || '');
            }
        });

        list.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const openCard = event.target.closest('[data-youtube-open-url]');
            if (openCard) {
                event.preventDefault();
                window.PegasusYouTube.openUrl(openCard.dataset.youtubeOpenUrl || '');
            }
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

            <div class="mini-card" style="border-left: 4px solid var(--main); padding: 15px; margin-bottom: 15px; background: rgba(8,20,10,0.96); box-shadow: 0 0 14px rgba(0,255,136,0.12);">
                <div style="font-size: 11px; font-weight: 900; color: var(--main); margin-bottom: 10px; text-align: center; letter-spacing: 1px;">ΚΑΤΑΧΩΡΗΣΗ YOUTUBE ΣΕΛΙΔΑΣ</div>
                <input type="text" id="youtubeUrlInput" placeholder="https://www.youtube.com/..." style="margin-bottom: 10px; border: 2px solid #444;">
                <input type="text" id="youtubeTitleInput" placeholder="Τίτλος ή σύντομο όνομα..." style="margin-bottom: 10px; border: 2px solid #444;">
                <input type="text" id="youtubeTagInput" placeholder="Λέξη-κλειδί / σημείωση..." style="margin-bottom: 12px; border: 2px solid #444;">
                <button class="primary-btn" style="background:var(--main); border-color:var(--main); color:#04110a; box-shadow:0 0 10px rgba(0,255,136,0.25);" onclick="window.PegasusYouTube.addEntry()">ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>

            <input type="text" id="youtubeSearchInput" placeholder="🔍 Αναζήτηση YouTube link..." oninput="window.PegasusYouTube.handleSearch(this.value)" autocomplete="off">
            <div id="youtubeCounter" style="font-size: 10px; color: var(--main); font-weight: 800; margin: 12px 0; text-align: center; opacity: 0.9;"></div>
            <div id="youtubeList" style="width: 100%; display: flex; flex-direction: column; gap: 12px; padding-bottom: 80px;"></div>
        `;

        document.body.appendChild(viewDiv);
        bindYoutubeListEvents(document.getElementById('youtubeList'));
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

            const videoId = extractYoutubeId(normalizedUrl);

            items.unshift({
                id: `yt_${Date.now()}`,
                url: normalizedUrl,
                videoId,
                thumbnailUrl: videoId ? getThumbnailUrl(normalizedUrl) : '',
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

        openUrl: function(url) {
            const normalizedUrl = normalizeUrl(url);
            if (!normalizedUrl || !isYoutubeUrl(normalizedUrl)) return;
            window.location.href = normalizedUrl;
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

            list.innerHTML = items.length ? items.map(item => {
                const safeUrl = sanitizeHTML(item.url || '');
                const safeId = sanitizeHTML(item.id || '');
                const thumbUrl = getThumbnailUrl(item.url, item.thumbnailUrl);
                const thumbHtml = thumbUrl
                    ? `<div style="position:relative; width:100%; aspect-ratio:16/9; border-radius:14px; overflow:hidden; border:1px solid rgba(0,255,136,0.24); background:linear-gradient(135deg, rgba(0,255,136,0.10), rgba(0,0,0,0.92)); box-shadow:inset 0 0 18px rgba(0,255,136,0.08); margin-bottom:12px;">
                            <img src="${sanitizeHTML(thumbUrl)}" alt="YouTube thumbnail" loading="lazy" style="width:100%; height:100%; object-fit:cover; display:block; opacity:0.92;" onerror="this.style.display='none';">
                            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.45)); pointer-events:none;">
                                <span style="width:54px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:rgba(0,255,136,0.90); color:#04110a; font-size:20px; font-weight:900; box-shadow:0 0 18px rgba(0,255,136,0.35);">▶</span>
                            </div>
                       </div>`
                    : `<div style="width:100%; aspect-ratio:16/9; border-radius:14px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(0,255,136,0.22); background:linear-gradient(135deg, rgba(0,255,136,0.10), rgba(0,0,0,0.92)); color:var(--main); font-size:34px; font-weight:900; margin-bottom:12px; box-shadow:inset 0 0 18px rgba(0,255,136,0.08);">▶</div>`;

                return `
                <div class="mini-card" data-youtube-open-url="${safeUrl}" tabindex="0" role="button" aria-label="Άνοιγμα YouTube video" style="border-left: 4px solid var(--main); padding: 14px; background: rgba(8,20,10,0.95); box-shadow: 0 0 12px rgba(0,255,136,0.10); cursor:pointer; transition: transform 0.12s ease, box-shadow 0.12s ease;">
                    ${thumbHtml}
                    <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-size: 14px; font-weight: 900; color: #fff; word-break: break-word; line-height:1.35;">${sanitizeHTML(item.title || 'YOUTUBE LINK')}</div>
                            ${item.tag ? `<div style="font-size: 10px; color: var(--main); font-weight: 800; margin-top: 4px; word-break: break-word; opacity:0.95;">${sanitizeHTML(item.tag)}</div>` : ''}
                            <div style="font-size: 9px; color: #777; margin-top: 5px; word-break: break-all;">${safeUrl}</div>
                            <div style="font-size: 9px; color: #555; margin-top: 4px;">Προστέθηκε: ${sanitizeHTML(item.dateAdded || '')}</div>
                        </div>
                        <button data-youtube-delete-id="${safeId}" style="background: transparent; border: none; color: var(--main); font-size: 16px; padding: 0 5px; cursor: pointer;">🗑️</button>
                    </div>
                    <div style="font-size:9px; color:var(--main); opacity:0.75; font-weight:800; margin-top:10px; text-align:center; letter-spacing:0.6px;">ΠΑΤΑ ΤΗΝ ΚΑΡΤΑ ΓΙΑ ΑΝΟΙΓΜΑ</div>
                </div>
            `;
            }).join('') : '<div style="color:#555; font-size:11px; text-align:center;">ΔΕΝ ΥΠΑΡΧΟΥΝ ΑΠΟΘΗΚΕΥΜΕΝΑ YOUTUBE LINKS</div>';

            bindYoutubeListEvents(list);
        }
    };

    window.renderYoutubeContent = function() {
        window.PegasusYouTube.renderContent();
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectViewLayer();
        registerYoutubeModule();
        window.PegasusMobileUI?.render?.();
        window.PegasusYouTube.renderContent();
    });
})();
