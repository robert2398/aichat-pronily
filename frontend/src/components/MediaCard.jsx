import { Play, Heart } from "lucide-react";

export default function MediaCard({ variant, name, likes }) {
  console.log("MediaCard render", { variant, name, likes });
  return (
    <a
      href="#media"
      className="group relative overflow-hidden rounded-2xl"
      onClick={() => { console.log("MediaCard click", { variant, name }); }}
    >
      <div className="h-64 w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
  <div className="absolute inset-0 bg-transparent" />
      {variant === 'video' && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid place-items-center h-12 w-12 rounded-full bg-white/90 backdrop-blur shadow">
            <Play className="h-6 w-6 text-[#1b1426]" aria-hidden />
          </div>
        </div>
      )}
      <div className="absolute left-3 right-3 bottom-3 p-0">
        <div className="px-3 pb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white drop-shadow-md">{name}</h4>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 text-xs text-pink-300">
              <Heart className="h-3.5 w-3.5 text-pink-400" aria-hidden /> {likes ?? "1.5k"}
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-white/90">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              {"1M"}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
