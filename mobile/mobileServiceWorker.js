        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('../sw.js?v=3.25')
                    .then(reg => {
                        console.log('📡 PEGASUS: Service Worker Registered.');
                        reg.update();

                        reg.onupdatefound = () => {
                            const installingWorker = reg.installing;
                            if (!installingWorker) return;

                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        console.log('🔄 Νέο update στο background. Θα εφαρμοστεί στο επόμενο άνοιγμα.');
                                    }
                                }
                            };
                        };
                    })
                    .catch(err => console.error('❌ SW Registration Failed:', err));
            }, { once: true });
        }
    
