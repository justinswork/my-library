export default function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-16 gap-3">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-rose-soft/50 text-rose-deep flex items-center justify-center">
          <Icon size={28} strokeWidth={1.6} />
        </div>
      )}
      <div className="text-[17px] font-semibold">{title}</div>
      {body && <div className="text-[14px] text-ash max-w-xs">{body}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
