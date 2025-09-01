import { useState, useEffect } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import CharacterCard from "./CharacterCard";

export default function Characters() {
  const [style, setStyle] = useState("all");
  const [data, setData] = useState([]);
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

  // reset visible count when style/filter changes
  useEffect(() => {
    setVisibleCount(5);
  }, [style]);

  const filtered = data.filter((c) => (style === "all" ? true : (c.style || "") === style));
  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Pronily Character</h2>
        <div className="flex items-center gap-2">
          <button type="button" className="relative rounded-xl px-3 py-1.5 text-sm/6 text-white/90 hover:bg-white/5" onClick={() => { console.log("Gender tab click"); }}>
            <span className="inline-flex items-center gap-1.5">Gender <ChevronDown className="h-4 w-4 opacity-70" /></span>
            <span aria-hidden className="absolute left-3 -bottom-0.5 h-[2px] w-10 rounded-full bg-pink-500" />
          </button>
          <button onClick={() => { console.log("Style change", "realistic"); setStyle("realistic"); }} className={`${style === "realistic" ? "bg-white/10" : "hover:bg-white/5"} rounded-xl px-3 py-1.5 text-sm/6 text-white/90`}>
            Realistic
          </button>
          <button onClick={() => { console.log("Style change", "anime"); setStyle("anime"); }} className={`${style === "anime" ? "bg-white/10" : "hover:bg-white/5"} rounded-xl px-3 py-1.5 text-sm/6 text-white/90`}>
            Anime
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm/6 text-white/90 ring-1 ring-inset ring-white/15 hover:bg-white/5" onClick={() => console.log("Filter click") }>
          <SlidersHorizontal className="h-4 w-4" /> Filter
        </button>
        <button onClick={() => { console.log("Style change", "all"); setStyle("all"); }} className="rounded-xl px-3 py-1.5 text-sm/6 text-white/90 ring-1 ring-inset ring-white/15 hover:bg-white/5">
          All Models
        </button>
      </div>

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
