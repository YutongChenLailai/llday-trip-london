# LLday trip London

A pure-white camera game: pick up a 3D kunai and let it choose a rail-friendly day trip from London. The bundled regional map includes 40 destinations such as Brighton, Southend-on-Sea, Oxford, Cambridge, Bath and Canterbury.

## Run

`npm install` then `npm run dev -- --port 4180`. Open http://127.0.0.1:4180 and select **Enable camera**. Localhost or HTTPS is required.

Pinch thumb and index to hold the kunai. Move to aim, then flick and release. Mouse mode supports map clicks and Space. Sound can be toggled in the top bar; the impact combines a low thud and a sharp crack through Web Audio, without downloaded audio files.

## Tracking and performance

Face and hand detection run in a classic Web Worker. Only one frame can be in flight, with a maximum of 20 detection updates per second; slow devices drop intermediate frames instead of queuing them. Three.js only resizes when its viewport changes.

The face is cropped to a smooth oval inside the detected face box, with a dashed outline. Hair and the rest of the body are excluded. Hands combine tracked wrist-clipped outlines with a lightweight foreground mask for softened edges. The old 16 MB multi-class segmentation model has been removed. Canvas drawing and inference stay in the worker; the page receives a completed cutout bitmap. Camera frames never leave the browser. Camera off and switching away stop the camera and worker.

## Map and visits

The regional map uses standard OpenStreetMap street tiles with geographic destination coordinates. A bundled coastline illustration stays underneath as a fallback. Live tiles need a network connection. A successful throw subtly fades the basemap and other pins while highlighting the chosen destination in yellow; throwing again or clearing restores the full map. Nearby destinations are grouped and expand on zoom. Route and rail information links are supplied for each destination. These are curated day-trip ideas, not a complete inventory or live train availability; check your travel date and last return train.

Checked destinations persist in localStorage in this browser and are excluded from subsequent throws. Unchecking restores eligibility. Every visitor has their own list; local preview history does not migrate automatically to the public URL. All-visited selection stops cleanly.

## Checks

`npm test` checks gesture gates, map grouping, catalogue bounds, visited exclusion, storage validation, oval geometry and wrist clipping. `npm run build` bundles the classic tracking worker and creates `dist/` for static hosting. `/tests/models.html` checks actual worker/model loading and inference without camera access during development.

Live-person edge quality, hand latency and physical throwing feel still need target-device testing. First model download and initial inference can be slower than later frames.

## Bilingual fast interaction

English UI and destination names have a smaller Chinese companion line. A throw flies in 170 ms, then the small yellow result badge reels through eligible names for 280 ms before settling. The aim-selected destination is unchanged, and visited destinations are still excluded. Reduced motion skips the reel. Hands now receive a dashed blue tracked outline, matching the accepted face oval.

The destination list uses the reference blue/coral/green dots. On a mouse, a local yellow cursor gently repels the text (at most 6 px); checkboxes stay stationary, keyboard operation remains native, and touch/reduced-motion users do not need the effect.
