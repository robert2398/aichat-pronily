import { Plus, Sparkles } from "lucide-react";

// explicit urls for the two promo placeholders (prefer these if present)
import promoImage1 from "../../assets/home/3rd section/image_1.png?url";
import promoImage2 from "../../assets/home/3rd section/image_2.png?url";

// eagerly import promo images from assets/home/3rd section so we can use them as backgrounds
const PROMO_IMAGES = import.meta.glob(
  "../../assets/home/3rd section/*.{png,jpg,jpeg,svg}",
  { eager: true, import: "default", query: "?url" }
);

export default function Promo() {
  // build array of entries (filename + url), sorted by filename
  const entries = Object.entries(PROMO_IMAGES)
    .map(([p, url]) => {
      const parts = String(p).split(/[\\/]+/g);
      const filename = (parts[parts.length - 1] || p).toLowerCase();
      return { filename, url: String(url) };
    })
    .sort((a, b) => a.filename.localeCompare(b.filename));

  const stripExt = (s) => String(s).replace(/\.[a-z0-9]+$/i, "");

  // exact names we want for the mock
  const LEFT_NAME = "image_1";
  const RIGHT_NAME = "image_2";

  const exactLeft = entries.find((e) => stripExt(e.filename) === LEFT_NAME) || null;
  const exactRight = entries.find((e) => stripExt(e.filename) === RIGHT_NAME) || null;

  // urls in stable order
  const urls = entries.map((e) => e.url);

  // prefer explicit static imports, then exact matches, otherwise use first/second URL in list
  const leftBg = promoImage1 || (exactLeft && exactLeft.url) || urls[0] || null;
  const rightBg = promoImage2 || (exactRight && exactRight.url) || urls[1] || urls[0] || null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 gap-6 lg:gap-x-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px] lg:items-center">
          {/* LEFT IMAGE PANE (always shown) */}
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] aspect-[4/5] w-[350px]"
            style={
              leftBg
                ? {
                    backgroundImage: `url(${leftBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {
                    background:
                      "linear-gradient(180deg, rgba(40,15,30,0.5), rgba(20,10,25,0.5))",
                  }
            }
          >
            {/* ensure an <img> is present for reliability */}
            {promoImage1 && (
              <img
                src={promoImage1}
                alt="promo left"
                className="pointer-events-none absolute inset-0 w-full h-full object-cover rounded-2xl"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.12)]"
            />
          </div>

          {/* CENTER COPY */}
          <div className="px-1 lg:px-0">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">
                AI Porn Generator
              </span>
              <span className="text-white"> to Satiate Your Lust</span>
            </h2>
            <p className="mt-3 text-sm text-white/75 max-w-prose">
              Do you crave watching porn scenes that fit your lusty desires? Are
              you tired of watching those subscription-based porn that does not
              gratify individual fantasies or would otherwise be repetitive?
              This AI porn generator at Pornily puts the entire power over the
              experience into your hands. With the help of AI generated porn,
              you can alternate and possess visuals that strictly follow your
              imagination instead of depending on the studios for production.
              Be it exploring forbidden scenarios, designing seductive
              characters, or even creating porn AI visuals that mainstream
              platforms can't deliver, opportunities are limitless.
            </p>
            <div className="mt-4">
              <a
                href="#generate"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white bg-gradient-to-r from-fuchsia-500 to-sky-500 shadow-[0_6px_18px_rgba(79,70,229,0.12)]"
              >
                <Sparkles className="h-4 w-4" /> Generate Now
              </a>
            </div>
          </div>

          {/* RIGHT IMAGE PANE (2nd placeholder; hidden on mobile, shown on lg+) */}
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] aspect-[4/5] w-[180px] shrink-0 justify-self-end hidden lg:block"
            style={
              rightBg
                ? { backgroundImage: `url(${rightBg})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: "linear-gradient(180deg, rgba(40,15,30,0.5), rgba(20,10,25,0.5))" }
            }
          >
            {promoImage2 && (
              <img
                src={promoImage2}
                alt="promo right"
                className="pointer-events-none absolute inset-0 w-full h-full object-cover rounded-2xl"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.12)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
