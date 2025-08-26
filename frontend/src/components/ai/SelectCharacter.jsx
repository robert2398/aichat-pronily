import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mars, Venus, Transgender, Image, Palette } from "lucide-react";
import Dropdown from "../ui/Dropdown";

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

function CharacterTile({ item, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[.02] shadow-sm text-left hover:border-white/20"
    >
      {/* image or fallback */}
      {item.img ? (
        <img src={item.img} alt={item.name} className="h-64 w-full object-cover" />
      ) : (
        <div className="h-64 w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0)_70%)]" />
      )}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="rounded-lg bg-[#1b1426]/85 px-3 py-2 ring-1 ring-inset ring-white/10 backdrop-blur">
          <p className="text-white text-sm font-semibold">{item.name}</p>
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

  // demo data – replace img with your actual thumbnails when ready
  const characters = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i + 1,
        name: `Luna, ${20 + (i % 6)}`,
        img: "",
        gender: i % 3 === 0 ? "female" : i % 3 === 1 ? "male" : "trans",
        style: i % 5 === 0 ? "anime" : "realistic",
      })),
    []
  );

  const onSelect = (character) => {
    // persist selection and return to the correct generator (image or video)
    try {
      const isVideo = location.pathname.includes("/ai-porn/video");
      const prefix = isVideo ? "pronily:video:" : "pronily:image:";
      localStorage.setItem(`${prefix}selectedCharacter`, JSON.stringify(character));
    } catch (e) {
      /* ignore */
    }
    // after selecting a character, navigate to the character-variant selector
    // which lets the user pick a specific image (for image generator)
    // or a specific video variant (for video generator).
    if (location.pathname.includes("/ai-porn/video")) navigate("/ai-porn/video/character-video");
    else navigate("/ai-porn/image/character-image");
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {filteredCharacters.length > 0 ? (
          filteredCharacters.map((c) => <CharacterTile key={c.id} item={c} onSelect={onSelect} />)
        ) : (
          <div className="col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 rounded-md border border-white/10 bg-white/[.02] p-6 text-center">
            <p className="text-white/70">No characters found for the selected filters.</p>
          </div>
        )}
      </div>
    </section>
  );
}
