import React, { useRef, useState, useEffect } from "react";

export default function Dropdown({ trigger, children, align = "right", onOpenChange }) {
  const ref = useRef();
  const [open, setOpen] = useState(false);

  // notify parent when `open` changes, but do it from an effect so the
  // parent setState won't run while this component is rendering.
  useEffect(() => {
    if (typeof onOpenChange === "function") onOpenChange(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) {
        setOpen(false);
        // do not call onOpenChange here synchronously; the effect above will
        // run after the state change and inform the parent.
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((s) => !s)}>{trigger}</div>
      {open && (
        <div className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-2 z-20`}>
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}
