import React from "react";

export default function DividerOr(){
  return (
    <div className="flex items-center gap-4 text-white/70">
      <div className="h-px flex-1 bg-white/15" />
      <span className="text-sm">Or</span>
      <div className="h-px flex-1 bg-white/15" />
    </div>
  );
}
