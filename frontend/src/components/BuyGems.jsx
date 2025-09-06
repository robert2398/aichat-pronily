import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function IconGemLarge({ className = 'w-12 h-12' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="gemGradLg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF66C4" />
          <stop offset="1" stopColor="#FF2EA6" />
        </linearGradient>
      </defs>
      <path d="M10 1 L17 8 L10 19 L3 8 Z" fill="url(#gemGradLg)"/>
      <path d="M10 1 L13.5 8 L6.5 8 Z" fill="#FFFFFF" opacity=".25"/>
      <path d="M3 8 L6.5 8 L10 19 Z" fill="#000000" opacity=".07"/>
      <path d="M17 8 L13.5 8 L10 19 Z" fill="#000000" opacity=".07"/>
    </svg>
  );
}

function PricePill({ price, oldPrice, suffix = ' USD' , discountPercent }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 flex items-center justify-between overflow-hidden">
      <div className="text-2xl font-bold">${price}<span className="text-base font-medium">{suffix}</span></div>
      <div className="flex items-center gap-2 text-xs">
        {typeof discountPercent === 'number' && discountPercent > 0 ? (
          <span className="rounded-md bg-orange-500/20 text-orange-300 px-2 py-0.5 font-semibold">
            {Math.round(discountPercent)}% off
          </span>
        ) : null}
        {oldPrice ? <span className="text-white/70 line-through">${oldPrice}</span> : null}
      </div>
      {/* soft glass blobs */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10" />
    </div>
  );
}

export default function BuyGems(){
  const [packages, setPackages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();

  // create checkout session helper at component scope so handlers can call it
  async function createCheckoutSession({ priceId = null, currency = 'USD', discountApplied = null, subtotalAtApply = 0, promoCode = null, coupon = null } = {}){
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const url = `${base.replace(/\/$/, '')}/subscription/create-checkout-session`;
    const payload = {
      price_id: priceId || null,
      promo_code: promoCode || null,
      discount_type: 'coin_purchase',
      coupon: coupon || null,
      currency: currency,
      discount_applied: discountApplied,
      subtotal_at_apply: subtotalAtApply,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: (function(){
        const headers = { 'Content-Type': 'application/json' };
        try {
          const stored = localStorage.getItem('pronily:auth:token') || import.meta.env.VITE_API_AUTH_TOKEN || null;
          if (stored) {
            const tokenOnly = stored.replace(/^Bearer\s+/i, '').trim();
            if (tokenOnly) headers['Authorization'] = `Bearer ${tokenOnly}`;
          }
        } catch (e) {
          // localStorage may not be available in some environments; ignore
        }
        return headers;
      })(),
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      throw new Error(`Create checkout failed: ${res.status} ${text || ''}`);
    }

    return res.json();
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.VITE_API_BASE_URL || '';
        const url = `${base.replace(/\/$/, '')}/subscription/get-coin-pricing`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        // Normalize response into array of packages. Accept either { packages: [] } or []
        let pkgs = Array.isArray(data) ? data : (data && data.packages ? data.packages : []);
        // If data is an object with numeric keys, convert to array
        if (!Array.isArray(pkgs) && typeof data === 'object') {
          pkgs = Object.values(data || {});
        }

        // If server returned empty, try to interpret top-level fields as single package
        if (!pkgs || pkgs.length === 0) {
          // attempt to extract common fields
          const fallback = data && (data.gems || data.amount || data.size) ? [data] : [];
          pkgs = fallback;
        }

        // map packages to normalized shape: { gems, price (original), discounted_price, discount, price_id, currency }
        const normalized = (pkgs || []).map((p) => {
          // prefer explicit coin_reward fields from backend
          const coinCandidate = p.coin_reward ?? p.coin_rewarded ?? p.coin_rewarded_amount ?? p.gems ?? p.amount ?? p.count ?? p.size ?? (p.gem_count ? Number(p.gem_count) : undefined);
          const coins = Number(coinCandidate ?? 0) || null;
          // price from backend is treated as the base/original price
          const originalPrice = Number(p.price ?? p.amount_usd ?? p.cost ?? p.original_price ?? 0) || 0;
          const discount = Number(p.discount ?? p.discount_percent ?? p.percent ?? 0) || 0;

          // calculate discounted price from original price and discount percent
          const discountedPrice = +(originalPrice * (1 - (discount / 100 || 0))).toFixed(2) || 0;

          return {
            gems: coins || 50,
            price: originalPrice, // keep original/base price
            discounted_price: discountedPrice,
            discount: discount || 0,
            id: p.id || p.sku || `${coins}-${originalPrice}`,
            price_id: p.pricing_id ?? p.pricingId ?? p.price_id ?? p.priceId ?? null,
            currency: p.currency ?? 'USD',
          };
        });

  // (removed nested duplicate createCheckoutSession) -- using component-scope helper

        if (mounted) setPackages(normalized);
      } catch (err) {
        console.warn('Failed to fetch coin pricing', err);
        if (mounted) {
          // fallback to default packages so the UI remains usable
          setPackages([ { gems:50, price:5, discounted_price:5, discount:0 }, { gems:100, price:10, discounted_price:10, discount:0 }, { gems:200, price:18, discounted_price:18, discount:0 } ]);
          setNotice('Could not load live pricing — showing default packages.');
          setError(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fallbackPackages = [ { gems:50, price:5, discounted_price:5, discount:0 }, { gems:100, price:10, discounted_price:10, discount:0 }, { gems:200, price:18, discounted_price:18, discount:0 } ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-2">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold">Purchase Gems</h1>
      </div>

      <section className="mx-auto rounded-3xl border border-white/10 bg-white/[.02] p-6 sm:p-10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="max-w-6xl mx-auto rounded-2xl bg-[#24182b]/80 p-6 sm:p-10">
          {loading ? (
            <div className="text-center py-8">Loading gems…</div>
          ) : (
            <>
              {notice ? <div className="text-center py-2 text-yellow-300">{notice}</div> : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(packages && packages.length > 0 ? packages : fallbackPackages).map((pkg, idx) => {
                const original = Number(pkg.price || 0);
                const discounted = Number(pkg.discounted_price ?? pkg.price ?? 0);
                const discount = Number(pkg.discount || 0);
                const gems = Number(pkg.gems || 50);
                const unit = gems ? (discounted / gems) : 0;

                // center card highlighted visually similar to Pricing page
                const highlight = idx === 1; // middle on 3

                return (
                  <div key={pkg.id || `${gems}-${original}`} className={`relative rounded-3xl border p-5 sm:p-6 shadow-md bg-[#0e0a16]/80 ${highlight ? 'border-pink-500/40 ring-1 ring-pink-500/20' : 'border-white/10'}`}>
                    {highlight && (
                      <span className="absolute -top-3 left-6 rounded-full bg-orange-500 text-white text-[11px] px-2 py-0.5 shadow">Best value</span>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0"><IconGemLarge className="w-12 h-12"/></div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold">{gems} Gems</div>
                        <div className="text-sm text-white/70 mt-1">One-time purchase</div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <PricePill price={discounted.toFixed(2)} oldPrice={discount > 0 && original ? original.toFixed(2) : null} suffix=" USD" discountPercent={discount} />
                    </div>

                    <div className="text-xs text-white/60 mt-3">${unit.toFixed(2)}/gem</div>

                    <ul className="mt-4 space-y-2 text-sm">
                      <li className="flex items-center gap-2"><span className="inline-grid h-4 w-4 place-items-center rounded-full border border-green-400 text-green-300 text-[10px]">✓</span>{gems} coins - Instant delivery</li>
                      <li className="flex items-center gap-2"><span className="inline-grid h-4 w-4 place-items-center rounded-full border border-green-400 text-green-300 text-[10px]">✓</span>Secure checkout</li>
                    </ul>

                    <button
                      className="mt-6 w-full rounded-xl bg-gradient-to-r from-pink-600 via-pink-500 to-indigo-500 px-4 py-2.5 text-center font-semibold text-white hover:opacity-95 disabled:opacity-60"
                      onClick={async () => {
                        if (creatingId) return;
                        setCreatingId(pkg.id || `${pkg.gems}-${pkg.price}`);
                        setError(null);
                        try {
                          const originalPrice = Number(pkg.price || 0);
                          const discountedPrice = Number(pkg.discounted_price ?? pkg.price ?? 0);
                          // discount amount as numeric difference (original - discounted). If no discount, 0
                          const discountAmount = Math.max(0, +(originalPrice - discountedPrice));

                          const session = await createCheckoutSession({
                            priceId: pkg.price_id || null,
                            currency: pkg.currency || 'USD',
                            discountApplied: discountAmount || null,
                            subtotalAtApply: discountedPrice,
                          });

                          // if backend returns a url to redirect to (Stripe checkout), use it
                          if (session && session.url) {
                            window.location.href = session.url;
                            return;
                          }

                          // if backend returned a session id (like { session_id: 'cs_...' }), use Stripe.js to redirect
                          const sessionId = session && (session.session_id || session.sessionId || session.id || session.session);
                          if (sessionId) {
                            const stripePk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
                            if (!stripePk) {
                              throw new Error('Missing Stripe publishable key');
                            }

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
                            return;
                          }

                          throw new Error('Invalid session response');
                        } catch (err) {
                          console.error(err);
                          setError(err.message || 'Checkout failed');
                        } finally {
                          setCreatingId(null);
                        }
                      }}
                      type="button"
                      disabled={!!creatingId}
                    >
                      {creatingId === (pkg.id || `${pkg.gems}-${pkg.price}`) ? 'Processing…' : `Buy for $${discounted.toFixed(2)}`}
                    </button>
                  </div>
                );
              })}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
