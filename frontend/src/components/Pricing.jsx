import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, X, ChevronLeft } from "lucide-react";

function SegmentedBilling({ value, onChange, maxAnnualPercent }) {
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
        {typeof maxAnnualPercent === 'number' && maxAnnualPercent > 0 ? (
          <span className="ml-1 rounded-full bg-white/20 text-[10px] px-1.5 py-[2px]">
            {maxAnnualPercent}% off
          </span>
        ) : null}
      </button>
    </div>
  );
}

function PricePill({ price, oldPrice, suffix = "/mo", discountPercent }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 flex items-center justify-between overflow-hidden">
      <div className="text-2xl font-bold">${price}<span className="text-base font-medium">{suffix}</span></div>
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-md bg-orange-500/20 text-orange-300 px-2 py-0.5 font-semibold">
          {typeof discountPercent === 'number' ? `${Math.round(discountPercent)}% off` : '31% off'}
        </span>
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
  discount,
}) {
  return (
    <div
      className={`relative rounded-3xl border bg-[#0e0a16]/80 p-5 sm:p-6 shadow-md ${
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

      <h3 className="text-xl font-semibold mb-4">{title}</h3>
  <PricePill price={priceCurrent} oldPrice={priceOld} suffix={per} discountPercent={discount} />
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
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [billing, setBilling] = useState("monthly"); // 'monthly' | 'annual'
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // compute maximum yearly discount percentage across plan pairs
  const maxAnnualPercent = useMemo(() => {
    if (!plans || plans.length === 0) return 0;
    // group plans by plan_name (or plan_id) to find monthly vs yearly pairs
    const groups = {};
    for (const p of plans) {
      const key = (p.plan_name || p.plan_id || '') + '::' + (p.currency || '');
      groups[key] = groups[key] || [];
      groups[key].push(p);
    }

    let max = 0;
    for (const key of Object.keys(groups)) {
      const items = groups[key];
      const monthly = items.find(i => /month/i.test(i.billing_cycle || ''));
      const yearly = items.find(i => /year/i.test(i.billing_cycle || ''));
      if (monthly && yearly) {
        // calculate percent: (yearly - monthly*12) relative to monthly*12
        const monthlyTotal = Number(monthly.price || 0) * 12;
        const yearlyPrice = Number(yearly.price || 0);
        if (monthlyTotal > 0 && monthlyTotal > yearlyPrice) {
          const percent = Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
          if (percent > max) max = percent;
        }
      }
    }

    return max;
  }, [plans]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const base = import.meta.env.VITE_API_BASE_URL || "";
    const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/subscription/get-pricing";
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt.slice(0, 200)}`);
        }
        // attempt JSON parse, but provide helpful error if HTML is returned
        const txt = await r.text();
        try {
          return JSON.parse(txt);
        } catch (err) {
          throw new Error(`Invalid JSON response from ${url}: ${txt.slice(0, 200)}`);
        }
      })
      .then((data) => {
        if (!mounted) return;
        // keep only active
        const active = (data || []).filter((p) => p.status === "Active");
        setPlans(active);
      })
      .catch((err) => {
        console.error("Failed to load pricing", err);
        if (mounted) setError(err.message || "Failed to load");
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const goCheckout = (pricing) => {
    // pricing: a pricing object from the API
    if (!pricing || !pricing.pricing_id) {
      console.warn("Missing pricing selected");
      return;
    }
    // require user to be signed in
    const stored = localStorage.getItem("pronily:auth:token");
    if (!stored) {
      // redirect to signin and preserve current location as background so modal returns here
      navigate('/signin', { state: { background: location } });
      return;
    }
    // route to verify page where user can pick promo and confirm
    navigate(`/verify?pricing_id=${encodeURIComponent(pricing.pricing_id)}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-2">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold">Pricing &amp; Membership</h1>
        <div className="mt-3 flex items-center justify-center">
          <SegmentedBilling value={billing} onChange={setBilling} maxAnnualPercent={maxAnnualPercent} />
        </div>
      </div>

      {/* large rounded hero panel that holds cards */}
      <section className="mx-auto rounded-3xl border border-white/10 bg-white/[.02] p-6 sm:p-10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="max-w-6xl mx-auto rounded-2xl bg-[#24182b]/80 p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-8">Loading plans…</div>
          ) : error ? (
            <div className="col-span-3 text-center py-8 text-red-400">{error}</div>
          ) : (
            // dedupe by pricing_id, filter strictly by billing_cycle, and sort by price
            (() => {
              const norm = (s = "") => String(s).toLowerCase();
              const isAnnualSelected = billing === "annual";

              // filter strictly by billing_cycle and sort by price
              const filtered = (plans || []).filter((pl) => {
                const c = norm(pl.billing_cycle || "");
                if (isAnnualSelected) return c.includes("year") || c.includes("annual") || c.includes("yearly");
                return c.includes("month");
              });

              filtered.sort((a, b) => (Number(a.price || 0) - Number(b.price || 0)));

              return filtered.map((p, idx) => {
                // backend price is original (pre-discount) amount
                const originalPrice = Number(p.price || 0);
                const discountPct = Number(p.discount || 0) || 0;
                const discountedPrice = originalPrice * (1 - discountPct / 100);
                const priceCurrent = discountedPrice.toFixed(2);
                const priceOld = originalPrice ? originalPrice.toFixed(2) : null;
                const per = isAnnualSelected ? "/yr" : "/mo";
                const features = [
                  { ok: true, text: `${p.coin_reward} coins per ${p.billing_cycle.toLowerCase()}` },
                  { ok: true, text: `${p.plan_name} tier` },
                ];

                // center card highlighted visually similar to Figma
                const highlight = idx === Math.floor(filtered.length / 2);

                return (
                  <div key={p.pricing_id} className={`transition-transform`}>
                    <PlanCard
                      title={p.plan_name}
                      highlight={highlight}
                      priceCurrent={priceCurrent}
                      priceOld={priceOld}
                      per={per}
                      blurb={`${p.coin_reward} coins - ${p.billing_cycle}`}
                      features={features}
                      onPay={() => goCheckout(p)}
                      discount={p.discount}
                    />
                  </div>
                );
              });
            })()
          )}
          </div>
        </div>
      </section>
    </main>
  );
}
