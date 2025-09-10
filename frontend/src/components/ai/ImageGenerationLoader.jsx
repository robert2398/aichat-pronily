import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

// Circular percent loader that increases over time to 100%.
// Accepts optional `step` prop to reflect current backend stage (parse/style/pose/render/rig/done).
export default function ImageGenerationLoader({ step = 'parse' }) {
  const [pct, setPct] = useState(0);
  const intervalRef = useRef(null);
  const mounted = useRef(true);

  // base pace for stages (relative multipliers)
  const baseFor = (s) => {
    switch (s) {
      case 'parse':
        return 0.8; // quick startup
      case 'style':
        return 1.2;
      case 'pose':
        return 1.0;
      case 'render':
        return 0.9;
      case 'rig':
        return 0.6; // tends to be slower
      case 'done':
        return 2.5; // when finished, accelerate to 100
      default:
        return 1.0;
    }
  };

  useEffect(() => {
    mounted.current = true;
    // tick every 180-220ms for a smooth, visible progression
    const tickInterval = 200;

    const tick = () => {
      setPct((prev) => {
        // if already at 100, stop
        if (prev >= 100) return 100;

        const finished = step === 'done';

        // If backend not finished, never progress past 99%.
        const cap = finished ? 100 : 99;

        if (!finished && prev >= cap) return prev;

        // compute delta: large at start, smaller near cap
        const base = baseFor(step);
        // progress factor decreases as we approach the cap
        const remainRatio = Math.max(0, (cap - prev) / cap);
        // nonlinear easing: faster early, slow later
        const easing = Math.pow(remainRatio, 1.25);
        // small random jitter to avoid exact linear feeling
        const jitter = 0.7 + Math.random() * 0.8;

        // delta scaled by base, easing and tick time
        const delta = Math.max(0.2, base * easing * jitter);

        // when finished, accelerate towards 100 (use proportional step)
        if (finished) {
          const finishDelta = Math.max(1, (100 - prev) * 0.25);
          return Math.min(100, +(prev + finishDelta).toFixed(2));
        }

        const next = Math.min(cap, +(prev + delta).toFixed(2));
        return next;
      });
    };

    // start immediately and continue on interval
    tick();
    intervalRef.current = setInterval(tick, tickInterval);

    return () => {
      mounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // only re-run when stage changes so pace adapts
  }, [step]);

  const size = 140;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="g1" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <motion.circle
            r={radius}
            fill="none"
            stroke="url(#g1)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90)`}
            style={{ transition: 'stroke-dasharray 0.2s linear' }}
          />
        </g>
      </svg>
      <div className="text-white text-2xl font-semibold">{Math.round(pct)}%</div>
      <div className="text-sm text-white/70">Creating your AI — {step}</div>
    </div>
  );
}
