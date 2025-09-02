import React from 'react';

export default function Modal({ open, title, children, onClose, hideFooter = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[#0b0710] rounded-2xl p-6 w-full max-w-md mx-4 ring-1 ring-white/10 text-white shadow-lg">
        {title && <h3 className="text-lg font-semibold text-white/90 mb-2">{title}</h3>}
        <div className="text-white/70 mb-4">{children}</div>
        {!hideFooter && (
          <div className="text-right">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-gradient-to-r from-pink-500 to-sky-400 text-[#0A011A] font-semibold"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
