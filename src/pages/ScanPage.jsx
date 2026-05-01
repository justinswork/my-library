import { useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Keyboard, RotateCcw, Library, AlertTriangle, Check, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import NavBar from '../components/NavBar.jsx';
import Scanner from '../components/Scanner.jsx';
import Sheet from '../components/Sheet.jsx';
import BookCover from '../components/BookCover.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { lookupByISBN, isbnCoverUrl } from '../api/openLibrary.js';
import { authorList, findExistingBook, copiesOf } from '../utils/book.js';

export default function ScanPage() {
  const navigate = useNavigate();
  const { books, wishlist, incrementCopies } = useData();
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [scannedIsbn, setScannedIsbn] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [decodingPhoto, setDecodingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const existing = useMemo(() => {
    if (!result) return null;
    return findExistingBook(books, result);
  }, [books, result]);

  const onlyOnWishlist = useMemo(() => {
    if (!existing || !wishlist) return false;
    const cids = existing.collectionIds || [];
    return cids.length === 1 && cids[0] === wishlist.id;
  }, [existing, wishlist]);

  const handleDetected = async (isbn) => {
    if (busy || result) return;
    setBusy(true);
    setError('');
    setScannedIsbn(isbn);
    try {
      const book = await lookupByISBN(isbn);
      if (book) {
        setResult(book);
      } else {
        setResult({
          isbn,
          title: '',
          authors: [],
          cover: isbnCoverUrl(isbn, 'M'),
          notFound: true
        });
      }
    } catch (e) {
      setError('Lookup failed. Check connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError('');
    setScannedIsbn(null);
    setConfirmation('');
  };

  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setDecodingPhoto(true);
    let tempScanner;
    try {
      const tempId = 'photo-decode-region';
      let tempEl = document.getElementById(tempId);
      if (!tempEl) {
        tempEl = document.createElement('div');
        tempEl.id = tempId;
        tempEl.style.display = 'none';
        document.body.appendChild(tempEl);
      }
      tempScanner = new Html5Qrcode(tempId);
      const text = await tempScanner.scanFile(file, false);
      const cleaned = String(text).replace(/[^0-9X]/gi, '');
      if (cleaned.length === 10 || cleaned.length === 13) {
        await handleDetected(cleaned);
      } else {
        setError(`Read "${text}" — that doesn't look like an ISBN. Try another photo.`);
      }
    } catch (err) {
      setError("Couldn't find a barcode in that photo. Try a clearer, closer shot.");
    } finally {
      try { tempScanner?.clear(); } catch {}
      setDecodingPhoto(false);
    }
  };

  const addAnotherCopy = async () => {
    if (!existing) return;
    setBusy(true);
    try {
      await incrementCopies(existing.id);
      setConfirmation(`Now ${copiesOf(existing) + 1} copies`);
    } finally {
      setBusy(false);
    }
  };

  const goAdd = () => {
    navigate('/add/from-scan', { state: { book: result } });
  };

  const openExisting = () => {
    if (existing) navigate(`/book/${existing.id}`);
  };

  return (
    <>
      <NavBar
        title="Scan"
        large
        action={
          <Link
            to="/add/manual"
            className="text-rose-deep p-2"
            aria-label="Manual entry"
          >
            <Keyboard size={22} />
          </Link>
        }
      />

      <div className="px-4 pb-6">
        <Scanner onDetected={handleDetected} paused={!!result || busy || decodingPhoto} />
        <p className="text-center text-[13px] text-ash mt-3">
          Hold the barcode 4–6 inches from the camera. Tap the screen to refocus.
        </p>

        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={decodingPhoto}
          className="ios-button-secondary w-full mt-3"
        >
          <Camera size={16} className="inline -mt-0.5 mr-2" />
          {decodingPhoto ? 'Reading photo…' : 'Trouble scanning? Take a photo'}
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPhotoSelected}
          className="hidden"
        />

        {error && (
          <div className="mt-3 text-center text-[13px] text-rose-deep">{error}</div>
        )}
      </div>

      <Sheet open={!!result} onClose={reset} title={result?.notFound ? 'Not found' : 'Book details'}>
        {result && (
          <div className="px-4 pb-6 flex flex-col gap-4">
            <div className="flex gap-4">
              <BookCover src={result.cover} title={result.title} size="md" />
              <div className="flex-1 min-w-0">
                {result.title ? (
                  <div className="font-bold text-[18px] leading-snug">{result.title}</div>
                ) : (
                  <div className="font-semibold text-ash">Book not found in catalog</div>
                )}
                {result.subtitle && (
                  <div className="text-[14px] text-ash mt-0.5">{result.subtitle}</div>
                )}
                {authorList(result) && (
                  <div className="text-[14px] mt-1">{authorList(result)}</div>
                )}
                {result.publisher && (
                  <div className="text-[12px] text-ash mt-1">
                    {result.publisher}
                    {result.publishedYear ? ` · ${result.publishedYear}` : ''}
                  </div>
                )}
                {scannedIsbn && (
                  <div className="text-[11px] font-mono text-ash mt-1">ISBN {scannedIsbn}</div>
                )}
              </div>
            </div>

            <StatusBanner
              existing={existing}
              onlyOnWishlist={onlyOnWishlist}
              notFound={result.notFound}
              confirmation={confirmation}
            />

            <div className="flex flex-col gap-2">
              {existing && !onlyOnWishlist && (
                <button onClick={addAnotherCopy} disabled={busy} className="ios-button">
                  Add another copy
                </button>
              )}
              {existing && (
                <button onClick={openExisting} className="ios-button-secondary">
                  <Library size={16} className="inline -mt-0.5 mr-2" />
                  View in library
                </button>
              )}
              {!existing && (
                <button onClick={goAdd} className="ios-button">
                  Add to library
                </button>
              )}
              {existing && onlyOnWishlist && (
                <button onClick={openExisting} className="ios-button">
                  Mark as acquired
                </button>
              )}
              <button onClick={reset} className="ios-button-secondary">
                <RotateCcw size={16} className="inline -mt-0.5 mr-2" />
                Scan another
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

function StatusBanner({ existing, onlyOnWishlist, notFound, confirmation }) {
  if (confirmation) {
    return (
      <div className="ios-card p-3 text-[13px] bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
        <Check size={16} className="shrink-0" />
        <div>{confirmation}</div>
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="ios-card p-3 text-[13px] bg-yellow-50 border border-yellow-200 text-yellow-900 flex gap-2">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          We couldn't find this book by its ISBN. You can still add it manually — the next
          screen will let you fill in the details.
        </div>
      </div>
    );
  }
  if (onlyOnWishlist) {
    return (
      <div className="ios-card p-3 text-[13px] bg-rose-soft/40 border border-rose-soft text-rose-deep">
        ★ This book is on the <strong>wishlist</strong>. Mark it as acquired and pick a collection?
      </div>
    );
  }
  if (!existing) {
    return (
      <div className="ios-card p-3 text-[13px] bg-emerald-50 border border-emerald-200 text-emerald-800">
        Not in your library yet.
      </div>
    );
  }
  const copies = copiesOf(existing);
  return (
    <div className="ios-card p-3 text-[13px] bg-rose-soft/40 border border-rose-soft text-rose-deep">
      <strong>
        Already owned · {copies} {copies === 1 ? 'copy' : 'copies'}
      </strong>
    </div>
  );
}
