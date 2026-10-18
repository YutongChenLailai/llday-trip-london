# Verification · 2026-10-18

- Ten automated tests pass: gesture gates, map clustering, all 40 destination coordinates, Brighton/Southend presence, visited exclusion and all-visited behavior, storage validation, face-oval bounds and wrist clipping.
- Production build passes; the classic tracking worker is included as a local static asset.
- Browser worker integration: face, hand and lightweight selfie models loaded and ran on a 640×480 blank frame, including foreground segmentation. A 640×480 cutout was returned. First cold frame took 117 ms in the background; this is not a live-person benchmark.
- Browser mouse throw reached the regional destination flow. Sound uses the browser Web Audio engine and a visible mute control.
- Large hero heading removed. White background, Pretendard font, 8px corners and reference palette retained.

Not verified with a live person: face movement, hair exclusion on real footage, detailed hand edges, live latency and throw calibration. Impact sound has not been assessed by listening on the user's speakers. Destination links do not verify current outward/return train availability.

## Street map and hit focus

- Restored OpenStreetMap street tiles with visible attribution. The offline illustration uses a separate pane below tiles, so its white background cannot cover the street map.
- A hit is removed from pin clustering and shown as its own yellow marker. Other pins/clusters fade, and street tiles fade slightly. Throw again and Clear my throws restore normal contrast.
- Destination details now sit beneath the game instead of covering the map.
