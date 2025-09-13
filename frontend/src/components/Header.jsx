import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import Dropdown from "./ui/Dropdown";
// using the header logo in /img/Pornily.png

function IconGem({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="gemGradSmall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF66C4" />
          <stop offset="1" stopColor="#FF2EA6" />
        </linearGradient>
      </defs>
      <path d="M10 1 L17 8 L10 19 L3 8 Z" fill="url(#gemGradSmall)"/>
      <path d="M10 1 L13.5 8 L6.5 8 Z" fill="#FFFFFF" opacity=".25"/>
      <path d="M3 8 L6.5 8 L10 19 Z" fill="#000000" opacity=".07"/>
      <path d="M17 8 L13.5 8 L10 19 Z" fill="#000000" opacity=".07"/>
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const nav = [
  // AI Characters will open a popover that fetches default characters and shows a small grid
  { label: "AI Characters", href: "/characters" },
  { label: "Gallery", href: "/ai-porn/gallery" },
  { label: "AI Porn Generator", href: "/ai-porn" },
    { label: "AI Chat", href: "/ai-chat" },
    { label: "AI Story", href: "#ai-story" },
    { label: "Premium", href: "/pricing" },
    { label: "Company", href: "#company" },
  ];
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [coinBalance, setCoinBalance] = useState(null);
  const [gemsOpen, setGemsOpen] = useState(false);
  const [coinCosts, setCoinCosts] = useState(null);
  const [coinCostsLoading, setCoinCostsLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const lastTokenRef = useRef(null);

  // helper to fetch coin balance given a token
  async function fetchCoinBalance(token) {
    if (!token) return setCoinBalance(null);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${base}/subscription/get-user-coin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setCoinBalance(data?.coin_balance ?? 0);
    } catch (err) {
      console.warn("Failed to fetch coin balance", err);
      setCoinBalance(null);
    }
  }

  // fetch costs like chat_cost,image_cost,video_cost,character_cost
  async function fetchCoinCosts(token) {
    try {
      setCoinCostsLoading(true);
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const url = `${base.replace(/\/$/, '')}/subscription/coin-cost`;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      // normalize per sample response
      setCoinCosts({
        chat_cost: Number(data.chat_cost ?? data.chatCost ?? data.chat_cost) || 1,
        character_cost: Number(data.character_cost ?? data.characterCost ?? data.character_cost) || 6,
        image_cost: Number(data.image_cost ?? data.imageCost ?? data.image_cost) || 5,
        video_cost: Number(data.video_cost ?? data.videoCost ?? data.video_cost) || 10,
      });
    } catch (err) {
      console.warn('Failed to fetch coin costs', err);
      setCoinCosts(null);
    } finally {
      setCoinCostsLoading(false);
    }
  }

  useEffect(() => {
    // initialize from localStorage
    function readAuthFromStorage() {
      const token = localStorage.getItem("pronily:auth:token") || null;
      const raw = localStorage.getItem("pronily:auth:raw");
      let parsedUser = null;

      if (raw) {
        try {
          const r = JSON.parse(raw);
          // Your /login sample shape:
          // { access_token, token_type, user: { role: "admin", ... } }
          let u = r?.user ?? r?.data?.user ?? r?.data ?? r ?? null;
          if (u && u.user) u = u.user; // unwrap once more if needed
          parsedUser = u || null;
        } catch (e) {
          parsedUser = null;
        }
      }

      // fallback: old keys (optional)
      if (!parsedUser) {
        const alt = localStorage.getItem('user');
        if (alt) {
          try {
            const a = JSON.parse(alt);
            let u = a?.user ?? a?.data?.user ?? a?.data ?? a ?? null;
            if (u && u.user) u = u.user;
            parsedUser = u || null;
          } catch (e) {}
        }
      }

      // final fallback
      const email = localStorage.getItem('pronily:auth:email');
      if (!parsedUser && email) parsedUser = { email };

      // Merge cached profile (keeps avatar/full_name between navigations)
      try {
        const cached = localStorage.getItem('pronily:profile');
        if (cached) {
          const p = JSON.parse(cached || '{}');
          parsedUser = parsedUser || {};
          // prefer parsedUser fields but fall back to cached profile values
          parsedUser.full_name = parsedUser.full_name || parsedUser.name || p.full_name || p.name || p.displayName || parsedUser.fullName || parsedUser.full_name;
          parsedUser.avatar = parsedUser.avatar || parsedUser.profile_picture || p.profile_image_url || p.avatar || p.profile_picture || parsedUser.picture;
          parsedUser.email = parsedUser.email || p.email || p.email_id || parsedUser.email;
          parsedUser.username = parsedUser.username || p.username || parsedUser.username;
        }
      } catch (e) { }

      if (token) {
        setUser(parsedUser);
        // store cleaned token in state for profile loads and coin fetches
        const tokenOnly = token.replace(/^Bearer\s+/i, '').trim();
        setToken(tokenOnly || null);
        fetchCoinBalance(tokenOnly || token);
      } else {
        setUser(null);
        setCoinBalance(null);
        setToken(null);
      }

      lastTokenRef.current = localStorage.getItem("pronily:auth:token");
    }

    readAuthFromStorage();

    // cross-tab updates: listen to the actual keys this app uses
    function onStorage(e) {
      // our app stores auth under 'pronily:auth:token' and raw response under 'pronily:auth:raw'
      if (e.key === "pronily:auth:token" || e.key === "pronily:auth:raw") {
        readAuthFromStorage();
      }
    }
    window.addEventListener("storage", onStorage);

    // same-window changes (storage event doesn't fire in same tab) - lightweight poll
    // Compare the same key we read earlier to avoid a perpetual mismatch.
    const interval = setInterval(() => {
      const token = localStorage.getItem("pronily:auth:token");
      if (token !== lastTokenRef.current) {
        readAuthFromStorage();
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, [location]);

  // close gems banner on outside click or escape
  useEffect(() => {
    function onDocClick(e) {
      // if click happened outside any open gems popover, close it
      if (!e?.target) return;
      // simple approach: if clicked element is inside a button that toggles gems, skip
      const path = e.composedPath ? e.composedPath() : (e.path || []);
      const insideGems = path.some((el) => el?.getAttribute && el.getAttribute('aria-label') === 'Gems balance');
      if (!insideGems) setGemsOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setGemsOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // When we have a token, fetch the authoritative profile to get profile_image_url and full_name
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!token) return;
      try {
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const url = `${base.replace(/\/$/, '')}/user/get-profile`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setUser((u) => ({
          ...u,
          full_name: data.full_name || u?.full_name,
          email: data.email || data.email_id || u?.email,
          username: data.username || u?.username,
          gender: data.gender || u?.gender,
          birth_date: data.birth_date || u?.birth_date,
          avatar: data.profile_image_url || u?.avatar,
          role: data.role || u?.role,
        }));
        try {
          localStorage.setItem('pronily:profile', JSON.stringify({ full_name: data.full_name, profile_image_url: data.profile_image_url, email: data.email, username: data.username, role: data.role }));
        } catch (e) {}
      } catch (e) {
        console.warn('Header: load profile failed', e);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [token]);

  function handleLogout() {
    localStorage.removeItem('pronily:auth:token');
    localStorage.removeItem('pronily:auth:raw');
    localStorage.removeItem('pronily:auth:email');
    // (optional) clean legacy keys:
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    setUser(null);
    setCoinBalance(null);
    navigate('/');
  }

  // Open user's gallery: fetch media with auth token, cache and navigate to /gallery
  async function openMyGallery() {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '');
      if (!base) {
        navigate('/ai-porn/gallery');
        return;
      }
      const url = `${base.replace(/\/$/, '')}/characters/media/get-users-character-media`;
      const headers = { 'Content-Type': 'application/json' };
      const stored = localStorage.getItem('pronily:auth:token');
      if (stored) {
        const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
        headers['Authorization'] = `bearer ${tokenOnly}`;
      } else if (import.meta.env.VITE_API_AUTH_TOKEN) {
        headers['Authorization'] = import.meta.env.VITE_API_AUTH_TOKEN;
      }

      let items = [];
      try {
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          items = data.images || data.data || [];
        }
      } catch (e) {
        // ignore fetch errors here; gallery page will handle fallback
        console.warn('openMyGallery: fetch failed', e);
      }

      try {
        const CACHE_KEY = 'pronily:gallery:cache';
        const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours
        const payload = { items, expiresAt: Date.now() + CACHE_TTL };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch (e) {}

  navigate('/ai-porn/gallery');
    } catch (e) {
      console.warn('openMyGallery error', e);
  navigate('/ai-porn/gallery');
    }
  }
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/5" role="banner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <a
            href="/"
            className="group inline-flex items-center gap-2"
            aria-label="Triple Minds home"
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
          >
            <img src="/img/Pornily.png" alt="Triple Minds" className="h-8 w-auto" />
          </a>
          {/* Center: Nav (desktop) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm/6 text-white/80 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                onClick={() => {
                  // navigate for internal app routes (starting with '/'), otherwise let anchors work
                  if (item.href && item.href.startsWith("/")) {
                    navigate(item.href);
                  } else {
                    console.log("Desktop nav click", item.label);
                  }
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
          {/* Right: CTAs (desktop) and Profile (conditional) */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <a
                  href="/signin"
                  className="rounded-xl px-3 py-2 text-sm/6 text-white/80 ring-1 ring-inset ring-white/15 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  onClick={() => {
                    console.log("Sign in click (desktop)");
                    navigate('/signin',{state:{background:location}});
                  }}
                >
                  Sign in
                </a>
                <a
                  href="/signup"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-[#0A011A] bg-gradient-to-r from-violet-300 via-fuchsia-200 to-sky-200 shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset] hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  onClick={() => {
                    navigate('/signup', { state: { background: location } });
                  }}
                >
                  Get started
                </a>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {/* GEMS */}
                <div className="relative">
                <button
                  onClick={async (e) => { e.stopPropagation(); const next = !gemsOpen; setGemsOpen(next); if (next) await fetchCoinCosts(token); }}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white/90 bg-white/10 ring-1 ring-white/10 hover:bg-white/15 focus:outline-none"
                  aria-label="Gems balance"
                  aria-expanded={gemsOpen}
                >
                  {/* Diamond gem w/ facets */}
                  <svg
                    className="w-5 h-5 shrink-0"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#FF66C4" />
                        <stop offset="1" stopColor="#FF2EA6" />
                      </linearGradient>
                    </defs>
                    {/* main body */}
                    <path d="M10 1 L17 8 L10 19 L3 8 Z" fill="url(#gemGrad)"/>
                    {/* top facet highlight */}
                    <path d="M10 1 L13.5 8 L6.5 8 Z" fill="#FFFFFF" opacity=".25"/>
                    {/* side facets (subtle shading) */}
                    <path d="M3 8 L6.5 8 L10 19 Z" fill="#000000" opacity=".07"/>
                    <path d="M17 8 L13.5 8 L10 19 Z" fill="#000000" opacity=".07"/>
                  </svg>

                  <span className="leading-none">{coinBalance ?? 0} gems</span>
                  <span className="text-pink-300 text-base leading-none">+</span>
                </button>

                {gemsOpen ? (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0b0710] text-white shadow-lg ring-1 ring-white/10 py-3 z-50">
                    <div className="px-3 text-sm text-white/60">Gems cost</div>
                    <div className="mt-1 grid gap-1 px-3">
                      {coinCostsLoading ? (
                        <div className="text-sm text-white/60">Loading…</div>
                      ) : coinCosts ? (
                        <>
                          <div className="flex items-center justify-between text-sm px-2 py-1 rounded-md hover:bg-white/5">
                            <div>Chat cost</div>
                            <div className="font-mono flex items-center gap-2"><span>{coinCosts.chat_cost}</span> <IconGem className="w-4 h-4" /></div>
                          </div>
                          <div className="flex items-center justify-between text-sm px-2 py-1 rounded-md hover:bg-white/5">
                            <div>Image cost</div>
                            <div className="font-mono flex items-center gap-2"><span>{coinCosts.image_cost}</span> <IconGem className="w-4 h-4" /></div>
                          </div>
                          <div className="flex items-center justify-between text-sm px-2 py-1 rounded-md hover:bg-white/5">
                            <div>Video cost</div>
                            <div className="font-mono flex items-center gap-2"><span>{coinCosts.video_cost}</span> <IconGem className="w-4 h-4" /></div>
                          </div>
                          <div className="flex items-center justify-between text-sm px-2 py-1 rounded-md hover:bg-white/5">
                            <div>Character cost</div>
                            <div className="font-mono flex items-center gap-2"><span>{coinCosts.character_cost}</span> <IconGem className="w-4 h-4" /></div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-white/60">Failed to load costs</div>
                      )}
                    </div>
                    <div className="mt-3 px-3">
                      <button onClick={() => { setGemsOpen(false); navigate('/buy-gems'); }} className="w-full rounded-md bg-gradient-to-r from-pink-600 to-indigo-600 px-3 py-2 text-sm font-semibold">+ Buy more</button>
                    </div>
                  </div>
                ) : null}
                </div>

                <Dropdown
                  onOpenChange={(v) => setProfileOpen(v)}
                  trigger={
                    <button className="flex items-center gap-3 focus:outline-none hover:opacity-90">
                      <img
                        src={user?.avatar || "/img/Pornily.png"}
                        alt={user?.full_name || "User"}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-white/90">{user?.full_name}</span>
                      <svg
                        className="w-3 h-3 text-white/80 translate-y-[1px]"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  }
                >
                  {({ close }) => {
                    const isAdmin = String(user?.role ?? "").toLowerCase() === "admin";

                    return (
                      <div className="w-56 rounded-xl bg-[#0b0710] text-white shadow-lg ring-1 ring-white/10 py-2">
                        <div className="px-3 pb-2 text-xs text-white/60">{user?.full_name}</div>

                        <div className="flex flex-col">
                          <button
                            onClick={() => { close(); navigate('/my-ai'); }}
                            className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5"
                          >
                            My AI
                          </button>
                          <button
                            onClick={() => { close(); openMyGallery(); }}
                            className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5"
                          >
                            My Gallery
                          </button>
                          <button
                            onClick={() => { close(); navigate('/pricing'); }}
                            className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5"
                          >
                            Subscription
                          </button>
                          <button
                            onClick={() => { close(); console.debug('Header: Settings clicked'); navigate('/settings'); }}
                            className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5"
                          >
                            Settings
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => { navigate('/admin/dashboard'); close(); }}
                              className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5"
                            >
                              Admin Dashboard
                            </button>
                          )}
                        </div>

                        <div className="h-px bg-white/5 my-2" />

                        <button
                          onClick={() => { close(); handleLogout(); }}
                          className="block w-full text-left px-3 py-2 rounded-md text-rose-400 hover:bg-white/5"
                        >
                          Logout
                        </button>
                      </div>
                    );
                  }}
                </Dropdown>
              </div>
            )}
          </div>
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-xl p-2 text-white/80 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => {
              setOpen((v) => !v);
            }}
          >
            <span className="sr-only">Toggle navigation</span>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {/* subtle bottom glow / divider (to echo the SVG's soft line) */}
      <div aria-hidden className="h-px w-full bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
      {/* Mobile flyout */}
      <div
        id="mobile-menu"
        className={`${open ? "block" : "hidden"} md:hidden border-b border-white/10 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/5`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          {/* Mobile: search removed per request */}
          <nav className="grid gap-1" aria-label="Mobile">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm/6 text-white/90 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                onClick={() => { setOpen(false); if (item.href && item.href.startsWith("/")) navigate(item.href); }}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-1 flex gap-2">
              {!user ? (
                <>
                  <a
                    href="/signin"
                    className="flex-1 rounded-xl px-3 py-2 text-center text-sm/6 text-white/90 ring-1 ring-inset ring-white/15 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    onClick={() => { setOpen(false); navigate('/signin',{state:{background:location}}); }}
                  >
                      Sign in
                  </a>
                  <a
                    href="/signup"
                    className="flex-1 rounded-xl px-3 py-2 text-center text-sm font-medium text-[#0A011A] bg-gradient-to-r from-violet-300 via-fuchsia-200 to-sky-200 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    onClick={() => { setOpen(false); navigate('/signup', { state: { background: location } }); }}
                  >
                    Get started
                  </a>
                </>
              ) : (
                <div className="mt-3 border-t border-white/5 pt-3">
                  <div className="flex items-center gap-3 px-1">
                    <div className="avatar">
                        <img src={user?.avatar || '/img/Pornily.png'} alt={user?.full_name || 'avatar'} />
                      </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{user?.full_name}</div>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-1 px-1">
                    {String(user?.role ?? "").toLowerCase() === 'admin' && (
                      <a onClick={() => { setOpen(false); navigate('/admin/dashboard'); }} className="block w-full text-left text-sm px-3 py-2 rounded-xl text-white/80 hover:bg-white/5">Admin Dashboard</a>
                    )}
                    <a onClick={() => { setOpen(false); openMyGallery(); }} className="block w-full text-left text-sm px-3 py-2 rounded-xl text-white/80 hover:bg-white/5">My Gallery</a>
                    <a onClick={() => { setOpen(false); handleLogout(); }} className="block w-full text-left text-sm px-3 py-2 rounded-xl text-rose-400 hover:bg-white/5">Logout</a>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

