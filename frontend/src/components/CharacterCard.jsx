import { Heart, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMessageCounts } from "../hooks/useMessageCounts";

export default function CharacterCard({ id, name, img, age, bio, desc, likes, messages, views }) {
  const navigate = useNavigate();
  console.log("CharacterCard render", { id, name, img, likes, messages, views });
  
  // Get message count for this character
  const { getFormattedCount } = useMessageCounts([{ id }]);
  const messageCount = getFormattedCount(id);
  
  const shortDesc = desc ?? bio ?? "";

  return (
    <a
      href="#character"
      className="group relative overflow-hidden rounded-2xl"
      onClick={(e) => { e.preventDefault(); navigate(`/ai-chat/${id}`); }}
    >
      {/* image area (use img if available, otherwise a radial gradient placeholder) */}
      <div className="h-80 w-full overflow-hidden">
        {img ? (
          <img src={img} alt={name} className="h-full w-full object-cover object-top" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />
        )}
      </div>

      {/* subtle overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/45 pointer-events-none" />

      <div className="absolute left-3 right-3 bottom-3 p-0">
        <div className="px-3 pb-2">
          <h3 className="text-sm font-semibold text-white drop-shadow-md">{name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-white/60 drop-shadow-sm">{age ? `${age} • ` : ""}{shortDesc}</p>

          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-2 text-pink-300">
              <Heart className="h-3.5 w-3.5 text-pink-400" aria-hidden />
              {likes ?? "1.5k"}
            </span>
            <span className="inline-flex items-center gap-2 text-pink-300">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {messageCount || messages || views || "0"}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
