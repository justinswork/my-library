import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar.jsx';
import BookForm from '../components/BookForm.jsx';
import { useData } from '../contexts/DataContext.jsx';

export default function ManualAddPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addBook, collections, wishlist } = useData();
  const [busy, setBusy] = useState(false);

  const fromScan = location.state?.book || null;
  const presetCollectionIds = location.state?.collectionIds || [];
  const defaultMyBooks = collections.find((c) => !c.isWishlist && c.name === 'My Books');

  const initial = fromScan
    ? {
        ...fromScan,
        collectionIds: presetCollectionIds.length
          ? presetCollectionIds
          : defaultMyBooks
          ? [defaultMyBooks.id]
          : []
      }
    : {
        collectionIds: defaultMyBooks ? [defaultMyBooks.id] : []
      };

  const submit = async (data) => {
    setBusy(true);
    try {
      const { id, merged } = await addBook(data);
      navigate(`/book/${id}`, { replace: true, state: { merged } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <NavBar title={fromScan ? 'Add to Library' : 'Manual Entry'} back />
      <BookForm initial={initial} submitLabel="Add to Library" onSubmit={submit} busy={busy} />
    </>
  );
}
