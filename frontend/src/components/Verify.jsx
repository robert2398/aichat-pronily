import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pricingId = searchParams.get("pricing_id");
  const location = useLocation();

  const [promoList, setPromoList] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [pricingObj, setPricingObj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setSelectedPromo(promo);
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
        setVerifyResult({ ok: !!data.valid, data });
      })
      .catch((err) => {
        if (!mounted) return;
        setVerifyResult({ ok: false, error: err.message });
      })
      .finally(() => mounted && setVerifyLoading(false));

    return () => (mounted = false);
  };

  const confirm = () => {
    // Create a checkout session on the backend and redirect to Stripe Checkout
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
        const percent = selectedPromo ? Number(selectedPromo.percent_off || 0) : 0;
        const discountApplied = +(priceValue * (percent / 100));
        const subtotalAtApply = +(priceValue - discountApplied);

        const payload = {
          price_id: pricingId,
          coupon: selectedPromo ? (selectedPromo.coupon || selectedPromo.promo_name) : "",
          discount_applied: Number(discountApplied.toFixed(2)),
          subtotal_at_apply: Number(subtotalAtApply.toFixed(2)),
        };

        setCreateLoading(true);
        setCreateError(null);

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
      <p className="text-sm text-white/70 mb-4">Pricing: <span className="font-semibold">{pricingId || "(missing)"}</span></p>

      <section className="rounded-lg border border-white/10 bg-white/[.03] p-4 mb-4">
        <h3 className="font-semibold mb-2">Apply a promo</h3>
        {loading ? (
          <div>Loading promos…</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : promoList.length === 0 ? (
          <div className="text-sm text-white/70">No promos available</div>
        ) : (
          <div className="space-y-2">
            {promoList.map((p) => (
              <label key={p.promo_id} className={`flex items-center justify-between gap-4 rounded-md border p-3 ${selectedPromo && selectedPromo.promo_id === p.promo_id ? "bg-pink-700/20 border-pink-500" : "bg-transparent"}`}>
                <div>
                  <div className="font-semibold">{p.promo_name} <span className="ml-2 text-xs text-white/70">{p.coupon}</span></div>
                  <div className="text-sm text-white/70">{p.percent_off}% off — expires {new Date(p.expiry_date).toLocaleDateString()}</div>
                </div>
                <input type="radio" name="promo" checked={selectedPromo && selectedPromo.promo_id === p.promo_id} onChange={() => applyPromo(p)} />
              </label>
            ))}
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
              {pricingObj && selectedPromo && (
                (() => {
                  const priceValue = Number(pricingObj.price || 0);
                  const percent = Number(selectedPromo.percent_off || 0);
                  const discountApplied = +(priceValue * (percent / 100));
                  const subtotal = +(priceValue - discountApplied);
                  return (
                    <div className="mt-2 text-sm text-emerald-200">Sub Total after discount: <span className="font-semibold">${subtotal.toFixed(2)}</span></div>
                  );
                })()
              )}
            </div>
          ) : (
            <div className="rounded-md border border-red-600 bg-red-900/20 p-3 text-red-300">
              {verifyResult.data && verifyResult.data.reason ? verifyResult.data.reason : verifyResult.error || 'Promo is not valid.'}
            </div>
          )
        ) : null}
      </div>

      <div className="flex gap-3">
        <button onClick={confirm} className="rounded-md bg-gradient-to-r from-pink-600 to-indigo-600 px-4 py-2 font-semibold">Confirm &amp; Pay</button>
        <button onClick={() => navigate(-1)} className="rounded-md border px-4 py-2">Back</button>
      </div>
    </main>
  );
}
