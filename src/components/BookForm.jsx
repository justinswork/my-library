import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Search, X, Camera } from 'lucide-react';
import CollectionPicker from './CollectionPicker.jsx';
import BookCover from './BookCover.jsx';
import Sheet from './Sheet.jsx';
import { compressImage } from '../utils/image.js';
import { searchBooks } from '../api/openLibrary.js';

export default function BookForm({ initial = {}, submitLabel = 'Save', onSubmit, busy }) {
  const [title, setTitle] = useState(initial.title || '');
  const [subtitle, setSubtitle] = useState(initial.subtitle || '');
  const [authors, setAuthors] = useState((initial.authors || []).join(', '));
  const [isbn, setIsbn] = useState(initial.isbn || '');
  const [publisher, setPublisher] = useState(initial.publisher || '');
  const [publishedYear, setPublishedYear] = useState(initial.publishedYear || '');
  const [pageCount, setPageCount] = useState(initial.pageCount || '');
  const [cover, setCover] = useState(initial.cover || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [description, setDescription] = useState(initial.description || '');
  const [collectionIds, setCollectionIds] = useState(initial.collectionIds || []);
  const [copies, setCopies] = useState(
    typeof initial.copies === 'number' ? initial.copies : 1
  );
  const [readStatus, setReadStatus] = useState(
    initial.readStatus === 'read' || initial.readStatus === 'unread'
      ? initial.readStatus
      : null
  );
  const [imageBusy, setImageBusy] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [showCoverSearch, setShowCoverSearch] = useState(false);

  const toggleStatus = (status) => {
    setReadStatus((prev) => (prev === status ? null : status));
  };

  const openCoverSearch = () => setShowCoverSearch(true);
  const pickFoundCover = (url) => {
    setCover(url);
    setShowCoverSearch(false);
  };

  const onImagePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageBusy(true);
    try {
      const dataUri = await compressImage(file);
      if (dataUri) setCover(dataUri);
    } catch {
      // silent — cover field stays as-is
    } finally {
      setImageBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      subtitle: subtitle.trim(),
      authors: authors
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      isbn: isbn.trim() || null,
      publisher: publisher.trim(),
      publishedYear: publishedYear ? parseInt(publishedYear, 10) || null : null,
      pageCount: pageCount ? parseInt(pageCount, 10) || null : null,
      cover: cover.trim() || null,
      notes: notes.trim(),
      description: description.trim(),
      collectionIds,
      copies: Math.max(1, parseInt(copies, 10) || 1),
      readStatus
    });
  };

  return (
    <form onSubmit={submit} className="px-4 pb-8 flex flex-col gap-4">
      <div className="flex flex-col items-center pt-2 gap-3">
        <BookCover src={cover} title={title} size="lg" />
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={imageBusy}
            className="rounded-full bg-white border border-hairline px-4 py-1.5 text-[13px] font-medium text-rose-deep flex items-center gap-1.5 active:opacity-70 disabled:opacity-50"
          >
            <Camera size={14} />
            Take photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={imageBusy}
            className="rounded-full bg-white border border-hairline px-4 py-1.5 text-[13px] font-medium text-rose-deep flex items-center gap-1.5 active:opacity-70 disabled:opacity-50"
          >
            <ImageIcon size={14} />
            {imageBusy ? 'Processing…' : 'From gallery'}
          </button>
          <button
            type="button"
            onClick={openCoverSearch}
            className="rounded-full bg-white border border-hairline px-4 py-1.5 text-[13px] font-medium text-rose-deep flex items-center gap-1.5 active:opacity-70"
          >
            <Search size={14} />
            Search online
          </button>
          {cover && (
            <button
              type="button"
              onClick={() => setCover('')}
              className="rounded-full bg-white border border-hairline px-3 py-1.5 text-[13px] text-ash active:opacity-70"
              aria-label="Clear cover"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onImagePicked}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={onImagePicked}
          className="hidden"
        />
      </div>

      <CoverSearchSheet
        open={showCoverSearch}
        onClose={() => setShowCoverSearch(false)}
        defaultQuery={[title, (authors || '').split(',')[0]?.trim()].filter(Boolean).join(' ').trim()}
        onPick={pickFoundCover}
      />

      <div>
        <div className="text-[12px] uppercase tracking-wider text-ash px-1 pb-1.5">
          Read status
        </div>
        <div className="flex gap-2">
          <StatusPill
            active={readStatus === 'read'}
            onClick={() => toggleStatus('read')}
          >
            Read
          </StatusPill>
          <StatusPill
            active={readStatus === 'unread'}
            onClick={() => toggleStatus('unread')}
          >
            Unread
          </StatusPill>
        </div>
        <div className="text-[12px] text-ash px-1 pt-1.5">
          Optional. Tap an active button to clear it.
        </div>
      </div>

      <Field label="Title" required>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="ios-input"
        />
      </Field>
      <Field label="Subtitle">
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="ios-input"
        />
      </Field>
      <Field label="Author(s)" hint="Separate multiple with commas">
        <input
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          className="ios-input"
        />
      </Field>
      <Field label="ISBN">
        <input
          inputMode="numeric"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          className="ios-input"
        />
      </Field>
      <Field label="Publisher">
        <input
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          className="ios-input"
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Year">
          <input
            inputMode="numeric"
            value={publishedYear}
            onChange={(e) => setPublishedYear(e.target.value)}
            className="ios-input"
          />
        </Field>
        <Field label="Pages">
          <input
            inputMode="numeric"
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
            className="ios-input"
          />
        </Field>
        <Field label="Copies">
          <input
            inputMode="numeric"
            value={copies}
            onChange={(e) => setCopies(e.target.value)}
            className="ios-input"
          />
        </Field>
      </div>
      <Field label="Cover image URL" hint="Or use Choose image above">
        <input
          value={cover.startsWith('data:') ? '' : cover}
          onChange={(e) => setCover(e.target.value)}
          className="ios-input"
          placeholder={cover.startsWith('data:') ? 'Custom image set' : 'https://…'}
        />
      </Field>
      <Field label="Notes">
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="ios-input resize-none"
        />
      </Field>
      <Field label="Description">
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="ios-input resize-none"
        />
      </Field>

      <div>
        <div className="text-[12px] uppercase tracking-wider text-ash px-1 pb-1.5">
          Collections
        </div>
        <CollectionPicker value={collectionIds} onChange={setCollectionIds} />
      </div>

      <button type="submit" disabled={busy || !title.trim()} className="ios-button mt-2">
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

function CoverSearchSheet({ open, onClose, defaultQuery, onPick }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery(defaultQuery || '');
      setResults([]);
    }
  }, [open, defaultQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open || !debounced) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchBooks(debounced)
      .then((rs) => {
        if (cancelled) return;
        setResults(rs.filter((r) => r.cover));
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
  }, [debounced, open]);

  return (
    <Sheet open={open} onClose={onClose} title="Find cover online">
      <div className="px-4 pb-6 flex flex-col gap-3">
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

        {!debounced ? (
          <div className="text-center text-[13px] text-ash py-6">
            Enter a title or author to find covers from the Open Library catalog.
          </div>
        ) : searching && results.length === 0 ? (
          <div className="text-center text-[13px] text-ash py-6">Searching…</div>
        ) : results.length === 0 ? (
          <div className="text-center text-[13px] text-ash py-6">
            No covers found. Try different terms.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={`${r.isbn || r.title}-${i}`}
                type="button"
                onClick={() => onPick(r.cover)}
                className="flex flex-col gap-1.5 active:opacity-70"
              >
                <img
                  src={r.cover}
                  alt={r.title}
                  loading="lazy"
                  className="w-full aspect-[2/3] object-cover rounded-md bg-hairline shadow-card"
                />
                <div className="text-[12px] font-medium line-clamp-2 text-center px-1">
                  {r.title}
                </div>
                {r.authors?.[0] && (
                  <div className="text-[11px] text-ash line-clamp-1 text-center px-1 -mt-1">
                    {r.authors[0]}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose} className="ios-button-secondary mt-2">
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

function StatusPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 px-4 py-2.5 rounded-full text-[14px] font-semibold transition-colors ${
        active
          ? 'bg-rose text-white'
          : 'bg-white text-ink border border-hairline'
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children, required }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ash px-1">
        {label}
        {required && <span className="text-rose-deep"> *</span>}
      </span>
      {children}
      {hint && <span className="text-[12px] text-ash px-1">{hint}</span>}
    </label>
  );
}
