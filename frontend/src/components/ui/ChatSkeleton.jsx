import React from 'react';
import Skeleton from './Skeleton';

export default function ChatSkeleton() {
  return (
    <div className="w-full h-full flex">
      <div className="w-1/3 p-4">
        <Skeleton className="h-8 mb-4" />
        <div className="grid gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-10 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
        </div>
      </div>
      <div className="w-1/3 p-4">
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
