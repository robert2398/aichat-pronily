import React, { useState } from "react";
import { Play, Heart, Check } from "lucide-react";

/**
 * PreviewCard
 * Props:
 * - variant: 'image' | 'video' (default 'image')
 * - src: string (optional image src; falls back to gradient)
 * - alt: string
 * - name: string
 * - likes: string | number
 * - size: 'sm' | 'md' | 'lg' (controls height; default 'md')
 * - badge: string (optional top-right label e.g. "NEW")
 * - selected: boolean (shows a check overlay)
 * - loading: boolean (skeleton state)
 * - onClick: () => void
 */
export default function PreviewCard({
  variant = "image",
  src = "",
  alt = "",
  name = "",
  likes = "",
  size = "md",
  badge,
  selected = false,
  loading = false,
  onClick,
}) {
  const [imgErr, setImgErr] = useState(false);

  const heightCls =
    size === "sm" ? "h-36" : size === "lg" ? "h-64" : "h-48";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-xl border bg-white/[.02] shadow-sm text-left
        ${selected ? "border-pink-500/70 ring-1 ring-pink-500/30" : "border-white/8 hover:border-white/12"}`}
      aria-label={name || "Preview item"}
    >
      {/* Media area */}
      <div className={`relative w-full ${heightCls}`}>
        {/* Image or fallback */}
        {loading ? (
          <div className="absolute inset-0 animate-pulse bg-white/5" />
        ) : src && !imgErr ? (
          <img
            src={src}
            alt={alt || name || ""}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgErr(true)}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0)_70%)]" />
        )}

        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/18" />

        {/* Video play indicator */}
        {variant === "video" && !loading && (
          <div className="absolute left-4 top-4 grid place-items-center h-10 w-10 rounded-full bg-white/90 shadow">
            <Play className="h-5 w-5 text-[#1b1426]" aria-hidden />
          </div>
        )}

        {/* Badge (e.g., NEW) */}
        {badge && !loading && (
          <div className="absolute right-3 top-3 rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white/90">
            {badge}
          </div>
        )}

        {/* Selected check */}
        {selected && (
          <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-pink-500 shadow">
            <Check className="h-4 w-4 text-white" aria-hidden />
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="flex items-center justify-between rounded-xl bg-[#1b1426]/85 px-3 py-2 ring-1 ring-inset ring-white/10 backdrop-blur">
          <h4 className="line-clamp-1 text-sm font-semibold text-white">
            {name || (loading ? "Loading…" : "Untitled")}
          </h4>
          <span className="inline-flex items-center gap-1 text-xs text-white/90">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            {String(likes ?? "")}
          </span>
        </div>
      </div>
    </button>
  );
}
