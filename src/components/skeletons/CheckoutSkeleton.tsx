import React from 'react';
import { Skeleton } from '../ui/Skeleton';

/**
 * Skeleton for the real-time shipping and fees breakdown inside Checkout sidebar
 */
export const BreakdownSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 py-1">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3.5 w-28 rounded" />
        <Skeleton className="h-3.5 w-16 rounded" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-3.5 w-32 rounded" />
        <Skeleton className="h-3.5 w-16 rounded" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-3.5 w-20 rounded" />
      </div>
      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-6 w-24 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Full page skeleton for Summary Page (Step 3)
 */
export const SummaryPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="card p-4 sm:p-5 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
          <Skeleton className="h-4 w-32 rounded mb-2" />
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
          <Skeleton className="h-3.5 w-2/3 rounded" />
        </div>
        <div className="card p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
          <Skeleton className="h-4 w-32 rounded mb-2" />
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-3/4 rounded" />
          <Skeleton className="h-3.5 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
};
