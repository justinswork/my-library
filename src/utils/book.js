export function bookKey(book) {
  if (book.isbn) return `isbn:${book.isbn}`;
  const t = (book.title || '').trim().toLowerCase();
  const a = ((book.authors || [])[0] || '').trim().toLowerCase();
  return `ta:${t}|${a}`;
}

export function findExistingBook(books, candidate) {
  const k = bookKey(candidate);
  if (!k || k === 'ta:|') return null;
  return books.find((b) => bookKey(b) === k) || null;
}

export function copiesOf(book) {
  return Math.max(1, book?.copies ?? 1);
}

export function groupDuplicates(books) {
  const map = new Map();
  for (const b of books) {
    const k = bookKey(b);
    const arr = map.get(k) || [];
    arr.push(b);
    map.set(k, arr);
  }
  return map;
}

export function matchesQuery(book, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  if ((book.title || '').toLowerCase().includes(needle)) return true;
  if ((book.authors || []).some((a) => a.toLowerCase().includes(needle))) return true;
  if ((book.isbn || '').includes(needle)) return true;
  return false;
}

export function authorList(book) {
  return (book.authors || []).join(', ');
}
