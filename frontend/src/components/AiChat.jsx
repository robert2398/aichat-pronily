import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PhoneCall, MoreVertical, Search, ChevronLeft, Send, ShieldCheck } from "lucide-react";

// prefer S3 image url, fall back to local img — keep a single source-of-truth
const getCharacterImageUrl = (c) => {
  const a = typeof (c === null || c === void 0 ? void 0 : c.image_url_s3) === "string" ? c.image_url_s3 : "";
  const b = typeof (c === null || c === void 0 ? void 0 : c.img) === "string" ? c.img : "";
  return a || b;
};

function ChatCharacterCard({ item, onOpen }) {
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
        <div className="absolute left-3 right-3 bottom-3 p-0">
          <div className="px-3 pb-2">
            <p className="text-white text-sm font-semibold drop-shadow-md">{item.name}</p>
            <p className="text-white/60 text-xs mt-1 drop-shadow-sm">
              {item.age} • {item.desc}
            </p>
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
  const [sourceOpen, setSourceOpen] = useState(false);

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

  // Reset chat when switching character so each character starts fresh
  useEffect(() => {
    // Only run when id changes to a real value
    if (!id) return;
    setMessages([]);
    setText("");
    try {
      userAtBottomRef.current = true;
    } catch (e) {}
    // ensure scroll position is reset
    setTimeout(() => scrollToBottom(true), 30);
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
    if (!selectedSafe.id) {
      // no character selected
      setMessages((m) => [...m, { id: Date.now(), from: "them", text: "Please select a character before sending a message.", time: "" }]);
      return;
    }
    if (isSending) return; // prevent duplicate
  // optimistic add user message
  const userMsg = { id: Date.now(), from: "me", text: text.trim(), time: "Now" };
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
          const txt = await res.text();
          throw new Error(txt || res.statusText || `HTTP ${res.status}`);
        }
        const data = await res.json();

        // try a few common response shapes for AI reply
  // Prefer explicit backend field `chat_response`, then fall back to other common keys
  const aiText = data?.chat_response || data?.reply || data?.ai_response || data?.message || (data?.choices && (data.choices[0]?.message?.content || data.choices[0]?.text)) || (typeof data === 'string' ? data : JSON.stringify(data));

  setMessages((m) => [...m, { id: Date.now() + 2, from: "them", text: aiText || "(no response)", time: "Now" }]);
  // only auto-scroll if user was near bottom
  setTimeout(() => scrollToBottom(false), 25);
      } catch (err) {
  setMessages((m) => [...m, { id: Date.now() + 3, from: "them", text: `Error: ${err.message || String(err)}`, time: "" }]);
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
        const base = import.meta.env.VITE_API_BASE_URL;
        let url = "";
        const opts = { method: "GET", headers: {} };
        if (source === "Default") {
          url = `${base}/characters/fetch-default`;
        } else {
          // My AI: requires access token
          url = `${base}/characters/fetch-loggedin-user`;
          const stored = localStorage.getItem("pronily:auth:token");
          if (!stored) {
            // redirect to signin so user can provide token
            setCharsError("You must sign in to view your characters.");
            setCharacters([]);
            setLoadingChars(false);
            navigate('/signin', { state: { background: location } });
            return;
          }
          // Exactly mirror CreateCharacterSave: strip any leading bearer and send lowercase 'bearer'
          const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();
          const authHeader = `bearer ${tokenOnly}`;
          opts.headers["Authorization"] = authHeader;
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
          const rawUrl = d.image_url_s3 || d.image_url || "";
          const cached = rawUrl ? getCachedImage(d.id) : null;
          const finalUrl = cached || rawUrl || "";
          if (rawUrl && !cached) {
            // store in cache with ttl
            setCachedImage(d.id, rawUrl);
          }
          return {
            id: d.id,
            name: d.name || d.username,
            age: d.age || "",
            desc: d.bio || "",
            img: finalUrl,
            bio: d.bio || "",
            image_url_s3: d.image_url_s3 || "",
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
              {/* Styled dropdown for Source */}
              <div className="relative">
                <button
                  onClick={() => setSourceOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white bg-white/[.03] border border-white/10 hover:bg-white/5 focus:outline-none"
                  aria-haspopup="true"
                >
                  <span className="px-1">{source}</span>
                  <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {sourceOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 min-w-[10rem] rounded-xl bg-[#0b0710] border border-white/6 shadow-lg z-50">
                    <button onClick={() => { setSource('Default'); setSourceOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 rounded-t-xl">Default</button>
                    <button onClick={() => { setSource('My AI'); setSourceOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 rounded-b-xl">My AI</button>
                  </div>
                )}
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
                <ChatCharacterCard key={c.id} item={c} onOpen={openChatFor} />
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
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[70%] p-3 rounded-lg ${
                    m.from === "me" ? "ml-auto bg-pink-600 text-white" : "bg-white/[.03] text-white/85"
                  }`}
                >
                  <div className="text-sm">{m.text}</div>
                  <div className="text-xs text-white/50 mt-1">{m.time}</div>
                </div>
              ))}
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
            <p className="text-sm text-white/70 mb-4">{selectedSafe.bio || 'Avatara is loving and empathetic, she loves playing with cats and dancing.'}</p>

            {/* Generate image */}
            <button onClick={() => navigate(`/ai-image?character=${selectedSafe.id}`)} className="w-full rounded-xl px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-pink-500 via-pink-400 to-indigo-500 shadow mb-4">✨ Generate image</button>

            {/* Gallery */}
            <div className="mb-4">
              <div className="text-sm font-medium text-pink-400 mb-2">Gallery</div>
              <div className="grid grid-cols-3 gap-2">
                {[0,1,2].map((i) => (
                  <div key={i} className="relative h-16 w-full rounded-lg overflow-hidden bg-white/[.02]">
                    {(selectedSafe.image_url_s3 || selectedSafe.img) ? (
                      <img src={selectedSafe.image_url_s3 || selectedSafe.img} alt={`thumb-${i}`} className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0)_70%)]" />
                    )}
                    {i === 2 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-medium">View More</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="mb-4">
              <div className="text-[10px] font-medium text-white/80 mb-2">Details</div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px]">👤</div>
                  <div>
                    <div className="text-[8px] text-white/60">BODY</div>
                    <div className="text-white text-[10px]">Fit</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px]">🌍</div>
                  <div>
                    <div className="text-[8px] text-white/60">ETHNICITY</div>
                    <div className="text-white text-[10px]">Caucasian</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px]">👁️</div>
                  <div>
                    <div className="text-[8px] text-white/60">EYE</div>
                    <div className="text-white text-[10px]">Green</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px]">💇</div>
                  <div>
                    <div className="text-[8px] text-white/60">HAIR</div>
                    <div className="text-white text-[10px]">Brown, Straight</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px]">🍒</div>
                  <div>
                    <div className="text-[8px] text-white/60">BREAST</div>
                    <div className="text-white text-[10px]">Big</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px]">🍑</div>
                  <div>
                    <div className="text-[8px] text-white/60">BUTT</div>
                    <div className="text-white text-[10px]">Big</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Her Traits */}
            <div>
              <div className="text-[10px] font-medium text-pink-400 mb-2">Her Traits</div>
              <div className="grid grid-cols-2 gap-1">
                {/* First row: Personality and Occupation */}
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px]">🧠</div>
                  <div>
                    <div className="text-[8px] text-white/60">PERSONALITY</div>
                    <div className="text-white text-[10px]">Lover</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px]">🎭</div>
                  <div>
                    <div className="text-[8px] text-white/60">OCCUPATION</div>
                    <div className="text-white text-[10px]">Actress</div>
                  </div>
                </div>
                {/* Second row: Hobbies and Relationship */}
                <div className="flex items-start gap-2 text-[10px] col-span-2">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px] flex-shrink-0 mt-0.5">🎨</div>
                  <div>
                    <div className="text-[8px] text-white/60">HOBBIES</div>
                    <div className="text-white text-[10px] leading-tight">Ambitious, Empathetic, Caring, Writing Poetry, Bird Watching</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] col-span-2">
                  <div className="w-4 h-4 flex items-center justify-center text-[8px]">💖</div>
                  <div>
                    <div className="text-[8px] text-white/60">RELATIONSHIP</div>
                    <div className="text-white text-[10px]">Stranger</div>
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
    </main>
  );
}
