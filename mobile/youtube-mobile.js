/* ==========================================================================
   ▶️ PEGASUS MODULE: YOUTUBE LINKS (v1.0)
   Protocol: Link-only thumbnail library. No video titles under thumbnails.
   ========================================================================== */

(function() {
    const YOUTUBE_DATA_KEY = 'pegasus_youtube_v1';

    function escapeHTML(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalizeYouTubeUrl(rawUrl) {
        const input = String(rawUrl || '').trim();
        if (!input) return null;

        const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;

        try {
            const url = new URL(withProtocol);
            const hostname = url.hostname.replace(/^www\./i, '').toLowerCase();
            const isYouTube = hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'music.youtube.com' || hostname === 'youtu.be';
            if (!isYouTube) return null;

            let videoId = '';

            if (hostname === 'youtu.be') {
                videoId = url.pathname.split('/').filter(Boolean)[0] || '';
            } else if (url.pathname === '/watch') {
                videoId = url.searchParams.get('v') || '';
            } else {
                const parts = url.pathname.split('/').filter(Boolean);
                const markerIndex = parts.findIndex(part => ['shorts', 'embed', 'live'].includes(part.toLowerCase()));
                if (markerIndex !== -1 && parts[markerIndex + 1]) {
                    videoId = parts[markerIndex + 1];
                }
            }

            videoId = String(videoId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
            if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;

            return {
                videoId,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumb: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            };
        } catch (e) {
            return null;
        }
    }

    function loadEntries() {
        try {
            const parsed = JSON.parse(localStorage.getItem(YOUTUBE_DATA_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveEntries(entries) {
        localStorage.setItem(YOUTUBE_DATA_KEY, JSON.stringify(entries));
    }

    function triggerCloudPush() {
        if (!window.PegasusCloud) return;
        if (typeof window.PegasusCloud.push === 'function') window.PegasusCloud.push();
        else if (typeof window.PegasusCloud.upload === 'function') window.PegasusCloud.upload();
        else if (typeof window.PegasusCloud.sync === 'function') window.PegasusCloud.sync();
        else if (typeof window.PegasusCloud.save === 'function') window.PegasusCloud.save();
    }

    window.PegasusYouTube = {
        addLink: function() {
            const input = document.getElementById('youtubeLinkInput');
            if (!input) return;

            const normalized = normalizeYouTubeUrl(input.value);
            const errorBox = document.getElementById('youtubeError');

            if (!normalized) {
                if (errorBox) {
                    errorBox.textContent = 'Βάλε έγκυρο YouTube link.';
                    errorBox.style.display = 'block';
                }
                return;
            }

            const entries = loadEntries();
            const existingIndex = entries.findIndex(entry => entry.videoId === normalized.videoId);
            const newEntry = {
                id: `yt_${Date.now()}`,
                videoId: normalized.videoId,
                url: normalized.url,
                thumb: normalized.thumb,
                dateAdded: new Date().toLocaleDateString('el-GR')
            };

            if (existingIndex !== -1) {
                entries.splice(existingIndex, 1);
            }

            entries.unshift(newEntry);
            saveEntries(entries);
            input.value = '';

            if (errorBox) {
                errorBox.textContent = '';
                errorBox.style.display = 'none';
            }

            window.renderYoutubeContent();
            triggerCloudPush();
        },

        openVideo: function(id) {
            const entry = loadEntries().find(item => item.id === id);
            if (!entry?.url) return;
            window.open(entry.url, '_blank', 'noopener,noreferrer');
        },

        deleteLink: function(id) {
            if (!confirm('Διαγραφή αυτού του YouTube link;')) return;
            const nextEntries = loadEntries().filter(item => item.id !== id);
            saveEntries(nextEntries);
            window.renderYoutubeContent();
            triggerCloudPush();
        }
    };

    function injectStyles() {
        if (document.getElementById('pegasusYoutubeStyles')) return;
        const style = document.createElement('style');
        style.id = 'pegasusYoutubeStyles';
        style.textContent = `
            .pegasus-youtube-grid {
                width: 100%;
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                padding-bottom: 90px;
            }

            .pegasus-youtube-card {
                position: relative;
                width: 100%;
                aspect-ratio: 16 / 9;
                overflow: hidden;
                border: 1px solid rgba(0, 255, 65, 0.35);
                border-radius: 16px;
                background: #050505;
                box-shadow: 0 0 18px rgba(0, 255, 65, 0.08);
                cursor: pointer;
            }

            .pegasus-youtube-card img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                filter: saturate(1.05) contrast(1.03);
            }

            .pegasus-youtube-card::after {
                content: '▶';
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 46px;
                height: 46px;
                border-radius: 999px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.72);
                color: var(--main);
                border: 1px solid rgba(0, 255, 65, 0.55);
                font-size: 20px;
                line-height: 1;
                box-shadow: 0 0 18px rgba(0, 255, 65, 0.18);
                pointer-events: none;
            }

            .pegasus-youtube-delete {
                position: absolute;
                top: 7px;
                right: 7px;
                z-index: 2;
                width: 30px;
                height: 30px;
                border-radius: 999px;
                border: 1px solid rgba(255, 68, 68, 0.85);
                background: rgba(0, 0, 0, 0.78);
                color: #ff4444;
                font-weight: 900;
                font-size: 16px;
                line-height: 1;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    function injectViewLayer() {
        if (document.getElementById('youtube')) return;
        injectStyles();

        const viewDiv = document.createElement('div');
        viewDiv.id = 'youtube';
        viewDiv.className = 'view';

        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>

            <div class="section-title">YOUTUBE</div>

            <div class="mini-card" style="border-color: var(--main); margin-bottom: 18px; padding: 15px;">
                <input type="url" id="youtubeLinkInput" placeholder="Βάλε YouTube link..." autocomplete="off" style="margin-bottom: 12px; border: 2px solid #333;">
                <button class="primary-btn" onclick="window.PegasusYouTube.addLink()">+ ΠΡΟΣΘΗΚΗ VIDEO</button>
                <div id="youtubeError" style="display:none; margin-top:10px; color:#ff4444; font-size:11px; font-weight:900; text-align:center;"></div>
            </div>

            <div id="youtube-content" class="pegasus-youtube-grid"></div>
        `;

        document.body.appendChild(viewDiv);

        const input = viewDiv.querySelector('#youtubeLinkInput');
        if (input) {
            input.addEventListener('keydown', function(ev) {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    window.PegasusYouTube.addLink();
                }
            });
        }
    }

    window.renderYoutubeContent = function() {
        const container = document.getElementById('youtube-content');
        if (!container) return;

        const entries = loadEntries();

        if (!entries.length) {
            container.innerHTML = '<div class="mini-card" style="grid-column: 1 / -1; color:#555; font-size:11px; text-align:center; padding:20px;">Δεν έχεις αποθηκευμένα YouTube links.</div>';
            return;
        }

        container.innerHTML = entries.map(entry => `
            <div class="pegasus-youtube-card" role="button" tabindex="0" aria-label="Άνοιγμα YouTube video" onclick="window.PegasusYouTube.openVideo('${escapeHTML(entry.id)}')" onkeydown="if(event.key==='Enter'){window.PegasusYouTube.openVideo('${escapeHTML(entry.id)}')}">
                <button class="pegasus-youtube-delete" aria-label="Διαγραφή" onclick="event.stopPropagation(); window.PegasusYouTube.deleteLink('${escapeHTML(entry.id)}')">×</button>
                <img src="${escapeHTML(entry.thumb)}" alt="YouTube thumbnail" loading="lazy">
            </div>
        `).join('');
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectViewLayer();
        window.renderYoutubeContent();

        if (window.registerPegasusModule) {
            window.registerPegasusModule({
                id: 'youtube',
                label: 'YouTube',
                icon: '▶️'
            });
        }
    });
})();
