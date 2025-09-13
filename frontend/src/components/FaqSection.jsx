import { useState } from "react";
import { Plus } from "lucide-react";

export default function FaqSection() {
  const [open, setOpen] = useState(null);

  const items = [
    {
      question: "What is Pornily and why is it called the best AI porn generator?",
      answer:
        "Pornily is the go-to porn ai generator that lets you create custom ai porn in 5 seconds. Unlike random clips online, you actually control what you see. Not only does it give you free ai porn options, but also the most realistic ai generated porn that matches your kink. As a result, Pornily is trusted as the best ai porn generator today.",
    },
    {
      question: "Is Pornily safe to use for custom AI porn?",
      answer:
        "Yes. Despite dealing with NSFW content, Pornily is built to keep things secure and private. In comparison to shady sites, this ai porn website encrypts all your activity. So, you can enjoy the best ai porn and custom creations without worrying about leaks.",
    },
    {
      question: "Can Pornily really create realistic AI porn?",
      answer:
        "Absolutely! Our ai porn generator at Pornily uses advanced tech to make AI realistic porn that feels hot and believable. Even though it’s AI, the results are shockingly close to your fantasy. Consequently, it keeps you hooked longer than basic porn sites.",
    },
    {
      question: "Can I make custom AI porn with specific desire?",
      answer:
        "Of course. Pornily shines as an ai porn creator because it lets you pick the body type, style, and mood you want. Similarly, the ai porn lab lets you refine details so your custom ai porn looks exactly how you imagined. Obviously, that’s why users love it.",
    },
    {
      question: "Does Pornily support videos or just images?",
      answer:
        "Pornily is more than just an ai porn website for pics. In particular, the ai porn maker on Pornily creates both hot AI porn images and AI generated porn videos. Consequently, you’re not limited—you can watch your fantasy play out in motion too.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
      <h3 className="text-center text-3xl font-semibold tracking-tight">
        Frequently Asked Questions
      </h3>
      <div className="mt-8 space-y-4">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]"
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="text-base sm:text-lg font-medium">
                  {item.question}
                </span>
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-pink-500 to-sky-500 text-white transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  <Plus className="h-5 w-5" aria-hidden />
                </span>
              </button>
              <div
                className={`px-5 pb-5 text-sm text-white/80 transition-[max-height] duration-300 ${
                  isOpen ? "max-h-40" : "max-h-0"
                }`}
              >
                {isOpen && <p>{item.answer}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
