import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from './AuthContext.jsx';
import { findExistingBook, copiesOf } from '../utils/book.js';

const DataContext = createContext(null);

const WISHLIST_NAME = 'Wishlist';

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setBooks([]);
      setCollections([]);
      setLoaded(false);
      setError(null);
      return;
    }

    const booksRef = query(
      collection(db, 'users', user.uid, 'books'),
      orderBy('addedAt', 'desc')
    );
    const colsRef = query(
      collection(db, 'users', user.uid, 'collections'),
      orderBy('createdAt', 'asc')
    );

    let booksLoaded = false;
    let colsLoaded = false;
    const checkLoaded = () => {
      if (booksLoaded && colsLoaded) setLoaded(true);
    };

    const handleError = (err) => {
      console.error('Firestore subscription error:', err);
      setError(err);
      setLoaded(true);
    };

    const unsubBooks = onSnapshot(
      booksRef,
      (snap) => {
        setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        booksLoaded = true;
        checkLoaded();
      },
      handleError
    );

    const unsubCols = onSnapshot(
      colsRef,
      async (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (list.length === 0) {
          try {
            await seedDefaultCollections(user.uid);
          } catch (err) {
            handleError(err);
          }
          return;
        }
        setCollections(list);
        colsLoaded = true;
        checkLoaded();
      },
      handleError
    );

    return () => {
      unsubBooks();
      unsubCols();
    };
  }, [user]);

  const wishlist = useMemo(
    () => collections.find((c) => c.isWishlist) || null,
    [collections]
  );

  const value = {
    books,
    collections,
    wishlist,
    loaded,
    error,
    addBook: (book) => addBook(user.uid, book, books),
    updateBook: (id, patch) => updateBook(user.uid, id, patch),
    deleteBook: (id) => deleteBook(user.uid, id),
    incrementCopies: (id) => incrementCopies(user.uid, id),
    decrementCopies: (id) => decrementCopies(user.uid, id, books),
    addCollection: (name) => addCollection(user.uid, name),
    renameCollection: (id, name) => renameCollection(user.uid, id, name),
    deleteCollection: (id) => deleteCollection(user.uid, id, books),
    importData: (payload, mode) => importData(user.uid, payload, mode, books, collections)
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}

async function seedDefaultCollections(uid) {
  const ref = collection(db, 'users', uid, 'collections');
  const existing = await getDocs(ref);
  if (!existing.empty) return;
  const batch = writeBatch(db);
  batch.set(doc(ref), {
    name: 'My Books',
    isWishlist: false,
    createdAt: serverTimestamp()
  });
  batch.set(doc(ref), {
    name: WISHLIST_NAME,
    isWishlist: true,
    createdAt: serverTimestamp()
  });
  await batch.commit();
}

async function addBook(uid, book, existingBooks) {
  const existing = findExistingBook(existingBooks, book);
  if (existing) {
    const mergedCollections = Array.from(
      new Set([...(existing.collectionIds || []), ...(book.collectionIds || [])])
    );
    await updateDoc(doc(db, 'users', uid, 'books', existing.id), {
      copies: increment(1),
      collectionIds: mergedCollections
    });
    return { id: existing.id, merged: true };
  }
  const ref = collection(db, 'users', uid, 'books');
  const payload = {
    isbn: book.isbn || null,
    title: book.title || '',
    subtitle: book.subtitle || '',
    authors: book.authors || [],
    publisher: book.publisher || '',
    publishedYear: book.publishedYear || null,
    pageCount: book.pageCount || null,
    cover: book.cover || null,
    description: book.description || '',
    notes: book.notes || '',
    collectionIds: book.collectionIds || [],
    copies: typeof book.copies === 'number' && book.copies > 0 ? book.copies : 1,
    readStatus: book.readStatus === 'read' || book.readStatus === 'unread' ? book.readStatus : null,
    addedAt: serverTimestamp()
  };
  const created = await addDoc(ref, payload);
  return { id: created.id, merged: false };
}

async function updateBook(uid, id, patch) {
  await updateDoc(doc(db, 'users', uid, 'books', id), patch);
}

async function deleteBook(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'books', id));
}

async function incrementCopies(uid, id) {
  await updateDoc(doc(db, 'users', uid, 'books', id), { copies: increment(1) });
}

async function decrementCopies(uid, id, books) {
  const book = books.find((b) => b.id === id);
  if (!book) return;
  if (copiesOf(book) <= 1) return;
  await updateDoc(doc(db, 'users', uid, 'books', id), { copies: increment(-1) });
}

async function addCollection(uid, name) {
  const ref = collection(db, 'users', uid, 'collections');
  const created = await addDoc(ref, {
    name,
    isWishlist: false,
    createdAt: serverTimestamp()
  });
  return created.id;
}

async function renameCollection(uid, id, name) {
  await updateDoc(doc(db, 'users', uid, 'collections', id), { name });
}

async function deleteCollection(uid, id, books) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', uid, 'collections', id));
  for (const b of books) {
    if ((b.collectionIds || []).includes(id)) {
      batch.update(doc(db, 'users', uid, 'books', b.id), {
        collectionIds: b.collectionIds.filter((c) => c !== id)
      });
    }
  }
  await batch.commit();
}

function reviveTimestamp(val) {
  if (!val) return serverTimestamp();
  if (typeof val.seconds === 'number') return new Timestamp(val.seconds, val.nanoseconds || 0);
  return serverTimestamp();
}

async function importData(uid, payload, mode, currentBooks, currentCollections) {
  const stats = { added: 0, skipped: 0, overwritten: 0, collectionsCreated: 0 };
  const importedCols = Array.isArray(payload?.collections) ? payload.collections : [];
  const importedBooks = Array.isArray(payload?.books) ? payload.books : [];

  const colIdMap = {};
  for (const col of importedCols) {
    let local;
    if (col.isWishlist) {
      local = currentCollections.find((c) => c.isWishlist);
    } else {
      local = currentCollections.find(
        (c) => !c.isWishlist && c.name?.toLowerCase() === (col.name || '').toLowerCase()
      );
    }
    if (local) {
      colIdMap[col.id] = local.id;
    } else if (col.name) {
      const ref = collection(db, 'users', uid, 'collections');
      const created = await addDoc(ref, {
        name: col.name,
        isWishlist: !!col.isWishlist,
        createdAt: reviveTimestamp(col.createdAt)
      });
      colIdMap[col.id] = created.id;
      stats.collectionsCreated++;
    }
  }

  const batchSize = 400;
  let batch = writeBatch(db);
  let opsInBatch = 0;
  const flush = async () => {
    if (opsInBatch === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    opsInBatch = 0;
  };

  const booksRef = collection(db, 'users', uid, 'books');

  for (const b of importedBooks) {
    const remapped = (b.collectionIds || [])
      .map((id) => colIdMap[id])
      .filter(Boolean);

    const existing = findExistingBook(currentBooks, b);

    const data = {
      isbn: b.isbn || null,
      title: b.title || '',
      subtitle: b.subtitle || '',
      authors: b.authors || [],
      publisher: b.publisher || '',
      publishedYear: b.publishedYear || null,
      pageCount: b.pageCount || null,
      cover: b.cover || null,
      description: b.description || '',
      notes: b.notes || '',
      collectionIds: remapped,
      copies: typeof b.copies === 'number' ? b.copies : 1,
      readStatus: b.readStatus === 'read' || b.readStatus === 'unread' ? b.readStatus : null,
      addedAt: reviveTimestamp(b.addedAt)
    };

    if (existing) {
      if (mode === 'skip') {
        stats.skipped++;
        continue;
      }
      batch.set(doc(db, 'users', uid, 'books', existing.id), data);
      stats.overwritten++;
    } else {
      batch.set(doc(booksRef), data);
      stats.added++;
    }

    opsInBatch++;
    if (opsInBatch >= batchSize) await flush();
  }
  await flush();
  return stats;
}
