const KEY = 'cyt-day-trip-darts.visited.v1';
export function loadVisited(storage, places) {
  try {
    const saved = JSON.parse(storage.getItem(KEY) || '[]');
    if (!Array.isArray(saved)) return new Set();
    const valid = new Set(places.map(place => place.name));
    return new Set(saved.filter(name => valid.has(name)));
  } catch { return new Set(); }
}
export function saveVisited(storage, visited) {
  try { storage.setItem(KEY, JSON.stringify([...visited])); return true; }
  catch { return false; }
}
export function nextPlace(places, visited, previousName=null, random=Math.random) {
  const available = places.filter(place => !visited.has(place.name));
  const candidates = available.filter(place => place.name !== previousName);
  // With only one unvisited place left, stop rather than repeat the previous hit.
  return candidates.length ? candidates[Math.floor(random()*candidates.length)] : null;
}
