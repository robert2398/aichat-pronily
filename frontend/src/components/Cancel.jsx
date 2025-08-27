import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Cancel(){
  const navigate = useNavigate();
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
      <p className="text-white/75 mb-6">Your payment was not completed. You can try again or contact support if you think this is an error.</p>
      <div className="flex justify-center gap-3">
        <button onClick={() => navigate('/pricing')} className="rounded-md border px-4 py-2">Back to pricing</button>
      </div>
    </main>
  );
}
