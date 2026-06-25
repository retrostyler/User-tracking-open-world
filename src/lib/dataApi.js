export async function fetchJson(path) {
  const response = await fetch(path, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

export function getAvailableDates(index) {
  return [...new Set(index.map((m) => m.date).filter(Boolean))].sort();
}

export function getAvailableMaps(index) {
  return [...new Set(index.map((m) => m.map_id).filter(Boolean))].sort();
}

export function filterMatches(index, { mapId, date }) {
  return index.filter((match) => {
    if (mapId !== 'all' && match.map_id !== mapId) return false;
    if (date !== 'all' && match.date !== date) return false;
    return true;
  });
}
