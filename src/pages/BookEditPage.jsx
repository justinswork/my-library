import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../components/NavBar.jsx';
import BookForm from '../components/BookForm.jsx';
import Loader from '../components/Loader.jsx';
import { useData } from '../contexts/DataContext.jsx';

export default function BookEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, loaded, updateBook } = useData();
  const [busy, setBusy] = useState(false);

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

  const submit = async (data) => {
    setBusy(true);
    try {
      await updateBook(id, data);
      navigate(`/book/${id}`, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <NavBar title="Edit Book" back />
      <BookForm initial={book} submitLabel="Save" onSubmit={submit} busy={busy} />
    </>
  );
}
