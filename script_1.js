
        window.PegasusMobileUI = {
            currentPage: 0,
            modulesPerPage: 10,

            coreModules: [
                { id: 'diet', icon: '🥗', label: 'Διατροφή' },
                { id: 'library', icon: '🍽️', label: 'Γεύματα' },
                { id: 'cardio', icon: '🚴', label: 'Αερόβια' },
                { id: 'ems_panel', icon: '⚡', label: 'EMS' },
                { id: 'preview', icon: '🎯', label: 'Στόχοι' },
                { id: 'profile', icon: '👤', label: 'Έγγραφα' },
                { id: 'car', icon: '🚗', label: 'Όχημα' },
                { id: 'notes', icon: '📝', label: 'Σημειώσεις' }
            ],

            extraModules: [],

            registerModule: function(module) {
                if (this.coreModules.some(m => m.id === module.id)) return;
                if (this.extraModules.some(m => m.id === module.id)) return;

                this.extraModules.push(module);

                if (document.readyState === "loading") {
                    document.addEventListener("DOMContentLoaded", () => this.render(), { once: true });
                } else {
                    this.render();
                }
            },

            changePage: function(direction) {
                const extraPages = Math.ceil(this.extraModules.length / this.modulesPerPage);
                const maxPages = Math.max(1, 1 + extraPages);

                this.currentPage = Math.max(0, Math.min(this.currentPage + direction, maxPages - 1));
                this.render();
            },

            render: function() {
                const grid = document.getElementById('dynamic-grid');
                const pageTxt = document.getElementById('pageIndicator');
                const btnPrev = document.getElementById('prevPage');
                const btnNext = document.getElementById('nextPage');
                if (!grid) return;

                const extraPages = Math.ceil(this.extraModules.length / this.modulesPerPage);
                const maxPages = Math.max(1, 1 + extraPages);

                if (this.currentPage >= maxPages) this.currentPage = Math.max(0, maxPages - 1);

                grid.innerHTML = "";

                if (this.currentPage === 0) {
                    this.coreModules.forEach(m => this.createTile(grid, m));
                    this.injectParkingTile(grid);
                    this.injectSuppsTile(grid);
                    this.injectSettingsTile(grid);
                } else {
                    const start = (this.currentPage - 1) * this.modulesPerPage;
                    const end = start + this.modulesPerPage;
                    const pageItems = this.extraModules.slice(start, end);
                    pageItems.forEach(m => this.createTile(grid, m));
                }

                if (pageTxt) {
                    if (this.currentPage === 0) {
                        pageTxt.textContent = "TACTICAL DATA INTERFACE";
                    } else {
                        pageTxt.textContent = `EXTENDED TACTICAL MODULES (ΣΕΛ. ${this.currentPage + 1}/${maxPages})`;
                    }
                }

                if (btnPrev) {
                    btnPrev.style.opacity = this.currentPage === 0 ? "0.1" : "1";
                    btnPrev.style.pointerEvents = this.currentPage === 0 ? "none" : "auto";
                }

                if (btnNext) {
                    btnNext.style.opacity = this.currentPage >= maxPages - 1 ? "0.1" : "1";
                    btnNext.style.pointerEvents = this.currentPage >= maxPages - 1 ? "none" : "auto";
                }

                if (window.PegasusInventory && typeof window.PegasusInventory.updateUI === "function") {
                    window.PegasusInventory.updateUI();
                }
            },

            createTile: function(container, m) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.onclick = () => openView(m.id);
                tile.innerHTML = `<span class="tile-icon">${m.icon}</span><span class="tile-label">${m.label}</span>`;
                container.appendChild(tile);
            },

            injectParkingTile: function(container) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.onclick = () => openView('parking_panel');
                tile.innerHTML = `<span class="tile-icon icon-parking">P</span><span id="parkingStatus" class="tile-label">ΠΑΡΚΙΝΓΚ: --</span>`;
                container.appendChild(tile);
            },

            injectSuppsTile: function(container) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.onclick = () => openView('supps');
                tile.style.padding = "10px 8px";
                tile.innerHTML = `
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 4px;">
                        <div style="font-size: 7px; color: #fff; display: flex; justify-content: space-between; font-weight: 900;">
                            <span>WHEY</span><span id="homeProtTxt" style="color: var(--main);">--%</span>
                        </div>
                        <div class="bar-bg" style="height: 4px; margin: 0; background: rgba(0,0,0,0.5);">
                            <div id="homeProtBar" class="bar-fill" style="background: var(--main); box-shadow: 0 0 8px var(--main);"></div>
                        </div>
                        <div style="font-size: 7px; color: #fff; display: flex; justify-content: space-between; font-weight: 900;">
                            <span>CREA</span><span id="homeCreaTxt" style="color: var(--main);">--%</span>
                        </div>
                        <div class="bar-bg" style="height: 4px; margin: 0; background: rgba(0,0,0,0.5);">
                            <div id="homeCreaBar" class="bar-fill" style="background: var(--main); box-shadow: 0 0 8px var(--main);"></div>
                        </div>
                    </div>
                `;
                container.appendChild(tile);
            },

            injectSettingsTile: function(container) {
                const settingsTile = document.createElement('div');
                settingsTile.className = 'tile full-width';
                settingsTile.onclick = () => openView('settings_panel');
                settingsTile.style.borderColor = "var(--main)";
                settingsTile.innerHTML = `
                    <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; width: 100%; height: 100%;">
                        <span class="tile-icon" style="font-size: 20px; margin-right: 10px; margin-bottom: 0;">⚙️</span>
                        <span class="tile-label" style="color: var(--main); font-weight: 900; text-align: center;">ΡΥΘΜΙΣΕΙΣ & ΒΑΡΟΣ</span>
                    </div>
                `;
                container.appendChild(settingsTile);
            }
        };

        window.registerPegasusModule = function(module) {
            window.PegasusMobileUI.registerModule(module);
        };

        document.addEventListener("DOMContentLoaded", () => {
            window.PegasusMobileUI.render();
        }, { once: true });
    