import { Play, Heart } from "lucide-react";

export default function MediaCard({ variant, name, likes }) {
  console.log("MediaCard render", { variant, name, likes });
  return (
    <a
      href="#media"
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] shadow hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      onClick={() => { console.log("MediaCard click", { variant, name }); }}
    >
      <div className="h-64 w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
      <div className="absolute inset-0 bg-black/40" />
      {variant === 'video' && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid place-items-center h-12 w-12 rounded-full bg-white/90 backdrop-blur shadow">
            <Play className="h-6 w-6 text-[#1b1426]" aria-hidden />
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="flex items-center justify-between rounded-xl bg-[#1b1426]/85 px-3 py-2 ring-1 ring-inset ring-white/10 backdrop-blur">
          <h4 className="text-sm font-semibold text-white">{name}</h4>
          <span className="inline-flex items-center gap-1 text-xs text-white/90"><Heart className="h-3.5 w-3.5" aria-hidden /> {likes}</span>
        </div>
      </div>
    </a>
  );
}
