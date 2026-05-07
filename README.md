# PEGASUS 234

Code-only mobile sync indicator final raw-label lock fix based on PEGASUS 233.

## Fix
- The mobile sync countdown label is now excluded from the global UI label-polish MutationObserver.
- The indicator keeps the same text casing every second: `ΣΥΝΔΕΔΕΜΕΝΟ · XXs`.
- The indicator keeps fixed CSS size/width/height and changes only color/countdown.
- No media folders included.
