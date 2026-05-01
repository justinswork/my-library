import { useState } from 'react';
import CollectionPicker from './CollectionPicker.jsx';
import BookCover from './BookCover.jsx';

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
      collectionIds
    });
  };

  return (
    <form onSubmit={submit} className="px-4 pb-8 flex flex-col gap-4">
      <div className="flex justify-center pt-2">
        <BookCover src={cover} title={title} size="lg" />
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
      <div className="grid grid-cols-2 gap-3">
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
      </div>
      <Field label="Cover image URL">
        <input
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          className="ios-input"
          placeholder="https://…"
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
