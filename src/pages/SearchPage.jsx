import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight, Library, Star } from 'lucide-react';
import NavBar from '../components/NavBar.jsx';
import BookCover from '../components/BookCover.jsx';
import Sheet from '../components/Sheet.jsx';
import CollectionPicker from '../components/CollectionPicker.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { searchBooks, lookupByISBN, lookupByOLID } from '../api/openLibrary.js';
import { authorList, findExistingBook, copiesOf } from '../utils/book.js';
import {
  pickDefaultCollectionIds,
  setLastCollections
} from '../utils/lastCollections.js';

export default function SearchPage() {
  const { books, addBook, updateBook, collections, wishlist } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const updateMode = location.state?.updateMode || null;
  const targetBook = updateMode ? books.find((b) => b.id === updateMode.bookId) : null;

  const [query, setQuery] = useState(updateMode?.query || '');
  const [debounced, setDebounced] = useState(updateMode?.query?.trim() || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [enriched, setEnriched] = useState(null);
  const [collectionIds, setCollectionIds] = useState([]);
  const [adding, setAdding] = useState(false);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    searchBooks(debounced, { signal: controller.signal })
      .then((r) => {
        if (controller.signal.aborted) return;
        setResults(r);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    if (!selected) return;
    setEnriched(selected);

    const existing = findExistingBook(books, selected);
    if (existing) {
      setCollectionIds(existing.collectionIds || []);
    } else {
      setCollectionIds(pickDefaultCollectionIds(collections));
    }

    let cancelled = false;
    const enrich = async () => {
      let full = null;
      if (selected.isbn) full = await lookupByISBN(selected.isbn).catch(() => null);
      if (!full && selected.editionKey)
        full = await lookupByOLID(selected.editionKey).catch(() => null);
      if (cancelled || !full) return;
      const merged = { ...selected };
      for (const [k, v] of Object.entries(full)) {
        if (v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) merged[k] = v;
      }
      setEnriched(merged);
    };
    enrich();
    return () => {
      cancelled = true;
    };
  }, [selected, books, collections]);

  const existing = useMemo(
    () => (selected ? findExistingBook(books, selected) : null),
    [books, selected]
  );

  const close = () => {
    setSelected(null);
    setEnriched(null);
  };

  const submit = async () => {
    if (!enriched) return;
    setAdding(true);
    try {
      await addBook({ ...enriched, collectionIds });
      setLastCollections(collectionIds);
      close();
    } finally {
      setAdding(false);
    }
  };

  const replaceDetails = async () => {
    if (!enriched || !existing) return;
    setReplacing(true);
    try {
      await updateBook(existing.id, {
        isbn: enriched.isbn || null,
        title: enriched.title || existing.title || '',
        subtitle: enriched.subtitle || '',
        authors: enriched.authors?.length ? enriched.authors : existing.authors || [],
        publisher: enriched.publisher || '',
        publishedYear: enriched.publishedYear || null,
        pageCount: enriched.pageCount || null,
        cover: enriched.cover || existing.cover || null,
        description: enriched.description || existing.description || ''
      });
      close();
    } finally {
      setReplacing(false);
    }
  };

  const applyToTarget = async (mode) => {
    if (!enriched || !targetBook) return;
    setReplacing(true);
    try {
      const patch = buildPatch(enriched, targetBook, mode);
      await updateBook(targetBook.id, patch);
      navigate(`/book/${targetBook.id}`, {
        replace: true,
        state: { detailsUpdated: true }
      });
    } finally {
      setReplacing(false);
    }
  };

  const buttonLabel = useMemo(() => {
    const onlyWishlist =
      wishlist && collectionIds.length === 1 && collectionIds[0] === wishlist.id;
    if (existing) return onlyWishlist ? 'Add another to wishlist' : 'Add another copy';
    return onlyWishlist ? 'Add to wishlist' : 'Add to library';
  }, [collectionIds, existing, wishlist]);

  return (
    <>
      <NavBar
        title={updateMode ? 'Update Details' : 'Find'}
        large={!updateMode}
        back={updateMode ? `/book/${updateMode.bookId}` : undefined}
      />

      {updateMode && targetBook && (
        <div className="px-4 pb-3 -mt-1">
          <div className="ios-card p-3 text-[13px] text-ash">
            Pick a search result to update <strong className="text-ink">{targetBook.title}</strong>.
          </div>
        </div>
      )}

      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, author, or ISBN"
            autoFocus
            className="ios-input pl-10 pr-10 bg-white"
          />
          {searching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full border-2 border-hairline border-t-rose animate-spin" />
            </div>
          ) : (
            query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ash p-1"
              >
                <X size={16} />
              </button>
            )
          )}
        </div>
      </div>

      <div className="px-4">
        {!debounced ? (
          <EmptyState
            icon={Search}
            title="Find a book"
            body="Search by title, author, or ISBN to add to your library or wishlist."
          />
        ) : results.length === 0 && searching ? (
          <div className="py-12 text-center text-ash">Searching…</div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No results"
            body="Try different terms, or add the book manually from the Library tab."
          />
        ) : (
          <div className="ios-list">
            {results.map((b, i) => (
              <ResultRow
                key={`${b.isbn || b.title}-${i}`}
                book={b}
                existing={findExistingBook(books, b)}
                wishlist={wishlist}
                onClick={() => setSelected(b)}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet
        open={!!selected}
        onClose={close}
        title={updateMode ? 'Update with this result?' : 'Add this book'}
      >
        {enriched && (
          <div className="px-4 pb-6 flex flex-col gap-4">
            <div className="flex gap-4">
              <BookCover src={enriched.cover} title={enriched.title} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[18px] leading-snug">{enriched.title}</div>
                {enriched.subtitle && (
                  <div className="text-[14px] text-ash mt-0.5">{enriched.subtitle}</div>
                )}
                {authorList(enriched) && (
                  <div className="text-[14px] mt-1">{authorList(enriched)}</div>
                )}
                {enriched.publisher && (
                  <div className="text-[12px] text-ash mt-1">
                    {enriched.publisher}
                    {enriched.publishedYear ? ` · ${enriched.publishedYear}` : ''}
                  </div>
                )}
                {enriched.isbn && (
                  <div className="text-[11px] font-mono text-ash mt-1">ISBN {enriched.isbn}</div>
                )}
              </div>
            </div>

            {!updateMode && existing && (
              <div className="ios-card p-3 text-[13px] bg-rose-soft/40 border border-rose-soft text-rose-deep">
                Already in library · {copiesOf(existing)}{' '}
                {copiesOf(existing) === 1 ? 'copy' : 'copies'}
              </div>
            )}

            {updateMode && targetBook && (
              <div className="ios-card p-3 text-[13px] text-ash">
                Will update <strong className="text-ink">{targetBook.title}</strong>. Your
                copies, collections, and notes will be kept.
              </div>
            )}

            {!updateMode && (
              <div>
                <div className="text-[12px] uppercase tracking-wider text-ash px-1 pb-1.5">
                  Collections
                </div>
                <CollectionPicker value={collectionIds} onChange={setCollectionIds} />
              </div>
            )}

            {updateMode ? (
              <>
                <button
                  onClick={() => applyToTarget('replace')}
                  disabled={replacing}
                  className="ios-button"
                >
                  {replacing ? 'Updating…' : 'Replace all details'}
                </button>
                <button
                  onClick={() => applyToTarget('fill')}
                  disabled={replacing}
                  className="ios-button-secondary"
                >
                  Only fill in blanks
                </button>
              </>
            ) : (
              <>
                <button onClick={submit} disabled={adding || replacing} className="ios-button">
                  {adding ? 'Adding…' : buttonLabel}
                </button>
                {existing && (
                  <button
                    onClick={replaceDetails}
                    disabled={adding || replacing}
                    className="ios-button-secondary"
                  >
                    {replacing ? 'Updating…' : 'Replace existing details with this result'}
                  </button>
                )}
              </>
            )}
            <button onClick={close} className="ios-button-secondary">
              Cancel
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}

function buildPatch(enriched, target, mode) {
  const fields = {
    isbn: enriched.isbn || null,
    title: enriched.title || '',
    subtitle: enriched.subtitle || '',
    authors: enriched.authors || [],
    publisher: enriched.publisher || '',
    publishedYear: enriched.publishedYear || null,
    pageCount: enriched.pageCount || null,
    cover: enriched.cover || null,
    description: enriched.description || ''
  };
  if (mode === 'replace') {
    return fields;
  }
  const patch = {};
  for (const [k, v] of Object.entries(fields)) {
    const current = target[k];
    const isEmpty =
      current == null ||
      current === '' ||
      (Array.isArray(current) && current.length === 0);
    if (!isEmpty) continue;
    const hasValue =
      v != null && v !== '' && !(Array.isArray(v) && v.length === 0);
    if (hasValue) patch[k] = v;
  }
  return patch;
}

function ResultRow({ book, existing, wishlist, onClick }) {
  const onWishlist = wishlist && (existing?.collectionIds || []).includes(wishlist.id);
  const ownedElsewhere =
    existing && (existing.collectionIds || []).some((id) => id !== wishlist?.id);

  return (
    <button onClick={onClick} className="ios-row w-full text-left">
      <BookCover src={book.cover} title={book.title} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] truncate">{book.title}</div>
        {authorList(book) && (
          <div className="text-[13px] text-ash truncate">{authorList(book)}</div>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          {book.publishedYear && (
            <span className="text-[11px] text-ash">{book.publishedYear}</span>
          )}
          {ownedElsewhere && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-soft text-rose-deep rounded-full px-2 py-0.5">
              <Library size={11} strokeWidth={2.2} />×{copiesOf(existing)}
            </span>
          )}
          {onWishlist && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose text-white rounded-full px-2 py-0.5">
              <Star size={10} strokeWidth={2.5} fill="currentColor" />
              Wishlist
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-ash shrink-0" />
    </button>
  );
}
