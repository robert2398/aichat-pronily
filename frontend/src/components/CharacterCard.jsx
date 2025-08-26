import { Heart, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CharacterCard({ id, name, likes, views }) {
  const navigate = useNavigate();
  console.log("CharacterCard render", { id, name, likes, views });
  return (
    <a
      href="#character"
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] shadow hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      onClick={(e) => { e.preventDefault(); navigate(`/ai-chat/${id}`); }}
    >
      <div className="h-56 w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="rounded-xl bg-[#1b1426]/80 px-3 py-2 ring-1 ring-inset ring-white/10 backdrop-blur">
          <h3 className="text-sm font-semibold text-white">{name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-white/70">Sample character bio text goes here. Keep it short and neutral.</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-white/80">
            <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" aria-hidden /> {likes}</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden /> {views}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
