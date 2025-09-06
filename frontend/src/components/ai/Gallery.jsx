import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

function Thumb({ item, onOpen, onDownload, isDownloading = false }) {
  const src = item.s3_path_gallery || item.s3_path || item.s3_url || item.media_url || item.image_s3_url || item.image_url_s3 || item.image_url || item.url || item.path || item.file || item.image || item.img || item.signed_url || item.signedUrl || (item.attributes && (item.attributes.s3_path_gallery || item.attributes.url || item.attributes.path || item.attributes.image_s3_url || item.attributes.image_url_s3 || item.attributes.s3_url || item.attributes.media_url || item.attributes.file || item.attributes.img));
  const isVideo = (item.mime_type || item.content_type || '').toString().startsWith('video') || (src && /\.(mp4|webm|ogg)$/i.test(src));
  return (
    <div className="rounded overflow-hidden bg-white/5 relative group">
      <button type="button" onClick={() => onOpen(item)} className="w-full block">
        <div className="w-full aspect-[4/5]">
          {isVideo ? (
            <video src={src} className="w-full h-full object-cover object-top" muted preload="metadata" />
          ) : (
            <img src={src} alt={item.id} className="w-full h-full object-cover object-top" />
          )}
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (onDownload && src) onDownload(src); }}
        className="absolute top-2 right-2 inline-flex items-center gap-2 px-2 py-1 rounded bg-black/60 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        aria-label="Download"
        disabled={!src || isDownloading}
      >
        {isDownloading ? <IconSpinner className="w-4 h-4 text-white animate-spin" /> : <IconDownload className="w-4 h-4 text-white" />}
      </button>
    </div>
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

function IconSpinner({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
  's3_url',
  'media_url',
  'file',
  'img',
    'image',
    'signed_url',
    'signedUrl',
  ];
  for (const k of keys) {
    const v = item[k];
    if (v && typeof v === 'string') return v;
  }
  // nested common locations
  if (item.attributes) {
    for (const k of ['s3_path_gallery', 'url', 'path', 'image']) {
      const v = item.attributes[k];
      if (v && typeof v === 'string') return v;
    }
  }
  if (item.attributes) {
    for (const k of ['s3_path_gallery', 'url', 'path', 'image', 'image_s3_url', 'image_url_s3', 's3_url', 'media_url', 'file', 'img']) {
      const v = item.attributes[k];
      if (v && typeof v === 'string') return v;
    }
  }
  // try nested data fields
  if (item.data && typeof item.data === 'object') {
    return getMediaUrl(item.data) || null;
  }
  return null;
};

export default function Gallery() {
  const navigate = useNavigate();
  const location = useLocation();
  console.log('Gallery component mounted');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewer, setViewer] = useState(null); // item or null
  const [downloading, setDownloading] = useState(null); // url string while downloading
  // simple client-side auth check (only local user token matters for UI behaviour)
  const isLoggedIn = (() => {
    try {
      const t = localStorage.getItem('pronily:auth:token');
      return !!t;
    } catch (e) {
      return false;
    }
  })();

  // derive a sensible filename from an s3 url
  const getFilenameFromUrl = (url) => {
    try {
      if (!url || typeof url !== 'string') return 'download.bin';
      const clean = url.split('?')[0].split('#')[0];
      const parts = clean.split('/').filter(Boolean);
      const last = parts[parts.length - 1] || '';
      if (last && last.includes('.')) return last;
      const extMatch = clean.match(/\.(jpg|jpeg|png|webp|mp4|webm|ogg)(?:$|\?)/i);
      const ext = extMatch ? extMatch[0].replace('.', '') : 'bin';
      return `download.${ext}`;
    } catch (e) {
      return 'download.bin';
    }
  };
  // ---- download helpers following user's guidance ----
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const API_ORIGIN = (() => {
    try {
      return API_BASE ? new URL(API_BASE).origin : null;
    } catch {
      return null;
    }
  })();
  const getOrigin = (u) => {
    try {
      return new URL(u, window.location.href).origin;
    } catch {
      return null;
    }
  };
  const isSameOrApiOrigin = (u) => {
    const o = getOrigin(u);
    return o === window.location.origin || (API_ORIGIN && o === API_ORIGIN);
  };

  const getFilenameFromHeadersOrUrl = (res, url) => {
    try {
      const cd = res?.headers?.get?.('content-disposition');
      if (cd) {
        const m = cd.match(/filename\*?=(?:UTF-8''|")?([^\";]+)\"?/i);
        if (m && m[1]) return decodeURIComponent(m[1].replace(/\"/g, ''));
      }
    } catch (e) {}
    return getFilenameFromUrl(url);
  };

  async function saveBlob(blob, suggestedName) {
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description: 'File', accept: { [blob.type || 'application/octet-stream']: ['.bin'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e) {
        // If the user cancelled the file picker, stop and do not fall back to anchor download.
        // Different browsers report different error names; treat common cancellation names as cancellation.
        const name = e && e.name ? e.name : '';
        const msg = e && e.message ? e.message : '';
        if (name === 'AbortError' || name === 'NotAllowedError' || name === 'SecurityError' || /cancel/i.test(msg)) {
          return; // user cancelled
        }
        // otherwise fallthrough to anchor download
      }
    }
  const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = suggestedName || 'download.bin';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }

  const downloadAndSave = async (url) => {
    if (!url) return;
    setDownloading(url);
    try {
      // 1) Try direct fetch (no auth on cross-origin -> no preflight; requires S3 CORS)
      try {
        const opts = { method: 'GET', mode: 'cors', credentials: 'omit' };
        // Only send auth when hitting same-origin or your API
        if (isSameOrApiOrigin(url)) {
          const headers = {};
          const stored = localStorage.getItem('pronily:auth:token');
          if (stored) headers['Authorization'] = `Bearer ${stored.replace(/^bearer\s+/i, '').trim()}`;
          else if (import.meta.env.VITE_API_AUTH_TOKEN) headers['Authorization'] = import.meta.env.VITE_API_AUTH_TOKEN;
          opts.headers = headers;
          opts.credentials = 'include';
        }

        const res = await fetch(url, opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        await saveBlob(blob, getFilenameFromHeadersOrUrl(res, url));
        return; // success
      } catch (err) {
        console.warn('Direct fetch failed (likely CORS). Will try proxy.', err);
      }

      // 2) Proxy (works even if S3 has no CORS). Make sure this route exists!
      try {
        const proxyUrl = `${(API_BASE || '').replace(/\/$/, '')}/characters/media/download-proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(getFilenameFromUrl(url))}`;
        // include Authorization for proxy calls (proxy is same/API origin and may require auth)
        const proxyHeaders = {};
        try {
          const stored = localStorage.getItem('pronily:auth:token');
          if (stored) proxyHeaders['Authorization'] = `Bearer ${stored.replace(/^bearer\s+/i, '').trim()}`;
          else if (import.meta.env.VITE_API_AUTH_TOKEN) proxyHeaders['Authorization'] = import.meta.env.VITE_API_AUTH_TOKEN;
        } catch (e) {
          // ignore
        }

        const pres = await fetch(proxyUrl, { method: 'GET', credentials: 'omit', headers: proxyHeaders });
        if (!pres.ok) {
          const txt = await pres.text().catch(() => null);
          console.error('Proxy response status/text:', pres.status, txt);
          throw new Error(`Proxy HTTP ${pres.status}`);
        }
        const blob = await pres.blob();
        await saveBlob(blob, getFilenameFromHeadersOrUrl(pres, url));
        return;
      } catch (err2) {
        console.error('Proxy fetch failed:', err2);
        alert('Download failed. Ensure S3 CORS is set OR the /characters/media/download-proxy route is enabled. Check proxy auth and logs.');
      }
    } finally {
      setDownloading(null);
    }
  };

  // fetchGallery is declared at component scope so we can trigger it from other effects (e.g. when auth state changes)
  const lastTokenRef = useRef(null);
  const fetchGallery = useCallback(async (force = false) => {
    const CACHE_KEY = 'pronily:gallery:cache';
    const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours
    console.log('Gallery: fetchGallery start (force=', !!force, ')');
    setLoading(true);
    setError(null);
    try {
      // Try cache first unless forced
      if (!force) {
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.expiresAt && Number(parsed.expiresAt) > Date.now() && Array.isArray(parsed.items)) {
              console.log('Gallery: using cached items', parsed.items.length);
              setItems(parsed.items);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Gallery: cache read failed', e);
        }
      }

      const base = API_BASE;
      console.log('Gallery: VITE_API_BASE_URL=', base);
      if (!base) throw new Error('API base not configured');
      const url = `${base.replace(/\/$/, '')}/characters/media/get-users-character-media`;
      console.log('Gallery: fetch url=', url);
      const headers = { 'Content-Type': 'application/json' };
      const stored = localStorage.getItem('pronily:auth:token');
      if (stored) {
        const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
        headers['Authorization'] = `bearer ${tokenOnly}`;
      } else if (import.meta.env.VITE_API_AUTH_TOKEN) {
        headers['Authorization'] = import.meta.env.VITE_API_AUTH_TOKEN;
      }
      const res = await fetch(url, { headers });
      console.log('Gallery: fetch completed, status=', res.status);
      if (!res.ok) {
        // try to parse known JSON error shapes and treat "no images found" as empty
        let parsed = null;
        try { parsed = await res.json(); } catch (e) { parsed = null; }
        // If backend explicitly says 'Not authenticated', redirect to signin preserving location
        const authMsg = parsed && (parsed.detail || parsed.message || parsed.error) ? String(parsed.detail || parsed.message || parsed.error) : null;
        if (authMsg && /not authenticated/i.test(authMsg)) {
          navigate('/signin', { state: { background: location } });
          return;
        }
        if (parsed && parsed.detail && /no images found/i.test(String(parsed.detail))) {
          // server explicitly reports no images — treat as empty gallery
          setItems([]);
          setLoading(false);
          return;
        }
        const txt = await res.text().catch(() => null);
        throw new Error((parsed && JSON.stringify(parsed)) || txt || res.statusText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log('Gallery: response json', data);
      const rawItems = data.images || data.data || [];
      // normalize items to common shape
      const items = (rawItems || []).map((it, idx) => {
        const url = it.s3_path_gallery || it.s3_path || it.image_s3_url || it.image_url_s3 || it.image_url || it.url || it.path || it.image || it.signed_url || it.signedUrl || (it.attributes && (it.attributes.s3_path_gallery || it.attributes.url || it.attributes.path || it.attributes.image_s3_url || it.attributes.image_url_s3));
        return {
          id: it.id ?? it._id ?? `item-${idx}`,
          mime_type: it.mime_type || it.content_type || (it.type || '').toString(),
          s3_path_gallery: url || null,
          image_s3_url: it.image_s3_url || it.image_s3_url || it.image_url_s3 || null,
          image_url_s3: it.image_url_s3 || it.image_s3_url || it.image_url || null,
          // keep original data for fallback
          ...it,
        };
      });
      setItems(items);
      try {
        const payload = { items, expiresAt: Date.now() + CACHE_TTL };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('Gallery: cache write failed', e);
      }
    } catch (e) {
      const msg = String(e && (e.message || e) || '');
      if (/not authenticated/i.test(msg)) {
        navigate('/signin', { state: { background: location } });
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, navigate, location]);

  useEffect(() => {
    const onOpen = () => console.log('open:gallery event received');
    window.addEventListener('open:gallery', onOpen);

    // initial load: force a network fetch so gallery is populated when the page opens
    fetchGallery(true);

    const onReload = () => { console.log('Gallery: gallery:reload received — refetching'); fetchGallery(true); };
    window.addEventListener('gallery:reload', onReload);

    // detect cross-tab auth changes and same-tab changes (poll) so we can refetch when user returns from signin
    function onStorage(e) {
      if (e.key === 'pronily:auth:token') {
        const newVal = e.newValue;
        if (newVal) fetchGallery(true);
      }
    }
    window.addEventListener('storage', onStorage);

    lastTokenRef.current = (() => {
      try { return localStorage.getItem('pronily:auth:token'); } catch { return null; }
    })();

    const pollInterval = setInterval(() => {
      try {
        const cur = localStorage.getItem('pronily:auth:token');
        if (cur !== lastTokenRef.current) {
          // token changed in same tab (signin flow returned here)
          if (cur) fetchGallery(true);
          lastTokenRef.current = cur;
        }
      } catch (e) {}
    }, 1000);

    return () => {
      window.removeEventListener('gallery:reload', onReload);
      window.removeEventListener('open:gallery', onOpen);
      window.removeEventListener('storage', onStorage);
      clearInterval(pollInterval);
    };
  }, [fetchGallery]);

  return (
    <section className="w-full max-w-7xl mx-auto rounded-2xl border border-white/10 bg-white/[.03] p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/5"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-semibold">Gallery</h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { console.log('Gallery: manual reload'); setItems([]); setLoading(true); setError(null); const ev = new Event('gallery:reload'); window.dispatchEvent(ev); }}
            className="px-3 py-1 rounded bg-white/5"
          >
            Refresh Gallery
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white/60">Loading…</div>
      ) : error ? (
        <div className="text-center text-red-400">{error}</div>
      ) : items.length === 0 ? (
        // if user isn't logged in show a sign-in prompt; otherwise show the existing 'no items' message
        !isLoggedIn ? (
          <div className="text-center text-white/70 space-y-3">
            <div className="text-lg font-medium">You are not logged in.</div>
            <div className="text-sm text-white/60">Sign in to view your Character Images and Videos.</div>
            <div className="mt-3">
              <button onClick={() => navigate('/signin', { state: { background: location } })} className="rounded-xl px-4 py-2 font-semibold text-white bg-gradient-to-r from-pink-500 via-pink-400 to-indigo-500">Sign in</button>
            </div>
          </div>
        ) : (
          <div className="text-center text-white/70 space-y-3">
            <div className="text-lg font-medium">You have not created any Images or Videos.</div>
            <div className="text-sm text-white/60">Use the AI Porn Generator to create your own character images and videos.</div>
            <div className="mt-3">
              <button onClick={() => navigate('/ai-porn/image')} className="rounded-xl px-4 py-2 font-semibold text-white bg-gradient-to-r from-pink-500 via-pink-400 to-indigo-500">Use AI Porn Generator</button>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((it) => {
              const itUrl = getMediaUrl(it);
              return (
                <Thumb
                  key={it.id}
                  item={it}
                  onOpen={(i) => setViewer(i)}
                  onDownload={(url) => downloadAndSave(url)}
                  isDownloading={!!(downloading && itUrl && downloading === itUrl)}
                />
              );
            })}
          </div>
      )}

      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <div className="max-w-[90vw] max-h-[90vh] w-full">
            <div className="mb-3 text-right">
              <button onClick={() => { setViewer(null); }} className="px-3 py-1 rounded bg-white/5">Close</button>
              {(() => {
                const viewerUrl = getMediaUrl(viewer);
                const isCurDownloading = !!(viewerUrl && downloading && downloading === viewerUrl);
                return (
                  <button
                    onClick={() => viewerUrl && downloadAndSave(viewerUrl)}
                    className="ml-2 px-3 py-1 rounded bg-white/5"
                    disabled={!viewerUrl || isCurDownloading}
                  >
                    {isCurDownloading ? <span className="inline-flex items-center gap-2"><IconSpinner className="w-4 h-4 text-white animate-spin" />Downloading…</span> : 'Download'}
                  </button>
                );
              })()}
            </div>
            {((viewer.mime_type || viewer.content_type || '').toString().startsWith('video')) ? (
              <video src={getMediaUrl(viewer)} controls autoPlay className="w-full h-auto max-h-[80vh] bg-black" />
            ) : (
              <img src={getMediaUrl(viewer)} alt="full" className="w-full h-auto max-h-[80vh] object-contain" />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
