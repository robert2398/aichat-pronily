import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Thumb({ item, onOpen }) {
  const src = item.s3_path_gallery || item.s3_path || item.s3_url || item.media_url || item.image_s3_url || item.image_url_s3 || item.image_url || item.url || item.path || item.file || item.image || item.img || item.signed_url || item.signedUrl || (item.attributes && (item.attributes.s3_path_gallery || item.attributes.url || item.attributes.path || item.attributes.image_s3_url || item.attributes.image_url_s3 || item.attributes.s3_url || item.attributes.media_url || item.attributes.file || item.attributes.img));
  const isVideo = (item.mime_type || item.content_type || '').toString().startsWith('video') || (src && /\.(mp4|webm|ogg)$/i.test(src));
  return (
    <button onClick={() => onOpen(item)} className="rounded overflow-hidden bg-white/5">
      <div className="w-full aspect-[4/5]">
        {isVideo ? (
          <video src={src} className="w-full h-full object-cover object-top" muted preload="metadata" />
        ) : (
          <img src={src} alt={item.id} className="w-full h-full object-cover object-top" />
        )}
      </div>
    </button>
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
  console.log('Gallery component mounted');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewer, setViewer] = useState(null); // item or null

  useEffect(() => {
  const CACHE_KEY = 'pronily:gallery:cache';
  const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

  const onOpen = () => console.log('open:gallery event received');
  window.addEventListener('open:gallery', onOpen);

  const fetchGallery = async (force = false) => {
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

        const base = import.meta.env.VITE_API_BASE_URL;
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
          const txt = await res.text();
          throw new Error(txt || res.statusText || `HTTP ${res.status}`);
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
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    // initial load (use cache if available)
    fetchGallery();
    const onReload = () => { console.log('Gallery: gallery:reload received — refetching'); fetchGallery(true); };
    window.addEventListener('gallery:reload', onReload);
    return () => {
      window.removeEventListener('gallery:reload', onReload);
      window.removeEventListener('open:gallery', onOpen);
    };
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto rounded-2xl border border-white/10 bg-white/[.03] p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Gallery</h1>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => window.location.reload()} className="px-3 py-1 rounded bg-white/5">Reload page</button>
        <button onClick={() => { console.log('Gallery: manual reload'); setItems([]); setLoading(true); setError(null); const ev = new Event('gallery:reload'); window.dispatchEvent(ev); }} className="px-3 py-1 rounded bg-white/5">Reload</button>
      </div>

      {loading ? (
        <div className="text-center text-white/60">Loading…</div>
      ) : error ? (
        <div className="text-center text-red-400">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center text-white/60">No media yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((it) => (
            <Thumb key={it.id} item={it} onOpen={(i) => setViewer(i)} />
          ))}
        </div>
      )}

      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <div className="max-w-[90vw] max-h-[90vh] w-full">
            <div className="mb-3 text-right">
              <button onClick={() => { setViewer(null); }} className="px-3 py-1 rounded bg-white/5">Close</button>
              <a href={getMediaUrl(viewer) || '#'} download className="ml-2 px-3 py-1 rounded bg-white/5">Download</a>
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
