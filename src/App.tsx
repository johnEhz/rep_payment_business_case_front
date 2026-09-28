import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProductPage } from './pages/ProductPage/ProductPage';
import { ProductDetailPage } from './pages/ProductDetailPage/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage/CheckoutPage';
import { SummaryPage } from './pages/SummaryPage/SummaryPage';
import { StatusPage } from './pages/StatusPage/StatusPage';
import { TermsPage } from './pages/TermsPage/TermsPage';
import { TrackPage } from './pages/TrackPage/TrackPage';
import { useSessionRestore } from './hooks/useSessionRestore';

/**
 * Inner component that uses hooks requiring Router context.
 */
const AppRoutes: React.FC = () => {
  // Restore user to the correct step on refresh safely
  useSessionRestore();

  return (
    <Routes>
      {/* Step 1: Catalog & Product Detail (slug-based URL) */}
      <Route path="/" element={<ProductPage />} />
      <Route path="/product/:slug" element={<ProductDetailPage />} />

      {/* Step 2: Delivery & Customer Info */}
      <Route path="/checkout" element={<CheckoutPage />} />

      {/* Step 3: Order Summary & Payment Card Info */}
      <Route path="/summary" element={<SummaryPage />} />

      {/* Step 4: Final Payment Status */}
      <Route path="/status" element={<StatusPage />} />

      {/* Guest Order Tracking (Sin login) */}
      <Route path="/orders/track/:orderNumber" element={<TrackPage />} />
      <Route path="/track/:orderNumber" element={<TrackPage />} />

      {/* Legal & Terms and Conditions */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/terminos" element={<Navigate to="/terms" replace />} />
      <Route path="/terminos-y-condiciones" element={<Navigate to="/terms" replace />} />

      {/* Catch-all redirect to Step 1 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="bottom-center"
        duration={2500}
        theme="light"
        toastOptions={{
          className: '!rounded-2xl !py-2.5 !px-4 !text-xs sm:!text-sm !font-medium !shadow-lg !border !border-gray-100 !bg-white/95 !backdrop-blur-md',
        }}
      />
    </BrowserRouter>
  );
};

export default App;
