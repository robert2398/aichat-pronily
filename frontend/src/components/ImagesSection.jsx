import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";

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
  if (item.attributes) {
    for (const k of ['s3_path_gallery', 'url', 'path', 'image']) {
      const v = item.attributes[k];
      if (v && typeof v === 'string') return v;
    }
  }
  if (item.data && typeof item.data === 'object') return getMediaUrl(item.data) || null;
  return null;
};

const isVideoUrl = (u, mime) => {
  if (!u && !mime) return false;
  if (mime && mime.toString().startsWith('video')) return true;
  return !!(u && /\.(mp4|webm|ogg)$/i.test(u));
};

export default function ImagesSection() {
  const [items, setItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchDefault = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL;
        if (!API_BASE) throw new Error('VITE_API_BASE_URL not configured');
        const url = `${API_BASE.replace(/\/$/, '')}/characters/media/get-default-character-media`;
        const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // endpoint may return media under `media` (new shape) or older shapes
        const raw = data.media || data.images || data.items || data.data || data || [];
        const imgs = (Array.isArray(raw) ? raw : []).map((it, idx) => ({
          id: it.id ?? it._id ?? `img-${idx}`,
          media_type: it.media_type ?? null,
          mime_type: it.mime_type || it.content_type || (it.type || '').toString(),
          likes: it.likes || it._likes || '1.5k',
          raw: it,
        })).filter(i => {
          // prefer explicit media_type; fall back to MIME / URL heuristics
          if (i.media_type) return i.media_type.toString().toLowerCase() === 'image';
          return !isVideoUrl(getMediaUrl(i.raw), i.mime_type);
        });
        if (!cancelled) setItems(imgs);
      } catch (e) {
        console.warn('ImagesSection: fetch failed', e);
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDefault();
    return () => { cancelled = true; };
  }, []);

  // reset visible count when items change (after fetch)
  useEffect(() => {
    setVisibleCount(5);
  }, [items]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <h3 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight">Our Best AI Porn Images Collection - 72 PPI to 200+ DPI</h3>
      <div className="mt-6">
        {loading ? (
          <div className="text-center text-white/60">Loading…</div>
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-center text-white/60">No images available.</div>
        ) : (
          <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.slice(0, visibleCount).map((it) => {
              const src = getMediaUrl(it.raw) || '';
              return (
                <div key={it.id} className="rounded-2xl overflow-hidden bg-white/5">
                  <div className="w-full aspect-[4/5] bg-black/5">
                    <img src={src} alt={it.id} className="w-full h-full object-cover object-top" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            {items.length > visibleCount ? (
              <button
                className="rounded-full px-5 py-2 text-sm/6 text-white/90 bg-white/10 hover:bg-white/15 ring-1 ring-inset ring-white/15"
                onClick={() => setVisibleCount((v) => Math.min(items.length, v + 5))}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            ) : items.length > 5 ? (
              <button
                className="rounded-full px-5 py-2 text-sm/6 text-white/90 bg-white/10 hover:bg-white/15 ring-1 ring-inset ring-white/15"
                onClick={() => setVisibleCount(5)}
                disabled={loading}
              >
                Show Less
              </button>
            ) : (
              <button
                className="rounded-full px-5 py-2 text-sm/6 text-white/60 bg-transparent ring-1 ring-inset ring-white/6 cursor-default"
                disabled
              >
                No more
              </button>
            )}
          </div>
          </>
        )}
      </div>
    </section>
  );
}
