import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PrimaryButton from "../auth/PrimaryButton";
import ImageGenerationLoader from "./ImageGenerationLoader";
import InsufficientCoinsModal from "../ui/InsufficientCoinsModal";

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

function IconDownload({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 21H3" strokeLinecap="round" strokeLinejoin="round" />
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
  // prompts + generation state
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [viewerItem, setViewerItem] = useState(null);
  const [showInsufficientCoinsModal, setShowInsufficientCoinsModal] = useState(false);
  const [thumbCache, setThumbCache] = useState({}); // mediaUrl -> dataURL

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

  // Re-read selection when returning to the page (visibility change or storage event)
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("pronily:video:selectedCharacter");
        if (raw) setCharacter(JSON.parse(raw)); else setCharacter(null);
      } catch (e) {}
      try {
        const raw = localStorage.getItem("pronily:video:selectedPose");
        if (raw) setPose(JSON.parse(raw)); else setPose(null);
      } catch (e) {}
      try {
        const raw = localStorage.getItem("pronily:video:selectedSource");
        if (raw) setVideoSrc(JSON.parse(raw)); else setVideoSrc(null);
      } catch (e) {}
    };
    const onStorage = (e) => { if (e.key && e.key.startsWith('pronily:video:')) read(); };
    const onVis = () => { if (!document.hidden) read(); };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Generate thumbnails for video files that lack a server-side poster/thumb.
  // This attempts a client-side capture (video -> canvas -> dataURL). It will
  // fail silently if the media is cross-origin without proper CORS headers.
  useEffect(() => {
    if (!galleryItems || !galleryItems.length) return;
    let cancelled = false;
    const pending = [];

    const makeThumb = async (mediaUrl, targetW = 512, targetH = 512) => {
      if (!mediaUrl) return null;
      if (thumbCache[mediaUrl]) return thumbCache[mediaUrl];
      return new Promise((resolve) => {
        try {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.playsInline = true;
          video.preload = 'metadata';
          video.src = mediaUrl;
          // small timeout guard
          const onError = (err) => {
            cleanup();
            resolve(null);
          };
          const cleanup = () => {
            video.removeEventListener('loadeddata', onLoaded);
            video.removeEventListener('error', onError);
            try { video.src = ''; } catch (e) {}
          };
          const onLoaded = () => {
            try {
              // seek to a small time if possible (use duration || 1 to avoid NaN)
              const seekTime = Math.min(0.2, Math.max(0, (video.duration || 1) * 0.05));
              const seek = () => {
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = targetW;
                  canvas.height = targetH;
                  const ctx = canvas.getContext('2d');
                  // draw video frame scaled to cover
                  ctx.fillStyle = '#000';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  // compute object-cover sizing
                  const vw = video.videoWidth;
                  const vh = video.videoHeight;
                  if (vw && vh) {
                    const r = Math.max(canvas.width / vw, canvas.height / vh);
                    const dw = vw * r;
                    const dh = vh * r;
                    const dx = (canvas.width - dw) / 2;
                    const dy = (canvas.height - dh) / 2;
                    ctx.drawImage(video, dx, dy, dw, dh);
                  } else {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  }
                  const data = canvas.toDataURL('image/jpeg', 0.85);
                  cleanup();
                  resolve(data);
                } catch (e) {
                  cleanup();
                  resolve(null);
                }
              };
              // some browsers allow immediate capture; others require a small seek
              try {
                if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) seek();
                else {
                  const onSeeked = () => { video.removeEventListener('seeked', onSeeked); seek(); };
                  video.addEventListener('seeked', onSeeked);
                  video.currentTime = seekTime;
                }
              } catch (e) { seek(); }
            } catch (e) { cleanup(); resolve(null); }
          };
          video.addEventListener('loadedmetadata', onLoaded);
          video.addEventListener('error', onError);
          // start loading
          // append to DOM hidden to improve some browsers' behaviour
          video.style.position = 'fixed'; video.style.left = '-9999px'; video.style.width = '1px'; video.style.height = '1px';
          document.body.appendChild(video);
          // safety timeout
          const to = setTimeout(() => { try { cleanup(); } catch (e) {} ; resolve(null); }, 5000);
          // ensure cleanup removes element
          const origResolve = resolve;
          resolve = (v) => { clearTimeout(to); try { if (video && video.parentNode) video.parentNode.removeChild(video); } catch (e) {} origResolve(v); };
        } catch (e) { resolve(null); }
      });
    };

    (async () => {
      for (const raw of galleryItems) {
        if (cancelled) break;
        const it = (typeof raw === 'string') ? { url: raw } : raw || {};
        const mediaUrl = getMediaUrl(it) || it.url || it.video_url || it.video_s3_url || it.path || null;
        const mime = (it.mime_type || it.content_type || '').toLowerCase();
        const isVideo = mime.startsWith('video') || /\.(mp4|webm|ogg)$/i.test(mediaUrl || '');
        const hasPoster = it.thumb || it.poster || it.image_s3_url || it.image_url;
        if (isVideo && mediaUrl && !hasPoster && !thumbCache[mediaUrl]) {
          // generate and cache
          try {
            const data = await makeThumb(mediaUrl);
            if (cancelled) break;
            if (data) setThumbCache((s) => ({ ...s, [mediaUrl]: data }));
          } catch (e) {
            // ignore
          }
        }
      }
    })();

    return () => { cancelled = true; };
  }, [galleryItems]);

  const clear = (key) => {
    try {
      localStorage.removeItem(`pronily:video:${key}`);
    } catch {}
    if (key === "selectedCharacter") setCharacter(null);
    if (key === "selectedPose") setPose(null);
    if (key === "selectedSource") setVideoSrc(null);
  };

  const handleGenerate = () => {
    (async () => {
      setError(null);
      setResponseData(null);
      // Redirect to sign-in if user isn't authenticated. Preserve current location
      // in state.background so SignIn can navigate back after successful login.
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

      const url = `${base.replace(/\/$/, '')}/characters/media/create-video`;
      const payload = {
        character_id: Number(character.id),
        name: character?.name || `character-${character?.id}`,
        prompt: prompt || '',
        duration: Number(lengthSec) || 5,
        negative_prompt: negativePrompt || '',
        pose: pose?.name || (pose?.id ? String(pose.id) : ''),
      };

      try {
        setLoading(true);
        const headers = { 'Content-Type': 'application/json' };
        const stored = localStorage.getItem("pronily:auth:token");
        let authHeader = null;
        if (stored) {
          const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();
          authHeader = `bearer ${tokenOnly}`;
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

        try { window.dispatchEvent(new CustomEvent('gallery:reload')); } catch (e) {}

        // proactively refresh gallery
        (async () => {
          try {
            const CACHE_KEY = 'pronily:gallery:cache';
            const base2 = import.meta.env.VITE_API_BASE_URL;
            if (!base2) return;
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
            if (!r.ok) return;
            const j = await r.json();
            const items = j.videos || j.data || j.images || [];
            setGalleryItems(items);
            try { localStorage.setItem(CACHE_KEY, JSON.stringify({ items, expiresAt: Date.now() + 1000 * 60 * 60 * 6 })); } catch (e) {}
          } catch (e) { /* ignore */ }
        })();
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  };

  // helper to robustly find a usable media URL from various API shapes
  const getMediaUrl = (item) => {
    if (!item) return null;
    const keys = ['s3_path_gallery','s3_path','video_s3_url','video_url','image_s3_url','image_url','url','path','file','image','signed_url','signedUrl','thumb'];
    for (const k of keys) {
      const v = item[k];
      if (v && typeof v === 'string') return v;
    }
    if (item.attributes) {
      for (const k of ['s3_path_gallery','url','path','image','video_url']) {
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
      const clean = url.split('?')[0].split('#')[0];
      const parts = clean.split('/').filter(Boolean);
      const last = parts[parts.length - 1] || '';
      if (last && last.includes('.')) return last;
      const extMatch = clean.match(/\.(jpg|jpeg|png|webp|mp4|webm|ogg)(?:$|\?)/i);
      const ext = extMatch ? extMatch[0].replace('.', '') : 'bin';
      return `download.${ext}`;
    } catch (e) {
      return null;
    }
  };

  // Returns best poster URL: prefer client-generated thumb, then server-provided image fields
  // Returns best poster URL: generated dataURL -> explicit poster/thumb -> other image-ish fields (even if no file extension)
  const getPosterUrl = (item, mediaUrl) => {
    // 1) client-generated
    if (thumbCache && mediaUrl && thumbCache[mediaUrl]) return thumbCache[mediaUrl];

    // 2) server-provided (any of these if present)
    if (item) {
      const candidates = [
        item.thumb, item.poster, item.image_thumb_url,
        item.image_s3_url, item.image_url, item.cover_url, item.poster_s3_url,
        item?.attributes?.thumb, item?.attributes?.poster, item?.attributes?.image, item?.attributes?.image_url
      ];
      const first = candidates.find(u => typeof u === 'string' && u.trim());
      if (first) return first;
    }
    return null;
  };

  // fetch gallery alongside form mount so gallery is available immediately (same as AiPornImage)
  useEffect(() => {
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
  // Merge videos and images (and any data array) so the gallery shows all media
  const videos = Array.isArray(json.videos) ? json.videos : [];
  const images = Array.isArray(json.images) ? json.images : [];
  const dataItems = Array.isArray(json.data) ? json.data : [];
  const items = [...videos, ...images, ...dataItems];
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

  const openViewer = (item) => { setViewerItem(item); };
  const closeViewer = () => setViewerItem(null);

  return (
    <section className="-mx-[calc(50vw-50%)] w-screen overflow-x-clip px-6 sm:px-8 lg:px-10 xl:px-12">
      <div className="mx-auto w-full max-w-[1600px] rounded-2xl border border-white/10 bg-white/[.03] p-3 sm:p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
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

  <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
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
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
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
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
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
          <div className="h-full w-full">
            {loading ? (
              <ImageGenerationLoader />
            ) : error ? (
              <div className="h-full w-full grid place-items-center text-center">
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            ) : responseData && (responseData.video || responseData.videos || responseData.data) ? (
              <div className="grid grid-cols-1 gap-3">
                {((responseData.video && [responseData.video]) || responseData.videos || responseData.data || []).map((it, idx) => {
                      const mediaUrl = typeof it === 'string' ? it : (it.url || it.video_url || it.video_s3_url || it.s3_path || it.path || it.file || null);
                      if (!mediaUrl) return null;
                      const key = `resp-${idx}-${String(mediaUrl)}`;
                      return (
                        <div key={key} className="rounded-md overflow-hidden bg-white/5 relative group">
                          <button type="button" onClick={() => openViewer({ type: 'video', url: mediaUrl, meta: it })} className="w-full block">
                            <div className="w-full bg-black flex items-center justify-center overflow-hidden min-h-[360px] md:min-h-[420px]">
                              <video
                                src={mediaUrl}
                                controls
                                poster={getPosterUrl(it, mediaUrl) || undefined}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          </button>
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
                  // prefer robust getMediaUrl for the media; fallbacks for different API shapes
                  const mediaUrl = getMediaUrl(it) || it.url || it.video_url || it.video_s3_url || it.path || null;
                  const mime = (it.mime_type || it.content_type || '').toLowerCase();
                  const isVideo = mime.startsWith('video') || /\.(mp4|webm|ogg)$/i.test(mediaUrl || '');
                  const posterUrl = getPosterUrl(it, mediaUrl);
                  return (
                    <div key={key} className="rounded-md overflow-hidden bg-white/5 relative group">
                      <button type="button" onClick={() => openViewer({ type: isVideo ? 'video' : 'image', url: mediaUrl, meta: it })} className="w-full block">
                        {isVideo ? (
                          <div className="w-full aspect-square bg-black">
                            <video
                              src={mediaUrl}
                              poster={posterUrl || undefined}
                              muted
                              playsInline
                              preload="metadata"
                              autoPlay={!posterUrl}
                              loop={!posterUrl}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                        ) : (
                          <div className="w-full aspect-square">
                            <img src={mediaUrl} alt={`gallery-${key}`} className="w-full h-full object-cover object-top" />
                          </div>
                        )}
                      </button>
                      <a href={mediaUrl} download={getFilenameFromUrl(mediaUrl) || undefined} className="absolute top-2 right-2 inline-flex items-center gap-2 px-2 py-1 rounded bg-black/60 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                        <IconDownload className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              // empty state: render nothing so the preview area stays clean (same as AiPornImage)
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
