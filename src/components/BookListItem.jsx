import { Link } from 'react-router-dom';
import { ChevronRight, Copy } from 'lucide-react';
import BookCover from './BookCover.jsx';
import { authorList } from '../utils/book.js';

export default function BookListItem({ book, duplicateCount = 1, collectionsById = {} }) {
  const collectionNames = (book.collectionIds || [])
    .map((id) => collectionsById[id]?.name)
    .filter(Boolean);

  return (
    <Link to={`/book/${book.id}`} className="ios-row">
      <BookCover src={book.cover} title={book.title} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] truncate">{book.title}</div>
        {authorList(book) && (
          <div className="text-[13px] text-ash truncate">{authorList(book)}</div>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {duplicateCount > 1 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-soft text-rose-deep rounded-full px-2 py-0.5">
              <Copy size={11} strokeWidth={2.2} />×{duplicateCount}
            </span>
          )}
          {collectionNames.slice(0, 2).map((n) => (
            <span
              key={n}
              className="text-[11px] text-ash bg-hairline/60 rounded-full px-2 py-0.5"
            >
              {n}
            </span>
          ))}
          {collectionNames.length > 2 && (
            <span className="text-[11px] text-ash">+{collectionNames.length - 2}</span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-ash shrink-0" />
    </Link>
  );
}
