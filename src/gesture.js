export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function handState(points) {
  const palm = Math.hypot(points[0].x - points[9].x, points[0].y - points[9].y);
  const pinch = Math.hypot(points[4].x - points[8].x, points[4].y - points[8].y) / Math.max(.025, palm);
  return { x: 1 - (points[4].x + points[8].x) / 2, y: (points[4].y + points[8].y) / 2, pinch, palm };
}
export function aimFromHand(x, y) {
  return { x: clamp((x - .15) / .7, .04, .96), y: clamp((y - .12) / .68, .06, .94) };
}
export function releaseReady(held, pinch, heldMs, motion) {
  return held && pinch > .65 && heldMs > 180 && motion > .22;
}
export function nearestPlace(lat, lng, places) {
  return places.reduce((best, place) => {
    const distance = (place.lat - lat) ** 2 + ((place.lng - lng) * Math.cos(lat * Math.PI / 180)) ** 2;
    return !best || distance < best.distance ? { ...place, distance } : best;
  }, null);
}
