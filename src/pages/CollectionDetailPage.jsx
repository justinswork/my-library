import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import NavBar from '../components/NavBar.jsx';
import BookListItem from '../components/BookListItem.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Sheet from '../components/Sheet.jsx';
import Loader from '../components/Loader.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { Library } from 'lucide-react';
import { bookKey } from '../utils/book.js';

export default function CollectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { collections, books, loaded, renameCollection, deleteCollection } = useData();
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState('');

  if (!loaded) return <Loader />;
  const collection = collections.find((c) => c.id === id);
  if (!collection) {
    return (
      <>
        <NavBar title="Collection" back />
        <EmptyState title="Collection not found" />
      </>
    );
  }

  const filtered = books.filter((b) => (b.collectionIds || []).includes(id));
  const collectionsById = Object.fromEntries(collections.map((c) => [c.id, c]));
  const counts = (() => {
    const m = new Map();
    for (const b of filtered) {
      const k = bookKey(b);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  })();

  const openEdit = () => {
    setName(collection.name);
    setShowEdit(true);
  };

  const saveName = async () => {
    if (!name.trim() || name === collection.name) {
      setShowEdit(false);
      return;
    }
    await renameCollection(id, name.trim());
    setShowEdit(false);
  };

  const remove = async () => {
    if (!confirm(`Delete "${collection.name}"? Books in it won't be deleted.`)) return;
    await deleteCollection(id);
    navigate('/collections');
  };

  return (
    <>
      <NavBar
        title={collection.name}
        back="/collections"
        action={
          !collection.isWishlist && (
            <button onClick={openEdit} className="text-rose-deep p-2" aria-label="Edit">
              <Pencil size={20} />
            </button>
          )
        }
      />

      <div className="px-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Library}
            title="No books here yet"
            body="Add books to this collection from the book detail page."
          />
        ) : (
          <div className="ios-list">
            {filtered.map((b) => (
              <BookListItem
                key={b.id}
                book={b}
                duplicateCount={counts.get(bookKey(b)) || 1}
                collectionsById={collectionsById}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={showEdit} onClose={() => setShowEdit(false)} title="Edit collection">
        <div className="px-4 pb-6 flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="ios-input"
            autoFocus
          />
          <button onClick={saveName} className="ios-button">
            Save
          </button>
          <button onClick={remove} className="ios-button-secondary text-rose-deep">
            <Trash2 size={16} className="inline -mt-0.5 mr-2" />
            Delete collection
          </button>
        </div>
      </Sheet>
    </>
  );
}
