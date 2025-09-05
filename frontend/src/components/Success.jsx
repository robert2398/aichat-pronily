import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Success(){
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = search.get('session_id');

  useEffect(() => {
    // keep session id in console for debugging but don't show to users
    if (sessionId) console.info('Stripe session id:', sessionId);
    const t = setTimeout(() => navigate('/'), 1800);
    return () => clearTimeout(t);
  }, [navigate, sessionId]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Successful</h1>
      <p role="status" aria-live="polite" className="text-white/75 mb-6">Payment successful — redirecting to the homepage…</p>
      <div className="flex justify-center gap-3">
        <button onClick={() => navigate('/')} className="rounded-md border px-4 py-2">Return home</button>
      </div>
    </main>
  );
}
