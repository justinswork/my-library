const KEY = 'my-library:last-collections';

export function getLastCollections() {
  try {
    const v = localStorage.getItem(KEY);
    if (!v) return null;
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setLastCollections(ids) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids || []));
  } catch {}
}

export function pickDefaultCollectionIds(allCollections, fallbackName = 'My Books') {
  const remembered = getLastCollections();
  if (remembered && remembered.length > 0) {
    const valid = remembered.filter((id) => allCollections.some((c) => c.id === id));
    if (valid.length > 0) return valid;
  }
  const fallback =
    allCollections.find((c) => !c.isWishlist && c.name === fallbackName) ||
    allCollections.find((c) => !c.isWishlist);
  return fallback ? [fallback.id] : [];
}
