import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, MessageSquare } from "lucide-react";
import { useMessageCounts } from "../../hooks/useMessageCounts";

// reuse the same tile layout as AiChat
function ChatCharacterCard({ item, onOpen, messageCount }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="relative w-full overflow-hidden rounded-xl text-left"
      >
        <div className="h-80 w-full overflow-hidden">
          {item.img ? (
            <img src={item.img} alt={item.name} className="h-full w-full object-cover object-top" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/45 pointer-events-none" />
        <div className="absolute left-3 right-3 bottom-3 p-0">
          <div className="px-3 pb-2">
            <p className="text-white text-sm font-semibold drop-shadow-md">{item.name}</p>
            <p className="text-white/60 text-xs mt-1 drop-shadow-sm">{item.age} • {item.desc}</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-2 text-pink-300">
                <Heart className="h-3.5 w-3.5 text-pink-400" aria-hidden />
                {item.likes ?? "1M"}
              </span>
              <span className="inline-flex items-center gap-2 text-pink-300">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                {messageCount || "0"}
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export default function SelectCharacterImage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [charsError, setCharsError] = useState(null);
  const [source, setSource] = useState("Default");

  // Fetch message counts for characters
  const { getFormattedCount } = useMessageCounts(characters);

  const IMAGE_CACHE_KEY = "pronily:characters:image_cache";
  const IMAGE_CACHE_TTL = 10 * 60 * 60 * 1000;

  const getCachedImage = (id) => {
    try {
      const raw = localStorage.getItem(IMAGE_CACHE_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw || "{}") || {};
      const entry = map[String(id)];
      if (!entry) return null;
      if (!entry.expiresAt || Number(entry.expiresAt) < Date.now()) {
        return null;
      }
      return entry.url || null;
    } catch (e) {
      return null;
    }
  };

  const setCachedImage = (id, url) => {
    try {
      const raw = localStorage.getItem(IMAGE_CACHE_KEY);
      const map = (raw && JSON.parse(raw)) || {};
      map[String(id)] = { url, expiresAt: Date.now() + IMAGE_CACHE_TTL };
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(map));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchChars = async () => {
      setLoadingChars(true);
      setCharsError(null);
      try {
        const base = import.meta.env.VITE_API_BASE_URL;
        if (!base) {
          throw new Error('VITE_API_BASE_URL not configured');
        }
        const url = `${base.replace(/\/$/, "")}/characters/fetch-default`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.statusText || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        const mapped = (Array.isArray(data) ? data : []).map((d) => {
          const rawUrl = d.image_url_s3 || d.image_url || "";
          const cached = rawUrl ? getCachedImage(d.id) : null;
          const finalUrl = cached || rawUrl || "";
          if (rawUrl && !cached) setCachedImage(d.id, rawUrl);
          return {
            id: d.id,
            name: d.name || d.username,
            age: d.age || "",
            desc: d.bio || "",
            img: finalUrl,
            likes: d.likes || '1M',
            messages: d.messages || '1M',
          };
        });
        setCharacters(mapped);
      } catch (err) {
        if (!cancelled) setCharsError(err.message || String(err));
      } finally {
        if (!cancelled) setLoadingChars(false);
      }
    };
    fetchChars();
    return () => { cancelled = true; };
  }, []);

  const onSelect = (character) => {
    try {
      localStorage.setItem("pronily:image:selectedCharacter", JSON.stringify(character));
    } catch (e) {}
    // return to image generator so it picks up the selection
    navigate("/ai-porn/image", { state: { fromSelect: true } });
  };

  return (
    <section className="w-full max-w-7xl mx-auto p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/5"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 6 9 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-2xl font-semibold">Select Character Image</h1>
      </div>

  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loadingChars ? (
          <div className="col-span-full text-center text-sm text-white/70">Loading characters...</div>
        ) : charsError ? (
          <div className="col-span-full text-center text-sm text-red-400">{charsError}</div>
        ) : characters.length === 0 ? (
          <div className="col-span-full text-center text-sm text-white/70">No characters available.</div>
        ) : (
          characters.map((c) => <ChatCharacterCard key={c.id} item={c} onOpen={onSelect} messageCount={getFormattedCount(c.id)} />)
        )}
      </div>
    </section>
  );
}
