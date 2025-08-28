import { Heart, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CharacterCard({ id, name, likes, views }) {
  const navigate = useNavigate();
  console.log("CharacterCard render", { id, name, likes, views });
  return (
    <a
      href="#character"
      className="group relative overflow-hidden rounded-2xl"
      onClick={(e) => { e.preventDefault(); navigate(`/ai-chat/${id}`); }}
    >
      <div className="h-56 w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
      <div className="absolute inset-0 bg-transparent" />
      <div className="absolute left-3 right-3 bottom-3 p-0">
        <div className="px-3 pb-2">
          <h3 className="text-sm font-semibold text-white drop-shadow-md">{name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-pink-300 drop-shadow-sm">Sample character bio text goes here. Keep it short and neutral.</p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-2 text-pink-300">
              <Heart className="h-3.5 w-3.5 text-pink-400" aria-hidden />
              {likes ?? "1.5k"}
            </span>
            <span className="inline-flex items-center gap-2 text-white/90">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {views ?? "1M"}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
