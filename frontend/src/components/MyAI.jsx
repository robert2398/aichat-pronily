import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Heart, MessageSquare, ChevronLeft } from "lucide-react";
import { useMessageCounts } from "../hooks/useMessageCounts";

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

export default function MyAI() {
  const navigate = useNavigate();

  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [charsError, setCharsError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const location = useLocation();

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
        const envBase = import.meta.env.VITE_API_BASE_URL;
        const base = envBase || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '');
        if (!base) throw new Error('API base URL not configured');

        const stored = localStorage.getItem('pronily:auth:token');
        if (!stored) {
          throw new Error('Not authenticated');
        }
        const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();

        const url = `${base.replace(/\/$/, '')}/characters/fetch-loggedin-user`;
        const res = await fetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `bearer ${tokenOnly}` } });
        if (!res.ok) {
          const txt = await res.text().catch(()=>null);
          throw new Error(txt || res.statusText || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        const chars = Array.isArray(data) ? data : (data.characters || data.data || []);
        const mapped = (chars || []).map((d) => {
          const rawUrl = d.image_url_s3 || d.image_url || d.img || "";
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
  }, [reloadKey]);

  // Watch for navigation state or createdCharacter marker to trigger reload
  useEffect(() => {
    try {
      const st = location.state || {};
      if (st.refresh) {
        // clear the navigation state to avoid repeated reloads
        try { window.history.replaceState({}, document.title); } catch (e) {}
        setReloadKey((k) => k + 1);
        return;
      }
    } catch (e) {}
    try {
      const created = localStorage.getItem('pronily:createdCharacter');
      if (created) {
        // clear marker and reload
        try { localStorage.removeItem('pronily:createdCharacter'); } catch (e) {}
        setReloadKey((k) => k + 1);
      }
    } catch (e) {}
  }, [location]);

  const onOpen = (character) => {
    try { localStorage.setItem('pronily:image:selectedCharacter', JSON.stringify(character)); } catch (e) {}
    // open chat for this character
    navigate(`/ai-chat/${character.id}`);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-2 pt-2 sm:pt-2 pb-2">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/5"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-semibold">My AI</h1>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => navigate('/create-character')}
            className="rounded-xl px-4 py-2 font-semibold text-white bg-gradient-to-r from-pink-600 via-pink-400 to-indigo-500"
          >
            Create Character
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loadingChars ? (
          <div className="col-span-full text-center text-sm text-white/70">Loading characters...</div>
        ) : charsError ? (
          <div className="col-span-full text-center text-sm text-red-400">{charsError}</div>
        ) : characters.length === 0 ? (
          <div className="col-span-full text-center text-sm text-white/70">No characters found.</div>
        ) : (
          characters.map((c) => <ChatCharacterCard key={c.id} item={c} onOpen={onOpen} messageCount={getFormattedCount(c.id)} />)
        )}
      </div>
    </section>
  );
}
