import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Dropdown from "../ui/Dropdown";
import { getAssets } from '../../utils/assets'

function BackgroundTile({ item, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[.02] shadow-sm text-left hover:border-white/20"
    >
      {item.img ? <img src={item.img} alt={item.name} className="h-72 w-full object-cover" /> : <div className="h-5 w-full bg-white/[.02]" />}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute left-3 right-3 bottom-3 p-0">
        <div className="px-3 pb-2">
          <p className="text-white text-sm font-semibold drop-shadow-md">{item.name}</p>
        </div>
      </div>
    </button>
  );
}

export default function SelectBackground() {
  const navigate = useNavigate();

  const [type, setType] = useState("");
  const [mood, setMood] = useState("");
  const backgrounds = useMemo(() => {
    try {
      // First try canonical asset loader which may include nested files
      const items = getAssets(null, 'background') || [];
      if (items && items.length) {
        const seen = new Set();
        return items
          .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
          .map((i) => {
            const name = i.name || '';
            const low = name.toLowerCase();
            let t = 'indoor';
            if (low.includes('park') || low.includes('city')) t = 'outdoor';
            let m = 'neutral';
            if (low.includes('penthouse') || low.includes('lux')) m = 'luxury';
            if (low.includes('park')) m = 'calm';
            if (low.includes('night') || low.includes('club')) m = 'party';
            if (low.includes('sauna')) m = 'relax';
            if (low.includes('hospital')) m = 'clinical';
            if (low.includes('bath')) m = 'intimate';
            return { id: i.id, name: i.name, img: i.url, type: t, mood: m };
          });
      }

      // Fallback: directly import files from the background folder to ensure Vite resolves URLs correctly
      const mods = import.meta.glob('../../assets/generate ai/background/*.{png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' });
      const mapped = Object.entries(mods).map(([path, url]) => {
        const parts = String(path).split(/[\/]+/g);
        const filename = parts[parts.length - 1] || path;
        const name = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const low = name.toLowerCase();
        let t = 'indoor';
        if (low.includes('park') || low.includes('city')) t = 'outdoor';
        let m = 'neutral';
        if (low.includes('penthouse') || low.includes('lux')) m = 'luxury';
        if (low.includes('park')) m = 'calm';
        if (low.includes('night') || low.includes('club')) m = 'party';
        if (low.includes('sauna')) m = 'relax';
        if (low.includes('hospital')) m = 'clinical';
        if (low.includes('bath')) m = 'intimate';
        return { id: path, name, img: url, type: t, mood: m };
      });
      return mapped;
    } catch (e) {
      return [];
    }
  }, []);

  // fallback: if asset loader returned nothing, use a small static list to avoid empty UI
  const backgroundsWithFallback = backgrounds && backgrounds.length ? backgrounds : [
    { id: 'penthouse', name: 'Penthouse', img: '', type: 'indoor', mood: 'luxury' },
    { id: 'park', name: 'Public Park', img: '', type: 'outdoor', mood: 'calm' },
    { id: 'night', name: 'Night Club', img: '', type: 'indoor', mood: 'party' },
    { id: 'sauna', name: 'Sauna', img: '', type: 'indoor', mood: 'relax' },
    { id: 'hospital', name: 'Hospital', img: '', type: 'indoor', mood: 'clinical' },
    { id: 'city', name: 'City', img: '', type: 'outdoor', mood: 'urban' },
    { id: 'bathroom', name: 'Bathroom', img: '', type: 'indoor', mood: 'intimate' },
    { id: 'studio', name: 'Studio', img: '', type: 'indoor', mood: 'neutral' },
  ];

  const onSelect = (bg) => {
    try {
      const isVideo = location.pathname.includes("/ai-porn/video");
      const prefix = isVideo ? "pronily:video:" : "pronily:image:";
      localStorage.setItem(`${prefix}selectedBackground`, JSON.stringify(bg));
    } catch (e) {}
    if (location.pathname.includes("/ai-porn/video")) navigate("/ai-porn/video", { state: { fromSelect: true } });
    else navigate("/ai-porn/image", { state: { fromSelect: true } });
  };

  const location = useLocation();

  const filtered = backgrounds.filter((b) => {
    const t = (type || "").toLowerCase();
    const m = (mood || "").toLowerCase();
    const tm = !t || b.type === t;
    const mm = !m || b.mood === m;
    return tm && mm;
  });

  return (
    <section className="w-full max-w-7xl mx-auto p-6 sm:p-8">
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
          <h1 className="text-2xl font-semibold">Select Background</h1>
        </div>

        <div className="flex gap-2">
          <Dropdown
            trigger={<button className="px-3 py-1.5 rounded-lg bg-[#1b1426] text-white text-sm">{type || "All"} ▾</button>}
          >
            {({ close }) => (
              <div className="w-44 bg-[#0b0712] border border-white/10 text-white rounded-xl p-2">
                <button className="w-full text-left px-2 py-2" onClick={() => { setType(""); close(); }}>All</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setType("indoor"); close(); }}>Indoor</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setType("outdoor"); close(); }}>Outdoor</button>
              </div>
            )}
          </Dropdown>

          <Dropdown
            trigger={<button className="px-3 py-1.5 rounded-lg bg-[#1b1426] text-white text-sm">{mood || "All"} ▾</button>}
          >
            {({ close }) => (
              <div className="w-44 bg-[#0b0712] border border-white/10 text-white rounded-xl p-2">
                <button className="w-full text-left px-2 py-2" onClick={() => { setMood(""); close(); }}>All</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setMood("luxury"); close(); }}>Luxury</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setMood("calm"); close(); }}>Calm</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setMood("party"); close(); }}>Party</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setMood("relax"); close(); }}>Relax</button>
              </div>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((b) => (
            <div key={b.id} className="w-full">
              <BackgroundTile item={b} onSelect={onSelect} />
            </div>
          ))
        ) : (
          <div className="col-span-1 sm:col-span-2 md:col-span-3 rounded-md border border-white/10 bg-white/[.02] p-6 text-center">
            <p className="text-white/70">No backgrounds found for the selected filters.</p>
          </div>
        )}
      </div>
    </section>
  );
}
