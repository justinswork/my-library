import { useEffect } from 'react';

export default function Sheet({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 animate-[fade_0.2s_ease-out]"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md bg-cream rounded-t-3xl shadow-sheet animate-[slideUp_0.25s_ease-out] max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center pt-2.5">
          <div className="w-9 h-1 rounded-full bg-hairline" />
        </div>
        {title && (
          <div className="text-center font-semibold text-[17px] py-3">{title}</div>
        )}
        {children}
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
