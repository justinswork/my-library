import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar.jsx';
import BookForm from '../components/BookForm.jsx';
import { useData } from '../contexts/DataContext.jsx';
import {
  pickDefaultCollectionIds,
  setLastCollections
} from '../utils/lastCollections.js';

export default function ManualAddPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addBook, collections } = useData();
  const [busy, setBusy] = useState(false);

  const fromScan = location.state?.book || null;
  const presetCollectionIds = location.state?.collectionIds || [];
  const defaults = pickDefaultCollectionIds(collections);

  const initial = fromScan
    ? {
        ...fromScan,
        collectionIds: presetCollectionIds.length ? presetCollectionIds : defaults
      }
    : { collectionIds: defaults };

  const submit = async (data) => {
    setBusy(true);
    try {
      const { id, merged } = await addBook(data);
      setLastCollections(data.collectionIds || []);
      if (fromScan) {
        navigate('/scan', {
          replace: true,
          state: { added: { title: data.title, merged } }
        });
      } else {
        navigate(`/book/${id}`, { replace: true, state: { merged } });
      }
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
