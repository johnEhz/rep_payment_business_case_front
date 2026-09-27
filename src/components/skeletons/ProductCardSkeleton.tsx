import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <article className="card flex flex-col h-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 sm:p-4">
      {/* Image Skeleton */}
      <Skeleton className="relative w-full aspect-[4/3] rounded-xl mb-3" />

      {/* Content */}
      <div className="flex-1 flex flex-col px-1">
        {/* Chips Skeleton */}
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Title Skeleton */}
        <Skeleton className="h-5 w-4/5 mb-1.5 rounded-md" />
        <Skeleton className="h-4 w-3/5 mb-3 rounded-md" />

        {/* Description Skeleton */}
        <div className="space-y-1.5 mb-4 flex-1">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
        </div>

        {/* Price & Stock Skeleton */}
        <div className="flex items-end justify-between mb-3 pt-2 border-t border-gray-50">
          <div>
            <Skeleton className="h-3 w-10 mb-1 rounded" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Button Skeleton */}
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </article>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 mb-10">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};
