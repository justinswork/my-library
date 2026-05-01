import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight, Star, Folder } from 'lucide-react';
import NavBar from '../components/NavBar.jsx';
import Sheet from '../components/Sheet.jsx';
import Loader from '../components/Loader.jsx';
import { useData } from '../contexts/DataContext.jsx';

export default function CollectionsPage() {
  const { collections, books, loaded, addCollection } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');

  if (!loaded) return <Loader />;

  const counts = books.reduce((acc, b) => {
    for (const id of b.collectionIds || []) acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const sorted = [...collections].sort((a, b) => {
    if (a.isWishlist) return -1;
    if (b.isWishlist) return 1;
    return 0;
  });

  const submit = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    await addCollection(n);
    setName('');
    setShowAdd(false);
  };

  return (
    <>
      <NavBar
        title="Collections"
        large
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="text-rose-deep p-2 active:opacity-60"
            aria-label="New collection"
          >
            <Plus size={26} strokeWidth={2} />
          </button>
        }
      />

      <div className="px-4">
        <div className="ios-list">
          {sorted.map((c) => (
            <Link key={c.id} to={`/collection/${c.id}`} className="ios-row">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  c.isWishlist ? 'bg-rose text-white' : 'bg-rose-soft/60 text-rose-deep'
                }`}
              >
                {c.isWishlist ? (
                  <Star size={18} strokeWidth={2} fill="currentColor" />
                ) : (
                  <Folder size={18} strokeWidth={2} />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-[13px] text-ash">
                  {counts[c.id] || 0} {counts[c.id] === 1 ? 'book' : 'books'}
                </div>
              </div>
              <ChevronRight size={18} className="text-ash" />
            </Link>
          ))}
        </div>
      </div>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="New Collection">
        <form onSubmit={submit} className="px-4 pb-6 flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Collection name"
            className="ios-input"
          />
          <button type="submit" disabled={!name.trim()} className="ios-button">
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="ios-button-secondary"
          >
            Cancel
          </button>
        </form>
      </Sheet>
    </>
  );
}
