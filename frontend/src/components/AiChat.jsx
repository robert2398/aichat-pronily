import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PhoneCall, MoreVertical, Search, ChevronLeft, Send, ShieldCheck, Heart, MessageSquare } from "lucide-react";
import InsufficientCoinsModal from "./ui/InsufficientCoinsModal";
import { useMessageCounts } from "../hooks/useMessageCounts";

// prefer S3 image url, fall back to local img — keep a single source-of-truth
const getCharacterImageUrl = (c) => {
  const a = typeof (c === null || c === void 0 ? void 0 : c.image_url_s3) === "string" ? c.image_url_s3 : "";
  const b = typeof (c === null || c === void 0 ? void 0 : c.img) === "string" ? c.img : "";
  return a || b;
};

function ChatCharacterCard({ item, onOpen, messageCount }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpen(item)}
  className="relative w-full overflow-hidden rounded-xl text-left"
      >
  <div className="h-80 w-full overflow-hidden">
          {item.img ? (
            <img src={item.img} alt={item.name} className="h-full w-full object-cover object-top" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />
          )}
        </div>
        {/* subtle bottom gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/45 pointer-events-none" />
        <div className="absolute left-3 right-3 bottom-3 p-0">
          <div className="px-3 pb-2">
            <p className="text-white text-sm font-semibold drop-shadow-md">{item.name}</p>
            <p className="text-white/60 text-xs mt-1 drop-shadow-sm">{item.age} • {item.desc}</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-2 text-pink-300">
                <Heart className="h-3.5 w-3.5 text-pink-400" aria-hidden />
                {item.likes ?? "1M"}
              </span>
              <span className="inline-flex items-center gap-2 text-pink-300">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                {messageCount || "0"}
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export default function AiChat() {
  const navigate = useNavigate();
  const { id } = useParams();

  const location = useLocation();
  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [charsError, setCharsError] = useState(null);
  const [source, setSource] = useState("Default"); // "Default" | "My AI"

  // image cache key and helpers (presigned urls have ~10h validity)
  const IMAGE_CACHE_KEY = "pronily:characters:image_cache";
  const IMAGE_CACHE_TTL = 10 * 60 * 60 * 1000; // 10 hours in ms

  const getCachedImage = (id) => {
    try {
      const raw = localStorage.getItem(IMAGE_CACHE_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw || "{}") || {};
      const entry = map[String(id)];
      if (!entry) return null;
      if (!entry.expiresAt || Number(entry.expiresAt) < Date.now()) {
        // expired
        return null;
      }
      return entry.url || null;
    } catch (e) {
      return null;
    }
  };

  const setCachedImage = (id, url) => {
    try {
      const raw = localStorage.getItem(IMAGE_CACHE_KEY);
      const map = (raw && JSON.parse(raw)) || {};
      map[String(id)] = { url, expiresAt: Date.now() + IMAGE_CACHE_TTL };
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(map));
    } catch (e) {
      // ignore storage errors
    }
  };

  // selected character (by id) from route or fallback to first
  const selected = (characters && characters.find((c) => String(c.id) === String(id))) || characters[0] || null;

  // safe selected for use in chat UI (prevents null access when characters haven't loaded)
  const selectedSafe = selected || { name: "", bio: "", id: null };

  // start with empty conversation (remove dummy messages)
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [showAllGallery, setShowAllGallery] = useState(false);
  const [showInsufficientCoinsModal, setShowInsufficientCoinsModal] = useState(false);
  const [galleryFetchStatus, setGalleryFetchStatus] = useState("");
  const [galleryFetchUrl, setGalleryFetchUrl] = useState("");

  // Fetch message counts for characters
  const { getFormattedCount } = useMessageCounts(characters);

  // Session id management: keep a stable id for the lifetime of the page/tab
  const ensureSessionId = (characterId) => {
    // persist on window so it survives component remounts during the SPA lifetime
    try {
      if (typeof window !== "undefined") {
        // if auth token changed, reset session id so server can start a fresh session
        const stored = localStorage.getItem("pronily:auth:token") || "";
        const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();
        const prevToken = window.__pronily_prev_auth_token || "";
        if (prevToken !== tokenOnly) {
          // reset session id when token changes (login/logout)
          window.__pronily_chat_session_id = undefined;
          window.__pronily_chat_session_character_id = undefined;
        }
        window.__pronily_prev_auth_token = tokenOnly;

        // if character changed, reset session so each character gets its own session
        const prevChar = window.__pronily_chat_session_character_id;
        if (characterId != null && String(prevChar) !== String(characterId)) {
          window.__pronily_chat_session_id = undefined;
          window.__pronily_chat_session_character_id = undefined;
        }

        if (!window.__pronily_chat_session_id) {
          // try crypto.randomUUID when available
          let id = null;
          try {
            id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : null;
          } catch (e) {
            id = null;
          }
          if (!id) id = `sess_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
          window.__pronily_chat_session_id = id;
          // associate this session id with the active character
          try {
            window.__pronily_chat_session_character_id = characterId != null ? String(characterId) : undefined;
          } catch (e) {}
        }
        return window.__pronily_chat_session_id;
      }
    } catch (e) {
      // fallback
    }
    return `sess_fallback_${Date.now()}`;
  };

  const messagesRef = useRef(null);
  const endRef = useRef(null);
  const mainRef = useRef(null);
  const composerRef = useRef(null);

  // Date/time helpers for WhatsApp-style grouping
  const toDate = (v) => {
    try { return v ? new Date(v) : new Date(); } catch (e) { return new Date(); }
  };

  const getDayKey = (date) => {
    const d = toDate(date);
    return d.toISOString().slice(0,10); // YYYY-MM-DD
  };

  const isOlderThanWeek = (date) => {
    const d = toDate(date);
    return (Date.now() - d.getTime()) > 7 * 24 * 60 * 60 * 1000;
  };

  const formatDayLabel = (date) => {
    const d = toDate(date);
    if (isOlderThanWeek(d)) return d.toLocaleDateString();
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  };

  const formatTime = (date) => {
    const d = toDate(date);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Message bubble helper component
  function MessageBubble({ m }) {
    const bubbleRef = useRef(null);
    const timeRef = useRef(null);

    useEffect(() => {
      const elTime = timeRef.current;
      const elBubble = bubbleRef.current;
      if (!elTime || !elBubble) return;

      const setVar = (w) => {
        try { elBubble.style.setProperty('--tsw', `${Math.ceil(w)}px`); } catch (e) {}
      };

      // initialize
      setVar(elTime.getBoundingClientRect().width || elTime.offsetWidth || 0);

      let ro = null;
      try {
        ro = new ResizeObserver((entries) => {
          for (const e of entries) {
            const w = e.contentRect?.width || 0;
            // small padding buffer so time doesn't touch text
            setVar(w + 6);
          }
        });
        ro.observe(elTime);
      } catch (e) {
        // ResizeObserver not supported
        const onResize = () => setVar(elTime.offsetWidth || 0);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
      }

      const onWin = () => setVar(elTime.getBoundingClientRect().width || elTime.offsetWidth || 0);
      window.addEventListener('resize', onWin);

      return () => {
        try { if (ro && elTime) ro.unobserve(elTime); } catch (e) {}
        try { window.removeEventListener('resize', onWin); } catch (e) {}
      };
    }, [m.time, m.text]);

    return (
      <div ref={bubbleRef} className={`bubble max-w-[75%] relative`} style={{'--tsw': '0px'}}>
        <div className="text-sm whitespace-pre-wrap break-words">
          {typeof m.text === 'string' ? (
            m.text.split(/(\*[^*]+\*)/g).map((part, i) => {
              if (/^\*.+\*$/.test(part)) return <em key={i}>{part.replace(/\*/g, '')}</em>;
              return <span key={i}>{part}</span>;
            })
          ) : (
            m.text
          )}
          {/* inline spacer only affects the last line because it's inline-block */}
          <span className="inline-block" style={{ width: 'var(--tsw)' }} aria-hidden />
        </div>

        {/* absolutely positioned time sits bottom-right inside bubble; never wraps */}
        <time ref={timeRef} className="message-time absolute right-3 bottom-2 text-[11px] text-white/60 whitespace-nowrap">
          {m.time ? formatTime(m.time) : ''}
        </time>
      </div>
    );
  }

  // Track whether user is near bottom so we don't yank scroll when they scroll up
  const userAtBottomRef = useRef(true);

  // Robust scroll helper: tries to scroll the messages container to bottom.
  // If `force` is false, only scroll when user is already near the bottom.
  const scrollToBottom = (force = false) => {
    try {
      if (!force && !userAtBottomRef.current) return;
      if (endRef.current && typeof endRef.current.scrollIntoView === "function") {
        endRef.current.scrollIntoView({ block: "end", behavior: "auto" });
        return;
      }
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    } catch (e) {
      // ignore
    }
  };

  const handleMessagesScroll = () => {
    try {
      const el = messagesRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      // consider near-bottom within 80px
      userAtBottomRef.current = distanceFromBottom < 80;
    } catch (e) {}
  };

  // Keep the messages scrolled to bottom
  useEffect(() => {
    // Use a requestAnimationFrame to ensure layout is settled, then scroll the sentinel into view.
  const id = requestAnimationFrame(() => {
      try {
        if (endRef.current && typeof endRef.current.scrollIntoView === "function") {
      endRef.current.scrollIntoView({ block: "end", behavior: "auto" });
        } else if (messagesRef.current) {
          // Fallback
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      } catch (e) {
        // ignore
      }
    });
    return () => cancelAnimationFrame(id);
  }, [messages]);

  // Also try to scroll after images or fonts load; observe size changes
  useEffect(() => {
    // small observer to catch layout changes and keep scrolled to bottom
    if (!messagesRef.current) return;
    let ro = null;
    try {
      ro = new ResizeObserver(() => {
        // use a small timeout to let layout settle; respect user scroll intent
        setTimeout(() => scrollToBottom(false), 20);
      });
      ro.observe(messagesRef.current);
    } catch (e) {
      // ResizeObserver may not exist; ignore
    }
    return () => {
      try {
        if (ro && messagesRef.current) ro.unobserve(messagesRef.current);
      } catch (e) {}
    };
  }, []);
  // ⚙️ Viewport-fit logic: size to viewport under whatever sits above <main>
  const setHeights = () => {
    try {
      if (!mainRef.current) return;
      const top = Math.max(0, Math.round(mainRef.current.getBoundingClientRect().top));
      document.documentElement.style.setProperty("--chat-top", `${top}px`);
    } catch (e) {}
  };

  // Keep messages' bottom padding equal to composer height
  const syncComposerPadding = () => {
    try {
      const h = composerRef.current?.offsetHeight ?? 0;
      // add a tiny buffer so the last bubble clears the radius/shadow
      const total = Math.round(h + 8);
      messagesRef.current?.style?.setProperty("--composer-h", `${total}px`);
    } catch (e) {}
  };

  // run after layout & on resize, but only when a chat is open (id present)
  useEffect(() => {
    if (!id) return;
    // initial run and a follow-up RAF to catch late layout shifts (fonts, images, transitions)
    setHeights();
    const rafId = requestAnimationFrame(() => {
      setHeights();
    });
    window.addEventListener("resize", setHeights);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", setHeights);
      // remove the css var when leaving chat
      document.documentElement.style.removeProperty("--chat-top");
    };
  }, [id]);

  // Gallery fetching: extracted function so we can log, force-refresh, and listen to reload events
  const fetchGallery = async (opts = { force: false }) => {
    const CACHE_KEY = 'pronily:gallery:cache';
    const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

    try {
      if (!opts.force) {
        // Try cache first
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.expiresAt && Number(parsed.expiresAt) > Date.now() && Array.isArray(parsed.items)) {
              // cache hit
              const all = parsed.items;
              const filtered = selectedSafe?.id ? all.filter((it) => String(it.character_id) === String(selectedSafe.id)) : all;
              setGalleryItems(filtered || []);
              console.debug('AiChat: gallery - cache hit, using cached items', filtered?.length ?? 0);
              return;
            }
          }
        } catch (e) {
          console.debug('AiChat: gallery - cache read/parse failed', e);
        }
      } else {
        console.debug('AiChat: gallery - force refresh requested');
      }

      // Determine base URL (fall back to origin + /api/v1 when VITE var not set)
      const envBase = import.meta.env.VITE_API_BASE_URL;
      const base = envBase || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '');
      if (!base) {
        console.debug('AiChat: gallery - no base URL available, skipping fetch');
        return;
      }

      // Choose endpoint based on source: Default uses media endpoint; My AI must use fetch-loggedin-user
      let url = '';
      const headers = { 'Content-Type': 'application/json' };
      if (source === 'Default') {
        url = `${base.replace(/\/$/, '')}/characters/media/get-default-character-media`;
        console.debug('AiChat: gallery - fetching (media)', url);
        try { setGalleryFetchUrl(url); setGalleryFetchStatus('loading'); } catch (e) {}
        // public or token-provided access allowed for media
        const stored = localStorage.getItem('pronily:auth:token');
        if (stored) {
          const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
          headers['Authorization'] = `bearer ${tokenOnly}`;
        } else if (import.meta.env.VITE_API_AUTH_TOKEN) {
          headers['Authorization'] = import.meta.env.VITE_API_AUTH_TOKEN;
        }
      } else {
        // My AI: call the logged-in characters endpoint and pass the user's token
        const stored = localStorage.getItem('pronily:auth:token');
        if (!stored) {
          console.debug('AiChat: gallery - My AI requested but no auth token');
          setGalleryFetchStatus('no-auth');
          return;
        }
        url = `${base.replace(/\/$/, '')}/characters/fetch-loggedin-user`;
        console.debug('AiChat: gallery - fetching (loggedin characters)', url);
        const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
        headers['Authorization'] = `bearer ${tokenOnly}`;
      }

      const res = await fetch(url, { headers });
      console.debug('AiChat: gallery - fetch response', res && res.status);
      if (!res.ok) {
        console.debug('AiChat: gallery - fetch not ok', res.status);
        try { setGalleryFetchStatus(`error ${res.status}`); } catch (e) {}
        return;
      }
      const json = await res.json();
      // For media endpoint expect images array; for loggedin-user expect characters list
      let items = [];
      if (source === 'Default') {
        items = json.images || json.data || [];
      } else {
        // map characters into a gallery-like items array with character_id and image fields
        const chars = Array.isArray(json) ? json : (json.characters || json.data || []);
        items = (chars || []).map((c) => ({
          id: c.id,
          character_id: c.id,
          image_url_s3: c.image_url_s3 || c.image_url || c.img || '',
          url: c.image_url_s3 || c.image_url || c.img || '',
        }));
      }
      const filtered = selectedSafe?.id ? items.filter((it) => String(it.character_id) === String(selectedSafe.id)) : items;
  setGalleryItems(filtered || []);
  try { setGalleryFetchStatus('ok'); } catch (e) {}

      try {
        const payload = { items, expiresAt: Date.now() + CACHE_TTL };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.debug('AiChat: gallery - cache write failed', e);
      }
    } catch (e) {
      console.debug('AiChat: gallery - unexpected error', e);
      try { setGalleryFetchStatus('error'); } catch (e2) {}
    }
  };

  // call on selected change, and listen for external reload triggers
  useEffect(() => {
    let cancelled = false;
    // small wrapper respects cancellation
    const run = async () => {
      if (cancelled) return;
      console.debug('AiChat: gallery effect triggered for selectedSafe.id', selectedSafe?.id);
      await fetchGallery({ force: true });
    };
    run();

    const onReload = () => {
      // force refresh when external code dispatches 'gallery:reload'
      fetchGallery({ force: true });
    };
    try { window.addEventListener('gallery:reload', onReload); } catch (e) {}

    return () => { cancelled = true; try { window.removeEventListener('gallery:reload', onReload); } catch (e) {} };
  }, [selectedSafe?.id]);

  // Also ensure gallery fetch runs when route id is present (covers cases where selectedSafe may be delayed)
  useEffect(() => {
  if (!id) return;
  console.debug('AiChat: gallery effect triggered for route id', id);
  // force a network fetch when opening a chat to ensure API is called
  fetchGallery({ force: true });
  }, [id]);

  // Observe composer size to keep padding tight
  useEffect(() => {
    if (!composerRef.current) return;
    syncComposerPadding();
    let ro;
    try {
      ro = new ResizeObserver(syncComposerPadding);
      ro.observe(composerRef.current);
    } catch (e) {}
    window.addEventListener("resize", syncComposerPadding);
    return () => {
      try { ro && composerRef.current && ro.unobserve(composerRef.current); } catch (e) {}
      window.removeEventListener("resize", syncComposerPadding);
    };
  }, [id]);

  // Recompute heights when navigating into a chat (id changes) to avoid the cropped state
  useEffect(() => {
    if (!id) return;
    // run a couple RAFs to ensure the layout and any transitions have settled
    const raf1 = requestAnimationFrame(() => {
      setHeights();
      const raf2 = requestAnimationFrame(setHeights);
      // no-op holder for raf2 (cleanup handled when effect tears down)
      void raf2;
    });
    // Also schedule a micro timeout as a fallback
    const t = setTimeout(setHeights, 120);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t);
    };
  }, [id]);

  // Load chat history when switching character (or reset if none)
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const loadHistory = async () => {
      setMessages([]);
      setText("");
      try {
        userAtBottomRef.current = true;
      } catch (e) {}

      const envBase = import.meta.env.VITE_API_BASE_URL;
      const base = envBase || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '');
      if (!base) {
        // no backend configured; nothing to load
        setTimeout(() => scrollToBottom(true), 30);
        return;
      }

      try {
        const url = `${base.replace(/\/$/, '')}/chats/all`;
        const opts = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
        const stored = localStorage.getItem('pronily:auth:token');
        if (stored) {
          const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
          opts.headers['Authorization'] = `bearer ${tokenOnly}`;
        }

        const res = await fetch(url, opts);
        if (!res.ok) {
          // fallback to empty messages but don't throw UI-breaking error
          setMessages([]);
          setTimeout(() => scrollToBottom(true), 30);
          return;
        }

        const data = await res.json();
        if (cancelled) return;
        // filter messages for this character id and map to local message shape
        const charId = Number(id);
        const filtered = (Array.isArray(data) ? data : []).filter((r) => Number(r.character_id) === charId);
        // sort ascending by created_at so older messages come first
        filtered.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

        const mapped = [];
        for (const row of filtered) {
          // user's message
          if (row.user_query && row.user_query.trim()) {
            mapped.push({ id: `u_${row.id}`, from: 'me', text: row.user_query, time: new Date(row.created_at).toISOString() });
          }
          // ai message
          if (row.ai_message && row.ai_message.trim()) {
            mapped.push({ id: `a_${row.id}`, from: 'them', text: row.ai_message, time: new Date(row.created_at).toISOString() });
          }
        }

        setMessages(mapped);
        // scroll to bottom after render
        setTimeout(() => scrollToBottom(true), 50);
      } catch (err) {
        // On error, keep messages empty but don't break the app
        setMessages([]);
        setTimeout(() => scrollToBottom(true), 30);
      }
    };

    loadHistory();
    return () => { cancelled = true; };
  }, [id]);

  // Hide footer & lock outer scroll while chat is open
  useEffect(() => {
    if (!id) return;
    const prevOverflowBody = document.body.style.overflow;
    const prevOverflowHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.setAttribute("data-chat-open", "1");

    const footer = document.querySelector("footer");
    const prevFooterDisplay = footer?.style.display;
    if (footer) footer.style.display = "none";

    return () => {
      document.body.style.overflow = prevOverflowBody || "";
      document.documentElement.style.overflow = prevOverflowHtml || "";
      document.body.removeAttribute("data-chat-open");
      if (footer) footer.style.display = prevFooterDisplay || "";
      document.documentElement.style.removeProperty("--chat-top");
    };
  }, [id]);

  const send = () => {
    if (!text.trim()) return;
    // If user isn't logged in, redirect to signin and preserve return location
    const storedToken = localStorage.getItem('pronily:auth:token');
    if (!storedToken) {
      // preserve current location so user can be returned after auth
      try {
        navigate('/signin', { state: { background: location, returnTo: location.pathname + (location.search || '') } });
      } catch (e) {
        navigate('/signin');
      }
      return;
    }

    if (!selectedSafe.id) {
      // no character selected
      setMessages((m) => [...m, { id: Date.now(), from: "them", text: "Please select a character before sending a message.", time: "" }]);
      return;
    }
    if (isSending) return; // prevent duplicate
  // optimistic add user message (use ISO timestamp)
  const userMsg = { id: Date.now(), from: "me", text: text.trim(), time: new Date().toISOString() };
  setMessages((m) => [...m, userMsg]);
  // user just sent a message — force scroll to show it
  setTimeout(() => scrollToBottom(true), 25);
    const userQuery = text.trim();
    setText("");
    (async () => {
      const base = import.meta.env.VITE_API_BASE_URL;
      if (!base) {
        setMessages((m) => [...m, { id: Date.now() + 1, from: "them", text: "API base URL not configured.", time: "" }]);
        return;
      }

      setIsSending(true);
      try {
        const url = `${base.replace(/\/$/, "")}/chats`;
        const headers = { "Content-Type": "application/json" };
        const stored = localStorage.getItem("pronily:auth:token");
        if (stored) {
          const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();
          headers["Authorization"] = `bearer ${tokenOnly}`;
        }

        const payload = {
          session_id: ensureSessionId(selectedSafe.id),
          character_id: selectedSafe.id,
          user_query: userQuery,
        };

        const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
        if (!res.ok) {
          if (res.status === 402) {
            // Handle insufficient coins gracefully
            setShowInsufficientCoinsModal(true);
            return;
          }
          const txt = await res.text();
          throw new Error(txt || res.statusText || `HTTP ${res.status}`);
        }
        const data = await res.json();

        // try a few common response shapes for AI reply
  // Prefer explicit backend field `chat_response`, then fall back to other common keys
  const aiText = data?.chat_response || data?.reply || data?.ai_response || data?.message || (data?.choices && (data.choices[0]?.message?.content || data.choices[0]?.text)) || (typeof data === 'string' ? data : JSON.stringify(data));

  setMessages((m) => [...m, { id: Date.now() + 2, from: "them", text: aiText || "(no response)", time: new Date().toISOString() }]);
  // only auto-scroll if user was near bottom
  setTimeout(() => scrollToBottom(false), 25);
      } catch (err) {
  setMessages((m) => [...m, { id: Date.now() + 3, from: "them", text: `Error: ${err.message || String(err)}`, time: new Date().toISOString() }]);
  setTimeout(() => scrollToBottom(false), 25);
      } finally {
        setIsSending(false);
      }
    })();
  };

  // fetch characters when source changes
  useEffect(() => {
    let cancelled = false;
    const fetchChars = async () => {
      setLoadingChars(true);
      setCharsError(null);
      try {
        // compute base URL with fallback
        const envBase = import.meta.env.VITE_API_BASE_URL;
        const base = envBase || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '');
        if (!base) {
          setCharsError('No API base configured');
          setCharacters([]);
          setLoadingChars(false);
          return;
        }

        let url = "";
        const opts = { method: 'GET', headers: {} };
        if (source === 'Default') {
          url = `${base.replace(/\/$/, '')}/characters/fetch-default`;
        } else {
          // My AI: requires access token
          const stored = localStorage.getItem('pronily:auth:token');
          if (!stored) {
            // No auth token - prompt sign-in. Do NOT set an error or clear the characters
            // so the default characters stay visible if the user cancels sign-in.
            navigate('/signin', { state: { background: location } });
            return;
          }
          url = `${base.replace(/\/$/, '')}/characters/fetch-loggedin-user`;
          const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
          opts.headers['Authorization'] = `bearer ${tokenOnly}`;
        }

        const res = await fetch(url, opts);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.statusText || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        // map backend shape to UI-friendly fields
        const mapped = (Array.isArray(data) ? data : []).map((d) => {
          // prefer cached presigned url if available and not expired
          const rawUrl = d.image_url_s3 || d.image_url || '';
          const cached = rawUrl ? getCachedImage(d.id) : null;
          const finalUrl = cached || rawUrl || '';
          if (rawUrl && !cached) {
            // store in cache with ttl
            setCachedImage(d.id, rawUrl);
          }
          return {
            id: d.id,
            name: d.name || d.username,
            age: d.age || '',
            desc: d.bio || '',
            img: finalUrl,
            bio: d.bio || '',
            image_url_s3: d.image_url_s3 || '',
          };
        });
        setCharacters(mapped);
      } catch (err) {
        if (!cancelled) setCharsError(err.message || String(err));
      } finally {
        if (!cancelled) setLoadingChars(false);
      }
    };
    fetchChars();
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (!id) {
    const openChatFor = (character) => {
      try {
        localStorage.setItem("pronily:chat:selectedCharacter", JSON.stringify(character));
      } catch {}
      navigate(`/ai-chat/${character.id}`);
    };

    return (
      <main className="mx-auto max-w-full px-0">
        <section className="w-full mx-auto px-0 sm:px-0 py-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/5"
                aria-label="Back"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M15 6 9 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-2xl font-semibold">Select Character For Chat</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Pill-style switch for Source (Default / My AI) */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[.03] p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setSource('Default')}
                  className={`h-9 px-4 min-w-[7rem] text-sm rounded-full text-center font-medium flex items-center justify-center transition-colors ${source === 'Default' ? 'bg-pink-500 text-white shadow' : 'text-white/90 hover:bg-white/5'}`}
                >
                  Pronily AI
                </button>
                <button
                  type="button"
                  onClick={() => {
                      const stored = localStorage.getItem('pronily:auth:token');
                      if (!stored) {
                        // Prompt sign-in without setting an error so default characters remain visible.
                        navigate('/signin', { state: { background: location } });
                        return;
                      }
                      setSource('My AI');
                    }}
                  className={`h-9 px-4 min-w-[7rem] text-sm rounded-full text-center font-medium flex items-center justify-center transition-colors ${source === 'My AI' ? 'bg-pink-500 text-white shadow' : 'text-white/90 hover:bg-white/5'}`}
                >
                  My AI
                </button>
              </div>

              <button
                className="rounded-full px-4 py-2 bg-gradient-to-r from-pink-500 via-pink-400 to-indigo-500 text-sm font-medium text-white shadow"
                onClick={() => navigate("/create-character")}
              >
                + Create Character
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loadingChars ? (
              <div className="col-span-full text-center text-sm text-white/70">Loading characters...</div>
            ) : charsError ? (
              <div className="col-span-full text-center text-sm text-red-400">{charsError}</div>
            ) : characters.length === 0 ? (
              <div className="col-span-full text-center text-sm text-white/70">No characters found.</div>
            ) : (
              characters.map((c) => (
                <ChatCharacterCard key={c.id} item={c} onOpen={openChatFor} messageCount={getFormattedCount(c.id)} />
              ))
            )}
          </div>
        </section>
      </main>
    );
  }

  // Chat view: fills viewport; badging sits bottom-center under chat window
  return (
    <main
      ref={mainRef}
      className="mx-auto max-w-full px-0"
      style={{
        // Height is the viewport minus the real top offset of this main element.
        height: "calc(105dvh - var(--chat-top, 0px))",
        overflow: "hidden",
        marginTop: "-40px"
      }}
    >
  <div className="h-full flex flex-col min-h-0">
        {/* CHAT WINDOW */}
  <div className="flex-1 overflow-hidden bg-white/[.02] grid grid-cols-12 min-h-0">
          {/* LEFT: chat list (search/header sticky) */}
          <aside className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-white/5 p-0 flex flex-col h-full min-h-0 overflow-x-hidden text-xs">
            <div className="sticky top-0 z-20 bg-white/[.02] backdrop-blur px-4 pt-4 pb-3">
              <div className="flex items-center gap-3 mb-3">
                <button
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/5"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-semibold">Chat</h2>
              </div>

              <div className="mb-0">
                <div className="relative">
                  <input
                    placeholder="Search"
                    className="w-full rounded-lg bg-white/[.02] px-3 py-2 text-sm outline-none"
                  />
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-white/50" />
                </div>
                
              </div>
            </div>

            <div className="p-3 space-y-2 flex-1 overflow-y-auto">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/ai-chat/${c.id}`)}
                  className={`flex items-center gap-2 w-full text-left p-1.5 rounded-lg hover:bg-white/5 ${
                    String(c.id) === String(selectedSafe.id) ? "bg-white/5" : ""
                  }`}
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    {(c.image_url_s3 || c.img) ? <img src={c.image_url_s3 || c.img} alt={c.name} className="h-full w-full object-cover object-top" /> : <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{c.name}</div>
                    <div className="text-[11px] text-white/60">Last message preview…</div>
                  </div>
                  <div className="text-xs text-white/50">12:35 PM</div>
                </button>
              ))}
            </div>
          </aside>

          {/* CENTER: messages */}
          <section className="col-span-12 md:col-span-6 p-4 flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  {(selectedSafe.image_url_s3 || selectedSafe.img) ? 
                    <img src={selectedSafe.image_url_s3 || selectedSafe.img} alt={selectedSafe.name} className="h-full w-full object-cover object-top" /> : 
                    <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />
                  }
                </div>
                <div>
                  <div className="text-sm font-semibold">{selectedSafe.name}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full p-2 bg-white/[.02] border border-white/10">
                  <PhoneCall className="w-4 h-4" />
                </button>
                <button className="rounded-full p-2 bg-white/[.02] border border-white/10">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={messagesRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto p-2 space-y-3 h-full min-h-0"
              style={{ paddingBottom: 'var(--composer-h, 64px)' }}
            >
              {(() => {
                // If user isn't logged in or there are no prior messages for this character,
                // show a friendly default prompt instead of an empty chat.
                const hasAuth = Boolean(localStorage.getItem('pronily:auth:token'));
                if (!hasAuth || (Array.isArray(messages) && messages.length === 0)) {
                  return (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="max-w-xl text-center text-white/70 px-4">
                        <div className="text-sm">
                          Hey you. I could ask for your details, or I could just say....you’re a vibe. Want to test compatibility? 😏
                        </div>
                      </div>
                    </div>
                  );
                }

                // Group messages by day key
                const groups = [];
                let lastKey = null;
                for (const m of messages) {
                  const key = getDayKey(m.time || new Date().toISOString());
                  if (key !== lastKey) {
                    groups.push({ type: 'day', key, time: m.time });
                    lastKey = key;
                  }
                  groups.push({ type: 'msg', msg: m });
                }

                return groups.map((item, idx) => {
                  if (item.type === 'day') {
                    return (
                      <div key={`day-${item.key}-${idx}`} className="flex items-center justify-center">
                        <div className="px-3 py-1 rounded-full bg-white/[.04] text-xs text-white/70">{formatDayLabel(item.time)}</div>
                      </div>
                    );
                  }
                  const m = item.msg;
                  return (
                    <div key={m.id} className={`message-wrapper ${m.from === 'me' ? 'message-user' : 'message-ai'}`}>
                      {m.from !== 'me' && (
                        <div className="avatar" title={selectedSafe.name}>
                          {(selectedSafe.image_url_s3 || selectedSafe.img) ? (
                            <img src={selectedSafe.image_url_s3 || selectedSafe.img} alt={selectedSafe.name} />
                          ) : (
                            <div className="avatar-initials">{(selectedSafe.name || 'AI').slice(0,2).toUpperCase()}</div>
                          )}
                        </div>
                      )}

                      <div className="message-inner">
                        <MessageBubble m={m} />
                      </div>

                      {m.from === 'me' && (
                        <div className="avatar" title="You">
                          <div className="avatar-initials">You</div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {/* typing indicator when AI is replying */}
              {isSending && (
                <div className="message-wrapper message-ai">
                  <div className="avatar">
                    {(selectedSafe.image_url_s3 || selectedSafe.img) ? (
                      <img src={selectedSafe.image_url_s3 || selectedSafe.img} alt={selectedSafe.name} />
                    ) : (
                      <div className="avatar-initials">AI</div>
                    )}
                  </div>
                  <div className="message-inner">
                    <div className="bubble typing" aria-hidden>
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={endRef} aria-hidden style={{ height: 8 }} />
            </div>

            {/* input */}
            <div ref={composerRef} className="mt-3 sticky bottom-0 bg-transparent">
              <div className="flex items-center gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Type a message (Enter to send, Shift+Enter for newline)"
                  className="flex-1 rounded-xl bg-white/[.02] px-3 py-2 text-sm outline-none"
                />
                <button onClick={send} className="rounded-full bg-pink-600 p-3 text-white">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT: profile */}
          <aside className="col-span-12 md:col-span-3 md:border-l border-white/5 p-4 flex flex-col h-full min-h-0 overflow-y-auto">
            {/* Image / hero */}
            <div className="relative mb-4">
  {(() => {
    const heroUrl = selectedSafe.image_url_s3 || selectedSafe.img;
    return heroUrl ? (
      <img
        key={`hero-${selectedSafe.id}-${heroUrl}`}
        src={heroUrl}
        alt={selectedSafe.name || "Character"}
        className="block w-full h-80 rounded-xl object-cover object-top"
        loading="eager"
        decoding="async"
        onError={(e) => {
          // graceful fallback if this URL 404s/expirs
          try { (e.currentTarget).replaceWith(
            Object.assign(document.createElement("div"), {
              className: "w-full h-80 rounded-xl bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0)_70%)]"
            })
          ); } catch {}
        }}
      />
    ) : (
      <div className="w-full h-80 rounded-xl bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0)_70%)]" />
    );
  })()}

  {/* left/right arrows */}
  <button aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white border border-white/10">
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </button>
  <button aria-hidden className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white border border-white/10">
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </button>

  {/* name + age overlay */}
  <div className="absolute left-4 bottom-4 text-left">
    <div className="text-white text-xl md:text-2xl font-semibold drop-shadow-md">
      {selectedSafe.name}{selectedSafe.age ? `, ${selectedSafe.age}` : ""}
    </div>
  </div>
</div>

            {/* description */}
            <div className="traits-panel compact">
              <p className="text-sm text-white/70 mb-4">{selectedSafe.bio || 'Avatara is loving and empathetic, she loves playing with cats and dancing.'}</p>

              {/* Generate image */}
              <button onClick={() => {
                try { localStorage.setItem('pronily:image:selectedCharacter', JSON.stringify(selectedSafe)); } catch (e) {}
                // mark that we're coming from a selection flow so the form reads persisted selection
                navigate('/ai-porn/image', { state: { fromSelect: true } });
              }} className="w-full rounded-xl px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-pink-500 via-pink-400 to-indigo-500 shadow mb-4">✨ Generate image</button>

              {/* Gallery */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-pink-400">Gallery</div>
                  <div className="text-xs text-white/50">{(galleryFetchStatus && galleryFetchStatus !== 'ok') ? `Status: ${galleryFetchStatus}` : ''}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(galleryItems && galleryItems.length > 0 ? (showAllGallery ? galleryItems : galleryItems.slice(0,4)) : []).map((it, idx) => (
                    <div key={it.id || idx} className="relative h-16 w-full rounded-lg overflow-hidden bg-white/[.02]">
                        { (it.media_type && String(it.media_type).toLowerCase().startsWith('video')) ? (
                          <video src={it.s3_path_gallery || it.url || it.image_url_s3 || it.image_url || it.img || it.file || it.media_url} className="w-full h-full object-cover object-top" controls muted preload="none" />
                        ) : (
                          (it.s3_path_gallery || it.url || it.image_url_s3 || it.image_url || it.img || it.file || it.media_url) ? (
                            <img src={it.s3_path_gallery || it.url || it.image_url_s3 || it.image_url || it.img || it.file || it.media_url} alt={`thumb-${idx}`} className="w-full h-full object-cover object-top" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0)_70%)]" />
                          )
                        )}
                      {/* overlay for first visible when collapsed */}
                      {!showAllGallery && idx === Math.min(3, (galleryItems.length-1)) && galleryItems.length > 4 && (
                        <button onClick={() => setShowAllGallery(true)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-medium">View More</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="section">
                <div className="traits-title">Details</div>
                <div className="grid">
                  <div className="item">
                    <div className="icon">👤</div>
                    <div>
                      <div className="label">Body</div>
                      <div className="value chips"><span className="chip">Fit</span></div>
                    </div>
                  </div>

                  <div className="item">
                    <div className="icon">🌍</div>
                    <div>
                      <div className="label">Ethnicity</div>
                      <div className="value chips"><span className="chip">Caucasian</span></div>
                    </div>
                  </div>

                  <div className="item">
                    <div className="icon">👁️</div>
                    <div>
                      <div className="label">Eye</div>
                      <div className="value chips"><span className="chip">Green</span></div>
                    </div>
                  </div>

                  <div className="item">
                    <div className="icon">💇</div>
                    <div>
                      <div className="label">Hair</div>
                      <div className="value chips"><span className="chip">Brown</span><span className="chip">Straight</span></div>
                    </div>
                  </div>

                  <div className="item">
                    <div className="icon">🍒</div>
                    <div>
                      <div className="label">Breast</div>
                      <div className="value chips"><span className="chip">Big</span></div>
                    </div>
                  </div>

                  <div className="item">
                    <div className="icon">🍑</div>
                    <div>
                      <div className="label">Butt</div>
                      <div className="value chips"><span className="chip">Big</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Her Traits */}
              <div className="section">
                <div className="traits-title">Her Traits</div>
                <div className="grid">
                  <div className="item">
                    <div className="icon">🧠</div>
                    <div>
                      <div className="label">Personality</div>
                      <div className="value chips"><span className="chip">Lover</span></div>
                    </div>
                  </div>

                  <div className="item">
                    <div className="icon">🎭</div>
                    <div>
                      <div className="label">Occupation</div>
                      <div className="value chips"><span className="chip">Actress</span></div>
                    </div>
                  </div>

                  <div className="item" style={{ gridColumn: '1 / -1' }}>
                    <div className="icon">🎨</div>
                    <div>
                      <div className="label">Hobbies</div>
                      <div className="value chips">
                        {['Ambitious','Empathetic','Caring','Writing Poetry','Bird Watching'].map((h) => (
                          <span key={h} className="chip">{h}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="item" style={{ gridColumn: '1 / -1' }}>
                    <div className="icon">💖</div>
                    <div>
                      <div className="label">Relationship</div>
                      <div className="value chips"><span className="chip">Stranger</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* BOTTOM-CENTER BADGING */}
        <div className="py-2 flex justify-center">
          <div className="flex items-center gap-2 text-xs text-white/85">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span className="px-2 py-0.5 rounded-full bg-white/[.06] border border-white/10">Secure</span>
            <span className="px-2 py-0.5 rounded-full bg-white/[.06] border border-white/10">
              End-to-end encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Insufficient Coins Modal */}
      <InsufficientCoinsModal 
        open={showInsufficientCoinsModal} 
        onClose={() => setShowInsufficientCoinsModal(false)} 
      />
    </main>
  );
}
