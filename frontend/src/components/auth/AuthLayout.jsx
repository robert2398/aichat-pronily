import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

// AuthLayout renders its panel as a floating modal by default.
// Pass `overlay={false}` to render only the inner panel (non-modal).
export default function AuthLayout({ children, overlay = true }){
  const panel = (
    <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-white/[.03] p-8 sm:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
      {children}
    </div>
  );

  if (!overlay) return panel;

  const navigate = useNavigate();
  const location = useLocation();
  const background = location.state && location.state.background;

  const closeModal = () => {
    if (background && background.pathname) {
      // Navigate to the saved background location and replace the current entry
      navigate(background.pathname + (background.search || ""), { replace: true });
    } else {
      // default fallback
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden
      />
      {/* Centered panel container */}
      <div className="relative w-full max-w-3xl mx-auto" onClick={(e)=>e.stopPropagation()}>
        {panel}
      </div>
    </div>
  );
}
