import React, { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PhoneCall, MoreVertical, Search, ChevronLeft, Send, ShieldCheck } from "lucide-react";

function ChatCharacterCard({ item, onOpen }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[.02] shadow-sm text-left hover:border-white/20"
      >
        {item.img ? (
          <img src={item.img} alt={item.name} className="h-44 w-full object-cover" />
        ) : (
          <div className="h-44 w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />
        )}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="rounded-lg bg-[#1b1426]/85 px-3 py-2 ring-1 ring-inset ring-white/10 backdrop-blur">
            <p className="text-white text-sm font-semibold">{item.name}</p>
            <p className="text-white/60 text-xs mt-1">
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

  const characters = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i + 1,
        name: `Luna, ${20 + (i % 6)}`,
        age: 20 + (i % 6),
        desc: "Soft hair, a backless gown hugging.",
        img: "",
        bio: "A charming conversationalist with a playful vibe.",
      })),
    []
  );

  const selected = characters.find((c) => String(c.id) === String(id)) || characters[0];

  const [messages, setMessages] = useState([
    { id: 1, from: "them", text: "Hi there, How are you?", time: "3:15 PM" },
    {
      id: 2,
      from: "me",
      text: "Hi, I am coming there in few minutes. Please wait! I am in taxi right now.",
      time: "3:17 PM",
    },
  ]);
  const [text, setText] = useState("");

  const messagesRef = useRef(null);
  const endRef = useRef(null);
  const mainRef = useRef(null);

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
  // ⚙️ Viewport-fit logic:
  // Measure the actual top offset of the main chat container and size it to the viewport.
  const setHeights = () => {
    const top = mainRef.current?.getBoundingClientRect().top ?? 0;
    document.documentElement.style.setProperty("--chat-top", `${Math.max(0, Math.round(top))}px`);
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
    setMessages((m) => [...m, { id: Date.now(), from: "me", text: text.trim(), time: "Now" }]);
    setText("");
  };

  // Character selection grid (entry screen)
  if (!id) {
    const openChatFor = (character) => {
      try {
        localStorage.setItem("pronily:chat:selectedCharacter", JSON.stringify(character));
      } catch {}
      navigate(`/ai-chat/${character.id}`);
    };

    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <section className="w-full mx-auto p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
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

            <button
              className="rounded-full px-4 py-2 bg-gradient-to-r from-pink-500 via-pink-400 to-indigo-500 text-sm font-medium text-white shadow"
              onClick={() => navigate("/create-character")}
            >
              + Create Character
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {characters.map((c) => (
              <ChatCharacterCard key={c.id} item={c} onOpen={openChatFor} />
            ))}
          </div>
        </section>
      </main>
    );
  }

  // Chat view: fills viewport; badging sits bottom-center under chat window
  return (
    <main
      ref={mainRef}
      className="mx-auto max-w-7xl px-4"
      style={{
        // Height is the viewport minus the real top offset of this main element.
        height: "calc(100dvh - var(--chat-top, 0px))",
        overflow: "hidden",
      }}
    >
      <div className="h-full flex flex-col">
        {/* CHAT WINDOW */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-white/[.02] grid grid-cols-12">
          {/* LEFT: chat list (search/header sticky) */}
          <aside className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-white/5 p-0 overflow-y-auto overflow-x-hidden">
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

            <div className="p-4 space-y-3">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/ai-chat/${c.id}`)}
                  className={`flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-white/5 ${
                    String(c.id) === String(selected.id) ? "bg-white/5" : ""
                  }`}
                >
                  <div className="h-12 w-12 rounded-lg bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-white/60">Last message preview…</div>
                  </div>
                  <div className="text-xs text-white/50">12:35 PM</div>
                </button>
              ))}
            </div>
          </aside>

          {/* CENTER: messages */}
          <section className="col-span-12 md:col-span-6 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)]" />
                <div>
                  <div className="text-sm font-semibold">{selected.name}</div>
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

            <div ref={messagesRef} className="flex-1 overflow-y-auto p-2 space-y-3 pb-20">
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
            <div className="mt-3 sticky bottom-0 bg-transparent">
              <div className="flex items-center gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={1}
                  placeholder="Type a message"
                  className="flex-1 rounded-xl bg-white/[.02] px-3 py-2 text-sm outline-none"
                />
                <button onClick={send} className="rounded-full bg-pink-600 p-3 text-white">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT: profile */}
          <aside className="col-span-12 md:col-span-3 md:border-l border-white/5 p-4 overflow-y-auto">
            <div className="h-44 w-full rounded-xl bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0)_70%)] mb-4" />
            <h3 className="text-lg font-semibold mb-2">{selected.name}</h3>
            <p className="text-sm text-white/70 mb-4">{selected.bio}</p>

            <div className="grid grid-cols-2 gap-3">
              <button className="rounded-xl px-3 py-2 bg-white/[.02]">Generate image</button>
              <button className="rounded-xl px-3 py-2 bg-white/[.02]">View gallery</button>
            </div>

            <div className="mt-6 text-xs text-white/60">
              <div className="font-medium text-white/80 mb-2">Details</div>
              <div className="grid grid-cols-2 gap-2">
                <div>Body: Fit</div>
                <div>Eye: Green</div>
                <div>Hair: Brown</div>
                <div>Ethnicity: Caucasian</div>
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
