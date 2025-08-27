import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function VerifyConfirm() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const pricingId = search.get("pricing_id");
  const promo = search.get("promo");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h2 className="text-2xl font-bold mb-4">Payment Started</h2>
      <p className="mb-2">Pricing ID: <span className="font-semibold">{pricingId}</span></p>
      <p className="mb-4">Applied promo: <span className="font-semibold">{promo || 'none'}</span></p>
      <p className="text-sm text-white/70 mb-6">This is a placeholder for the industry-standard verification flow which would collect billing details and call the backend to create a payment session.</p>
      <div className="flex justify-center gap-3">
        <button onClick={() => navigate('/')} className="rounded-md border px-4 py-2">Return home</button>
      </div>
    </main>
  );
}
