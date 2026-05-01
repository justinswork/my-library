import { BookOpen } from 'lucide-react';

export default function BookCover({ src, title, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-10 h-14 text-[8px]',
    sm: 'w-14 h-20 text-[10px]',
    md: 'w-20 h-28 text-xs',
    lg: 'w-32 h-48 text-sm',
    xl: 'w-40 h-60 text-base'
  };
  const dim = sizes[size] || sizes.md;

  if (src) {
    return (
      <img
        src={src}
        alt={title || ''}
        loading="lazy"
        className={`${dim} object-cover rounded-md bg-hairline shadow-card ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextSibling?.style.setProperty('display', 'flex');
        }}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-md bg-rose-soft/50 text-rose-deep flex flex-col items-center justify-center p-2 text-center shadow-card ${className}`}
    >
      <BookOpen size={20} strokeWidth={1.5} className="mb-1 opacity-60" />
      <span className="font-semibold leading-tight line-clamp-3">{title || 'Untitled'}</span>
    </div>
  );
}
