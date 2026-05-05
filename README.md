PEGASUS 212

Baseline: pegasus210.zip -> pegasus211 -> pegasus212 focused split fix.

Τι διορθώθηκε:
- IRON έγινε focused split αντί για full-body κάθε μέρα.
- Δεν εμφανίζει πια 2 σετ από όλες τις ασκήσεις. Κάθε βασική άσκηση έχει συνήθως 3-4 σετ.
- Τρίτη = PUSH: στήθος + τρικέφαλα/ώμοι + μικρός κορμός.
- Τετάρτη = PULL: πλάτη + δικέφαλα + κορμός. Αν δεν υπάρχει ποδηλασία, Leg Extensions μόνο Τετάρτη.
- Παρασκευή = UPPER BALANCE: δεύτερο ερέθισμα στήθους/πλάτης + χέρια/κορμός.
- Low Rows Seated και Reverse Grip Cable Row παραμένουν παραλλαγές της ίδιας οικογένειας και δεν μπαίνουν μαζί στο ίδιο workout από τον Brain.
- Προστέθηκε image fallback για όλες τις ασκήσεις ώστε αν λείπει/κολλάει το MP4 να μη μένει μαύρο το video panel.
- Προστέθηκε images/ με τα screenshots των ασκήσεων και placeholder images.
- Service worker cache bump σε 212 για να φορτώσουν τα νέα app/data/brain/assets.

Κανόνες που διατηρήθηκαν:
- reset Σάββατο μετά τις 06:00
- 45λεπτο πρόγραμμα
- timer 10″ προετοιμασία / 45″ άσκηση / 60″ διάλειμμα
- αν υπάρχει ποδηλασία δεν βγάζει πόδια καμία μέρα
- αν δεν υπάρχει ποδηλασία βγάζει πόδια μόνο Τετάρτη
- rest-aware και equipment-aware σειρά
- dynamic Γράμμωση/Όγκος: ίδια σειρά, αλλά αλλάζει η ένταση/κιλά
- mobile weather module
- YouTube module
- mobile/desktop sync fixes
