import { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import LazyImage from "./LazyImage";
import { usePerformance } from "../contexts/PerformanceContext";

type Props = {
  name: string;
  age?: number | null;
  img?: string | null;
  bio?: string | null;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  likesCount?: number;
  messageCount?: number;
};

export default function CharacterCard({ name, age, img, bio, onClick, onEdit, onDelete, likesCount = 0, messageCount = 0 }: Props) {
  const { theme } = useTheme();
  const { imageQuality, enableLazyLoading } = usePerformance();
  const isDark = theme === "dark";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const ignoreNextDocClick = useRef(false);
  // unique id for coordinating single-open behavior across cards
  const instanceId = useRef(Symbol("character-card"));

  // when menu is open, disable hover transforms to avoid geometry changes that cause flicker
  const hoverTransform = menuOpen ? '' : 'group-hover:scale-[1.02] group-hover:-translate-y-0.5';
  const hoverTheme = menuOpen
    ? ''
    : (isDark
        ? 'group-hover:border-white/12 group-hover:shadow-[0_18px_70px_rgba(255,197,77,0.38)] group-hover:ring-4 group-hover:ring-[var(--hl-gold)]/40'
        : 'group-hover:border-gray-300 group-hover:shadow-[0_16px_48px_rgba(255,197,77,0.18)] group-hover:ring-4 group-hover:ring-[var(--hl-gold)]/30');

  const optimizeImageUrl = (url: string) => {
    if (!url) return url;
    if (imageQuality === 'low') return url.includes('?') ? `${url}&quality=40&w=300` : `${url}?quality=40&w=300`;
    if (imageQuality === 'medium') return url.includes('?') ? `${url}&quality=70&w=400` : `${url}?quality=70&w=400`;
    return url;
  };

  // Close on outside click / esc
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (ignoreNextDocClick.current) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && menuButtonRef.current && !menuButtonRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  // Ensure only one menu is open at a time across all CharacterCards
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail !== instanceId.current) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('character-card-menu-open', handler as EventListener);
    return () => window.removeEventListener('character-card-menu-open', handler as EventListener);
  }, []);

  // No viewport-based positioning needed; menu is absolutely positioned within the button wrapper

  return (
    <div onClick={onClick} className={`group relative transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}>
  {/* make container overflow-visible so dropdown isn't clipped; keep image wrapper overflow-hidden */}
  <div className={`relative rounded-[12px] overflow-visible border transition-all duration-200 theme-transition ${hoverTransform} ${menuOpen ? 'z-[200]' : ''} ${isDark ? "bg-[var(--hl-grey)] border-white/8 shadow-[0_8px_30px_rgba(0,0,0,0.32)]" : "bg-white border-gray-200 shadow-[0_6px_18px_rgba(0,0,0,0.06)]"} ${hoverTheme}`}> 

        {img ? (
          // slightly shorter portrait ratio to reduce overall card height
          <div className="w-full aspect-[5/7] md:aspect-[6/9] overflow-hidden rounded-[12px]">
            <LazyImage
              src={optimizeImageUrl(img)}
              alt={`${name} character image`}
              className="w-full h-full object-cover object-center rounded-[12px] transition-filter duration-200 group-hover:brightness-105"
              loading={enableLazyLoading ? 'lazy' : 'eager'}
              placeholder="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
              fallback="/src/assets/girl.jpg"
            />
          </div>
        ) : (
          <div className={`h-56 sm:h-64 md:h-72 lg:h-[18rem] flex items-center justify-center overflow-hidden rounded-[12px] ${isDark ? "bg-gray-700 text-white/60" : "bg-gray-100 text-gray-400"}`}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}

  <div className={`pointer-events-none absolute inset-0 ${isDark ? "bg-gradient-to-t from-black/85 via-black/18 to-transparent" : "bg-gradient-to-t from-black/70 via-black/12 to-transparent"}`} />

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[21px] sm:text-[23px] md:text-[25px] font-semibold leading-[1.1] tracking-tight text-[var(--hl-gold)]">
              {name}
            </h3>
            {typeof age === 'number' && <span className="text-[18px] sm:text-[19px] font-medium text-white/85">{age}</span>}
          </div>

          <div className="mt-1.5 text-[13px] text-white/75 line-clamp-2 leading-5">
            {bio ?? "Valentina Smith is pure temptation. With soft hair, a backless gown hugging..."}
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={(e) => { e.stopPropagation(); /* default behavior: card onClick handles navigation to chat */ }}
                aria-label={`Chat with ${name}`}
                className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs theme-transition ${isDark ? 'bg-gray-800/55 text-white/90 border border-white/10' : 'bg-gray-100 text-black/80 border border-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 5.5H4a1.5 1.5 0 0 0-1.5 1.5v9.5a1.5 1.5 0 0 0 1.5 1.5h8.6l3.58 2.94c.74.61 1.82.08 1.82-.9V18.5H20a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5Z"
                    fill="currentColor"
                  />
                  <circle cx="8.5" cy="11.5" r="1" fill={isDark ? "#1f1f1f" : "#ffffff"} />
                  <circle cx="12" cy="11.5" r="1" fill={isDark ? "#1f1f1f" : "#ffffff"} />
                  <circle cx="15.5" cy="11.5" r="1" fill={isDark ? "#1f1f1f" : "#ffffff"} />
                </svg>
                <span className="text-sm font-medium">Chat</span>
              </button>

              <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs backdrop-blur-sm ${isDark ? 'bg-gray-800/55 text-white/90 border border-white/10' : 'bg-gray-100 text-black/80 border border-gray-200'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-rose-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21s-7.5-5.6-10-9.8C-0.7 7.3 1.8 3 6 3c2.4 0 4 1.6 6 3.6C14 4.6 15.6 3 18 3c4.2 0 6.7 4.3 4 8.2-2.5 4.2-10 9.8-10 9.8Z" />
                  </svg>
                  <span className="tabular-nums font-medium">{likesCount ?? 0}</span>
                </div>
                  <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs backdrop-blur-sm ${isDark ? 'bg-gray-800/55 text-white/90 border border-white/10' : 'bg-gray-100 text-black/80 border border-gray-200'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400" viewBox="0 0 24 24" fill="none">
                    <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="tabular-nums font-medium">{messageCount ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="relative z-[300]">
              <button
                ref={menuButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  // toggle behavior
                  if (menuOpen) {
                    setMenuOpen(false);
                    return;
                  }
                  // announce to others to close their menus
                  window.dispatchEvent(new CustomEvent('character-card-menu-open', { detail: instanceId.current }));
                  // ignore the next document click (which may be the same event loop)
                  ignoreNextDocClick.current = true;
                  setTimeout(() => { ignoreNextDocClick.current = false; }, 0);
                  setMenuOpen(true);
                }}
                aria-label="More options"
                className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs ${isDark ? 'bg-gray-800/55 text-white/90 hover:bg-gray-800/70 border border-white/10' : 'bg-gray-100 text-black/80 hover:bg-gray-200 border border-gray-200'}`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {/* Render menu anchored to this wrapper so it scrolls together */}
              {menuOpen ? (
                <div
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-0 top-full mt-2 z-[1000] w-44 rounded-lg p-2 bg-white text-black shadow-[0_8px_24px_rgba(0,0,0,0.15)] border border-gray-200`}
                >
                  <button
                    onClick={() => { setMenuOpen(false); if (typeof onEdit === 'function') onEdit(); }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-3 text-black"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Pencil className="h-5 w-5 text-black" />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); if (typeof onDelete === 'function') onDelete(); }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-3 text-red-600"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                </div>
              ) : null}

              {/* outside click/esc handling implemented with useEffect earlier in the component body */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

