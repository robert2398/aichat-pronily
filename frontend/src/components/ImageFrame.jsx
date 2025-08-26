export default function ImageFrame({ src, alt, className = "" }) {
  console.log("ImageFrame render", { hasSrc: Boolean(src), alt, className });
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] ${className}`}>
      {src ? (
        <img src={src} alt={alt || ""} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
      )}
      <div aria-hidden className="absolute inset-0 rounded-2xl shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.12)]" />
    </div>
  );
}
