import { Check } from 'lucide-react';
import { useData } from '../contexts/DataContext.jsx';

export default function CollectionPicker({ value = [], onChange, includeWishlist = true }) {
  const { collections } = useData();
  const visible = collections.filter((c) => includeWishlist || !c.isWishlist);

  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id];
    onChange(next);
  };

  return (
    <div className="ios-list">
      {visible.map((c) => {
        const checked = value.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            className="ios-row w-full text-left"
          >
            <div className="flex-1 font-medium">
              {c.name}
              {c.isWishlist && (
                <span className="ml-2 text-[11px] text-rose-deep font-semibold">★</span>
              )}
            </div>
            {checked && <Check size={20} className="text-rose-deep" />}
          </button>
        );
      })}
    </div>
  );
}
