import { Check } from "lucide-react";

export default function PricingPlans() {
  console.log("PricingPlans render");
  const features = [
    "3 -5 business days delivery",
    "Unlimited requests & revisions",
    "Dev ready Figma files",
    "Unlimited Stock Photos",
  ];
  const plans = [
    {
      title: "Premium +",
      price: "3,499",
      highlight: false,
      blurb:
        "Ideal choice for agencies that are committed to providing top-notch service",
      cta: "Get Started",
    },
    {
      title: "Premium",
      price: "2,999",
      highlight: true,
      badge: "POPULAR",
      blurb:
        "Ideal for burgeoning startups seeking continuous design assistance.",
      cta: "Get Started",
    },
    {
      title: "Premium +",
      price: "3,499",
      highlight: false,
      blurb:
        "Ideal choice for agencies that are committed to providing top-notch service",
      cta: "Get Started",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16" id="pricing">
      <h3 className="text-center text-3xl font-semibold tracking-tight">Our Plans</h3>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((p, idx) => (
          <div
            key={idx}
            className={
              p.highlight
                ? "relative rounded-3xl border border-white/10 bg-gradient-to-br from-pink-400 via-fuchsia-500 to-sky-500 p-6 sm:p-8 text-white shadow"
                : "relative rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-8 text-white/90"
            }
          >
            <div className={p.highlight ? "opacity-95" : "opacity-100"}>
              <h4 className="text-2xl font-semibold tracking-tight">
                {p.title}
                {p.highlight && (
                  <span className="ml-3 align-middle rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{p.badge}</span>
                )}
              </h4>
              <p className="mt-2 text-sm max-w-prose text-white/85">{p.blurb}</p>
              <div className="my-5 h-px w-full bg-white/15" />
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">${p.price}</span>
                <span className="mb-1 text-sm">/mo</span>
              </div>
              <p className="mt-1 text-xs text-white/85">Pause or cancel anytime.<br />7 days money-back guarantee</p>
              <ul className="mt-5 space-y-3 text-sm">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="text-white/90">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {p.highlight ? (
                  <a className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#1b1426] shadow hover:opacity-95" href="#start" onClick={() => console.log("Pricing CTA click", p.title) }>
                    {p.cta}
                  </a>
                ) : (
                  <a className="inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 hover:bg-white/5" href="#start" onClick={() => console.log("Pricing CTA click", p.title) }>
                    {p.cta}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
