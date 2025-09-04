import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import CharacterCard from "./CharacterCard";

export default function Characters() {
  // NOTE: defaulting to "realistic" so the new two-option pill switch has one active state by default.
  // Assumption: user expects a 2-way toggle between realistic and anime (no "All Models" button).
  const [style, setStyle] = useState("realistic");
  const [data, setData] = useState([]);
  const [gender, setGender] = useState(""); // "male" | "female" | "trans" | "" (empty = any)
  const [showGenderMenu, setShowGenderMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  console.log("Characters render", { style, loading, error, count: data.length });

  useEffect(() => {
    let mounted = true;
    const fetchCharacters = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.VITE_API_BASE_URL || "";
        if (!base) throw new Error("VITE_API_BASE_URL not configured");
        const url = `${base.replace(/\/$/, "")}/characters/fetch-default`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        // Accept array response or { data: [...] }
        const items = Array.isArray(json) ? json : json?.data ?? [];

        // map backend fields to the same shape used by AI chat components
        const normalized = items.map((d) => {
          const rawUrl = d.image_url_s3 || d.image_url || "";
          return {
            id: d.id,
            name: d.name || d.username || "Unknown",
            age: d.age || "",
            bio: d.bio || d.description || "",
            desc: d.bio || d.description || "",
            img: rawUrl || "",
            likes: d.likes ?? d.favorites ?? "1.5k",
            messages: d.messages ?? d.conversations ?? d.views ?? "1M",
            style: (d.style || "").toLowerCase(),
            gender: (d.gender || "").toLowerCase(),
          };
        });

        if (mounted) setData(normalized);
      } catch (err) {
        console.error("Failed to fetch characters", err);
        if (mounted) setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCharacters();
    return () => {
      mounted = false;
    };
  }, []);

  // reset visible count when style or gender filter changes
  useEffect(() => {
    setVisibleCount(5);
  }, [style, gender]);

  const filtered = data.filter((c) => {
    const matchesStyle = style === "all" ? true : (c.style || "") === style;
    const matchesGender = !gender ? true : (c.gender || "") === gender;
    return matchesStyle && matchesGender;
  });
  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Pronily Character</h2>
        <div className="flex items-center gap-3">
          {/* Gender dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGenderMenu((s) => !s)}
              className="relative rounded-xl px-3 py-1.5 text-sm/6 text-white/90 hover:bg-white/5 inline-flex items-center gap-1"
            >
              <span>{gender ? (gender.charAt(0).toUpperCase() + gender.slice(1)) : 'Gender'}</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>
            {showGenderMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl bg-[#0b0710] text-white shadow-lg ring-1 ring-white/10 py-1 z-50">
                <div className="px-1 py-1">
                  <button onClick={() => { setGender(""); setShowGenderMenu(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5">All</button>
                  <button onClick={() => { setGender('male'); setShowGenderMenu(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5">Male</button>
                  <button onClick={() => { setGender('female'); setShowGenderMenu(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5">Female</button>
                  <button onClick={() => { setGender('trans'); setShowGenderMenu(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5">Trans</button>
                </div>
              </div>
            )}
          </div>

          {/* Pill-style switch for style (Realistic / Anime) */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[.03] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setStyle('realistic')}
              className={`h-9 px-4 min-w-[7rem] text-sm rounded-full text-center font-medium flex items-center justify-center transition-colors ${style === 'realistic' ? 'bg-pink-500 text-white shadow' : 'text-white/90 hover:bg-white/5'}`}
            >
              Realistic
            </button>
            <button
              type="button"
              onClick={() => setStyle('anime')}
              className={`h-9 px-4 min-w-[7rem] text-sm rounded-full text-center font-medium flex items-center justify-center transition-colors ${style === 'anime' ? 'bg-pink-500 text-white shadow' : 'text-white/90 hover:bg-white/5'}`}
            >
              Anime
            </button>
          </div>
        </div>
      </div>

  {/* removed old Filter and All Models buttons per requirement */}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading ? (
          <div className="col-span-full text-center text-sm text-white/70">Loading characters...</div>
        ) : error ? (
          <div className="col-span-full text-center text-sm text-red-400">{error}</div>
        ) : visible.length > 0 ? (
          visible.map((c) => (
            <CharacterCard key={c.id} {...c} />
          ))
        ) : (
          <div className="col-span-full rounded-md border border-white/10 bg-white/[.02] p-6 text-center">
            <p className="text-white/70">No characters found for the selected filters.</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        {filtered.length > visibleCount ? (
          <button
            className="rounded-full px-5 py-2 text-sm/6 text-white/90 bg-white/10 hover:bg-white/15 ring-1 ring-inset ring-white/15"
            onClick={() => setVisibleCount((v) => Math.min(filtered.length, v + 5))}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        ) : (
          <button
            className="rounded-full px-5 py-2 text-sm/6 text-white/60 bg-transparent ring-1 ring-inset ring-white/6 cursor-default"
            disabled
          >
            No more
          </button>
        )}
      </div>
    </section>
  );
}
