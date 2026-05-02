const BASE = 'https://openlibrary.org';
const COVERS = 'https://covers.openlibrary.org/b';

export function coverUrl(coverId, size = 'M') {
  if (!coverId) return null;
  return `${COVERS}/id/${coverId}-${size}.jpg`;
}

export function isbnCoverUrl(isbn, size = 'M') {
  if (!isbn) return null;
  return `${COVERS}/isbn/${isbn}-${size}.jpg`;
}

function parseYear(s) {
  const m = String(s).match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}

async function fetchBibkey(bibkey) {
  const res = await fetch(
    `${BASE}/api/books?bibkeys=${encodeURIComponent(bibkey)}&jscmd=data&format=json`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[bibkey] || null;
}

function normalizeEntry(entry, isbnHint = null) {
  if (!entry) return null;
  const isbn =
    isbnHint ||
    entry.identifiers?.isbn_13?.[0] ||
    entry.identifiers?.isbn_10?.[0] ||
    null;
  return {
    isbn,
    title: entry.title || '',
    subtitle: entry.subtitle || '',
    authors: (entry.authors || []).map((a) => a.name),
    publisher: (entry.publishers || [])[0]?.name || '',
    publishedYear: entry.publish_date ? parseYear(entry.publish_date) : null,
    pageCount: entry.number_of_pages || null,
    cover: entry.cover?.medium || (isbn ? isbnCoverUrl(isbn, 'M') : null),
    coverLarge: entry.cover?.large || (isbn ? isbnCoverUrl(isbn, 'L') : null),
    description: ''
  };
}

export async function lookupByISBN(isbn) {
  const cleaned = String(isbn || '').replace(/[^0-9X]/gi, '');
  if (!cleaned) return null;
  const entry = await fetchBibkey(`ISBN:${cleaned}`);
  return normalizeEntry(entry, cleaned);
}

export async function lookupByOLID(olid) {
  if (!olid) return null;
  const entry = await fetchBibkey(`OLID:${olid}`);
  return normalizeEntry(entry);
}

export async function searchBooks(query, { signal } = {}) {
  const res = await fetch(
    `${BASE}/search.json?q=${encodeURIComponent(query)}&limit=15&fields=key,title,subtitle,author_name,isbn,cover_i,first_publish_year,publisher,number_of_pages_median,edition_key,cover_edition_key`,
    { signal }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.docs || []).map((d) => ({
    isbn: (d.isbn || []).find((s) => s && s.length === 13) || d.isbn?.[0] || null,
    title: d.title || '',
    subtitle: d.subtitle || '',
    authors: d.author_name || [],
    publisher: (d.publisher || [])[0] || '',
    publishedYear: d.first_publish_year || null,
    pageCount: d.number_of_pages_median || null,
    cover: d.cover_i ? coverUrl(d.cover_i, 'S') : null,
    coverMedium: d.cover_i ? coverUrl(d.cover_i, 'M') : null,
    editionKey: d.cover_edition_key || (d.edition_key || [])[0] || null
  }));
}
