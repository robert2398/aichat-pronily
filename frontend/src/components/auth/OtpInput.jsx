import React, { useRef, useState } from "react";

export default function OtpInput({ length = 5, onComplete }){
  const [values, setValues] = useState(Array.from({length}, ()=>""));
  const refs = useRef([]);
  const setAt = (i, v) => {
    const next = [...values];
    next[i] = v;
    setValues(next);
    if (v && i < length - 1) refs.current[i+1]?.focus();
    if (next.every(x=>x !== '') && onComplete) onComplete(next.join(''));
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i>0) refs.current[i-1]?.focus();
  };
  return (
    <div className="flex flex-wrap gap-4">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el)=>{ if (el) refs.current[i] = el; }}
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e)=>{ const v = e.currentTarget.value.replace(/[^0-9]/g,'').slice(0,1); setAt(i, v); }}
          onKeyDown={(e)=>onKey(i,e)}
          className="h-16 w-16 rounded-2xl border border-white/15 bg-white/5 text-center text-xl font-semibold outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
        />
      ))}
    </div>
  );
}
