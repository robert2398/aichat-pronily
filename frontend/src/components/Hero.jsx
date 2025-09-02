import { Image as ImageIcon, Video, MessageCircle, User, BookOpen, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  console.log("Hero render");
  const navigate = useNavigate();

  const items = [
    { title: "AI Image Generator", icon: ImageIcon, href: "/ai-porn/image" },
    { title: "AI Video Generator", icon: Video, href: "/ai-porn/video" },
  { title: "Erotic Chat", icon: MessageCircle, href: "/ai-chat" },
    { title: "Onlyfans AI Self", icon: User, href: "#self", soon: true },
    { title: "Story Generator", icon: BookOpen, href: "#story", soon: true },
    { title: "Interactive Game", icon: Gamepad2, href: "#game", soon: true },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-center text-3xl sm:text-5xl font-semibold tracking-tight">
        <span className="text-white">Create your own </span>
        <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">Free AI porn.</span>
      </h1>
      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[.03] p-5 sm:p-8 lg:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <a
              key={it.title}
              href={it.href}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] p-6 sm:p-8 min-h-[170px] flex items-center justify-start shadow hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              onClick={(e) => {
                console.log("Hero tile click", it.title, it.href);
                if (!it.href) return;

                // Internal SPA route -> use react-router navigation
                if (it.href.startsWith("/")) {
                  e.preventDefault();
                  navigate(it.href);
                  return;
                }

                // External http(s) -> full redirect
                if (it.href.startsWith("http://") || it.href.startsWith("https://")) {
                  e.preventDefault();
                  window.location.href = it.href;
                  return;
                }
                // otherwise let the anchor behave normally (hash, etc.)
              }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-500/70 via-pink-500/60 to-pink-400/70" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="grid place-items-center rounded-xl bg-white/15 p-3">
                  <it.icon className="h-8 w-8 text-white" aria-hidden />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white drop-shadow-sm">{it.title}</h3>
                </div>
              </div>
              {it.soon && (
                <div className="absolute right-4 top-4 select-none">
                  <span className="rounded-xl bg-white text-[#20172e] px-3 py-1 text-xs font-medium shadow-sm">Coming Soon</span>
                </div>
              )}
              <div aria-hidden className="absolute inset-0 rounded-2xl shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.12)]" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
