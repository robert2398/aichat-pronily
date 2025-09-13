import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Dropdown from "../ui/Dropdown";
import { getAssets } from '../../utils/assets'

function PoseTile({ item, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[.02] shadow-sm text-left hover:border-white/20"
    >
      {item.img ? (
        <img src={item.img} alt={item.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-white/[.02]" />
      )}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute left-3 right-3 bottom-3 p-0">
        <div className="px-3 pb-2">
          <p className="text-white text-sm font-semibold drop-shadow-md">{item.name}</p>
        </div>
      </div>
    </button>
  );
}

export default function SelectPose() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("");
  const poses = useMemo(() => {
    try {
      let gender = '';
      try {
        const imgChar = JSON.parse(localStorage.getItem('pronily:image:selectedCharacter') || '{}');
        const vidChar = JSON.parse(localStorage.getItem('pronily:video:selectedCharacter') || '{}');
        const pick = imgChar && imgChar.gender ? imgChar : (vidChar && vidChar.gender ? vidChar : null);
        if (pick && pick.gender) gender = pick.gender.toLowerCase();
      } catch (e) {}

      if (gender) {
        const items = getAssets(gender, 'pose') || [];
        return items.map(i => ({ id: i.id, name: i.name, img: i.url, category: (i.name || '').toLowerCase() }));
      }

      const female = getAssets('female', 'pose') || [];
      const male = getAssets('male', 'pose') || [];
      const trans = getAssets('trans', 'pose') || [];
      const merged = [...female, ...male, ...trans];
      const seen = new Set();
      return merged.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; }).map(i => ({ id: i.id, name: i.name, img: i.url, category: (i.name || '').toLowerCase() }));
    } catch (e) {
      return [];
    }
  }, []);

  const onSelect = (pose) => {
    try {
      const isVideo = location.pathname.includes("/ai-porn/video");
      const prefix = isVideo ? "pronily:video:" : "pronily:image:";
      localStorage.setItem(`${prefix}selectedPose`, JSON.stringify(pose));
    } catch (e) {}
    if (location.pathname.includes("/ai-porn/video")) navigate("/ai-porn/video", { state: { fromSelect: true } });
    else navigate("/ai-porn/image", { state: { fromSelect: true } });
  };

  const location = useLocation();

  const filtered = poses.filter((p) => {
    const c = (category || "").toLowerCase();
    return !c || p.category === c;
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
          <h1 className="text-2xl font-semibold">Select Pose</h1>
        </div>

        <div className="flex gap-2">
          <Dropdown
            trigger={<button className="px-3 py-1.5 rounded-lg bg-[#1b1426] text-white text-sm">{category || "All"} ▾</button>}
          >
            {({ close }) => (
              <div className="w-44 bg-[#0b0712] border border-white/10 text-white rounded-xl p-2">
                <button className="w-full text-left px-2 py-2" onClick={() => { setCategory(""); close(); }}>All</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setCategory("faces"); close(); }}>Faces</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setCategory("oral"); close(); }}>Oral</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setCategory("cowgirl"); close(); }}>Cowgirl</button>
                <button className="w-full text-left px-2 py-2" onClick={() => { setCategory("doggystyle"); close(); }}>Doggy</button>
              </div>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filtered.length > 0 ? (
          filtered.map((p) => <PoseTile key={p.id} item={p} onSelect={onSelect} />)
        ) : (
          <div className="col-span-2 md:col-span-3 lg:col-span-4 rounded-md border border-white/10 bg-white/[.02] p-6 text-center">
            <p className="text-white/70">No poses found for the selected filters.</p>
          </div>
        )}
      </div>
    </section>
  );
}
