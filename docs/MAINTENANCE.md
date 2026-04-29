# PEGASUS — Οδηγός Συντήρησης / Maintenance Guide (Baseline 158)

## 1. Τρέχον baseline

Το τρέχον καθαρό baseline είναι **PEGASUS 158 clean**, βασισμένο στο `pegasus 157.zip`.

Ο στόχος αυτού του baseline είναι να μη χαθεί καμία λειτουργία. Για αυτό το cleanup αφαίρεσε μόνο τεκμηριωμένα artifacts/backup αρχεία και κράτησε όλα τα runtime, fallback, service-worker, mobile και diagnostics modules.

## 2. Ενεργά entry points

- Desktop: `index.html`
- Mobile: `mobile/mobile.html`
- Compatibility/mobile desktop clone: `mobile/index.html` κρατιέται προσωρινά για να μη χαθεί πιθανό fallback route.
- Service worker: `sw.js`
- Mobile legacy service worker copy: `mobile/sw.js` κρατιέται προσωρινά επειδή δηλώνει cache/fallback assets.

## 3. Cleanup policy

Μη σβήνεις `.js` επειδή απλώς δεν φαίνεται στο πρώτο `index.html`. Πριν από οποιοδήποτε delete, έλεγξε:

1. `index.html` script tags.
2. `mobile/mobile.html` script tags.
3. `mobile/index.html` fallback script tags.
4. `sw.js` και `mobile/sw.js` cache lists.
5. String references μέσα σε άλλα `.js`.
6. `window.*` APIs που μπορεί να καλούνται runtime.
7. Mobile-only modules στη δεύτερη modular σελίδα.

Σίγουρα ασφαλή για σβήσιμο είναι μόνο:

- encoded/generated documentation `.txt` artifacts (`#U...txt`),
- backup HTML όπως `index.html.bak`,
- generated extracted inline scripts `script_0.js`–`script_3.js` όταν το αντίστοιχο logic υπάρχει ήδη σε κανονικά modules ή στο consolidated mobile runtime,
- zip files μέσα στο repo, αν τυχόν ανέβουν.

## 4. Desktop αρχιτεκτονική

Το desktop flow πλέον δεν ανήκει σε ένα μεγάλο `app.js`. Το orchestration έχει σπάσει σε modules:

- `desktopBoot.js`: boot, wiring, service worker registration, startup lifecycle.
- `desktopActions.js`: Start/Pause/Next/workout completion και workout runtime actions.
- `desktopPanels.js`: desktop panels και UI panel wiring.
- `calorieRuntime.js`: calorie runtime display/bridges.
- `runtimeBridge.js`: legacy/runtime bridge.
- `pegasusBridgeHub.js`: shared bridge intelligence για desktop/mobile.
- `pegasusCore.js`: engine state, selectors, semantic runtime actions, replay/checkpoints.

Το `app.js` αν υπάρχει πρέπει να θεωρείται compatibility shell, όχι το μόνο source of truth.

## 5. Preview & Progress κανόνας

Το Preview & Progress πρέπει να δείχνει εβδομαδιαία πρόοδο ανά μυϊκή ομάδα σε μορφή:

```text
completed weekly sets / weekly target
```

Παραδείγματα: `5/17`, `3/12`.

Δεν επιτρέπεται να γυρίσει σε:

- daily-only progress,
- target-only display,
- live daily badge,
- `daily_live` aggregation.

Η πρόοδος πρέπει να διαβάζει από weekly accumulated progress / `pegasus_weekly_history` με counted ledger protection ώστε να μη διπλομετράει completed sets.

## 6. Adaptive typography κανόνας

Μην βάζεις inline `font-size` σε νέα UI blocks. Το typography πρέπει να ελέγχεται από:

- `adaptiveTypography.js`,
- CSS classes,
- CSS variables τύπου `--pg-font-*`.

Αν χρειάζεται ειδικό μέγεθος, βάλε class και όχι hardcoded inline style.

## 7. Mobile κανόνες

- Μη βάζεις νέα features στην πρώτη/mobile home page.
- Όλα τα νέα `-mobile` modules μπαίνουν στη δεύτερη modular page.
- Τα νέα mobile boxes ακολουθούν Pegasus green palette.
- `Contacts mobile`: το `+ Νέα εγγραφή` μένει μόνιμα ανοιχτό. Δεν επιστρέφει close/hide toggle.

## 8. Inventory κανόνες

- Πρωτεΐνη και κρεατίνη αφαιρούνται μόνο από τη Διατροφή.
- Όταν διαγράφεται πρωτεΐνη από τη Διατροφή, το stock επιστρέφει στην αποθήκη.
- Μην αφαιρείς supplement stock από άλλες διαδρομές, για να μη γίνεται double-count.

## 9. Diet variation κανόνες

Κρατάμε ως completed context:

- accept/reject λειτουργεί,
- reject/accept κρύβει global τις επιλογές όπου πρέπει,
- 15 options ανά slot,
- replacements δεν προτείνουν ίδια κατηγορία.

## 10. Sync κανόνες

- Desktop approved device πρέπει να μένει synced μετά από refresh χωρίς να ζητάει ξανά PIN/master key, εκτός αν είναι άλλο device ή έχει καθαριστεί cache/storage.
- Mobile status indicator δεν πρέπει να γράφει απλώς `online`. Προτιμώνται `ενεργό` ή `συνδεδεμένο`.
- Sync cadence στόχος: 30 seconds, με visual cycle όπως συμφωνήθηκε.

## 11. Safe test checklist μετά από αλλαγή

Μετά από κάθε αλλαγή:

1. Άνοιγμα desktop χωρίς console error.
2. Άνοιγμα mobile χωρίς console error.
3. Αλλαγή ημέρας.
4. Start / Pause / Next.
5. Preview & Progress weekly counters.
6. Diet add/delete για whey/creatine stock.
7. Diet variation accept/reject.
8. Mobile contacts add form.
9. Sync unlock / refresh behavior.
10. MAX FINAL AUDIT όπου υπάρχει διαθέσιμο.

## 12. Αρχεία που αφαιρέθηκαν σε αυτό το clean build

- Root encoded documentation artifacts.
- Mobile encoded documentation artifacts.
- `index.html.bak`.
- `script_0.js`–`script_3.js` generated leftovers.

Δεν αφαιρέθηκαν runtime `.js` modules, ακόμη και αν μοιάζουν legacy, επειδή κάποια φορτώνονται από fallback HTML ή service worker cache lists.
