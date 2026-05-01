import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ChevronRight, Library, Star } from 'lucide-react';
import NavBar from '../components/NavBar.jsx';
import BookCover from '../components/BookCover.jsx';
import Sheet from '../components/Sheet.jsx';
import CollectionPicker from '../components/CollectionPicker.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { searchBooks, lookupByISBN, lookupByOLID } from '../api/openLibrary.js';
import { authorList, findExistingBook, copiesOf } from '../utils/book.js';

export default function SearchPage() {
  const { books, addBook, collections, wishlist } = useData();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [enriched, setEnriched] = useState(null);
  const [collectionIds, setCollectionIds] = useState([]);
  const [adding, setAdding] = useState(false);

  const lastSelectionRef = useRef(null);
  const defaultMyBooks = useMemo(
    () =>
      collections.find((c) => !c.isWishlist && c.name === 'My Books') ||
      collections.find((c) => !c.isWishlist) ||
      null,
    [collections]
  );

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchBooks(debounced)
      .then((r) => {
        if (!cancelled) setResults(r);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    if (!selected) return;
    setEnriched(selected);

    const existing = findExistingBook(books, selected);
    if (existing) {
      setCollectionIds(existing.collectionIds || []);
    } else if (lastSelectionRef.current) {
      setCollectionIds(lastSelectionRef.current);
    } else {
      setCollectionIds(defaultMyBooks ? [defaultMyBooks.id] : []);
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
  }, [selected, books, defaultMyBooks]);

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
      lastSelectionRef.current = collectionIds;
      close();
    } finally {
      setAdding(false);
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
      <NavBar title="Find" large />

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
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ash p-1"
            >
              <X size={16} />
            </button>
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
        ) : searching && results.length === 0 ? (
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

      <Sheet open={!!selected} onClose={close} title="Add this book">
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

            {existing && (
              <div className="ios-card p-3 text-[13px] bg-rose-soft/40 border border-rose-soft text-rose-deep">
                Already in library · {copiesOf(existing)}{' '}
                {copiesOf(existing) === 1 ? 'copy' : 'copies'}
              </div>
            )}

            <div>
              <div className="text-[12px] uppercase tracking-wider text-ash px-1 pb-1.5">
                Collections
              </div>
              <CollectionPicker value={collectionIds} onChange={setCollectionIds} />
            </div>

            <button onClick={submit} disabled={adding} className="ios-button">
              {adding ? 'Adding…' : buttonLabel}
            </button>
            <button onClick={close} className="ios-button-secondary">
              Cancel
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
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
