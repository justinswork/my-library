export default function Loader({ label }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-3 text-ash">
      <div className="w-6 h-6 rounded-full border-2 border-hairline border-t-rose animate-spin" />
      {label && <div className="text-sm">{label}</div>}
    </div>
  );
}
