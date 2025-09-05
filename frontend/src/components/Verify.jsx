import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Modal from "./ui/Modal";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pricingId = searchParams.get("pricing_id");
  const location = useLocation();

  const [promoList, setPromoList] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [selectedPromoKey, setSelectedPromoKey] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [pricingObj, setPricingObj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, title: '', message: '' });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const base = import.meta.env.VITE_API_BASE_URL || "";
    const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/subscription/get-promo";
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt.slice(0, 200)}`);
        }
        const txt = await r.text();
        try {
          return JSON.parse(txt);
        } catch (err) {
          throw new Error(`Invalid JSON response from ${url}: ${txt.slice(0,200)}`);
        }
      })
      .then((data) => mounted && setPromoList(data || []))
      .catch((err) => mounted && setError(err.message || "Failed to load promos"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  // fetch pricing details for pricingId so we can compute subtotal/discount
  useEffect(() => {
    if (!pricingId) return;
    let mounted = true;
    const base = import.meta.env.VITE_API_BASE_URL || "";
    const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/subscription/get-pricing";
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status} ${r.statusText} - ${txt.slice(0,200)}`);
        }
        const txt = await r.text();
        try {
          return JSON.parse(txt);
        } catch (err) {
          throw new Error(`Invalid JSON from ${url}`);
        }
      })
      .then((data) => {
        if (!mounted) return;
        const found = Array.isArray(data) ? data.find((p) => String(p.pricing_id) === String(pricingId)) : null;
        setPricingObj(found || null);
      })
      .catch((err) => {
        console.warn('Failed to fetch pricing for verify page', err);
      });
    return () => (mounted = false);
  }, [pricingId]);

  // when a promo is selected call the verify endpoint to check validity
  const applyPromo = (promo) => {
  // compute stable key for this promo (same logic as in render)
  const promoKey = promo?.promo_id ?? promo?.coupon ?? promo?.promo_name ?? null;
  setSelectedPromo(promo);
  setSelectedPromoKey(promoKey);
    setVerifyResult(null);
    if (!promo) return;
    const base = import.meta.env.VITE_API_BASE_URL || "";
    const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/subscription/verify-promo";

    // small debounce: cancel if user selects again quickly
    let mounted = true;
    setVerifyLoading(true);
  const payload = { promo_code: promo.coupon || promo.promo_name, pricing_id: pricingId || "" };
    const headers = { "Content-Type": "application/json" };
    // verify-promo requires a user access token; prefer token from localStorage
    const stored = localStorage.getItem("pronily:auth:token");
    if (!stored) {
      // redirect to signin and preserve current location as background so user returns to verify
      navigate('/signin', { state: { background: location } });
      return;
    }
    // normalize token and send as 'bearer <token>' to backend
    const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();
    headers["Authorization"] = `bearer ${tokenOnly}`;

    fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
      .then(async (r) => {
        const txt = await r.text().catch(() => "");
        try {
          const json = JSON.parse(txt || "{}");
          if (!r.ok) throw new Error(json?.reason || `HTTP ${r.status}`);
          return json;
        } catch (err) {
          throw new Error(`Invalid JSON response from ${url}: ${txt.slice(0,200)}`);
        }
      })
      .then((data) => {
        if (!mounted) return;
        const ok = !!data.valid;
        setVerifyResult({ ok, data });
        // If backend says promo is invalid, show a popup with the reason.
        // If valid, do not apply any additional frontend validation (no-op).
        if (!ok) {
          const reason = data && (data.reason || data.message || data.detail) || 'Promo is not valid.';
          setModal({ open: true, title: 'Promo invalid', message: reason });
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setVerifyResult({ ok: false, error: err.message });
      })
      .finally(() => mounted && setVerifyLoading(false));

    return () => (mounted = false);
  };

  const resetPromo = () => {
    // clear selected promo and verification state, revert to pricing discount
    setSelectedPromo(null);
  setSelectedPromoKey(null);
    setVerifyResult(null);
    setVerifyLoading(false);
    setModal({ open: false, title: '', message: '' });
  };

  const confirm = () => {
    // Create a checkout session on the backend and redirect to Stripe Checkout
    // set the loading state immediately so the UI shows processing feedback
    setCreateLoading(true);
    setCreateError(null);
    (async () => {
      setVerifyResult(null);
      setVerifyLoading(false);
      try {
        if (!pricingId) throw new Error("Missing pricing_id");
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/subscription/create-checkout-session";

        const stored = localStorage.getItem("pronily:auth:token");
        if (!stored) {
          navigate('/signin', { state: { background: location } });
          return;
        }
        const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();

        // compute discount and subtotal to include in checkout payload
  const priceValue = pricingObj ? Number(pricingObj.price || 0) : 0;
  // use promo only if it's been verified
  const promoPercentUsed = (selectedPromo && verifyResult && verifyResult.ok) ? Number(selectedPromo.percent_off || 0) : 0;
  const globalPercent = pricingObj ? Number(pricingObj.discount || 0) : 0;
  const percent = promoPercentUsed || globalPercent || 0;
  const discountApplied = +(priceValue * (percent / 100));
  const subtotalAtApply = +(priceValue - discountApplied);
  // discount_type: 'promo' when promo used, 'subscription' when global pricing discount used, otherwise 'none'
  const discount_type = promoPercentUsed ? 'promo' : (globalPercent ? 'subscription' : 'none');

              // prefer verified selected promo coupon, otherwise use coupon from pricing object (global pricing coupon)
              const couponToSend = (selectedPromo && verifyResult && verifyResult.ok) ? (selectedPromo.coupon || selectedPromo.promo_name) : (pricingObj ? (pricingObj.coupon || null) : null);
              const discountTypeToSend = (selectedPromo && verifyResult && verifyResult.ok) ? 'promo' : (pricingObj && pricingObj.coupon ? 'subscription' : 'none');

              const payload = {
                price_id: pricingId || null,
                discount_type: discountTypeToSend || null,
                coupon: couponToSend || null,
                currency: pricingObj ? (pricingObj.currency || null) : null,
                discount_applied: percent ? Number(discountApplied.toFixed(2)) : null,
                subtotal_at_apply: percent ? Number(subtotalAtApply.toFixed(2)) : null,
              };

  // createLoading is already set above (on click)

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `bearer ${tokenOnly}`,
          },
          body: JSON.stringify(payload),
        });

        const txt = await res.text().catch(() => "");
        let data = {};
        try {
          data = txt ? JSON.parse(txt) : {};
        } catch (err) {
          throw new Error(`Invalid JSON from server: ${txt.slice(0,200)}`);
        }

        if (!res.ok) {
          throw new Error(data?.message || data?.detail || data?.error || `HTTP ${res.status}`);
        }

        const sessionId = data && (data.session_id || data.sessionId || data.session);
        if (!sessionId) throw new Error("No session_id returned from server");

        // load stripe.js and redirect to checkout
        const stripePk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!stripePk) throw new Error("Missing Stripe publishable key");

        // ensure stripe.js is loaded
        const loadStripeJs = () => new Promise((resolve, reject) => {
          if (window.Stripe) return resolve(window.Stripe(stripePk));
          const script = document.createElement('script');
          script.src = 'https://js.stripe.com/v3/';
          script.onload = () => {
            if (!window.Stripe) return reject(new Error('Stripe.js failed to load'));
            resolve(window.Stripe(stripePk));
          };
          script.onerror = () => reject(new Error('Failed to load Stripe.js'));
          document.head.appendChild(script);
        });

        const stripe = await loadStripeJs();
        const redirectRes = await stripe.redirectToCheckout({ sessionId });
        if (redirectRes && redirectRes.error) {
          throw new Error(redirectRes.error.message || 'Stripe redirect failed');
        }
      } catch (err) {
        console.error('Checkout creation failed', err);
        setCreateError(err.message || String(err));
      } finally {
        setCreateLoading(false);
      }
    })();
  };

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h2 className="text-2xl font-bold mb-4">Verify &amp; Confirm</h2>
      

      <section className="rounded-lg border border-white/10 bg-white/[.03] p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Apply a promo</h3>
          {(selectedPromo || verifyResult) && (
            <button onClick={resetPromo} className="text-sm text-emerald-400 hover:underline">Reset</button>
          )}
        </div>
        {loading ? (
          <div>Loading promos…</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : promoList.length === 0 ? (
          <div className="text-sm text-white/70">No promos available</div>
        ) : (
          <div className="space-y-2">
            {promoList.map((p, idx) => {
              const promoKey = p.promo_id ?? p.coupon ?? p.promo_name ?? `promo-${idx}`;
              const inputId = `promo-${promoKey}`;
              const isSelected = selectedPromoKey ? String(selectedPromoKey) === String(promoKey) : false;
              return (
                <label key={promoKey} htmlFor={inputId} className={`flex items-center justify-between gap-4 rounded-md border p-3 ${isSelected ? "bg-emerald-700/20 border-emerald-500" : "bg-transparent"}`}>
                  <div>
                    <div className="font-semibold">{p.promo_name} <span className="ml-2 text-xs text-white/70">{p.coupon}</span></div>
                    <div className="text-sm text-white/70">{p.percent_off}% off — expires {new Date(p.expiry_date).toLocaleDateString()}</div>
                  </div>
                  <input
                    id={inputId}
                    type="radio"
                    name="promo"
                    value={p.promo_id ?? p.coupon ?? ''}
                    checked={!!isSelected}
                    onClick={() => applyPromo(p)}
                  />
                </label>
              );
            })}
          </div>
        )}
      </section>

      {/* verification result area */}
      <div className="mb-4">
        {verifyLoading ? (
          <div className="text-sm text-white/70">Checking promo…</div>
        ) : verifyResult ? (
          verifyResult.ok ? (
            <div className="rounded-md border border-emerald-600 bg-emerald-900/20 p-3 text-emerald-300">
              <div>Promo valid: {selectedPromo ? `${selectedPromo.coupon} — ${selectedPromo.percent_off}% off` : ''}</div>
            </div>
          ) : (
            <div className="rounded-md border border-red-600 bg-red-900/20 p-3 text-red-300">
              {verifyResult.data && verifyResult.data.reason ? verifyResult.data.reason : verifyResult.error || 'Promo is not valid.'}
            </div>
          )
        ) : null}
      </div>

      {/* Always show initial/rebill using verified promo or global discount */}
      {pricingObj && (
        (() => {
          const priceValue = Number(pricingObj.price || 0);
          // use promo only if it's been verified
          const promoPercentUsed = (selectedPromo && verifyResult && verifyResult.ok) ? Number(selectedPromo.percent_off || 0) : 0;
          const globalPercent = Number(pricingObj.discount || 0) || 0;
          const percent = promoPercentUsed || globalPercent || 0;
          const discountApplied = +(priceValue * (percent / 100));
          const subtotal = +(priceValue - discountApplied);
          const cycle = String(pricingObj.billing_cycle || '').toLowerCase();
          const period = cycle.includes('year') ? 'year' : cycle.includes('month') ? 'month' : 'period';
          return (
            <div className="mb-4 text-sm text-emerald-200">
              Initial payment: <span className="font-semibold">${subtotal.toFixed(2)}</span>
              &nbsp;&amp;&nbsp;Rebill: <span className="font-semibold">${priceValue.toFixed(2)}</span> every {period}
            </div>
          );
        })()
      )}

      <div className="flex gap-3">
      </div>

      <div className="flex gap-3">
        <button
          onClick={confirm}
          disabled={createLoading}
          aria-busy={createLoading ? 'true' : 'false'}
          className={`rounded-md px-4 py-2 font-semibold text-white flex items-center gap-2 ${createLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-indigo-600'}`}>
          {createLoading ? (
            // simple spinner using border animation
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true"></span>
          ) : null}
          {createLoading ? 'Processing…' : 'Confirm & Pay'}
        </button>
        <button onClick={() => navigate(-1)} className="rounded-md border px-4 py-2">Back</button>
      </div>
      <Modal open={modal.open} title={modal.title} onClose={() => setModal({ open: false, title: '', message: '' })}>
        {modal.message}
      </Modal>
    </main>
  );
}
