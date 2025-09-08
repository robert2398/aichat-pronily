import React from 'react';
import { useNavigate } from 'react-router-dom';

function IconGem({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="gemGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF66C4" />
          <stop offset="1" stopColor="#FF2EA6" />
        </linearGradient>
      </defs>
      <path d="M10 1 L17 8 L10 19 L3 8 Z" fill="url(#gemGradient)"/>
      <path d="M10 1 L13.5 8 L6.5 8 Z" fill="#FFFFFF" opacity=".25"/>
      <path d="M3 8 L6.5 8 L10 19 Z" fill="#000000" opacity=".07"/>
      <path d="M17 8 L13.5 8 L10 19 Z" fill="#000000" opacity=".07"/>
    </svg>
  );
}

function IconWallet({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
      <path d="M22 12h-4a2 2 0 0 1 0-4h4" />
    </svg>
  );
}

export default function InsufficientCoinsModal({ open, onClose }) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleBuyCoins = () => {
    onClose();
    navigate('/buy-gems');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[#0b0710] rounded-2xl p-6 w-full max-w-md mx-4 ring-1 ring-white/10 text-white shadow-lg">
        {/* Header with icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-orange-500/20">
            <IconWallet className="w-6 h-6 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-white/90">Insufficient Coins</h3>
        </div>

        {/* Content */}
        <div className="text-white/70 mb-6">
          <p className="mb-3">
            You don't have enough Gems to complete this action. Purchase more Gems to continue enjoying our AI services.
          </p>
          <div className="flex items-center gap-2 text-sm text-orange-300 bg-orange-500/10 rounded-lg p-3">
            <IconGem className="w-4 h-4" />
            <span>Get Gems to unlock unlimited AI interactions!</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBuyCoins}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 bg-gradient-to-r from-pink-500 to-sky-400 text-[#0A011A] font-semibold hover:opacity-90 transition-opacity"
          >
            <IconGem className="w-4 h-4" />
            Buy Coins
          </button>
        </div>
      </div>
    </div>
  );
}
