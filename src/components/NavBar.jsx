import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function NavBar({ title, large, back, action }) {
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-10 bg-cream/85 backdrop-blur-xl"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between px-2 h-11">
        <div className="w-1/4">
          {back && (
            <button
              onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
              className="flex items-center text-rose-deep -ml-2 px-2 py-1 active:opacity-60"
            >
              <ChevronLeft size={28} strokeWidth={2.2} />
              <span className="text-[17px] font-normal">Back</span>
            </button>
          )}
        </div>
        <div className="text-[17px] font-semibold truncate w-1/2 text-center">
          {!large && title}
        </div>
        <div className="w-1/4 flex justify-end pr-2">{action}</div>
      </div>
      {large && (
        <div className="px-4 pb-2 pt-1">
          <h1 className="nav-title">{title}</h1>
        </div>
      )}
    </header>
  );
}
