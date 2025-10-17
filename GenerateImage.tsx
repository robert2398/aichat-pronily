import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from "../contexts/ThemeContext";
// useRef / useCallback not needed in this file
import { useLocation, useNavigate } from "react-router-dom";
// theme utilities (not required here currently)
import Button from "../components/Button";
import Card from "../components/Card";
import apiClient, { getErrorMessage } from "../utils/api";
import genderService from '../utils/genderService';
import { useAuth } from "../contexts/AuthContext";
import { useToastActions } from "../contexts/ToastContext";
import { useCharacterMedia } from "../hooks/useCharacters";

// ——— Gallery helpers (copied/adapted) ———
function IconDownload({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 21H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSpinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const getMediaUrl = (item: any): string | null => {
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
      const v = (item.attributes as any)[k];
      if (v && typeof v === 'string') return v;
    }
  }
  if (item.data && typeof item.data === 'object') {
    return getMediaUrl(item.data) || null;
  }
  return null;
};

const getFilenameFromUrl = (url: string | null) => {
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

async function saveBlob(blob: Blob, suggestedName?: string) {
  if ((window as any).showSaveFilePicker) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [{ description: 'File', accept: { [blob.type || 'application/octet-stream']: ['.bin'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      const name = e && (e as any).name ? (e as any).name : '';
      const msg = e && (e as any).message ? (e as any).message : '';
      if (name === 'AbortError' || name === 'NotAllowedError' || name === 'SecurityError' || /cancel/i.test(msg)) {
        return;
      }
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


// Load generate-image assets (per-gender) using Vite glob
const genFemaleMap = (import.meta as any).glob('../assets/generate-image/female/**/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const genMaleMap = (import.meta as any).glob('../assets/generate-image/male/**/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function filenameLabel(path: string) {
  // extract filename without extension and folder, use underscores/dashes -> spaces, capitalize
  const parts = path.split('/');
  const name = parts[parts.length - 1] || path;
  return name.replace(/\.(png|jpe?g|webp)$/i, '').replace(/[_-]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function getGenAssets(tab: SuggestionTab, map: Record<string, string>): Array<{ url: string; label: string }> {
  const folder = tab.toLowerCase(); // outfit, pose, action, accessories
  const out: Array<{ url: string; label: string }> = [];
  for (const [path, url] of Object.entries(map)) {
    if (path.toLowerCase().includes(`/${folder}/`)) out.push({ url, label: filenameLabel(path) });
  }
  return out;
}

// Phrase templates for building a generated prompt
const outfitPhrases = [
  "dressed in {outfit}",
  "wearing {outfit}",
  "styled with {outfit}"
];

const posePhrases = [
  "in a {pose} pose",
  "while {pose}",
  "{pose} gracefully"
];

function randomPrompt(outfit?: string, pose?: string, action?: string, accessories: string[] = []) {
  const outfitPhrase = outfit ? outfitPhrases[Math.floor(Math.random() * outfitPhrases.length)].replace("{outfit}", outfit) : "";
  const posePhrase = pose ? posePhrases[Math.floor(Math.random() * posePhrases.length)].replace("{pose}", pose) : "";

  let segments: string[] = [];
  if (outfitPhrase) segments.push(outfitPhrase);
  if (posePhrase) segments.push(posePhrase);
  if (action) segments.push(action.toLowerCase());

  let prompt = "A model";
  if (segments.length > 0) prompt += ` ${segments.join(', ')}`;

  if (accessories.length > 0) {
    prompt += `, wearing ${accessories.join(', ')}`;
  }

  return prompt.trim().replace(/\s+,/g, ',') + '.';
}

// ------------------------------------------------------------
// Types & data
// ------------------------------------------------------------
type SuggestionTab = "Outfit" | "Pose" | "Action" | "Accessories";

// Use backend CharacterRead-ish type (partial fields we care about)
type Character = {
  id: number | string;
  username?: string;
  name?: string;
  bio?: string | null;
  age?: number | null;
  image_url_s3?: string | null;
  gender?: string | null;
};

// runtime fetched characters
// visible in the picker; we'll fetch defaults from the API

// Suggestions are replaced by the asset thumbnails below.

// Small helpers
// Chip helper removed — it was unused in this file. Kept other UI helpers (Thumb, CharacterBadge, etc.).

function Thumb({ label, selected, imageUrl }: { label: string; selected?: boolean; imageUrl?: string | null }) {
  return (
    <div className="w-[84px] pt-4 overflow-visible">
      <div className="relative">
        {imageUrl ? (
          <div className="h-[72px] w-[84px] rounded-xl overflow-hidden bg-black/5 ring-1 ring-white/10">
            <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-[72px] w-[84px] rounded-xl bg-gradient-to-br from-white/10 to-white/0 ring-1 ring-white/10" />
        )}

        {/* badge inside the thumb so it can't be clipped by ancestor overflow */}
        <div className="absolute right-1 top-0 transform -translate-y-1/2">
          <span
            className={`h-6 w-6 rounded-full grid place-items-center text-xs font-semibold ring-1 ring-white/15 ${
              selected ? "bg-[var(--hl-gold)] text-[var(--hl-black)]" : "bg-white/10 text-white/80"
            }`}
            aria-hidden
          >
            {selected ? "−" : "+"}
          </span>
        </div>

        <div className="absolute inset-x-0 -bottom-1 flex justify-center">
          <span className="rounded-xl bg-white/10 px-2 py-0.5 text-[11px] text-white/90 ring-1 ring-white/10 backdrop-blur">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyGenerated() {
  return (
    <Card className="h-[220px] flex items-center justify-center text-center">
      <div>
        <p className="text-white/70">No previous generations</p>
        <p className="text-xs text-white/40 mt-1">Go on... generate some spicy images!</p>
      </div>
    </Card>
  );
}


function CharacterPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (c: Character) => void }) {
  if (!open) return null;
  // Theme tokens are applied via Card/Button primitives; no direct use here.
  // local UI state for filtering
  const [onlyMyAI, setOnlyMyAI] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [ageFilterEnabled, setAgeFilterEnabled] = useState(false);
  const [hueFilterEnabled, setHueFilterEnabled] = useState(false);

  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.getDefaultCharacters();
        if (cancelled) return;
        setChars(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const visible = chars.filter((c) => {
    if (onlyMyAI) return false; // for now we don't have 'my ai' indicator from defaults
    if (ageFilterEnabled && (typeof c.age !== 'number' || c.age < 22)) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[680px] bg-[#000000] ring-1 ring-white/10 rounded-t-2xl sm:rounded-l-2xl p-6 overflow-y-auto">
        <div className="flex items-start justify-between gap-4 relative z-50 overflow-visible">
          <div>
            <h3 className="text-white text-lg font-semibold">Select a Character</h3>
            <div className="text-xs text-white/60">Pick one to use in the generator</div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setOnlyMyAI((s) => !s)}
              variant="ghost"
              className={onlyMyAI ? "bg-[var(--hl-gold)] text-[var(--hl-black)] ring-[var(--hl-gold)]" : ""}
            >
              My AI
            </Button>

            <div className="relative">
              <Button type="button" onClick={() => setShowFilter((s) => !s)} variant="ghost">Filter</Button>

              {showFilter && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#000000] ring-1 ring-white/10 p-3 shadow-lg z-60">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-white/80">Age ≥ 22</span>
                      <input type="checkbox" checked={ageFilterEnabled} onChange={() => setAgeFilterEnabled((s) => !s)} />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-white/80">Hue &gt; 100</span>
                      <input type="checkbox" checked={hueFilterEnabled} onChange={() => setHueFilterEnabled((s) => !s)} />
                    </label>
                    <div className="flex justify-end">
                      <Button variant="ghost" className="!px-3 !py-1" onClick={() => { setAgeFilterEnabled(false); setHueFilterEnabled(false); setShowFilter(false); }}>
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-5">
          {loading && (
            <div className="text-white/70">Loading characters…</div>
          )}

          {error && (
            <div className="text-red-400">Error loading characters: {error}</div>
          )}

          {!loading && !error && visible.map((c) => (
            <div
              key={String(c.id)}
              role="button"
              tabIndex={0}
              onClick={() => {
                onSelect(c as unknown as any);
                onClose();
              }}
              className="cursor-pointer focus:outline-none"
            >
              <Card className="p-0 text-left">
                <div className="aspect-[4/5] w-full rounded-2xl bg-gray-800 overflow-hidden">
                  {c.image_url_s3 ? (
                    <img src={c.image_url_s3} alt={c.name || c.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">No image</div>
                  )}
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-white/95 font-medium">{c.name || c.username}</div>
                    <div className="text-xs text-white/60">{c.age}</div>
                  </div>
                  <span className="text-xs rounded-lg px-2 py-1 bg-[var(--hl-gold)] text-[var(--hl-black)] font-medium">Select</span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Main component
// ------------------------------------------------------------
export default function GenerateImage() {
  // useThemeStyles is available if needed for theme-based component tokens.
  const [gender, setGender] = useState<string>(() => {
    try { return localStorage.getItem('hl_gender') || 'Female'; } catch { return 'Female'; }
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<SuggestionTab>("Outfit");
  const [prompt, setPrompt] = useState("");
  const [negPrompt, setNegPrompt] = useState(
    gender === 'Male'
      ? 'Portrait of a young man, wearing casual clothes, portrait picture, looking at the viewer with a smile'
      : 'Wearing short black tennis skirt and a crop top shirt, portrait picture, looking at the viewer with a smile'
  );
  // selection state removed; clicking thumbnails adds their label to prompt directly
  const [count, setCount] = useState<1 | 4 | 16>(1);
  // Local generated placeholders (kept for the 'Generate Now' flow)
  // Local placeholder images removed; rely solely on backend gallery
  // Images from backend (user's generated gallery)
  const { images: galleryImages, loading: galleryLoading, error: galleryError, refresh: refreshGallery } = useCharacterMedia();
  const displayedItems = useMemo(() => (galleryImages || []).slice(0, 9), [galleryImages]);
  // showAll removed — we'll show a maximum of 3 rows (9 items) and link to /gallery
  const [selectedAssetMap, setSelectedAssetMap] = useState<Record<SuggestionTab, string[]>>({ Outfit: [], Pose: [], Action: [], Accessories: [] });
  const [viewer, setViewer] = useState<any | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const API_ORIGIN = (() => {
    try { return API_BASE ? new URL(API_BASE).origin : null; } catch { return null; }
  })();
  const getOrigin = (u: string) => { try { return new URL(u, window.location.href).origin; } catch { return null; } };
  const isSameOrApiOrigin = (u: string | null) => { const o = getOrigin(u || ''); return o === window.location.origin || (API_ORIGIN && o === API_ORIGIN); };

  const getFilenameFromHeadersOrUrl = (res: Response | { headers?: any }, url: string | null) => {
    try {
      const cd = (res as any)?.headers?.get?.('content-disposition');
      if (cd) {
        const m = cd.match(/filename\*?=(?:UTF-8''|")?([^\";]+)\"?/i);
        if (m && m[1]) return decodeURIComponent(m[1].replace(/\"/g, ''));
      }
    } catch (e) {}
    return getFilenameFromUrl(url);
  };

  const downloadAndSave = async (url: string | null) => {
    if (!url) return;
    setDownloading(url);
    try {
      try {
        const opts: any = { method: 'GET', mode: 'cors', credentials: 'omit' };
        if (isSameOrApiOrigin(url)) {
          const headers: Record<string, string> = {};
          const t = localStorage.getItem('hl_token');
          if (t) headers['Authorization'] = `Bearer ${String(t).replace(/^bearer\s+/i, '').trim()}`;
          else if ((import.meta as any).env?.VITE_API_AUTH_TOKEN) {
            const envToken = String((import.meta as any).env.VITE_API_AUTH_TOKEN || '');
            headers['Authorization'] = envToken.match(/^Bearer\s+/i) ? envToken : `Bearer ${envToken}`;
          }
          opts.headers = headers;
          opts.credentials = 'include';
        }
        const res = await fetch(url, opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        await saveBlob(blob, getFilenameFromHeadersOrUrl(res, url));
        return;
      } catch (err) {
        console.warn('Direct fetch failed (likely CORS). Will try proxy.', err);
      }

      try {
        const proxyUrl = `${(API_BASE || '').replace(/\/$/, '')}/characters/media/download-proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(getFilenameFromUrl(url))}`;
        const proxyHeaders: Record<string, string> = {};
        try {
          const t = localStorage.getItem('hl_token');
          if (t) proxyHeaders['Authorization'] = `Bearer ${String(t).replace(/^bearer\s+/i, '').trim()}`;
          else if ((import.meta as any).env?.VITE_API_AUTH_TOKEN) {
            const envToken = String((import.meta as any).env.VITE_API_AUTH_TOKEN || '');
            proxyHeaders['Authorization'] = envToken.match(/^Bearer\s+/i) ? envToken : `Bearer ${envToken}`;
          }
        } catch (e) {}
        const pres = await fetch(proxyUrl, { method: 'GET', credentials: 'omit', headers: proxyHeaders });
        if (!pres.ok) {
          const txt = await pres.text().catch(() => null);
          console.error('Proxy response status/text:', pres.status, txt);
          throw new Error(`Proxy HTTP ${pres.status}`);
        }
        const blob = await pres.blob();
        await saveBlob(blob, getFilenameFromHeadersOrUrl(pres as any, url));
        return;
      } catch (err2) {
        console.error('Proxy fetch failed:', err2);
        try { showError('Download failed', 'Ensure S3 CORS is set OR the /characters/media/download-proxy route is enabled. Check proxy auth and logs.'); } catch { /* fallback */ }
      }
    } finally {
      setDownloading(null);
    }
  };

  const canGenerate = useMemo(() => !!character, [character]);
  const { token } = useAuth();
  const [generating, setGenerating] = useState(false);
  const { showError } = useToastActions();
  const location = useLocation();
  const navigate = useNavigate();
  

  // If navigated from chat, a character may be provided in location.state.character
  useEffect(() => {
    try {
      const navChar = (location.state as any)?.character;
      if (navChar) {
        // normalize minimal shape to Character type
        setCharacter({
          id: navChar.id,
          name: navChar.name || navChar.username,
          age: navChar.age ?? (navChar as any).age_in_years ?? null,
          image_url_s3: navChar.image_url_s3 || navChar.imageUrl || null,
          gender: (navChar as any).gender || null,
        } as Character);
      }
    } catch (e) {}
    // we only want to run this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToPrompt = (text: string) => {
    setPrompt((p) => {
      if (!p) return text;
      // Avoid duplicates
      const parts = p.split(",").map((s) => s.trim());
      if (parts.includes(text)) return p;
      return `${p}, ${text}`;
    });
  };

  // thumbnails now add labels directly via addToPrompt

  const generate = async () => {
    if (!canGenerate) return;
    // Build payload matching backend ImageCreate schema
    const payload = {
      character_id: Number(character?.id),
      name: `${character?.name || character?.username || 'character'}-${Date.now()}`,
      outfit: (selectedAssetMap.Outfit && selectedAssetMap.Outfit[0]) || undefined,
      pose: (selectedAssetMap.Pose && selectedAssetMap.Pose[0]) || undefined,
      action: (selectedAssetMap.Action && selectedAssetMap.Action[0]) || undefined,
      accessories: (selectedAssetMap.Accessories || []).join(', ') || undefined,
      prompt: prompt || undefined,
      num_images: Number(count || 1),
      image_s3_url: (getMediaUrl(character as any) || (character as any)?.image_url_s3 || (character as any)?.image_url || undefined) as string | undefined,
    } as any;

    setGenerating(true);
    try {
      // Ensure apiClient has token (AuthContext normally sets this). As a fallback set it here from localStorage
      try { if (token) apiClient.setAccessToken(token); else apiClient.setAccessToken(localStorage.getItem('hl_token')) } catch {}

  await apiClient.createCharacterImage(payload as any);
      // refresh backend gallery to show created images when available
      try { await refreshGallery(); } catch {}
      // Stay on this page (no navigation) per requirements
    } catch (err: any) {
      const msg = getErrorMessage(err);
      try { showError('Failed to generate image', msg); } catch { /* fallback */ }
    } finally {
      setGenerating(false);
    }
  };

  // when a character is selected, set gender and persist
  useEffect(() => {
    if (character?.gender) {
      setGender(character.gender);
      try { genderService.setGender(character.gender); } catch {}
    }
  }, [character]);

  // Auto-populate prompt when selected assets change
  useEffect(() => {
    const outfit = selectedAssetMap.Outfit?.[0];
    const pose = selectedAssetMap.Pose?.[0];
    const action = selectedAssetMap.Action?.[0];
    const accessories = selectedAssetMap.Accessories || [];

    // Only auto-fill if we have at least one of outfit/pose/action selected
    if (outfit || pose || action || (accessories && accessories.length > 0)) {
      const built = randomPrompt(outfit, pose, action, accessories);
      setPrompt(built);
    }
  }, [selectedAssetMap]);

  // update negPrompt when gender changes
  useEffect(() => {
    setNegPrompt(
      gender === 'Male'
        ? 'Portrait of a young man, wearing casual clothes, portrait picture, looking at the viewer with a smile'
        : 'Wearing short black tennis skirt and a crop top shirt, portrait picture, looking at the viewer with a smile'
    );
  }, [gender]);

  useEffect(() => {
    function onGender(e: any) {
      const g = e?.detail || (typeof e === 'string' ? e : null);
      if (g) setGender(g);
    }
    window.addEventListener('hl_gender_changed', onGender as EventListener);
    return () => window.removeEventListener('hl_gender_changed', onGender as EventListener);
  }, []);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Fullscreen viewer navigation (similar to Gallery)
  const findViewerIndex = (v = viewer) => {
    if (!v || !Array.isArray(displayedItems)) return -1;
    return displayedItems.findIndex((it: any) => {
      try {
        if (v.id != null && it.id != null) return String(it.id) === String(v.id);
        const a = getMediaUrl(it);
        const b = getMediaUrl(v);
        return a && b && String(a) === String(b);
      } catch (e) {
        return false;
      }
    });
  };

  const goPrev = () => {
    const idx = findViewerIndex();
    if (idx > 0) setViewer(displayedItems[idx - 1]);
  };

  const goNext = () => {
    const idx = findViewerIndex();
    if (idx >= 0 && idx < displayedItems.length - 1) setViewer(displayedItems[idx + 1]);
  };

  // Keyboard navigation for viewer
  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'Escape') { setViewer(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewer, displayedItems]);

  // Reduced heading sizes to better match Figma
  const pageHeading = `text-lg sm:text-xl lg:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`;
  // const pageSub = `text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`; // unused

  return (
    // reduce outer left/right padding to minimize space between sidebar and content
    <div className="max-w-screen-2xl mx-auto px-1 sm:px-2 py-6">
      {/* primary container (no secondary wrapper) */}
      <div className={`flex flex-col min-h-[60vh]`}>
        {/* Title + quick right heading (align with generated images) */}
        <div className="flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="rounded-full bg-[#2b2b2b] p-2 flex items-center justify-center ring-1 ring-white/5">
              {/* small left arrow icon to act as back button (Figma) */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--hl-gold)]">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div>
              <h1 className={pageHeading}>{'Generate AI NSFW Image'}</h1>
            </div>
          </div>

          {/* Small generated-images heading placed here so it lines up horizontally with the main title */}
          <div className="text-right hidden sm:block">
            <h3 className="text-white font-semibold">Generated Images</h3>
            <p className="text-xs text-white/50 mt-1">Your previously generated images. They are stored forever.</p>
          </div>
        </div>

  <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Left – Controls (50%) */}
    <div className="lg:col-span-6 space-y-6">
          {/* Character & Prompt */}
          <Card className="px-6 py-0 min-h-0 relative">
            <div className="flex items-stretch gap-4">
              <div className="min-w-[144px]">
                {!character ? (
                  // Exact 144px square tile to match Figma
                  <button onClick={() => setPickerOpen(true)} className="w-[144px] h-[144px]">
                    <Card noBase className="w-[144px] h-[144px] min-h-0 flex items-center justify-center p-3 rounded-2xl border-2 border-dashed border-[var(--hl-gold)]/30">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-white/6 ring-1 ring-white/10 grid place-items-center text-white/90">👤</div>
                        <div className="rounded-full bg-[var(--hl-gold)] text-[var(--hl-black)] px-2 py-1 text-xs font-medium whitespace-nowrap">Pick a Character</div>
                      </div>
                    </Card>
                  </button>
                ) : (
                  // Selected character preview sized to the same 144px square
                  <Card noBase className="w-[144px] h-[144px] min-h-0 p-0 overflow-hidden rounded-2xl relative">
                    {character.image_url_s3 ? (
                      <img src={character.image_url_s3} alt={character.name || character.username} className="w-full h-full object-cover object-top block" />
                    ) : (
                      <div className="w-full h-full" style={{ background: `linear-gradient(135deg, hsla(${(character as any).hue ?? 200},80%,60%,0.25), transparent)` }} />
                    )}

                    {/* Name overlay: only show name (no extra vertical padding) with font matching design */}
                    <div className="absolute left-0 bottom-0 right-0 px-3 pb-3">
                      <div className="text-sm font-medium text-white/95 leading-tight truncate">{character.name || character.username}</div>
                    </div>

                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => setPickerOpen(true)}
                        aria-label="Change character"
                      >
                        {/* Placeholder change icon (replace with asset later) */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/90">
                          <path d="M21 12a9 9 0 1 0-1.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>

              {/* empty placeholder area - prompt moved to bottom-right dropdown */}
              <div className="flex-1 h-full" />
            </div>

            {/* Prompts dropdown in bottom-right to match Figma */}
            {/* Prompts dropdown positioned with small offsets to match Figma */}
            <div className="absolute right-4 bottom-4">
              <div className="relative inline-block text-left">
                <div>
                  <Button variant="ghost" className="!px-3 !py-1 text-sm flex items-center gap-2" onClick={() => setShowPrompts((s) => !s)}>
                    <span>Prompts</span>
                    {/* small triangular caret - uses CSS border trick */}
                    <span className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white/90 transform translate-y-0.5" aria-hidden />
                  </Button>
                </div>

                {/* Dropdown menu - force open downward using absolute top-full */}
                {showPrompts && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-[#0b0b0b] ring-1 ring-white/10 p-1 shadow-lg z-50">
                    {/* Dropdown items: refined font-size, weight and spacing */}
                    {['Cute Pic','Sex','Blowjob','Ass','At a job','Out for dinner','Random Prompt'].map((item, idx) => (
                      <button
                        key={item}
                        onClick={() => { if(item === 'Random Prompt') setPrompt(randomPrompt()); else addToPrompt(item); setShowPrompts(false); }}
                        className={`w-full text-left rounded-md transition-colors duration-150 ${idx===0 ? 'bg-[var(--hl-gold)] text-[var(--hl-black)] font-semibold' : 'text-white/90 hover:bg-white/5'}`}
                        style={{ padding: '8px 12px' }}
                      >
                        <span className="block text-sm leading-5" style={{ fontWeight: idx===0 ? 700 : 600 }}>{item}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Negative Prompt */}
          <Card className="p-6">
            <label className="block text-sm text-white/70">Negative Prompt (what to avoid in the image)</label>
              <textarea
              value={negPrompt}
              onChange={(e) => setNegPrompt(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl bg-black/40 px-4 py-3 text-white placeholder-white/30 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--hl-gold)]"
            />
          </Card>

          {/* Suggestions - always visible */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              {["Outfit", "Pose", "Action", "Accessories"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t as SuggestionTab)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-white/10 hover:ring-white/30 hover:bg-white/5 ${
                    activeTab === t ? "bg-[var(--hl-gold)] text-[var(--hl-black)] ring-[var(--hl-gold)]/30" : "text-white/90"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Quick thumbnails row showing asset thumbnails for the active tab (gender-specific) */}
            <div className="mt-5 flex items-center gap-4 overflow-x-auto overflow-y-visible pb-2 gen-scrollbar">
              {getGenAssets(activeTab, gender === 'Male' ? genMaleMap : genFemaleMap).map((a) => (
                <button
                  key={a.url}
                  className="relative overflow-visible inline-flex"
                  onClick={() => {
                    setSelectedAssetMap((m) => {
                      const prev = m[activeTab] || [];

                      // Accessories can be multi-select; others are single-select (store as single-element array)
                      if (activeTab === 'Accessories') {
                        const exists = prev.includes(a.label);
                        const next = exists ? prev.filter((x) => x !== a.label) : [...prev, a.label];
                        return { ...m, [activeTab]: next };
                      }

                      // single-select tabs
                      const isSame = prev[0] === a.label;
                      return { ...m, [activeTab]: isSame ? [] : [a.label] };
                    });
                  }}
                >
                  <Thumb label={a.label} selected={(selectedAssetMap[activeTab] || []).includes(a.label)} imageUrl={a.url} />
                </button>
              ))}
            </div>
          </Card>

          {/* Number of images */}
          <Card className="p-6"> 
            <div className="text-white font-semibold mb-3">Number of images</div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {[1, 4, 16].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n as 1 | 4 | 16)}
                  className={`${
                    count === n ? "bg-[var(--hl-gold)] text-[var(--hl-black)] ring-[var(--hl-gold)]/30" : "text-white/90"
                  } rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-white/10 hover:ring-white/30 hover:bg-white/5`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="rounded-xl px-3 py-2 bg-black/40 text-sm text-white/90 ring-1 ring-white/10 flex items-center gap-2">
                <span className="inline-block bg-[var(--hl-gold)] text-[var(--hl-black)] rounded-full px-2">🪙</span>
                <span>32</span>
              </button>
              <button type="button" className="rounded-xl px-3 py-2 bg-black/40 text-sm text-white/90 ring-1 ring-white/10 flex items-center gap-2">
                <span className="inline-block bg-[var(--hl-gold)] text-[var(--hl-black)] rounded-full px-2">🪙</span>
                <span>64</span>
              </button>
            </div>
          </Card>

          {/* Large full-width Generate button to match CreateCharacter styling */}
          <div>
            <Button variant="primary" size="lg" className="w-full rounded-2xl py-4 flex items-center justify-center gap-3" onClick={generate} disabled={!canGenerate || generating}>
              {generating ? (
                <span className="inline-flex items-center gap-2"><IconSpinner className="w-5 h-5 animate-spin" />Generating…</span>
              ) : (
                <>
                  <span>✨</span>
                  <span className="text-lg font-semibold">Generate Now</span>
                </>
              )}
            </Button>
            {!canGenerate && (
              <p className="mt-2 text-sm text-[var(--hl-gold)]/90">Pick a character to enable generation.</p>
            )}
          </div>
        </div>

  {/* Right – Generated Images (50%) */}
  <div className="lg:col-span-6">
          <Card className="p-6 mt-0">
            <div className="mt-2">
              {/* Loading / Error / Empty states for gallery from backend */}
              {galleryLoading ? (
                <div className="text-white/70">Loading images…</div>
              ) : galleryError ? (
                <div className="text-red-400">Error loading images: {galleryError}</div>
              ) : (
                <>
                  {(galleryImages && galleryImages.length > 0) ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {displayedItems
                          .map((img: any, idx: number) => {
                            const url = getMediaUrl(img) || img?.s3_path_gallery || img?.s3_path || img?.image_url_s3 || img?.image_url || img?.url || img?.path || img?.thumbnail || null;
                            const key = img?.id ? String(img.id) : `img-${idx}`;
                            const isVideo = ((img.mime_type || img.content_type || '') || '').toString().startsWith('video') || (url && /\.(mp4|webm|ogg)$/i.test(url));

                            return (
                              <div key={key} className="rounded-xl overflow-hidden ring-1 ring-white/10 relative">
                                <button type="button" onClick={() => setViewer(img)} className="w-full block">
                                  {url ? (
                                    isVideo ? (
                                      <video src={url} className="w-full aspect-[4/5] object-cover" muted preload="metadata" />
                                    ) : (
                                      <img src={url} alt={`Generated ${idx + 1}`} className="w-full aspect-[4/5] object-cover" />
                                    )
                                  ) : (
                                    <div className="aspect-[4/5] bg-black/20" />
                                  )}
                                </button>
                                {/* Download button overlay similar to Gallery */}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); if (url) downloadAndSave(url); }}
                                  className="absolute right-2 bottom-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white opacity-95 hover:opacity-100 focus:opacity-100 transition-shadow shadow-sm"
                                  aria-label="Download"
                                  disabled={!url || !!(downloading && url && downloading === url)}
                                >
                                  {!!(downloading && url && downloading === url) ? (
                                    <IconSpinner className="w-4 h-4 text-white animate-spin" />
                                  ) : (
                                    <IconDownload className="w-4 h-4 text-white" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                      </div>

                      {/* View more / Show less controls */}
                      {galleryImages.length > 9 && (
                        <div className="mt-3 flex justify-center">
                          <button
                            type="button"
                            className="text-sm font-semibold rounded-xl px-4 py-2 bg-[var(--hl-gold)] text-[var(--hl-black)] shadow-md"
                            onClick={() => {
                              try { navigate('/gallery'); } catch { window.location.href = '/gallery'; }
                            }}
                          >
                            View more
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyGenerated />
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>

    {/* Character picker */}
    <CharacterPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(c) => setCharacter(c)} />
    {viewer && (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
        <div className="max-w-[90vw] max-h-[90vh] w-full relative">
          <div className="mb-3 flex justify-end gap-2">
            <button onClick={() => { setViewer(null); }} className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">Close</button>
            {(() => {
              const viewerUrl = getMediaUrl(viewer) || null;
              const isCurDownloading = !!(viewerUrl && downloading && downloading === viewerUrl);
              return (
                <button
                  onClick={() => viewerUrl && downloadAndSave(viewerUrl)}
                  className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm transition-colors disabled:opacity-50"
                  disabled={!viewerUrl || isCurDownloading}
                >
                  {isCurDownloading ? (
                    <span className="inline-flex items-center gap-2"><IconSpinner className="w-4 h-4 text-white animate-spin" />Downloading…</span>
                  ) : (
                    'Download'
                  )}
                </button>
              );
            })()}
          </div>
          {((viewer.mime_type || viewer.content_type || '').toString().startsWith('video')) ? (
            <video src={getMediaUrl(viewer) || ''} controls autoPlay className="w-full h-auto max-h-[80vh] bg-black rounded-lg" />
          ) : (
            <img src={getMediaUrl(viewer) || ''} alt="full" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
          )}

          {/* Prev/Next buttons similar to Gallery */}
          <button
            onClick={() => goPrev()}
            disabled={findViewerIndex() <= 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 disabled:opacity-50"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => goNext()}
            disabled={findViewerIndex() >= displayedItems.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 disabled:opacity-50"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    )}
  </div>
);
}
