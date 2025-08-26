import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
// using the single SVG logo in /img/Logo.svg for header (favico uses the same file)

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const nav = [
    { label: "Gallery", href: "#gallery" },
  { label: "AI Porn Generator", href: "/ai-porn" },
    { label: "AI Chat", href: "/ai-chat" },
    { label: "AI Story", href: "#ai-story" },
    { label: "Premium", href: "/pricing" },
    { label: "Company", href: "#company" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/5" role="banner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <a
            href="/"
            className="group inline-flex items-center gap-2"
            aria-label="Pronily home"
            onClick={(e) => { e.preventDefault(); /* perform a full reload to root */ location.href = '/'; }}
          >
            <img src="/img/Logo.svg" alt="Pronily" className="h-8 w-auto" />
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
          {/* Right: CTAs (desktop) - removed search per request */}
          <div className="hidden md:flex items-center gap-3">
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
              href="#get-started"
              className="rounded-xl px-3 py-2 text-sm font-medium text-[#0A011A] bg-gradient-to-r from-violet-300 via-fuchsia-200 to-sky-200 shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset] hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              onClick={() => {
                console.log("Get started click (desktop)");
              }}
            >
              Get started
            </a>
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
              <a
                href="/signin"
                className="flex-1 rounded-xl px-3 py-2 text-center text-sm/6 text-white/90 ring-1 ring-inset ring-white/15 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  onClick={() => { setOpen(false); navigate('/signin',{state:{background:location}}); }}
              >
                  Sign in
              </a>
              <a
                href="#get-started"
                className="flex-1 rounded-xl px-3 py-2 text-center text-sm font-medium text-[#0A011A] bg-gradient-to-r from-violet-300 via-fuchsia-200 to-sky-200 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                onClick={() => { setOpen(false); }}
              >
                Get started
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
