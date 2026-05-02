import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../components/NavBar.jsx';
import BookForm from '../components/BookForm.jsx';
import Loader from '../components/Loader.jsx';
import { useData } from '../contexts/DataContext.jsx';

const FORM_ID = 'book-edit-form';
const DISCARD_PROMPT = 'You have unsaved changes. Discard them?';

export default function BookEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, loaded, updateBook } = useData();
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    let consumedByConfirm = false;
    window.history.pushState({ editGuard: true }, '');
    const onPop = () => {
      if (window.history.state?.editGuard) return;
      if (window.confirm(DISCARD_PROMPT)) {
        consumedByConfirm = true;
      } else {
        window.history.forward();
      }
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPop);
      if (!consumedByConfirm && window.history.state?.editGuard) {
        window.history.back();
      }
    };
  }, [dirty]);

  if (!loaded) return <Loader />;
  const book = books.find((b) => b.id === id);
  if (!book) {
    return (
      <>
        <NavBar title="Edit" back />
        <div className="px-4 py-12 text-center text-ash">Book not found.</div>
      </>
    );
  }

  const handleBack = () => {
    if (dirtyRef.current && !window.confirm(DISCARD_PROMPT)) return;
    setDirty(false);
    navigate(-1);
  };

  const submit = async (data) => {
    setBusy(true);
    try {
      await updateBook(id, data);
      setDirty(false);
      navigate(`/book/${id}`, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <NavBar
        title="Edit Book"
        back={handleBack}
        action={
          <button
            type="submit"
            form={FORM_ID}
            disabled={busy || !dirty}
            className="text-rose-deep font-semibold px-2 py-1 active:opacity-60 disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        }
      />
      <BookForm
        id={FORM_ID}
        initial={book}
        submitLabel="Save"
        onSubmit={submit}
        busy={busy}
        onDirtyChange={setDirty}
        hideSubmit
      />
    </>
  );
}
