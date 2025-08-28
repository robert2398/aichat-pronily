import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function VariantTile({ item, onSelect }) {
  return (
    <button
      type="button"
  onClick={() => onSelect(item)}
  className="relative w-full overflow-hidden rounded-xl text-left"
    >
      {item.thumb ? (
        <img src={item.thumb} alt={item.name} className="h-56 w-full object-cover" />
      ) : (
        <div className="h-56 w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />
      )}
      <div className="absolute left-3 right-3 bottom-3 p-0">
        <div className="px-3 pb-2">
          <p className="text-white text-sm font-semibold drop-shadow-md">{item.name}</p>
        </div>
      </div>
    </button>
  );
}

export default function SelectCharacterVideo() {
  const navigate = useNavigate();

  const variants = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i + 1,
        name: `Character Video ${i + 1}`,
        thumb: "",
      })),
    []
  );

  const onSelect = (variant) => {
    try {
      localStorage.setItem("pronily:video:selectedCharacterVideo", JSON.stringify(variant));
    } catch {}
    navigate("/ai-porn/video");
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
        <h1 className="text-2xl font-semibold">Select Character Video</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {variants.map((v) => (
          <VariantTile key={v.id} item={v} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
