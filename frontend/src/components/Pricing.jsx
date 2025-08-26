import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";

function SegmentedBilling({ value, onChange }) {
  const isAnnual = value === "annual";
  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[.04] p-1">
      <button
        className={`px-4 py-1.5 rounded-full text-sm transition ${
          !isAnnual ? "bg-pink-600 text-white" : "text-white/80 hover:text-white"
        }`}
        onClick={() => onChange("monthly")}
        type="button"
      >
        Monthly
      </button>
      <button
        className={`relative px-4 py-1.5 rounded-full text-sm transition flex items-center gap-1 ${
          isAnnual ? "bg-pink-600 text-white" : "text-white/80 hover:text-white"
        }`}
        onClick={() => onChange("annual")}
        type="button"
      >
        Annual
        <span className="ml-1 rounded-full bg-white/20 text-[10px] px-1.5 py-[2px]">
          36% off
        </span>
      </button>
    </div>
  );
}

function PricePill({ price, oldPrice, suffix = "/mo" }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 flex items-center justify-between overflow-hidden">
      <div className="text-2xl font-bold">${price}<span className="text-base font-medium">{suffix}</span></div>
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-md bg-orange-500/20 text-orange-300 px-2 py-0.5 font-semibold">31% off</span>
        {oldPrice ? <span className="text-white/70 line-through">${oldPrice}</span> : null}
      </div>
      {/* soft glass blobs */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10" />
    </div>
  );
}

function Feature({ ok, children }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        className={`mt-0.5 grid h-4 w-4 place-items-center rounded-full border ${
          ok ? "border-green-400 text-green-300" : "border-white/20 text-white/40"
        }`}
      >
        {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <span className={`${ok ? "text-white/90" : "text-white/60"}`}>{children}</span>
    </li>
  );
}

function PlanCard({
  title,
  highlight = false,
  priceCurrent,
  priceOld,
  per = "/mo",
  blurb,
  features,
  onPay,
}) {
  return (
    <div
      className={`relative rounded-3xl border bg-white/[.03] p-5 sm:p-6 shadow-md ${
        highlight
          ? "border-pink-500/40 ring-1 ring-pink-500/20"
          : "border-white/10"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-6 rounded-full bg-orange-500 text-white text-[11px] px-2 py-0.5 shadow">
          Most popular
        </span>
      )}

      <div className="rounded-2xl bg-[#0e0a16]/80 p-5 ring-1 ring-white/10">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <PricePill price={priceCurrent} oldPrice={priceOld} suffix={per} />
        {blurb && (
          <p className="mt-2 text-sm text-white/70">
            {blurb}
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {features.map((f, i) => (
            <Feature key={i} ok={f.ok}>
              {f.text}
            </Feature>
          ))}
        </ul>

        <button
          onClick={onPay}
          type="button"
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-pink-600 via-pink-500 to-indigo-500 px-4 py-2.5 text-center font-semibold text-white hover:opacity-95"
        >
          Pay
        </button>
      </div>
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly"); // 'monthly' | 'annual'

  const plans = useMemo(() => {
    const per = billing === "annual" ? "/yr" : "/mo";
    // You can customize annual prices if you want deeper discounts;
    // here we just multiply for the "total" copy and keep per-unit the same.
    return [
      {
        key: "premium-left",
        title: "Premium",
        priceCurrent: "6.99",
        priceOld: "9.99",
        per,
        blurb:
          billing === "annual"
            ? "For a total 83.88"
            : "For a total 83.88",
        highlight: false,
        features: [
          { ok: true,  text: "6000 credits per month" },
          { ok: true,  text: "4k memory for smooth chat experience" },
          { ok: true,  text: "Character image generation" },
          { ok: true,  text: "20 credits for each AI-assisted conversation" },
          { ok: false, text: "Deluxe voice chat response" },
          { ok: false, text: "Picture generation from chat context" },
        ],
      },
      {
        key: "deluxe",
        title: "Deluxe",
        priceCurrent: "12.99",
        priceOld: "19.99",
        per,
        blurb:
          billing === "annual"
            ? "For a total 155.88"
            : "For a total 155.88",
        highlight: true,
        features: [
          { ok: true, text: "No need for credits" },
          { ok: true, text: "16k memory for immersive chat experience" },
          { ok: true, text: "Character image generation" },
          { ok: true, text: "Unlimited AI-assisted conversations" },
          { ok: true, text: "Deluxe voice chat response" },
          { ok: true, text: "Picture generation from chat context" },
        ],
      },
      {
        key: "premium-right",
        title: "Premium",
        priceCurrent: "6.99",
        priceOld: "9.99",
        per,
        blurb:
          billing === "annual"
            ? "For a total 83.88"
            : "For a total 83.88",
        highlight: false,
        features: [
          { ok: true,  text: "6000 credits per month" },
          { ok: true,  text: "4k memory for smooth chat experience" },
          { ok: true,  text: "Character image generation" },
          { ok: true,  text: "20 credits for each AI-assisted conversation" },
          { ok: false, text: "Deluxe voice chat response" },
          { ok: false, text: "Picture generation from chat context" },
        ],
      },
    ];
  }, [billing]);

  const goCheckout = (planKey) => {
    navigate(`/checkout?plan=${planKey}&billing=${billing}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <section className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold">Pricing &amp; Membership</h1>
        <div className="mt-4">
          <SegmentedBilling value={billing} onChange={setBilling} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[.03] p-5 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.key}
              className={`transition-transform ${p.highlight ? "md:scale-105" : ""}`}
            >
              <PlanCard
                title={p.title}
                highlight={p.highlight}
                priceCurrent={p.priceCurrent}
                priceOld={p.priceOld}
                per={p.per}
                blurb={p.blurb}
                features={p.features}
                onPay={() => goCheckout(p.key)}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
