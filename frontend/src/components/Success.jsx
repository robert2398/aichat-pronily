import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Success(){
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = search.get('session_id');

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Successful</h1>
      <p className="text-white/75 mb-6">Thank you — your subscription is active. Session id: <span className="font-mono text-sm">{sessionId}</span></p>
      <div className="flex justify-center gap-3">
        <button onClick={() => navigate('/')} className="rounded-md border px-4 py-2">Return home</button>
      </div>
    </main>
  );
}
