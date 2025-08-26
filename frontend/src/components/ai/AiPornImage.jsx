import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../auth/PrimaryButton";
import PreviewCard from "../PreviewCard";

function IconGem({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 8 7 3h10l4 5-9 13L3 8Z" />
      <path d="M7 3l5 5 5-5" />
    </svg>
  );
}
function IconPlus({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPose({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="5.5" r="2" />
      <path d="M12 8v4l-3 2m3-2 3 2M9 14l-2 5m8-5 2 5" strokeLinecap="round" />
    </svg>
  );
}
function IconBackground({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m7 15 3-3 3 3 3-3 3 3" />
    </svg>
  );
}
function IconOutfit({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 4 7 7v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7l-2-3-3 2-3-2Z" />
      <path d="M9 10h6" />
    </svg>
  );
}
function IconUserPlus({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="7" r="3" />
      <path d="M2 20a7 7 0 0 1 14 0" />
      <path d="M18 8v6M15 11h6" strokeLinecap="round" />
    </svg>
  );
}

function Pill({ active, children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
        active
          ? "bg-pink-600 border-pink-600 text-white"
          : "border-white/15 text-white/85 hover:border-pink-500 hover:text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function AiPornImage() {
  const navigate = useNavigate();

  const [orientation, setOrientation] = useState("portrait");
  const [ratio, setRatio] = useState("4:5");
  const [count, setCount] = useState(1);
  const [customPrompt, setCustomPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(true);

  const numbers = [1, 4, 16, 32, 64, 128, 256];
  const ratios = ["9:16", "1:1", "16:9"];

  const handleGenerate = () => {
    console.log("Generate", { orientation, ratio, count, customPrompt, negativePrompt });
  };

  const [character, setCharacter] = React.useState(null);

  const [background, setBackground] = React.useState(null);
  const [pose, setPose] = React.useState(null);
  const [outfit, setOutfit] = React.useState(null);

  // read the image-scoped selections
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("pronily:image:selectedCharacter");
      if (raw) setCharacter(JSON.parse(raw));
    } catch (e) {}
    try {
      const raw = localStorage.getItem("pronily:image:selectedBackground");
      if (raw) setBackground(JSON.parse(raw));
    } catch (e) {}
    try {
      const raw = localStorage.getItem("pronily:image:selectedPose");
      if (raw) setPose(JSON.parse(raw));
    } catch (e) {}
    try {
      const raw = localStorage.getItem("pronily:image:selectedOutfit");
      if (raw) setOutfit(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const clear = (key) => {
    try {
      localStorage.removeItem(`pronily:image:${key}`);
    } catch (e) {}
    // update local state
    if (key === "selectedCharacter") setCharacter(null);
    if (key === "selectedBackground") setBackground(null);
    if (key === "selectedPose") setPose(null);
    if (key === "selectedOutfit") setOutfit(null);
  };

  return (
    <section className="w-full max-w-7xl mx-auto rounded-2xl border border-white/10 bg-white/[.03] p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
      {/* Head row */}
      <div className="flex items-center justify-between gap-3 mb-4">
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
          <h1 className="text-xl sm:text-2xl font-semibold">AI Porn Image Generator</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/ai-porn")}
          className="rounded-lg px-4 py-2 text-sm border border-pink-500 text-pink-300 hover:bg-pink-500/10"
        >
          Gallery
        </button>
      </div>

      {/* FIX: use md breakpoint and correct arbitrary grid template syntax */}
      <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-6">
        {/* LEFT: Controls */}
        <div className="space-y-4">
          {/* Select Character */}
          <div className="relative">
            <button
              type="button"
              onClick={() => navigate("/ai-porn/image/character")}
              className="w-full rounded-xl border border-white/15 bg-white/[.02] p-5 text-left hover:border-pink-500/60 focus-visible:outline-none"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
                  <IconUserPlus className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-sm text-white/70">Select</div>
                  <div className="text-base font-medium">{character?.name || "Character"}</div>
                </div>
              </div>
            </button>
            {character && (
              <button
                type="button"
                onClick={() => clear("selectedCharacter")}
                className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black/40 border border-white/10 text-xs"
                title="Clear character"
              >
                ×
              </button>
            )}
          </div>

          {/* Pose / Background / Outfit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <button className="w-full col-span-1 h-40 rounded-xl border border-white/15 bg-white/[.02] hover:border-pink-500/60 flex flex-col items-start justify-center gap-2 p-3" onClick={() => navigate('/ai-porn/image/pose')}>
                {pose && pose.img ? (
                  <img src={pose.img} alt={pose.name} className="w-full h-24 rounded-md object-cover" />
                ) : (
                  <div className="w-full h-24 rounded-md bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.06),rgba(255,255,255,0)_70%)] flex items-center justify-center">
                    <IconPose className="w-8 h-8 text-white/60" />
                  </div>
                )}
                <div className="text-sm mt-2">{pose?.name || 'Pose'}</div>
              </button>
              {pose && (
                <button type="button" onClick={() => clear('selectedPose')} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black/40 border border-white/10 text-xs" title="Clear pose">×</button>
              )}
            </div>
            <div className="col-span-1 grid gap-4">
              <div className="relative">
                <button
                  className="w-full h-[72px] rounded-xl border border-white/15 bg-white/[.02] hover:border-pink-500/60 flex items-center gap-3 px-3"
                  onClick={() => navigate("/ai-porn/image/background")}
                >
                  {background && background.img ? (
                    <img src={background.img} alt={background.name} className="w-14 h-14 rounded-md object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-white/[.02] flex items-center justify-center">
                      <IconBackground className="w-6 h-6 text-white/60" />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs text-white/70">Background</div>
                    <div className="text-sm font-medium">{background?.name || "Background"}</div>
                  </div>
                </button>
                {background && (
                  <button type="button" onClick={() => clear('selectedBackground')} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black/40 border border-white/10 text-xs" title="Clear background">×</button>
                )}
              </div>
              <div className="relative">
                <button
                  className="w-full h-[72px] rounded-xl border border-white/15 bg-white/[.02] hover:border-pink-500/60 flex items-center gap-3 px-3"
                  onClick={() => navigate('/ai-porn/image/outfit')}
                >
                  {outfit && outfit.img ? (
                    <img src={outfit.img} alt={outfit.name} className="w-14 h-14 rounded-md object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-white/[.02] flex items-center justify-center">
                      <IconOutfit className="w-6 h-6 text-white/60" />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs text-white/70">Outfit</div>
                    <div className="text-sm font-medium">{outfit?.name || "Outfit"}</div>
                  </div>
                </button>
                {outfit && (
                  <button type="button" onClick={() => clear('selectedOutfit')} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black/40 border border-white/10 text-xs" title="Clear outfit">×</button>
                )}
              </div>
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="rounded-xl border border-white/15 bg-white/[.02] p-4">
            <div className="flex items-center gap-2 text-sm mb-2">
              <IconPlus className="w-4 h-4" />
              <span>Custom Prompt</span>
            </div>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what you want to generate…"
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>

          {/* Additional Settings toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-1 text-left text-sm text-white/80"
          >
            <span>Additional Settings</span>
            <svg
              viewBox="0 0 24 24"
              className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Negative Prompt */}
          {showAdvanced && (
            <div className="rounded-xl border border-white/15 bg-white/[.02] p-4">
              <div className="flex items-center gap-2 text-sm mb-2">
                <IconPlus className="w-4 h-4" />
                <span>Negative Prompt</span>
              </div>
              <textarea
                rows={2}
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Things to avoid (e.g., low-res, blur, extra fingers)…"
                className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/40"
              />
            </div>
          )}

          {/* Orientation */}
          <div className="space-y-2">
            <div className="text-sm text-white/80">Orientation</div>
            {/* Primary orientation buttons use two columns on small+ screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Pill
                active={orientation === "portrait"}
                onClick={() => {
                  setOrientation("portrait");
                  setRatio("4:5");
                }}
                className="w-full py-4 text-left"
              >
                Portrait (4:5)
              </Pill>
              <Pill
                active={orientation === "landscape"}
                onClick={() => {
                  setOrientation("landscape");
                  setRatio("5:4");
                }}
                className="w-full py-4 text-left"
              >
                Landscape (5:4)
              </Pill>
            </div>
            {/* Ratio presets spread across available width */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              {ratios.map((r) => (
                <Pill key={r} active={ratio === r} onClick={() => setRatio(r)} className="w-full py-3 justify-center">
                  {r}
                </Pill>
              ))}
            </div>
          </div>

          {/* Number of images */}
          <div className="space-y-2">
            <div className="text-sm text-white/80">Number of images</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {numbers.map((n) => (
                <Pill key={n} active={count === n} onClick={() => setCount(n)} className="w-full h-12 inline-flex items-center justify-center gap-2">
                  <IconGem />
                  {n}
                </Pill>
              ))}
            </div>
          </div>

          {/* Generate */}
          <PrimaryButton onClick={handleGenerate}>+ Generate Image</PrimaryButton>

          {/* Back link */}
          <div className="pt-1">
            <button className="text-sm text-white/70 hover:text-white" onClick={() => navigate("/ai-porn")}>
              Back
            </button>
          </div>
        </div>

        {/* RIGHT: Preview area */}
        <div className="rounded-2xl border border-white/10 bg-white/[.02] min-h-[640px] p-4">
          <div className="h-full w-full grid place-items-center text-center">
            <div className="text-white/60 text-sm">
              No previous generations
              <div className="text-white/40">Go on… generate some spicy images!</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
