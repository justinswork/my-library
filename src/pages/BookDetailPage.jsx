import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, Star, Minus, Plus } from 'lucide-react';
import NavBar from '../components/NavBar.jsx';
import BookCover from '../components/BookCover.jsx';
import Sheet from '../components/Sheet.jsx';
import CollectionPicker from '../components/CollectionPicker.jsx';
import Loader from '../components/Loader.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { authorList, copiesOf } from '../utils/book.js';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    books,
    collections,
    loaded,
    updateBook,
    deleteBook,
    incrementCopies,
    decrementCopies,
    wishlist
  } = useData();
  const [showCols, setShowCols] = useState(false);
  const [colSelection, setColSelection] = useState([]);
  const [mergedBanner, setMergedBanner] = useState(!!location.state?.merged);

  useEffect(() => {
    if (!mergedBanner) return;
    const t = setTimeout(() => setMergedBanner(false), 4000);
    return () => clearTimeout(t);
  }, [mergedBanner]);

  if (!loaded) return <Loader />;
  const book = books.find((b) => b.id === id);
  if (!book) {
    return (
      <>
        <NavBar title="Book" back />
        <div className="px-4 py-12 text-center text-ash">Book not found.</div>
      </>
    );
  }

  const copies = copiesOf(book);
  const collectionNames = (book.collectionIds || [])
    .map((cid) => collections.find((c) => c.id === cid)?.name)
    .filter(Boolean);
  const onWishlist = wishlist && (book.collectionIds || []).includes(wishlist.id);
  const onlyOnWishlist =
    wishlist &&
    (book.collectionIds || []).length === 1 &&
    (book.collectionIds || [])[0] === wishlist.id;

  const openCols = () => {
    setColSelection(book.collectionIds || []);
    setShowCols(true);
  };

  const saveCols = async () => {
    await updateBook(book.id, { collectionIds: colSelection });
    setShowCols(false);
  };

  const moveOffWishlist = async () => {
    if (!wishlist) return;
    const next = (book.collectionIds || []).filter((c) => c !== wishlist.id);
    await updateBook(book.id, { collectionIds: next });
  };

  const remove = async () => {
    if (!confirm('Delete this book from your library?')) return;
    await deleteBook(book.id);
    navigate(-1);
  };

  return (
    <>
      <NavBar
        title="Book"
        back
        action={
          <Link to={`/edit/${book.id}`} className="text-rose-deep p-2" aria-label="Edit">
            <Pencil size={20} />
          </Link>
        }
      />

      <div className="px-4 flex flex-col items-center gap-4 pt-4">
        {mergedBanner && (
          <div className="w-full ios-card p-3 text-[13px] bg-emerald-50 border border-emerald-200 text-emerald-800">
            Already in your library — added another copy.
          </div>
        )}
        <BookCover src={book.cover} title={book.title} size="xl" />
        <div className="text-center">
          <h2 className="text-[22px] font-bold tracking-tight leading-tight">
            {book.title}
          </h2>
          {book.subtitle && (
            <div className="text-[15px] text-ash mt-1">{book.subtitle}</div>
          )}
          {authorList(book) && (
            <div className="text-[15px] mt-1">{authorList(book)}</div>
          )}
        </div>

        {!onlyOnWishlist && (
          <div className="w-full">
            <SectionLabel>Copies owned</SectionLabel>
            <div className="ios-card p-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => decrementCopies(book.id)}
                disabled={copies <= 1}
                aria-label="Decrease copies"
                className="w-10 h-10 rounded-full bg-rose-soft/60 text-rose-deep flex items-center justify-center disabled:opacity-40 active:opacity-70"
              >
                <Minus size={18} strokeWidth={2.4} />
              </button>
              <div className="text-[28px] font-bold tabular-nums">{copies}</div>
              <button
                type="button"
                onClick={() => incrementCopies(book.id)}
                aria-label="Increase copies"
                className="w-10 h-10 rounded-full bg-rose text-white flex items-center justify-center active:opacity-70"
              >
                <Plus size={18} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        )}

        {onWishlist && (
          <button
            onClick={moveOffWishlist}
            className="w-full ios-button"
          >
            <Star size={16} className="inline -mt-0.5 mr-2" />
            I got this book — remove from wishlist
          </button>
        )}

        <div className="w-full">
          <SectionLabel>Collections</SectionLabel>
          <button onClick={openCols} className="w-full ios-card p-4 text-left">
            {collectionNames.length === 0 ? (
              <span className="text-ash">Tap to add to a collection</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {collectionNames.map((n) => (
                  <span
                    key={n}
                    className="text-[13px] bg-rose-soft/50 text-rose-deep rounded-full px-3 py-1"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}
          </button>
        </div>

        <div className="w-full">
          <SectionLabel>Details</SectionLabel>
          <div className="ios-list text-[15px]">
            {book.isbn && <Row label="ISBN" value={book.isbn} mono />}
            {book.publisher && <Row label="Publisher" value={book.publisher} />}
            {book.publishedYear && <Row label="Year" value={String(book.publishedYear)} />}
            {book.pageCount && <Row label="Pages" value={String(book.pageCount)} />}
          </div>
        </div>

        {book.notes && (
          <div className="w-full">
            <SectionLabel>Notes</SectionLabel>
            <div className="ios-card p-4 text-[15px] whitespace-pre-wrap">{book.notes}</div>
          </div>
        )}

        {book.description && (
          <div className="w-full">
            <SectionLabel>Description</SectionLabel>
            <div className="ios-card p-4 text-[14px] text-ink/90">{book.description}</div>
          </div>
        )}

        <button onClick={remove} className="w-full ios-button-secondary text-rose-deep mb-4">
          <Trash2 size={16} className="inline -mt-0.5 mr-2" />
          Delete book
        </button>
      </div>

      <Sheet open={showCols} onClose={() => setShowCols(false)} title="Collections">
        <div className="px-4 pb-6 flex flex-col gap-3">
          <CollectionPicker value={colSelection} onChange={setColSelection} />
          <button onClick={saveCols} className="ios-button">
            Save
          </button>
        </div>
      </Sheet>
    </>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[12px] uppercase tracking-wider text-ash px-1 pb-1.5 pt-2">
      {children}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="px-4 py-3 flex justify-between items-center gap-3">
      <span className="text-ash">{label}</span>
      <span className={`text-right ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</span>
    </div>
  );
}
