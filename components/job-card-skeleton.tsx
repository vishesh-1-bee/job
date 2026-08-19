"use client";

import React from "react";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-100 rounded-md ${className || ""}`} />
  );
}

export default function JobCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-slate-100 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="h-3 w-1/3" />
          <div className="flex gap-2 mt-1">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        </div>
        <SkeletonLine className="h-6 w-20 rounded-lg shrink-0" />
      </div>

      {/* Tags */}
      <div className="flex gap-1.5">
        {[40, 56, 44, 52].map((w, i) => (
          <SkeletonLine key={i} className={`h-5 w-${w === 40 ? '10' : w === 56 ? '14' : w === 44 ? '11' : '13'} rounded-full`} />
        ))}
      </div>

      {/* Score bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-3 w-8" />
        </div>
        <SkeletonLine className="h-1.5 w-full rounded-full" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-4/5" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <SkeletonLine className="h-9 flex-1 rounded-xl" />
        <SkeletonLine className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
}
