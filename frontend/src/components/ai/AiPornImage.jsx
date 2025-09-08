import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../auth/PrimaryButton";
import PreviewCard from "../PreviewCard";
import ImageGenerationLoader from "./ImageGenerationLoader";
import InsufficientCoinsModal from "../ui/InsufficientCoinsModal";

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

import { useLocation } from 'react-router-dom';

export default function AiPornImage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [orientation, setOrientation] = useState("portrait");
  const [ratio, setRatio] = useState("4:5");
  const [count, setCount] = useState(1);
  const [customPrompt, setCustomPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [viewerItem, setViewerItem] = useState(null);
  const [showInsufficientCoinsModal, setShowInsufficientCoinsModal] = useState(false);

  // helper to robustly find a usable media URL from various API shapes
  const getMediaUrl = (item) => {
    if (!item) return null;
    const keys = [
      's3_path_gallery',
      's3_path',
      'image_s3_url',
      'image_url_s3',
      'image_url',
      'url',
      'path',
      'file',
      'image',
      'signed_url',
      'signedUrl',
    ];
    for (const k of keys) {
      const v = item[k];
      if (v && typeof v === 'string') return v;
    }
    if (item.attributes) {
      for (const k of ['s3_path_gallery', 'url', 'path', 'image']) {
        const v = item.attributes[k];
        if (v && typeof v === 'string') return v;
      }
    }
    if (item.data && typeof item.data === 'object') return getMediaUrl(item.data);
    return null;
  };

  // derive a sensible filename from an s3 url
  const getFilenameFromUrl = (url) => {
    try {
      if (!url || typeof url !== 'string') return null;
      // strip query string and hash
      const clean = url.split('?')[0].split('#')[0];
      const parts = clean.split('/').filter(Boolean);
      const last = parts[parts.length - 1] || '';
      // if last contains extension, return it, otherwise fallback
      if (last && last.includes('.')) return last;
      // fallback: try to guess ext from common patterns
      const extMatch = clean.match(/\.(jpg|jpeg|png|webp|mp4|webm|ogg)(?:$|\?)/i);
      const ext = extMatch ? extMatch[0].replace('.', '') : 'bin';
      return `download.${ext}`;
    } catch (e) {
      return null;
    }
  };

  function IconDownload({ className = 'w-4 h-4' }) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 21H3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const numbers = [1, 4, 16, 32, 64, 128, 256];
  const ratios = ["9:16", "1:1", "16:9"];

  const handleGenerate = async () => {
    setError(null);
    setResponseData(null);
    // If user is not signed in (no stored token) redirect to sign-in and
    // preserve the current location so SignIn can navigate back after auth.
    try {
      const storedToken = localStorage.getItem('pronily:auth:token');
      if (!storedToken) {
        navigate('/signin', { state: { background: location } });
        return;
      }
    } catch (e) {}
    if (!character || !character.id) {
      setError('Please select a character before generating.');
      return;
    }
    const base = import.meta.env.VITE_API_BASE_URL;
    if (!base) {
      setError('API base url not configured (VITE_API_BASE_URL).');
      return;
    }

    const url = `${base.replace(/\/$/, '')}/characters/media/create-image`;

    const payload = {
      character_id: Number(character.id),
      name: character?.name || `character-${character?.id}`,
      pose: pose?.name || (pose?.id ? String(pose.id) : ''),
      background: background?.name || (background?.id ? String(background.id) : ''),
      outfit: outfit?.name || (outfit?.id ? String(outfit.id) : ''),
      orientation: orientation || 'portrait',
      positive_prompt: customPrompt || null,
      negative_prompt: negativePrompt || null,
      num_images: Number(count) || 1,
      image_s3_url: character?.img || ''
    };

    try {
      setLoading(true);
      const headers = { 'Content-Type': 'application/json' };
      // Prefer token from user sign-in (localStorage). Fall back to env token.
      const stored = localStorage.getItem("pronily:auth:token");
      let authHeader = null;
      if (stored) {
        const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();
        authHeader = `bearer ${tokenOnly}`; // backend expects lowercase 'bearer'
      } else if (import.meta.env.VITE_API_AUTH_TOKEN) {
        const envToken = import.meta.env.VITE_API_AUTH_TOKEN;
        const tokenOnly = envToken.replace(/^bearer\s+/i, "").trim();
        authHeader = `bearer ${tokenOnly}`;
      }
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 402) {
          // Handle insufficient coins gracefully
          setShowInsufficientCoinsModal(true);
          return;
        }
        let text = await res.text();
        try { const j = JSON.parse(text); text = JSON.stringify(j); } catch (e) {}
        setError(`Server returned ${res.status}: ${text}`);
        return;
      }

  const data = await res.json();
  setResponseData(data);
      // refresh gallery so new images appear there too
      try {
        console.log('AiPornImage: dispatching gallery:reload (immediate)');
        window.dispatchEvent(new CustomEvent('gallery:reload'));
        // dispatch again after a short delay in case the gallery listener wasn't mounted
        setTimeout(() => {
          try { console.log('AiPornImage: dispatching gallery:reload (delayed)'); window.dispatchEvent(new CustomEvent('gallery:reload')); } catch (e) { console.error('AiPornImage: delayed gallery:reload failed', e); }
        }, 400);
      } catch (e) { console.error('AiPornImage: gallery:reload dispatch failed', e); }

      // Also proactively fetch the gallery here and update the cache/state so
      // the newly created image appears immediately in the preview/gallery
      (async () => {
        try {
          console.log('AiPornImage: proactive gallery fetch start');
          const CACHE_KEY = 'pronily:gallery:cache';
          const base2 = import.meta.env.VITE_API_BASE_URL;
          if (!base2) {
            console.warn('AiPornImage: VITE_API_BASE_URL not set, skipping gallery fetch');
            return;
          }
          const fetchUrl = `${base2.replace(/\/$/, '')}/characters/media/get-users-character-media`;
          const headers2 = { 'Content-Type': 'application/json' };
          const stored2 = localStorage.getItem('pronily:auth:token');
          if (stored2) {
            const tokenOnly2 = stored2.replace(/^bearer\s+/i, '').trim();
            headers2['Authorization'] = `bearer ${tokenOnly2}`;
          } else if (import.meta.env.VITE_API_AUTH_TOKEN) {
            headers2['Authorization'] = import.meta.env.VITE_API_AUTH_TOKEN;
          }
          const r = await fetch(fetchUrl, { headers: headers2 });
          console.log('AiPornImage: proactive gallery fetch response', r && r.status);
          if (!r.ok) {
            const t = await r.text().catch(() => '');
            console.warn('AiPornImage: proactive gallery fetch failed', r.status, t);
            return;
          }
          const j = await r.json();
          const items = j.images || j.data || [];
          console.log('AiPornImage: proactive gallery fetch items', Array.isArray(items) ? items.length : 0);
          setGalleryItems(items);
          try {
            const payload = { items, expiresAt: Date.now() + 1000 * 60 * 60 * 6 };
            localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
          } catch (e) { console.warn('AiPornImage: cache write failed', e); }
        } catch (e) {
          console.error('AiPornImage: proactive gallery fetch error', e);
        }
      })();
  // Navigation to chat removed: remain on this page after successful generation
      // Optionally navigate to gallery or preview; keep user on page and show result
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const [character, setCharacter] = React.useState(null);

  const [background, setBackground] = React.useState(null);
  const [pose, setPose] = React.useState(null);
  const [outfit, setOutfit] = React.useState(null);

  // read the image-scoped selections (when returning from Select* pages)
  React.useEffect(() => {
  const fromSelect = location && location.state && location.state.fromSelect;
  if (fromSelect) {
      // coming from the Select flow — read persisted selections
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
    } else {
      // not coming from select — clear previous persisted selections to reset the form
      try { localStorage.removeItem('pronily:image:selectedCharacter'); } catch (e) {}
      try { localStorage.removeItem('pronily:image:selectedBackground'); } catch (e) {}
      try { localStorage.removeItem('pronily:image:selectedPose'); } catch (e) {}
      try { localStorage.removeItem('pronily:image:selectedOutfit'); } catch (e) {}
      setCharacter(null); setBackground(null); setPose(null); setOutfit(null);
    }
  }, [location]);

  // Ensure selected character has an image URL; fetch backend list and patch if missing
  React.useEffect(() => {
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
          try { localStorage.setItem('pronily:image:selectedCharacter', JSON.stringify(patched)); } catch (e) {}
        }
      } catch (e) {}
    };

    try {
      const raw = localStorage.getItem("pronily:image:selectedCharacter");
      if (raw) {
        const ch = JSON.parse(raw);
        ensureImage(ch);
      }
    } catch (e) {}
  }, []);

  // fetch gallery alongside form mount so gallery is available immediately
  React.useEffect(() => {
    (async () => {
      try {
        const CACHE_KEY = 'pronily:gallery:cache';
        const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

        // Try cache first
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.expiresAt && Number(parsed.expiresAt) > Date.now() && Array.isArray(parsed.items)) {
              setGalleryItems(parsed.items);
              return; // cached and valid
            }
          }
        } catch (e) {
          // ignore cache parse errors
        }

        const base = import.meta.env.VITE_API_BASE_URL;
        if (!base) return;
        const url = `${base.replace(/\/$/, '')}/characters/media/get-users-character-media`;
        const headers = { 'Content-Type': 'application/json' };
        const stored = localStorage.getItem('pronily:auth:token');
        if (stored) {
          const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
          headers['Authorization'] = `bearer ${tokenOnly}`;
        } else if (import.meta.env.VITE_API_AUTH_TOKEN) {
          headers['Authorization'] = import.meta.env.VITE_API_AUTH_TOKEN;
        }
        const res = await fetch(url, { headers });
        if (!res.ok) return;
        const json = await res.json();
        const items = json.images || json.data || [];
        setGalleryItems(items);
        try {
          const payload = { items, expiresAt: Date.now() + CACHE_TTL };
          localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        } catch (e) {
          // ignore cache write errors
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // also run when character state updates (e.g. after storage/visibility handlers set it)
  React.useEffect(() => {
    if (character && !character.img) {
      (async () => {
        try {
          const base = import.meta.env.VITE_API_BASE_URL;
          if (!base) return;
          const url = `${base.replace(/\/$/, "")}/characters/fetch-default`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          const found = (Array.isArray(data) ? data : []).find((d) => String(d.id) === String(character.id));
          if (found) {
            const rawUrl = found.image_url_s3 || found.image_url || "";
            const patched = { ...character, img: rawUrl || "" };
            setCharacter(patched);
            try { localStorage.setItem('pronily:image:selectedCharacter', JSON.stringify(patched)); } catch (e) {}
          }
        } catch (e) {}
      })();
    }
  }, [character]);

  // Re-read selection when returning to the page (visibility change or storage event)
  React.useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("pronily:image:selectedCharacter");
        if (raw) setCharacter(JSON.parse(raw));
        else setCharacter(null);
      } catch (e) {}
    };
    const onStorage = (e) => {
      if (e.key && e.key.startsWith('pronily:image:')) read();
    };
    const onVis = () => { if (!document.hidden) read(); };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVis);
    };
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

  const openViewer = (item) => {
    setViewerItem(item);
  };
  const closeViewer = () => setViewerItem(null);

  return (
  <section className="-mx-[calc(50vw-50%)] w-screen overflow-x-clip px-6 sm:px-8 lg:px-10 xl:px-12">
    <div className="mx-auto w-full max-w-[1600px] rounded-2xl border border-white/10 bg-white/[.03] p-3 sm:p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
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
          onClick={() => { console.log('Gallery button clicked'); window.dispatchEvent(new Event('open:gallery')); navigate('/ai-porn/gallery'); }}
          className="rounded-lg px-4 py-2 text-sm border border-pink-500 text-pink-300 hover:bg-pink-500/10"
        >
          Gallery
        </button>
      </div>

      {/* FIX: use md breakpoint and correct arbitrary grid template syntax */}
  <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
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

          {/* Download / result actions area - shows after respondData is present */}
          {responseData && (responseData.images || responseData.data || responseData.results) && (
            <div className="mt-3 text-sm text-white/85">
              <div className="mb-2">Generated images</div>
              <div className="flex flex-col gap-2">
                {(responseData.images || responseData.data || responseData.results).map((img, idx) => {
                  const url = typeof img === 'string' ? img : (img.url || img.image_url || img.s3_url || img.image_s3_url || img.path || img.file || img.image);
                  if (!url) return null;
                  return (
                    <a key={`dl-${idx}-${String(url)}`} href={url} download={getFilenameFromUrl(url) || undefined} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white/5 hover:bg-white/6">
                      <IconDownload className="w-4 h-4 text-white" />
                      <span className="truncate">{getFilenameFromUrl(url) || `image-${idx + 1}`}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="pt-1">
            <button className="text-sm text-white/70 hover:text-white" onClick={() => navigate("/ai-porn")}>
              Back
            </button>
          </div>
        </div>

        {/* RIGHT: Preview area */}
  <div className="rounded-2xl border border-white/10 bg-white/[.02] min-h-[640px] p-2 md:p-3">
          <div className="h-full w-full">
            {loading ? (
              <ImageGenerationLoader />
            ) : error ? (
              <div className="h-full w-full grid place-items-center text-center">
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            ) : responseData && (responseData.images || responseData.data || responseData.results) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(responseData.images || responseData.data || responseData.results).map((img, idx) => {
                  // img may be a string url or object
                  const url = typeof img === 'string' ? img : (img.url || img.image_url || img.s3_url || img.image_s3_url || img.path || img.file || img.image);
                  if (!url) return null;
                  const key = `resp-${idx}-${String(url)}`;
                  return (
                    <div key={key} className="rounded-md overflow-hidden bg-white/5 relative group">
                      <button type="button" onClick={() => openViewer({ type: 'image', url })} className="w-full block">
                          <div className="w-full bg-black flex items-center justify-center overflow-hidden min-h-[520px] md:min-h-[640px]">
                            <img src={url} alt={`generated-${idx}`} className="max-w-full max-h-full object-contain" />
                          </div>
                      </button>
          {/* download link for generated images moved below the Generate button */}
                    </div>
                  );
                })}
              </div>
            ) : galleryItems && galleryItems.length > 0 ? (
              // Show gallery items (images/videos) in the same preview area when there are no recent generations
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                {galleryItems.map((raw) => {
                  const it = (typeof raw === 'string') ? { url: raw } : raw || {};
                  const key = it.id || it.s3_path_gallery || it.url || Math.random();
                  const url = getMediaUrl(it) || it.url || it.path || null;
                  const mime = (it.mime_type || it.content_type || '').toLowerCase();
                  const isVideo = mime.startsWith('video') || /\.(mp4|webm|ogg)$/i.test(url || '');
                  return (
                    <div key={key} className="rounded-md overflow-hidden bg-white/5 relative group">
                      <button type="button" onClick={() => openViewer({ type: isVideo ? 'video' : 'image', url, meta: it })} className="w-full block">
                        {isVideo ? (
                          <div className="w-full aspect-square bg-black">
                            {/* show poster/thumb where possible, otherwise video element will show */}
                            {it.thumb ? (
                              <img src={getMediaUrl(it) || it.thumb} alt={`thumb-${key}`} className="w-full h-full object-cover object-top" />
                            ) : (
                              <video src={getMediaUrl(it) || undefined} muted playsInline preload="metadata" className="w-full h-full object-cover object-top" />
                            )}
                          </div>
                        ) : (
                          <div className="w-full aspect-square">
                            <img src={url} alt={`gallery-${key}`} className="w-full h-full object-cover object-top" />
                          </div>
                        )}
                      </button>
                      <a href={url} download={getFilenameFromUrl(url) || undefined} className="absolute top-2 right-2 inline-flex items-center gap-2 px-2 py-1 rounded bg-black/60 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                        <IconDownload className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              // empty state: render nothing so the preview area stays clean
              <div className="h-full w-full" />
            )}
            {/* Fullscreen viewer modal */}
            {viewerItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={closeViewer}>
                <div className="relative w-full max-w-4xl mx-3 sm:mx-6" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={closeViewer} className="absolute top-3 right-3 z-50 px-3 py-2 rounded bg-black/60 text-white">Close</button>
                  <a href={viewerItem.url} download className="absolute top-3 right-20 z-50 px-3 py-2 rounded bg-black/60 text-white">Download</a>
                  <div className="rounded-md overflow-hidden bg-black">
                    {viewerItem.type === 'video' ? (
                      <video controls autoPlay src={viewerItem.url} className="w-full h-[70vh] object-contain bg-black" />
                    ) : (
                      <img src={viewerItem.url} alt="preview" className="w-full h-[70vh] object-contain bg-black" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Insufficient Coins Modal */}
    <InsufficientCoinsModal 
      open={showInsufficientCoinsModal} 
      onClose={() => setShowInsufficientCoinsModal(false)} 
    />
  </section>
  );
}
