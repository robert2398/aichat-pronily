import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PrimaryButton from "../auth/PrimaryButton";

// ---- inline icons (kept lightweight & themeable) ----
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
function IconUserPlus({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="7" r="3" />
      <path d="M2 20a7 7 0 0 1 14 0" />
      <path d="M18 8v6M15 11h6" strokeLinecap="round" />
    </svg>
  );
}
function IconVideo({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M11 9.5v5l4-2.5-4-2.5Z" fill="currentColor" />
    </svg>
  );
}

// small pill button
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

export default function AiPornVideo() {
  const navigate = useNavigate();
  const location = useLocation();

  // selections (scoped to video)
  const [character, setCharacter] = useState(null);
  const [pose, setPose] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);

  // video options
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [videoMode, setVideoMode] = useState("presets"); // presets | image2video | extend | talking
  const [quality, setQuality] = useState("balanced"); // balanced | ultra
  const [lengthSec, setLengthSec] = useState(5); // 5 | 10
  const [speedBoost, setSpeedBoost] = useState(true);

  // read persisted selections if present; respect navigation state from SelectCharacter
  useEffect(() => {
    const fromSelect = location && location.state && location.state.fromSelect;
    console.log('AiPornVideo mounted, fromSelect=', fromSelect);
    try {
      const c = localStorage.getItem("pronily:video:selectedCharacter");
      console.log('AiPornVideo: read selectedCharacter raw=', c);
      if (c) setCharacter(JSON.parse(c));
      else if (!fromSelect) setCharacter(null);
    } catch {}
    try {
      const p = localStorage.getItem("pronily:video:selectedPose");
      console.log('AiPornVideo: read selectedPose raw=', p);
      if (p) setPose(JSON.parse(p));
      else if (!fromSelect) setPose(null);
    } catch {}
    try {
      const v = localStorage.getItem("pronily:video:selectedSource");
      console.log('AiPornVideo: read selectedSource raw=', v);
      if (v) setVideoSrc(JSON.parse(v));
      else if (!fromSelect) setVideoSrc(null);
    } catch {}
  }, [location]);

  // Ensure selected character has an image URL; fetch backend list and patch if missing
  useEffect(() => {
    const ensureImage = async (ch) => {
      try {
        if (!ch || ch.img) return;
        const base = import.meta.env.VITE_API_BASE_URL;
        if (!base) return;
        const url = `${base.replace(/\/$/, "")}/characters/fetch-default`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const found = (Array.isArray(data) ? data : []).find((d) => String(d.id) === String(ch.id));
        if (found) {
          const rawUrl = found.image_url_s3 || found.image_url || "";
          const finalUrl = rawUrl || "";
          const patched = { ...ch, img: finalUrl };
          setCharacter(patched);
          try { localStorage.setItem('pronily:video:selectedCharacter', JSON.stringify(patched)); } catch (e) {}
        }
      } catch (e) {}
    };

    try {
      const raw = localStorage.getItem("pronily:video:selectedCharacter");
      if (raw) {
        const ch = JSON.parse(raw);
        ensureImage(ch);
      }
    } catch (e) {}
  }, []);

  // also run when character changes
  useEffect(() => {
    if (character && !character.img) {
      useEffect(() => {
        const fromSelect = location && location.state && location.state.fromSelect;
        console.log('AiPornVideo mounted, fromSelect=', fromSelect);
        if (fromSelect) {
          try {
            const c = localStorage.getItem("pronily:video:selectedCharacter");
            console.log('AiPornVideo: read selectedCharacter raw=', c);
            if (c) setCharacter(JSON.parse(c));
          } catch {}
          try {
            const p = localStorage.getItem("pronily:video:selectedPose");
            console.log('AiPornVideo: read selectedPose raw=', p);
            if (p) setPose(JSON.parse(p));
          } catch {}
          try {
            const v = localStorage.getItem("pronily:video:selectedSource");
            console.log('AiPornVideo: read selectedSource raw=', v);
            if (v) setVideoSrc(JSON.parse(v));
          } catch {}
        } else {
          try { localStorage.removeItem('pronily:video:selectedCharacter'); } catch (e) {}
          try { localStorage.removeItem('pronily:video:selectedPose'); } catch (e) {}
          try { localStorage.removeItem('pronily:video:selectedSource'); } catch (e) {}
          setCharacter(null); setPose(null); setVideoSrc(null);
        }
      }, [location]);
    };
    const onStorage = (e) => { if (e.key && e.key.startsWith('pronily:video:')) read(); };
    const onVis = () => { if (!document.hidden) read(); };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('storage', onStorage); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const clear = (key) => {
    try {
      localStorage.removeItem(`pronily:video:${key}`);
    } catch {}
    if (key === "selectedCharacter") setCharacter(null);
    if (key === "selectedPose") setPose(null);
    if (key === "selectedSource") setVideoSrc(null);
  };

  const handleGenerate = () => {
    console.log("Generate video", {
      character,
      pose,
      videoSrc,
      videoMode,
      quality,
      lengthSec,
      speedBoost,
    });
  };

  return (
    <section className="w-full max-w-7xl mx-auto rounded-2xl border border-white/10 bg-white/[.03] p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
      {/* header row */}
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
          <h1 className="text-xl sm:text-2xl font-semibold">AI Porn Video Generator</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/ai-porn/gallery")}
          className="rounded-lg px-4 py-2 text-sm border border-pink-500 text-pink-300 hover:bg-pink-500/10"
        >
          Gallery
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-6">
        {/* LEFT */}
        <div className="space-y-4">
          {/* Select Character */}
          <div className="relative">
            <button
              type="button"
              onClick={() => navigate("/ai-porn/video/character")}
              className="w-full rounded-xl border border-white/15 bg-white/[.02] p-5 text-left hover:border-pink-500/60"
            >
              <div className="flex items-center gap-3">
                {character && character.img ? (
                  <img src={character.img} alt={character.name} className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
                    <IconUserPlus className="w-5 h-5" />
                  </span>
                )}
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

          {/* Pose + Video tiles */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pose (large) */}
            <div className="relative">
              <button
                className="w-full h-40 rounded-xl border border-white/15 bg-white/[.02] hover:border-pink-500/60 flex flex-col items-start justify-center gap-2 p-3"
                onClick={() => navigate("/ai-porn/video/pose")}
              >
                {pose && pose.img ? (
                  <img src={pose.img} alt={pose.name} className="w-full h-24 rounded-md object-cover" />
                ) : (
                  <div className="w-full h-24 rounded-md bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.06),rgba(255,255,255,0)_70%)] flex items-center justify-center">
                    <IconPose className="w-8 h-8 text-white/60" />
                  </div>
                )}
                <div className="text-sm mt-2">{pose?.name || "Pose"}</div>
              </button>
              {pose && (
                <button
                  type="button"
                  onClick={() => clear("selectedPose")}
                  className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black/40 border border-white/10 text-xs"
                  title="Clear pose"
                >
                  ×
                </button>
              )}
            </div>

            {/* Video (tall stack: single 72px tile like design) */}
            <div className="relative">
              <button
                className="w-full h-40 rounded-xl border border-white/15 bg-white/[.02] hover:border-pink-500/60 flex flex-col items-start justify-center gap-2 p-3"
                onClick={() => navigate("/ai-porn/video/source")}
              >
                {videoSrc && videoSrc.thumb ? (
                  <img src={videoSrc.thumb} alt={videoSrc.name} className="w-full h-24 rounded-md object-cover" />
                ) : (
                  <div className="w-full h-24 rounded-md bg-white/[.02] flex items-center justify-center">
                    <IconVideo className="w-8 h-8 text-white/60" />
                  </div>
                )}
                <div className="text-sm mt-2">{videoSrc?.name || "Video"}</div>
              </button>
              {videoSrc && (
                <button
                  type="button"
                  onClick={() => clear("selectedSource")}
                  className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black/40 border border-white/10 text-xs"
                  title="Clear video"
                >
                  ×
                </button>
              )}
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
              placeholder="Describe what you want to generate…"
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>

          {/* Additional Settings + Negative Prompt */}
          <div>
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

            {showAdvanced && (
              <div className="mt-3 rounded-xl border border-white/15 bg-white/[.02] p-4">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <IconPlus className="w-4 h-4" />
                  <span>Negative Prompt</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Things to avoid (e.g., low-res, blur, artifacts)…"
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/40"
                />
              </div>
            )}
          </div>

          {/* Video Mode */}
          <div className="space-y-2">
            <div className="text-sm text-white/80">Video Mode</div>
            <div className="grid grid-cols-2 gap-3">
              <Pill active={videoMode === "presets"} onClick={() => setVideoMode("presets")} className="w-full py-3 justify-center">
                Presets
              </Pill>
              <Pill active={videoMode === "image2video"} onClick={() => setVideoMode("image2video")} className="w-full py-3 justify-center">
                Image to Video
              </Pill>
              <Pill active={videoMode === "extend"} onClick={() => setVideoMode("extend")} className="w-full py-3 justify-center">
                Extend Video
              </Pill>
              <Pill active={videoMode === "talking"} onClick={() => setVideoMode("talking")} className="w-full py-3 justify-center">
                Talking
              </Pill>
            </div>
          </div>


            {/* Quality Level */}
            <div className="space-y-4">
              <div className="text-sm text-white/80">Quality Level</div>
              <div className="grid grid-cols-2 gap-4">
                <Pill active={quality === "balanced"} onClick={() => setQuality("balanced")} className="w-full py-6 text-lg font-medium">
                  Balanced
                </Pill>
                <Pill active={quality === "ultra"} onClick={() => setQuality("ultra")} className="w-full py-6 text-lg font-medium">
                  Ultra
                </Pill>
              </div>
              <div className="text-sm text-white/60">Recommended | ~1 min <span className="ml-2 inline-block px-2 py-1 bg-white/10 rounded">100 ⍟</span></div>
            </div>

            {/* Duration & Speed Boost */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/80">Duration</div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-white/70">5s</div>
                  <button
                    type="button"
                    onClick={() => setLengthSec((v) => (v === 5 ? 10 : 5))}
                    className={`relative w-12 h-6 rounded-full ${lengthSec === 10 ? "bg-pink-600" : "bg-white/[.08]"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${lengthSec === 10 ? "translate-x-6" : ""}`}></span>
                  </button>
                  <div className="text-sm text-white/70">10s</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/80">Speed Boost</div>
                  <div className="text-sm text-white/60">Generate faster with minimal quality loss.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSpeedBoost((s) => !s)}
                  className={`relative w-12 h-6 rounded-full ${speedBoost ? "bg-pink-600" : "bg-white/[.08]"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${speedBoost ? "translate-x-6" : ""}`}></span>
                </button>
              </div>
            </div>

          {/* CTA (matches screenshot text) */}
          <PrimaryButton onClick={handleGenerate}>+ Generate Video</PrimaryButton>

          <div className="pt-1">
            <button className="text-sm text-white/70 hover:text-white" onClick={() => navigate("/ai-porn")}>
              Back
            </button>
          </div>
        </div>

        {/* RIGHT: preview area */}
        <div className="rounded-2xl border border-white/10 bg-white/[.02] min-h-[640px] p-4">
          <div className="h-full w-full grid place-items-center text-center">
            <div className="text-white/60 text-sm">
              No previous generations
              <div className="text-white/40">Go on… generate some spicy videos!</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
