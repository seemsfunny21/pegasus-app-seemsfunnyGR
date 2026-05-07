# PEGASUS 232

Code-only mobile sync indicator stability fix based on PEGASUS 231.

Changes:
- Mobile sync indicator text is restored to a larger stable size.
- The indicator keeps a fixed width/height so the countdown cannot grow/shrink every second.
- Background/manual sync flashes no longer replace the countdown unless the visible 30-second heartbeat owns the sync pulse.
- Service worker/cache version bumped to 232 so the mobile files refresh cleanly.

No images or videos are bundled. No saved data is deleted.
