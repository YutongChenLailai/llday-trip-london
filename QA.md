# Verification · 2026-10-18

- Ten automated tests pass: gesture gates, map clustering, all 48 destination coordinates, Brighton/Southend presence, visited exclusion and all-visited behavior, storage validation, face-oval bounds and wrist clipping.
- Production build passes; the classic tracking worker is included as a local static asset.
- Browser worker integration: face, hand and lightweight selfie models loaded and ran on a 640×480 blank frame, including foreground segmentation. A 640×480 cutout was returned. First cold frame took 117 ms in the background; this is not a live-person benchmark.
- Browser mouse throw reached the regional destination flow. Sound uses the browser Web Audio engine and a visible mute control.
- Large hero heading removed. White background, Pretendard font, 8px corners and reference palette retained.

Not verified with a live person: face movement, hair exclusion on real footage, detailed hand edges, live latency and throw calibration. Impact sound has not been assessed by listening on the user's speakers. Destination links do not verify current outward/return train availability.

## Street map and hit focus

- Restored OpenStreetMap street tiles with visible attribution. The offline illustration uses a separate pane below tiles, so its white background cannot cover the street map.
- A hit is removed from pin clustering and shown as its own yellow marker. Other pins/clusters fade, and street tiles fade slightly. Throw again and Clear my throws restore normal contrast.
- Destination details now sit beneath the game instead of covering the map.

## Fast bilingual interaction

- English interface labels and all 48 destinations have smaller Chinese companion text. Translation tests cover names, descriptions and changing camera/sound/outcome states.
- Header keeps the arrow logo and removes the visible CYT wordmark.
- Hands receive the same dashed blue line treatment as the face; the accepted face oval is unchanged.
- Flight is 170 ms, followed by a 280 ms destination-name reel in the small yellow map badge and result card. Reduced-motion users receive the result immediately. The final location still comes from aim and excludes visited places; the reel does not change the selected destination.
- Option labels have the reference blue/coral/green dots. A local yellow cursor moves only option text by up to 6 px horizontally and 3 px vertically; touch and reduced-motion users retain stable options.
- Live-person hand outline stability still needs user testing.

Updated: yellow camera panel, white result, 48 destinations including villages. Uniform random unvisited selection excludes the last draw; when no different eligible place remains it stops. Reveal uses a 540 ms reel and local confetti, without map shake. Recent picks appear below the result.

Fullscreen native-dialog reveal replaces the standalone result card. Visited map, main map dots, checklist labels and pick-history buttons share visited state; clusters show visited counts and zoom to individual targets.
