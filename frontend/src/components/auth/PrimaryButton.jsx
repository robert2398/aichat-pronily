import React from "react";

export default function PrimaryButton({ children, onClick }){
  return (
    <button onClick={onClick} className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-sky-500 px-5 py-4 text-base font-semibold shadow hover:opacity-95">
      {children}
    </button>
  );
}
