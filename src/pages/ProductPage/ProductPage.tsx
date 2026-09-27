import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchProducts,
  fetchCategories,
  fetchBrands,
} from '../../store/slices/catalogSlice';
import { ProductCard } from '../../components/ProductCard';
import { CartDrawer } from '../../components/CartDrawer';
import { AppHeader } from '../../components/AppHeader';
import { ProductGridSkeleton } from '../../components/skeletons/ProductCardSkeleton';
import { ProductFiltersSidebar } from '../../components/ProductFiltersSidebar';
import { formatCOP } from '../../utils/currency';

const ITEMS_PER_PAGE_OPTIONS = [8, 12, 16];

export const ProductPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    products,
    total,
    totalPages,
    categories,
    brands,
    loading,
    error,
  } = useAppSelector((s) => s.catalog);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Structured sidebar filter state
  const [filters, setFilters] = useState<{
    category: string | null;
    brand: string | null;
    inStockOnly: boolean;
    minPrice: number | null;
    maxPrice: number | null;
  }>({
    category: null,
    brand: null,
    inStockOnly: false,
    minPrice: null,
    maxPrice: null,
  });

  // Initial load categories & brands
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
  }, [dispatch]);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Backend pagination & filter fetch whenever any filter/page changes
  useEffect(() => {
    dispatch(
      fetchProducts({
        category: filters.category || undefined,
        brand: filters.brand || undefined,
        inStockOnly: filters.inStockOnly ? true : undefined,
        minPrice: filters.minPrice !== null ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice !== null ? filters.maxPrice : undefined,
        search: debouncedSearch.trim() || undefined,
        page: currentPage,
        limit: itemsPerPage,
      })
    );
  }, [dispatch, filters, debouncedSearch, currentPage, itemsPerPage]);

  const handleFilterChange = (
    newFilters: Partial<typeof filters>
  ) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({
      category: null,
      brand: null,
      inStockOnly: false,
      minPrice: null,
      maxPrice: null,
    });
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const totalItems = total;
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    (filters.brand ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <CartDrawer />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 w-full">
        {/* Banner Section (Desktop & Mobile Friendly) */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 rounded-2xl p-5 sm:p-7 text-white mb-6 shadow-xs relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight mb-1.5">
              Explora Nuestro Catálogo
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Encuentra los mejores productos con disponibilidad en tiempo real y realiza tu compra de forma rápida y segura en 5 sencillos pasos.
            </p>
          </div>

          {/* Decorative background shapes */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-32 -top-12 w-48 h-48 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* 2-Column E-commerce Layout: Left Sidebar + Right Catalog */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Left Sidebar (Amazon Style) */}
          <div className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24">
            <ProductFiltersSidebar
              categories={categories}
              brands={brands}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAllFilters}
            />
          </div>

          {/* Right Main Content */}
          <div className="flex-1 min-w-0 w-full">
            {/* Toolbar: Search, Mobile Filters Trigger, and Page Controls */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-100 mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Bar + Mobile Filter Button */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <svg
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o descripción..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Mobile Filters Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold shrink-0 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Filtros</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Items-per-page & Counter */}
                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm text-gray-500">
                  <span>
                    <strong className="text-gray-900">{startIndex}</strong>–
                    <strong className="text-gray-900">{endIndex}</strong> de{' '}
                    <strong className="text-gray-900">{totalItems}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="hidden xl:inline text-xs">Por pág:</span>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg">
                      {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleItemsPerPageChange(opt)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                            itemsPerPage === opt
                              ? 'bg-white text-blue-600 shadow-xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filter Badges / Chips */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-medium mr-1">Filtros aplicados:</span>

                  {filters.category && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                      Categoría: {filters.category}
                      <button
                        type="button"
                        onClick={() => handleFilterChange({ category: null })}
                        className="hover:text-blue-900 font-bold ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {filters.brand && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                      Marca: {filters.brand}
                      <button
                        type="button"
                        onClick={() => handleFilterChange({ brand: null })}
                        className="hover:text-blue-900 font-bold ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {filters.inStockOnly && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                      En stock disponible
                      <button
                        type="button"
                        onClick={() => handleFilterChange({ inStockOnly: false })}
                        className="hover:text-green-900 font-bold ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {(filters.minPrice !== null || filters.maxPrice !== null) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                      Precio:{' '}
                      {filters.minPrice !== null && filters.maxPrice !== null
                        ? `${formatCOP(filters.minPrice)} - ${formatCOP(filters.maxPrice)}`
                        : filters.minPrice !== null
                        ? `Desde ${formatCOP(filters.minPrice)}`
                        : `Hasta ${formatCOP(filters.maxPrice!)}`}
                      <button
                        type="button"
                        onClick={() => handleFilterChange({ minPrice: null, maxPrice: null })}
                        className="hover:text-blue-900 font-bold ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {debouncedSearch.trim() && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200">
                      &quot;{debouncedSearch.trim()}&quot;
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="hover:text-gray-900 font-bold ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold ml-2 hover:underline"
                  >
                    Borrar filtros
                  </button>
                </div>
              )}
            </div>

            {/* Loading Skeleton Grid */}
            {loading && <ProductGridSkeleton count={itemsPerPage || 6} />}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto my-8">
                <p className="text-red-700 font-semibold mb-2">Error al cargar productos</p>
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <button
                  onClick={() =>
                    dispatch(
                      fetchProducts({
                        category: filters.category || undefined,
                        brand: filters.brand || undefined,
                        inStockOnly: filters.inStockOnly ? true : undefined,
                        minPrice: filters.minPrice ?? undefined,
                        maxPrice: filters.maxPrice ?? undefined,
                        search: debouncedSearch.trim() || undefined,
                        page: currentPage,
                        limit: itemsPerPage,
                      })
                    )
                  }
                  className="btn-primary text-sm py-2 px-4 w-auto inline-block"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && totalItems === 0 && (
              <div className="text-center py-14 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                  No hay productos disponibles para los criterios seleccionados
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  Prueba modificando los términos de búsqueda o ajustando los filtros aplicados en el catálogo.
                </p>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>
            )}

            {/* Products Grid: Responsive for Mobile, Tablet and Large Desktop */}
            {!loading && totalItems > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 mb-10">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Paginación del catálogo"
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs"
                  >
                    <span className="text-xs sm:text-sm text-gray-500">
                      Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Prev button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Anterior
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-9 h-9 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            aria-current={currentPage === pageNum ? 'page' : undefined}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      {/* Next button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente →
                      </button>
                    </div>
                  </nav>
                )}
              </>
            )}

            {/* Real-time stock guarantee footer note */}
            {!loading && totalItems > 0 && (
              <p className="text-xs text-gray-400 text-center mt-10">
                El inventario mostrado refleja el stock real descontando de forma inmediata las reservas activas de compras en curso.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filters Drawer Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white h-full overflow-y-auto shadow-2xl">
              <ProductFiltersSidebar
                categories={categories}
                brands={brands}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearAllFilters}
                isMobileModal={true}
                onCloseMobile={() => setIsMobileFiltersOpen(false)}
                className="rounded-none border-none p-5 shadow-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
