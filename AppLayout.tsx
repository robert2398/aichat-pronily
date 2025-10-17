import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import SEOHead from "./SEOHead";
import genderService from '../utils/genderService';
import AuthModal from "./AuthModal";
import Sidebar from "./Sidebar";
import HeroSection from "./HeroSection";
import CharacterCard from "./CharacterCard";
import { useNavigate } from "react-router-dom";
import CreateBanner from "./CreateBanner";
import { normalizeCharacters } from '../utils/normalizeCharacter';
import LoadMoreButton from "./LoadMoreButton";
import InfoSplit from "./InfoSplit";
import MoreInfoSplit from "./MoreInfoSplit";
import FeatureCardsGrid from "./FeatureCardsGrid";
import CenteredBanner from "./CenteredBanner";
import HighlightsTriple from "./HighlightsTriple";
import FAQSection from "./FAQSection";
import SiteFooter from "./SiteFooter";
import { useTheme } from "../contexts/ThemeContext";
import { Filter as FilterIcon } from "./icons";

// Import gender-specific assets
import femaleAsset1 from '../assets/home/female/assets/Female_Assets_1.jpg';
import femaleAsset1Gif from '../assets/home/female/assets/Female_Assets_1.gif';
import femaleAsset2 from '../assets/home/female/assets/Female_Assets_2.jpg';
import femaleAsset2Gif from '../assets/home/female/assets/Female_Assets_2.gif';
import femaleAsset3 from '../assets/home/female/assets/Female_Assets_3.jpg';
import femaleAsset3Gif from '../assets/home/female/assets/Female_Assets_3.gif';
import femaleAsset4 from '../assets/home/female/assets/Female_Assets_4.jpg';
import femaleAsset4Gif from '../assets/home/female/assets/Female_Assets_4.gif';
import femaleAsset5 from '../assets/home/female/assets/Female_Assets_5.jpg';
import femaleAsset6 from '../assets/home/female/assets/Female_Assets_6.jpg';
import femaleAsset7 from '../assets/home/female/assets/Female_Assets_7.jpg';
import femaleAsset8 from '../assets/home/female/assets/Female_Assets_8.jpg';

import maleAsset1 from '../assets/home/male/assets/Male_Assets_1.jpg';
import maleAsset2 from '../assets/home/male/assets/Male_Assets_2.jpg';
import maleAsset3 from '../assets/home/male/assets/Male_Assets_3.jpg';
import maleAsset4 from '../assets/home/male/assets/Male_Assets_4.jpg';

// Gender-aware asset arrays
const femaleAssets = [
  femaleAsset1, femaleAsset1Gif, femaleAsset2, femaleAsset2Gif,
  femaleAsset3, femaleAsset3Gif, femaleAsset4, femaleAsset4Gif,
  femaleAsset5, femaleAsset6, femaleAsset7, femaleAsset8
];

const maleAssets = [
  maleAsset1, maleAsset2, maleAsset3, maleAsset4
];

// Character names for variety
const femaleNames = ['Valentina', 'Sofia', 'Isabella', 'Gabriella', 'Anastasia', 'Victoria', 'Serena', 'Luna'];
const maleNames = ['Alexander', 'Sebastian', 'Maximilian', 'Adrian'];

// Function to get gender-appropriate assets and names
const getGenderAssets = (gender: string, count: number = 12) => {
  const isMale = gender === 'Male';
  let assets = isMale ? maleAssets : femaleAssets;
  let names = isMale ? maleNames : femaleNames;
  
  // Fallback: if male assets are empty or insufficient, use female assets with male names
  if (isMale && (!assets || assets.length === 0)) {
    console.warn('Male assets not found, using female assets with male names');
    assets = femaleAssets;
  }
  
  // Ensure we have at least some assets
  if (!assets || assets.length === 0) {
    console.warn('No assets found, using fallback');
    return [];
  }
  
  const result = [];
  for (let i = 0; i < count; i++) {
    const assetIndex = i % assets.length;
    const nameIndex = i % names.length;
    result.push({
      image: assets[assetIndex],
      name: names[nameIndex],
      age: 20 + (i % 8), // Ages between 20-27
    });
  }
  return result;
};

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();
  
  // Fixed header height for consistency across all pages (matches Create Character page)
  const HEADER_H = 68; // px
  
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("hl_sidebarOpen") || "true");
    } catch {
      return true;
    }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      // default to expanded (true) when no stored value exists
      return JSON.parse(localStorage.getItem("hl_sidebarCollapsed") || "true");
    } catch {
      return true;
    }
  });
  const [selectedItem, setSelectedItem] = useState<string>("Explore");
  const [genderOpen, setGenderOpen] = useState(false);
  
  // Determine initial gender based on route
  const getInitialGender = (): string => {
    const path = location.pathname;
    if (path === '/ai-boyfriend') return 'Male';
    if (path === '/ai-transgender') return 'Trans';
    if (path === '/ai-girlfriend') return 'Female';
    // Default to stored gender or Female
    try {
      return genderService.getGender();
    } catch { return 'Female'; }
  };
  
  const [gender, setGender] = useState<string>(getInitialGender);
  const [authOpen, setAuthOpen] = useState(false);

  // Filter states for homepage
  const [activeFilters, setActiveFilters] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hl_nsfw') || 'false');
      return saved ? ['nsfw'] : [];
    } catch { return []; }
  });

  // filter options based on the design - match Figma exactly
  const filterOptions = [
    { id: 'filter', label: 'Filter', type: 'filter' },
    { id: 'all_models', label: 'All Models', type: 'pill', isActive: activeFilters.length === 0 },
    { id: 'private_content', label: 'Private Content', type: 'pill', isActive: activeFilters.includes('private_content') },
    { id: 'nsfw', label: 'NSFW', type: 'toggle', isActive: activeFilters.includes('nsfw') },
  ] as const;

  const filterPillBase = isDark
    ? "bg-[#14100C]/85 border border-[#3F2B0B]/50 text-white/75 hover:text-white hover:border-[var(--hl-gold)]/60 hover:bg-[#1D140B]/85 hover:shadow-[0_10px_26px_rgba(246,185,75,0.18)]"
    : "bg-[#FCF5E4]/90 border border-[#D4AA58]/45 text-gray-800 hover:border-[#C8922E] hover:bg-[#FFE9C5] hover:shadow-[0_10px_20px_rgba(246,185,75,0.16)]";
  const filterPillActive = isDark
    ? "bg-[var(--hl-gold)] text-black border-transparent shadow-[0_16px_36px_rgba(246,185,75,0.35)]"
    : "bg-[var(--hl-gold)] text-black border-transparent shadow-[0_16px_30px_rgba(246,185,75,0.3)]";
  const filterToggleTrack = isDark
    ? "bg-[#17120A]/90 border border-[#3F2B0B]/60"
    : "bg-white/85 border border-[#D4AA58]/50";
  const filterToggleTrackActive = isDark
    ? "bg-[#2A1909]/90 border border-[var(--hl-gold)]/80"
    : "bg-[var(--hl-gold)]/90 border border-[var(--hl-gold)]/90";

  const toggleFilter = (filterId: string) => {
    if (filterId === 'all_models') {
      setActiveFilters([]);
      return;
    }
    setActiveFilters(prev => {
      const next = prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId];
      try {
        // persist NSFW preference so the toggle survives reloads
        if (filterId === 'nsfw') {
          const isNsfw = next.includes('nsfw');
          localStorage.setItem('hl_nsfw', JSON.stringify(isNsfw));
          try { window.dispatchEvent(new CustomEvent('hl_nsfw_changed', { detail: isNsfw })); } catch {}
        }
      } catch {}
      return next;
    });
  };

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerH, setHeaderH] = useState<number>(HEADER_H);

  // Preview images exported by the user in their console

  // Use gender-aware assets instead of static preview images
  const genderAwareAssets = getGenderAssets(gender, 12);
  const mainGridImages = genderAwareAssets;
  const moreGridImages = getGenderAssets(gender, 8).slice(0, 8); // For the additional section

  useEffect(() => {
    try {
      localStorage.setItem("hl_sidebarCollapsed", JSON.stringify(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);
  
  useEffect(() => {
    try {
      localStorage.setItem("hl_sidebarOpen", JSON.stringify(sidebarOpen));
    } catch {}
  }, [sidebarOpen]);
  
  // Update gender when route changes
  useEffect(() => {
    const path = location.pathname;
    if (path === '/ai-boyfriend') {
      setGender('Male');
      genderService.setGender('Male');
    } else if (path === '/ai-transgender') {
      setGender('Trans');
      genderService.setGender('Trans');
    } else if (path === '/ai-girlfriend' || path === '/') {
      setGender('Female');
      genderService.setGender('Female');
    }
  }, [location.pathname]);

  // Force a consistent header height no matter the page content
  useEffect(() => {
    setHeaderH(HEADER_H);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) setGenderOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setGenderOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // subscribe to global gender changes so the layout updates immediately
  useEffect(() => {
    const unsub = genderService.subscribe((g: string) => {
      try { setGender(String(g)); } catch {}
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  const navigate = useNavigate();
  const [characters, setCharacters] = useState<any[] | null>(null);
  const [charError, setCharError] = useState<string | null>(null);
  const [countsMap, setCountsMap] = useState<Record<number, { likes: number; messages: number }>>({});

  useEffect(() => {
    let aborted = false;
    async function loadChars() {
      try {
        const data = await (await import('../utils/api')).default.getDefaultCharacters();
        if (!aborted) {
          const arr = Array.isArray(data) ? normalizeCharacters(data) : [];
          setCharacters(arr);

          // fetch likes/message counts for these characters
          try {
            const ids = arr.map((c: any) => c.id).filter((v: any) => v != null);
            console.log('AppLayout: fetching counts for ids', ids);
            try {
              const d2 = await (await import('../utils/api')).default.getLikesMessageCount(ids);
              const m: Record<number, { likes: number; messages: number }> = {};
              if (Array.isArray(d2)) {
                for (const item of d2) {
                  const id = Number(item?.character_id);
                  if (!Number.isNaN(id)) m[id] = { likes: Number(item?.likes_count ?? 0), messages: Number(item?.message_count ?? 0) };
                }
              }
              setCountsMap(m);
            } catch (err) { console.debug('AppLayout: counts fetch error', err); }
          } catch (err) { console.debug('AppLayout: counts fetch error', err); }

          // Preload images via Image and try Cache Storage
          for (const ch of arr) {
            try {
              if (ch?.image_url_s3) {
                // Preload for display using Image() to avoid triggering fetch/CORS failures
                const img = new Image();
                img.src = ch.image_url_s3;
                img.onload = () => {};
                img.onerror = () => {};
                // If you need to persist into Cache Storage, enable CORS on S3/CloudFront and
                // then uncomment the lines below. Keep in mind cache.add() will perform a fetch
                // which requires the response to include Access-Control-Allow-Origin for your origin.
                // if ('caches' in window) {
                //   caches.open('hl-images').then(cache => cache.add(ch.image_url_s3).catch(() => {}));
                // }
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (!aborted) setCharError(err?.message || String(err));
      }
    }

    loadChars();
    return () => { aborted = true; };
  }, []);

  useEffect(() => {
    if (charError) console.warn("Character fetch error:", charError);
  }, [charError]);

  const isGenerateRoute = location.pathname.startsWith('/generate-image');

  return (
    <div
      className={`min-h-screen w-full theme-transition ${
        isDark 
          ? "bg-black text-white" 
          : "bg-white text-slate-900"
      }`}
      style={{ ["--header-h" as any]: `${headerH}px` }}
    >
      {/* SEO Head for homepage */}
      {!children && (
        <SEOHead 
          title="HoneyLove AI - Create & Chat with AI Characters | NSFW AI Companions"
          description="Experience the ultimate AI companion with HoneyLove AI. Create custom AI characters, chat with realistic AI girlfriends and boyfriends. Premium NSFW AI chat experience with unlimited conversations."
          keywords="AI girlfriend, AI boyfriend, AI chat, NSFW AI, AI companion, character AI, virtual girlfriend, virtual boyfriend, AI roleplay, custom AI characters"
          canonical="https://honeylove.ai"
          structuredData={{
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "HoneyLove AI",
            "description": "AI companion platform for creating and chatting with custom AI characters",
            "url": "https://honeylove.ai",
            "applicationCategory": "Entertainment",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            },
            "author": {
              "@type": "Organization",
              "name": "HoneyLove AI"
            }
          }}
        />
      )}
      <div
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300`}
      >
        <Header
          gender={gender}
          setGender={setGender}
          genderOpen={genderOpen}
          setGenderOpen={setGenderOpen}
          setSidebarOpen={setSidebarOpen}
          onOpenAuth={() => setAuthOpen(true)}
          popoverRef={popoverRef}
          currentPath={location.pathname}
        />
      </div>

      {/* Extend the golden sidebar divider line all the way up under the header */}
      <div
        aria-hidden
        className={`pointer-events-none fixed top-0 bottom-0 z-40 hidden md:block border-l ${
          isDark ? 'border-[var(--hl-gold)]/22' : 'border-[var(--hl-gold)]/14'
        }`}
        style={{ left: sidebarCollapsed ? '80px' as any : '240px' as any }}
      />

      {/* Reduce left padding on the generate-image page to minimize gap to sidebar */}
      <div className={`flex min-h-[calc(100vh-1px)] transition-all duration-300 ${
        isGenerateRoute ? (sidebarCollapsed ? 'md:pl-12' : 'md:pl-52') : (sidebarCollapsed ? 'md:pl-20' : 'md:pl-60')
      }`} style={{ paddingTop: "calc(var(--header-h) + 8px)" } as React.CSSProperties}>
        <Sidebar
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          setSidebarOpen={setSidebarOpen}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />

        {/* Main content column (remove inner left border to avoid double line) */}
        <div className={`flex min-h-screen flex-1 flex-col`}>
          {children ? (
            <main className="w-full px-4 sm:px-6">{children}</main>
          ) : (
            <>
              <HeroSection gender={gender} />

              <main className="w-full px-4 sm:px-6">
                <section className="py-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h3 className={`text-xl sm:text-2xl font-semibold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}>
                      <span className="text-[var(--hl-gold)]">Honey Love</span> Character
                    </h3>

                    {/* Filter Pills - Right aligned to match Figma */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {filterOptions.map((filter) => {
                        if (filter.type === 'filter') {
                          return (
                            <button
                              key={filter.id}
                              type="button"
                              className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-[#110D08]/90 border border-[#3F2B0B]/60 text-white/80 hover:text-black hover:bg-[var(--hl-gold)] hover:shadow-[0_14px_34px_rgba(246,185,75,0.28)]'
                    : 'bg-[#FCF5E4]/90 border border-[#D9AF5D]/60 text-gray-800 hover:text-black hover:bg-[var(--hl-gold)] hover:shadow-[0_14px_34px_rgba(246,185,75,0.28)]'
                              }`}
                            >
                              <FilterIcon
                                className={`h-3.5 w-3.5 transition-colors duration-200 ${
                                  isDark
                                    ? 'text-[var(--hl-gold)]/80 group-hover:text-[var(--hl-gold)]'
                                    : 'text-[#C8922E]/80 group-hover:text-[#B37611]'
                                }`}
                              />
                              <span>{filter.label}</span>
                            </button>
                          );
                        }

                        if (filter.type === 'toggle') {
                          // Toggle that switches between NSFW (active) and SFW (inactive)
                          const isActive = filter.isActive;
                          const displayLabel = isActive ? 'NSFW' : 'SFW';
                          return (
                            <div key={filter.id} className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${isDark ? (isActive ? 'text-white' : 'text-white/80') : (isActive ? 'text-gray-900' : 'text-gray-600')}`}>
                                {displayLabel}
                              </span>
                              <button
                                aria-pressed={isActive}
                                aria-label={`Toggle ${displayLabel} content`}
                                onClick={() => toggleFilter(filter.id)}
                                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-200 ${
                                  isActive ? filterToggleTrackActive : filterToggleTrack
                                } hover:shadow-[0_12px_30px_rgba(246,185,75,0.18)] hover:ring-1 hover:ring-[var(--hl-gold)]/30`}
                              >
                                <span
                                  className={`inline-block h-5 w-5 transform rounded-full shadow-[0_6px_16px_rgba(246,185,75,0.28)] transition-transform duration-200 ${
                                    isActive ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                  style={{
                                    background: isActive
                                      ? 'linear-gradient(135deg, var(--hl-gold) 0%, #F7D08E 100%)'
                                      : 'rgba(246,185,75,0.7)'
                                  }}
                                />
                              </button>
                            </div>
                          );
                        }
                        return (
                          <button
                            key={filter.id}
                            onClick={() => toggleFilter(filter.id)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                              filter.isActive
                                ? filterPillActive
                                : filterPillBase
                            } hover:text-black hover:bg-[var(--hl-gold)] hover:shadow-[0_16px_36px_rgba(246,185,75,0.28)]`}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 responsive-grid">
                    {characters && characters.length > 0 ? (
                      characters
                        .filter((ch) => {
                          // Apply active filter states
                          if (activeFilters.includes('private_content')) {
                            // Filter for characters with private content
                            const hasPrivate = ch.has_private_content || ch.private_content || ch.premium;
                            if (!hasPrivate) return false;
                          }

                          if (activeFilters.includes('nsfw')) {
                            // Filter for NSFW characters
                            const isNsfw = ch.nsfw || ch.is_nsfw || ch.adult_content;
                            if (!isNsfw) return false;
                          }

                          return true;
                        })
                        .map((ch) => (
                        <CharacterCard
                          key={ch.id}
                          name={ch.name || ch.username}
                          age={ch.age}
                          img={ch.image_url_s3}
                          bio={ch.bio}
                          onClick={() => navigate('/chat', { state: { character: ch } })}
                          likesCount={countsMap?.[ch.id]?.likes ?? 0}
                          messageCount={countsMap?.[ch.id]?.messages ?? 0}
                        />
                      ))
                    ) : (
                      // fallback to gender-aware assets while loading or on error
                      mainGridImages.map((asset, i) => (
                        <CharacterCard 
                          key={`main-${i}`} 
                          name={asset.name} 
                          age={asset.age} 
                          img={asset.image} 
                          likesCount={0} 
                          messageCount={0} 
                          onClick={() => navigate('/chat', { state: { character: {
                            id: `fallback-${i}`,
                            name: asset.name,
                            age: asset.age,
                            image_url_s3: asset.image,
                            bio: `Meet ${asset.name}, ${asset.age} years old`
                          } } })}
                        />
                      ))
                    )}
                  </div>
                </section>
              </main>

              {/* Create banner between grid and following content */}
              <CreateBanner gender={gender} />

              {/* Additional characters section (after banner) */}
              <main className="w-full px-4 sm:px-6">
                <section className="py-6">
                  <div className="mt-4 responsive-grid">
                    {moreGridImages.map((asset, i) => (
                      <CharacterCard 
                        key={`more-${i}`} 
                        name={asset.name} 
                        age={asset.age} 
                        img={asset.image} 
                        likesCount={0} 
                        messageCount={0} 
                        onClick={() => navigate('/chat', { state: { character: {
                          id: `more-${i}`,
                          name: asset.name,
                          age: asset.age,
                          image_url_s3: asset.image,
                          bio: `Meet ${asset.name}, ${asset.age} years old`
                        } } })}
                      />
                    ))}
                  </div>
                </section>
              </main>

              {/* Load more button (moved here so it appears above InfoSplit) */}
              <div className="py-6 flex justify-center">
                <LoadMoreButton />
              </div>

              {/* Additional site sections */}
              <InfoSplit gender={gender} />
              <FeatureCardsGrid gender={gender} />
              <MoreInfoSplit gender={gender} />
              <CenteredBanner />
              <HighlightsTriple gender={gender} />
              <FAQSection gender={gender} />
            </>
          )}
        </div>
      </div>

      {/* consistent footer for all pages that use this layout (except /chat) */}
      {location.pathname !== "/chat" && !location.pathname.startsWith("/create-character") && (
        <div className={`transition-all duration-300 ${
          sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}>
          <SiteFooter gender={gender} />
        </div>
      )}

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={`fixed bottom-4 left-4 z-50 grid h-12 w-12 place-items-center rounded-full ring-1 md:hidden theme-transition ${
            isDark 
              ? "bg-zinc-900 ring-white/10 hover:bg-zinc-800" 
              : "bg-white ring-gray-300 hover:bg-gray-50 shadow-lg"
          }`}
        >
          <div className={`h-6 w-6 rounded ${isDark ? "bg-white/80" : "bg-gray-700"}`} />
        </button>
      )}
  <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
