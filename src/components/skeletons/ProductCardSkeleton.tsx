import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <article className="card flex flex-col justify-between h-full rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-2.5 sm:p-4">
      {/* Image Skeleton */}
      <Skeleton className="relative w-full aspect-square rounded-xl sm:rounded-2xl mb-2.5" />

      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-7 w-full rounded-xl mt-2" />
      </div>
    </article>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 mb-10">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};
