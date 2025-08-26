import React, { useRef, useState, useEffect } from "react";

export default function Dropdown({ trigger, children, align = "right" }) {
  const ref = useRef();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
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
