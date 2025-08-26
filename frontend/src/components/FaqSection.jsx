import { useState } from "react";
import { Plus } from "lucide-react";

export default function FaqSection() {
  const [open, setOpen] = useState(null);
  console.log("FaqSection render", { open });
  const items = [
    "Lorem Ipsum is simply dummy text of the printing and typesetting?",
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry?",
    "Lorem Ipsum is simply dummy text of the printing and typesetting?",
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry?",
    "Lorem Ipsum is simply dummy text of the printing and typesetting?",
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
      <h3 className="text-center text-3xl font-semibold tracking-tight">Frequently Asked Questions</h3>
      <div className="mt-8 space-y-4">
        {items.map((q, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
                onClick={() => { console.log("FAQ toggle", { index: i, opening: open !== i }); setOpen(isOpen ? null : i); }}
              >
                <span className="text-base sm:text-lg font-medium">{q}</span>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-pink-500 to-sky-500 text-white transition-transform ${isOpen ? "rotate-45" : ""}`}>
                  <Plus className="h-5 w-5" aria-hidden />
                </span>
              </button>
              <div className={`px-5 pb-5 text-sm text-white/80 transition-[max-height] duration-300 ${isOpen ? "max-h-40" : "max-h-0"}`}>
                {isOpen && (
                  <p>
                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. When expanded, this area contains the answer copy.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
