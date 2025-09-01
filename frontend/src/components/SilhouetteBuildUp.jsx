import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple, lightweight silhouette build-up animation driven by `step` prop.
// Steps: parse -> style -> pose -> render -> rig -> done
export default function SilhouetteBuildUp({ step = 'parse' }) {
  const steps = ['parse', 'style', 'pose', 'render', 'rig'];
  const blurByStep = { parse: 14, style: 10, pose: 6, render: 2, rig: 0, done: 0 };

  // respects reduced motion
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    // two static plates crossfade for reduced motion
    return (
      <div className="relative flex items-center justify-center min-h-[420px] bg-gradient-to-br from-[#0f1021] via-[#302b63] to-[#24243e] rounded-2xl p-6">
        <div className="w-[320px] h-[420px] bg-white/6 rounded-xl flex items-center justify-center">
          <div className="text-white/80 text-sm">Preparing character…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-[420px] bg-gradient-to-br from-[#0f1021] via-[#302b63] to-[#24243e] rounded-2xl p-6">
      {/* Back particles (subtle) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/18"
            style={{ left: `${(i * 97) % 100}%`, top: `${(i * 53) % 100}%` }}
            animate={{ y: [0, -6, 0], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2 + i * 0.06, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Character SVG */}
      <motion.svg
        width="320"
        height="420"
        viewBox="0 0 320 420"
        initial={false}
        animate={{ filter: `blur(${blurByStep[step] ?? 8}px)`, scale: step === 'pose' ? 1.03 : 1 }}
        transition={{ filter: { duration: 0.35 }, scale: { duration: 0.32, type: 'spring', stiffness: 170, damping: 22 } }}
      >
        <motion.g
          animate={{ scale: [0.99, 1.01, 0.99], y: [0, -2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Rough silhouette */}
          <path
            d="M160 40c60 0 88 44 88 88s-24 72-40 90c-12 14-10 36-10 48 0 24-24 40-38 40s-38-16-38-40c0-12 2-34-10-48-16-18-40-46-40-90S100 40 160 40Z"
            fill="rgba(255,255,255,0.72)"
          />
        </motion.g>

        {/* Ink stroke draws on when render+ */}
        {(step === 'render' || step === 'rig' || step === 'done') && (
          <motion.path
            d="M90 140 C120 90, 200 90, 230 140"
            fill="none"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}

        {/* Eyes/hair snap at rig */}
        {(step === 'rig' || step === 'done') && (
          <motion.g initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 170, damping: 20, duration: 0.22 }}>
            <circle cx="140" cy="150" r="6" fill="white" />
            <circle cx="180" cy="150" r="6" fill="white" />
            <path d="M120 120 C150 100, 190 100, 210 120" stroke="white" strokeWidth="3" fill="none" />
          </motion.g>
        )}
      </motion.svg>

      {/* Stepper */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-2">
        {steps.map((s, idx) => (
          <motion.div
            key={s}
            className={`w-2.5 h-2.5 rounded-full ${step === s || (step === 'done' && idx === steps.length - 1) ? 'bg-white' : 'bg-white/30'}`}
            animate={step === s ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 0.18 }}
          />
        ))}
      </div>

      {/* Caption */}
      <div className="absolute bottom-4 text-white/80 text-sm">
        {step === 'parse' && 'Parsing prompt…'}
        {step === 'style' && 'Locking style…'}
        {step === 'pose' && 'Choosing pose…'}
        {step === 'render' && 'Inking & color…'}
        {step === 'rig' && 'Rigging character…'}
        {step === 'done' && 'All set!'}
      </div>
    </div>
  );
}
