import React from "react";

export default function Field({ label, type = 'text', placeholder = '', value = '', onChange = () => {}, rightIcon, onRightIconClick }){
  return (
    <div>
      <label className="block text-sm mb-2 text-white/80">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e)=>onChange(e.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 pr-12 text-base text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
        />
        {rightIcon && (
          <button type="button" onClick={onRightIconClick} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white">
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  )
}
