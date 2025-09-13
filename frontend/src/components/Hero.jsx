import { Image as ImageIcon, Video, MessageCircle, User, BookOpen, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import home images via Vite so we can use them as translucent backgrounds
const HOME_IMAGES = import.meta.glob('../../assets/home/1st section/*.{png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' });

export default function Hero() {
  console.log("Hero render");
  const navigate = useNavigate();

  const items = [
    { title: "AI Image Generator", icon: ImageIcon, href: "/ai-porn/image" },
    { title: "AI Video Generator", icon: Video, href: "/ai-porn/video" },
  { title: "Erotic Chat", icon: MessageCircle, href: "/ai-chat" },
  { title: "AI Editor", icon: User, href: "#self", soon: true },
    { title: "Story Generator", icon: BookOpen, href: "#story", soon: true },
    { title: "Interactive Game", icon: Gamepad2, href: "#game", soon: true },
  ];

  // map filenames to urls (normalize keys by filename)
  const imageMap = {};
  Object.entries(HOME_IMAGES).forEach(([p, url]) => {
    const parts = String(p).split(/[\\/]+/g);
    const filename = parts[parts.length - 1] || p;
    imageMap[filename.toLowerCase()] = url;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-center text-3xl sm:text-5xl font-semibold tracking-tight">
        <span className="text-white">Create your own </span>
        <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">Free AI porn.</span>
      </h1>
      <div className="mt-10 rounded-3xl border border-white/10 bg-white/[.03] p-5 sm:p-8 lg:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const lookup = `${it.title}.png`.toLowerCase();
            const bg = imageMap[lookup] || null;
            return (
              <a
                key={it.title}
                href={it.href}
                className="relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8 min-h-[170px] flex items-center justify-start shadow hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                onClick={(e) => {
                  console.log("Hero tile click", it.title, it.href);
                  if (!it.href) return;

                  if (it.href.startsWith("/")) {
                    e.preventDefault();
                    navigate(it.href);
                    return;
                  }
                  if (it.href.startsWith("http://") || it.href.startsWith("https://")) {
                    e.preventDefault();
                    window.location.href = it.href;
                    return;
                  }
                }}
              >
                {/* slightly more opaque translucent pink overlay */}
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-500/40 via-pink-500/25 to-pink-400/30" />
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
