PEGASUS 236

Code-only package. No bundled images or videos.

Main fixes:
- Cloud Data Guard repair push after manual/thin JSONBin payloads.
- Non-destructive cloud pulls: missing remote fields do not wipe local modules.
- Faster refresh after first v236 local cache build.

After upload:
1. Open PEGASUS once and let the local storage loader reach 100%.
2. Future refreshes should use the permanent local cache instead of downloading all files again.
3. Avoid manual JSONBin overwrite scripts. If cloud is thin again, v236 should preserve local data and rebuild the cloud from the device snapshot.
