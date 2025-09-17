import React from 'react';

export default function Skeleton({ className = 'w-full h-48', children = null }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded ${className}`}>{children}</div>
  );
}
