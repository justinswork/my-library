import { NavLink } from 'react-router-dom';
import { ScanLine, BookOpen, FolderHeart, Settings, Search } from 'lucide-react';

const tabs = [
  { to: '/library', label: 'Library', icon: BookOpen },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/find', label: 'Find', icon: Search },
  { to: '/collections', label: 'Collections', icon: FolderHeart },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export default function TabBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-white/85 backdrop-blur-xl border-t border-hairline"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around max-w-md mx-auto">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-3 flex-1 ${
                isActive ? 'text-rose-deep' : 'text-ash'
              }`
            }
          >
            <Icon size={24} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
