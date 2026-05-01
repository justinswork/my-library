import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  X,
  Library,
  ChevronDown,
  Check,
  Star,
  Folder,
  BookMarked,
  SlidersHorizontal,
  Copy
} from 'lucide-react';
import NavBar from '../components/NavBar.jsx';
import BookListItem from '../components/BookListItem.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import Sheet from '../components/Sheet.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { matchesQuery, copiesOf } from '../utils/book.js';

const SORT_OPTIONS = [
  { id: 'date-desc', label: 'Date added — newest first' },
  { id: 'date-asc', label: 'Date added — oldest first' },
  { id: 'title-asc', label: 'Title — A to Z' },
  { id: 'title-desc', label: 'Title — Z to A' }
];
const SORT_KEY = 'library:sort';

export default function LibraryPage() {
  const { books, collections, loaded, wishlist } = useData();
  const [query, setQuery] = useState('');
  const [filterCollection, setFilterCollection] = useState('all');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(SORT_KEY) : null;
    return SORT_OPTIONS.some((o) => o.id === saved) ? saved : 'date-desc';
  });

  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, sortBy);
    } catch {}
  }, [sortBy]);

  const collectionsById = useMemo(
    () => Object.fromEntries(collections.map((c) => [c.id, c])),
    [collections]
  );

  const ownedBooks = useMemo(
    () =>
      books.filter(
        (b) =>
          !wishlist ||
          !(b.collectionIds || []).includes(wishlist.id) ||
          (b.collectionIds || []).length > 1
      ),
    [books, wishlist]
  );

  const filtered = useMemo(() => {
    const arr = books
      .filter((b) => {
        if (filterCollection === 'all') {
          if (
            wishlist &&
            (b.collectionIds || []).length === 1 &&
            (b.collectionIds || [])[0] === wishlist.id
          ) {
            return false;
          }
          return true;
        }
        return (b.collectionIds || []).includes(filterCollection);
      })
      .filter((b) => matchesQuery(b, query))
      .filter((b) => !showDuplicatesOnly || copiesOf(b) > 1);

    const titleCmp = (a, b) =>
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
    const dateOf = (b) => b.addedAt?.seconds ?? 0;

    if (sortBy === 'title-asc') return [...arr].sort(titleCmp);
    if (sortBy === 'title-desc') return [...arr].sort((a, b) => titleCmp(b, a));
    if (sortBy === 'date-asc') return [...arr].sort((a, b) => dateOf(a) - dateOf(b));
    return arr;
  }, [books, filterCollection, query, wishlist, showDuplicatesOnly, sortBy]);

  const filtersActive = sortBy !== 'date-desc' || showDuplicatesOnly;

  const currentName =
    filterCollection === 'all'
      ? 'All Books'
      : collections.find((c) => c.id === filterCollection)?.name || 'All Books';

  const pick = (id) => {
    setFilterCollection(id);
    setShowPicker(false);
  };

  if (!loaded) return <Loader />;

  return (
    <>
      <NavBar
        title="Library"
        large
        action={
          <Link
            to="/add/manual"
            className="text-rose-deep p-2 active:opacity-60"
            aria-label="Add manually"
          >
            <Plus size={26} strokeWidth={2} />
          </Link>
        }
      />

      <div className="px-4 pb-2">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, ISBN"
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

      <div className="px-4 pb-3 flex gap-2 items-stretch">
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex-1 bg-white border border-hairline rounded-full px-4 py-2 flex items-center gap-2 text-left active:opacity-70"
        >
          <CollectionGlyph id={filterCollection} wishlist={wishlist} />
          <span className="font-medium text-[15px] truncate flex-1">{currentName}</span>
          <ChevronDown size={16} className="text-ash shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          aria-label="Sort and filter"
          className={`px-3 rounded-full border flex items-center gap-1.5 transition-colors ${
            filtersActive
              ? 'bg-rose-deep text-white border-rose-deep'
              : 'bg-white text-ink border-hairline'
          }`}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      <div className="px-4">
        {filtered.length === 0 ? (
          books.length === 0 ? (
            <EmptyState
              icon={Library}
              title="Your library is empty"
              body="Scan a barcode or add a book manually to get started."
              action={
                <Link to="/scan" className="ios-button inline-block">
                  Scan a book
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={Search}
              title={showDuplicatesOnly ? 'No duplicates' : 'No matches'}
              body={
                showDuplicatesOnly
                  ? 'Nothing in this view has multiple copies.'
                  : 'Try a different search or filter.'
              }
            />
          )
        ) : (
          <div className="ios-list">
            {filtered.map((book) => (
              <BookListItem
                key={book.id}
                book={book}
                duplicateCount={copiesOf(book)}
                collectionsById={collectionsById}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={showOptions} onClose={() => setShowOptions(false)} title="Sort & Filter">
        <div className="px-4 pb-6 flex flex-col gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-wider text-ash px-1 pb-1.5">
              Sort by
            </div>
            <div className="ios-list">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortBy(opt.id)}
                  className="ios-row w-full text-left"
                >
                  <div className="flex-1 font-medium">{opt.label}</div>
                  {sortBy === opt.id && <Check size={20} className="text-rose-deep" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[12px] uppercase tracking-wider text-ash px-1 pb-1.5">
              Filter
            </div>
            <div className="ios-list">
              <button
                type="button"
                onClick={() => setShowDuplicatesOnly((v) => !v)}
                className="ios-row w-full text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-rose-soft/60 text-rose-deep flex items-center justify-center">
                  <Copy size={16} strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Duplicates only</div>
                  <div className="text-[13px] text-ash">Books with more than one copy</div>
                </div>
                {showDuplicatesOnly && <Check size={20} className="text-rose-deep" />}
              </button>
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet open={showPicker} onClose={() => setShowPicker(false)} title="Show books in">
        <div className="px-4 pb-6">
          <div className="ios-list">
            <PickerRow
              active={filterCollection === 'all'}
              onClick={() => pick('all')}
              icon={<BookMarked size={18} strokeWidth={2} />}
              label="All Books"
              count={ownedBooks.length}
            />
            {[...collections]
              .sort((a, b) => (a.isWishlist ? -1 : b.isWishlist ? 1 : 0))
              .map((c) => (
                <PickerRow
                  key={c.id}
                  active={filterCollection === c.id}
                  onClick={() => pick(c.id)}
                  icon={
                    c.isWishlist ? (
                      <Star size={18} strokeWidth={2} fill="currentColor" />
                    ) : (
                      <Folder size={18} strokeWidth={2} />
                    )
                  }
                  iconClassName={c.isWishlist ? 'bg-rose text-white' : 'bg-rose-soft/60 text-rose-deep'}
                  label={c.name}
                  count={books.filter((b) => (b.collectionIds || []).includes(c.id)).length}
                />
              ))}
          </div>
        </div>
      </Sheet>
    </>
  );
}

function PickerRow({ active, onClick, icon, iconClassName, label, count }) {
  return (
    <button type="button" onClick={onClick} className="ios-row w-full text-left">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          iconClassName || 'bg-rose-soft/60 text-rose-deep'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-[13px] text-ash">
          {count} {count === 1 ? 'book' : 'books'}
        </div>
      </div>
      {active && <Check size={20} className="text-rose-deep" />}
    </button>
  );
}

function CollectionGlyph({ id, wishlist }) {
  if (id === 'all') {
    return (
      <div className="w-7 h-7 rounded-md bg-rose-soft/60 text-rose-deep flex items-center justify-center">
        <BookMarked size={14} strokeWidth={2} />
      </div>
    );
  }
  if (wishlist && id === wishlist.id) {
    return (
      <div className="w-7 h-7 rounded-md bg-rose text-white flex items-center justify-center">
        <Star size={14} strokeWidth={2} fill="currentColor" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-md bg-rose-soft/60 text-rose-deep flex items-center justify-center">
      <Folder size={14} strokeWidth={2} />
    </div>
  );
}
