import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { AppHeader } from '../AppHeader';

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 md:py-8 w-full" aria-busy="true">
        <span className="sr-only">Cargando detalles del producto...</span>
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-16 rounded" />
          <span className="text-gray-300">/</span>
          <Skeleton className="h-4 w-24 rounded" />
          <span className="text-gray-300">/</span>
          <Skeleton className="h-4 w-36 rounded" />
        </div>

        {/* 2-Column Responsive Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* Left Column: Image Gallery Skeleton */}
          <div className="lg:col-span-7 space-y-3">
            <div className="card p-3 sm:p-4 bg-white rounded-2xl">
              <Skeleton className="w-full aspect-square sm:aspect-[4/3] rounded-xl" />
            </div>

            {/* Thumbnail Row Skeleton */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0" />
              ))}
            </div>
          </div>

          {/* Right Column: Info & Purchase Controls Skeleton */}
          <div className="lg:col-span-5">
            <div className="card p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              {/* Category / Brand badges */}
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>

              {/* Title Skeleton */}
              <Skeleton className="h-7 sm:h-8 w-4/5 mb-2 rounded-lg" />
              <Skeleton className="h-6 w-3/5 mb-4 rounded-lg" />

              {/* Price Skeleton */}
              <div className="mb-4 pb-3 border-b border-gray-100">
                <Skeleton className="h-3 w-12 mb-1 rounded" />
                <Skeleton className="h-9 w-40 rounded-lg" />
              </div>

              {/* Specs Bar Skeleton (3 columns) */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/80 rounded-xl p-3 mb-4">
                <div className="pr-2 space-y-1">
                  <Skeleton className="h-2.5 w-12 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="px-2 space-y-1">
                  <Skeleton className="h-2.5 w-14 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="pl-2 space-y-1">
                  <Skeleton className="h-2.5 w-10 rounded" />
                  <Skeleton className="h-4 w-14 rounded" />
                </div>
              </div>

              {/* Description Skeleton */}
              <div className="border-t border-b border-gray-100 py-3 mb-4 space-y-2">
                <Skeleton className="h-3.5 w-24 rounded mb-2" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>

              {/* Quantity selector Skeleton */}
              <div className="mb-5 space-y-2">
                <Skeleton className="h-3 w-32 rounded" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>

              {/* Action Buttons Skeleton */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>

              {/* Guarantee footer note skeleton */}
              <div className="space-y-1.5 pt-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
