import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mars, Venus, Transgender, Image, Palette, Heart, MessageSquare } from "lucide-react";
import Dropdown from "../ui/Dropdown";
import { useMessageCounts } from "../../hooks/useMessageCounts";

// simple pill
function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
        active ? "bg-pink-600 border-pink-600 text-white" : "border-white/15 text-white/85 hover:border-pink-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function CharacterTile({ item, onSelect, messageCount }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="relative w-full overflow-hidden rounded-xl text-left"
    >
      {/* image or fallback */}
      {item.img ? (
        <img src={item.img} alt={item.name} className="h-80 w-full object-cover object-top" />
      ) : (
        <div className="h-80 w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />
      )}
      {/* subtle bottom gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/45 pointer-events-none" />
      <div className="absolute left-3 right-3 bottom-3 p-0">
        <div className="px-3 pb-2">
          <p className="text-white text-sm font-semibold drop-shadow-md">{item.name}</p>
          <p className="text-white/60 text-xs mt-1 drop-shadow-sm">{item.age} • {item.bio}</p>

          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-2 text-pink-300">
              <Heart className="h-3.5 w-3.5 text-pink-400" aria-hidden />
              {item.likes}
            </span>
            <span className="inline-flex items-center gap-2 text-pink-300">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {messageCount || "0"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function SelectCharacter() {
  const navigate = useNavigate();

  // filter state (empty = show all) — persisted in localStorage
  const [gender, setGender] = useState(() => {
    try {
      return localStorage.getItem("pronily:filter:gender") || "";
    } catch (e) {
      return "";
    }
  });
  const [style, setStyle] = useState(() => {
    try {
      return localStorage.getItem("pronily:filter:style") || "";
    } catch (e) {
      return "";
    }
  });

  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [charsError, setCharsError] = useState(null);

  // Fetch message counts for characters
  const { getFormattedCount } = useMessageCounts(characters);

  const IMAGE_CACHE_KEY = "pronily:characters:image_cache";
  const IMAGE_CACHE_TTL = 10 * 60 * 60 * 1000; // 10 hours

  const getCachedImage = (id) => {
    try {
      const raw = localStorage.getItem(IMAGE_CACHE_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw || "{}") || {};
      const entry = map[String(id)];
      if (!entry) return null;
      if (!entry.expiresAt || Number(entry.expiresAt) < Date.now()) return null;
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
    } catch (e) {}
  };

  // fetch characters from backend on mount — no demo fallback (per request)
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
            bio: d.bio || "",
            img: finalUrl,
            likes: d.likes || '1M',
            messages: d.messages || '1M',
            gender: d.gender || '',
            style: d.style || 'realistic',
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
    // persist selection and return to the correct generator (image or video)
    try {
      const isVideo = location.pathname.includes("/ai-porn/video");
      const prefix = isVideo ? "pronily:video:" : "pronily:image:";
      localStorage.setItem(`${prefix}selectedCharacter`, JSON.stringify(character));
    } catch (e) {
      /* ignore */
    }
  // after selecting a character, return to the generator main page so it shows the selection
  if (location.pathname.includes("/ai-porn/video")) navigate("/ai-porn/video", { state: { fromSelect: true } });
  else navigate("/ai-porn/image", { state: { fromSelect: true } });
  };

  const location = useLocation();

  // simple dropdown implementations used only in this file
  function GenderFilter({ value, onChange }) {
    return (
      <Dropdown
        trigger={
          <button className="px-3 py-1.5 rounded-lg bg-[#1b1426] text-white text-sm flex items-center gap-2">
            {value || "All"} <span className="text-white/60">▾</span>
          </button>
        }
      >
        {({ close }) => (
          <div className="w-44 bg-[#0b0712] border border-white/10 text-white rounded-xl p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                close();
              }}
              className="w-full text-left px-2 py-2 rounded-md flex items-center gap-2 hover:bg-white/5"
            >
              All
            </button>

            <button
              type="button"
              onClick={() => {
                onChange(value === "Male" ? "" : "Male");
                close();
              }}
              className="w-full text-left px-2 py-2 rounded-md flex items-center gap-2 hover:bg-white/5"
            >
              <Mars className="w-4 h-4 text-pink-400" /> Male
            </button>

            <button
              type="button"
              onClick={() => {
                onChange(value === "Female" ? "" : "Female");
                close();
              }}
              className="w-full text-left px-2 py-2 rounded-md flex items-center gap-2 hover:bg-white/5"
            >
              <Venus className="w-4 h-4" /> Female
            </button>

            <button
              type="button"
              onClick={() => {
                onChange(value === "Trans" ? "" : "Trans");
                close();
              }}
              className="w-full text-left px-2 py-2 rounded-md flex items-center gap-2 hover:bg-white/5"
            >
              <Transgender className="w-4 h-4" /> Trans
            </button>
          </div>
        )}
      </Dropdown>
    );
  }

  function StyleFilter({ value, onChange }) {
    return (
      <Dropdown
        trigger={
          <button className="px-3 py-1.5 rounded-lg bg-[#1b1426] text-white text-sm flex items-center gap-2">
            {value || "All"} <span className="text-white/60">▾</span>
          </button>
        }
      >
        {({ close }) => (
          <div className="w-44 bg-[#0b0712] border border-white/10 text-white rounded-xl p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                close();
              }}
              className="w-full text-left px-2 py-2 rounded-md flex items-center gap-2 hover:bg-white/5"
            >
              All
            </button>

            <button
              type="button"
              onClick={() => {
                onChange(value === "Realistic" ? "" : "Realistic");
                close();
              }}
              className="w-full text-left px-2 py-2 rounded-md flex items-center gap-2 hover:bg-white/5"
            >
              <Image className="w-4 h-4" /> Realistic
            </button>

            <button
              type="button"
              onClick={() => {
                onChange(value === "Anime" ? "" : "Anime");
                close();
              }}
              className="w-full text-left px-2 py-2 rounded-md flex items-center gap-2 hover:bg-white/5"
            >
              <Palette className="w-4 h-4" /> Anime
            </button>
          </div>
        )}
      </Dropdown>
    );
  }

  // apply filters (normalize to lower-case for comparison)
  const filteredCharacters = characters.filter((c) => {
    const g = (gender || "").toLowerCase();
    const s = (style || "").toLowerCase();
    const genderMatch = !g || c.gender === g;
    const styleMatch = !s || c.style === s;
    return genderMatch && styleMatch;
  });

  return (
    <section className="w-full max-w-7xl mx-auto p-6 sm:p-8">
      {/* page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
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
          <h1 className="text-2xl font-semibold">Select Character</h1>
        </div>

        {/* filters (functional) */}
        <div className="flex gap-2">
          <GenderFilter
            value={gender}
            onChange={(v) => {
              setGender(v);
              try {
                localStorage.setItem("pronily:filter:gender", v);
              } catch (e) {}
            }}
          />

          <StyleFilter
            value={style}
            onChange={(v) => {
              setStyle(v);
              try {
                localStorage.setItem("pronily:filter:style", v);
              } catch (e) {}
            }}
          />
        </div>
      </div>

  {/* grid */}
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loadingChars ? (
          <div className="col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 text-center text-sm text-white/70">Loading characters...</div>
        ) : charsError ? (
          <div className="col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 text-center text-sm text-red-400">{charsError}</div>
        ) : filteredCharacters.length > 0 ? (
          filteredCharacters.map((c) => <CharacterTile key={c.id} item={c} onSelect={onSelect} messageCount={getFormattedCount(c.id)} />)
        ) : (
          <div className="col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 rounded-md border border-white/10 bg-white/[.02] p-6 text-center">
            <p className="text-white/70">No characters found for the selected filters.</p>
          </div>
        )}
      </div>
    </section>
  );
}
