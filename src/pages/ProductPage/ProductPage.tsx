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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 w-full pb-28 lg:pb-10">
        {/* Mobile Search Bar (Top on Mobile, Clean & Uncluttered matching Mockup) */}
        <div className="lg:hidden mb-3.5">
          <div className="relative">
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
              placeholder="Buscar productos por nombre, marca o modelo..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Active Filter Chips on Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-gray-400 font-medium mr-0.5">Filtros:</span>
              {filters.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-medium rounded-lg border border-emerald-200">
                  {filters.category}
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ category: null })}
                    className="p-0.5 hover:text-emerald-950"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filters.brand && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-lg border border-blue-200">
                  {filters.brand}
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ brand: null })}
                    className="p-0.5 hover:text-blue-900"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filters.inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[11px] font-medium rounded-lg border border-green-200">
                  En stock
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ inStockOnly: false })}
                    className="p-0.5 hover:text-green-900"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-[11px] text-red-600 font-semibold hover:underline ml-1 cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Promotional Discount & Featured Deals Banner (Mockup 2 Design) */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white mb-5 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Ofertas Destacadas
                </span>
                <span className="text-[11px] font-medium text-emerald-100">
                  Valle de Aburrá y Medellín
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white mb-2 leading-tight">
                Clearance Sales
              </h1>

              <div className="inline-flex items-center gap-2 bg-white text-emerald-800 px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold shadow-xs mb-3">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                  %
                </span>
                <span>Hasta 30% de descuento en tecnología seleccionada</span>
              </div>

              <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed max-w-lg mb-3">
                Disponibilidad física garantizada en tiempo real. Al iniciar tu pago, aseguramos una <strong className="text-white underline decoration-emerald-300">reserva exclusiva de 15 minutos</strong> para evitar sobreventas.
              </p>

              {/* 3 Core Trust Pillars (Clean SVGs, No text emojis) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-white/20 text-xs">
                <div className="flex items-center gap-2 text-emerald-50">
                  <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-white leading-tight">15 Min de Reserva</p>
                    <p className="text-[10px] text-emerald-200 leading-tight">Garantía sin cancelaciones</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-emerald-50">
                  <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-white leading-tight">Domicilio Exacto</p>
                    <p className="text-[10px] text-emerald-200 leading-tight">Fijación en mapa Mapbox</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-emerald-50">
                  <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-white leading-tight">Cobro Cifrado Seguro</p>
                    <p className="text-[10px] text-emerald-200 leading-tight">Tokenización y soporte oficial</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Showcase Visual Element matching mockup 2 */}
            <div className="hidden md:flex items-center justify-center shrink-0 pr-4">
              <div className="relative">
                <div className="w-44 h-44 rounded-3xl bg-white/10 backdrop-blur-md p-3 flex items-center justify-center shadow-lg border border-white/20">
                  <img
                    src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=350&q=80"
                    alt="Dispositivos destacados con descuento"
                    className="w-full h-full object-contain filter drop-shadow-xl hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                  Top Deal
                </span>
              </div>
            </div>
          </div>

          {/* Decorative ambient flare */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Categories Horizontal Carousel Bar (Mockup 2 Design) */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">Categorías</h2>
              {filters.category && (
                <button
                  type="button"
                  onClick={() => handleFilterChange({ category: null })}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  Ver todas
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => handleFilterChange({ category: null })}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filters.category === null
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => {
                const isSelected = filters.category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleFilterChange({ category: isSelected ? null : cat.name })}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
            {/* Desktop Toolbar: Search, Items Per Page, and Count */}
            <div className="hidden lg:block bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-100 mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Bar on Desktop */}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        aria-label="Limpiar búsqueda"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
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
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
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

              {/* Active Filter Badges / Chips on Desktop */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-medium mr-1">Filtros aplicados:</span>

                  {filters.category && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-200">
                      Categoría: {filters.category}
                      <button
                        type="button"
                        onClick={() => handleFilterChange({ category: null })}
                        className="hover:text-emerald-950 p-0.5"
                        aria-label="Quitar filtro de categoría"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}

                  {filters.brand && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                      Marca: {filters.brand}
                      <button
                        type="button"
                        onClick={() => handleFilterChange({ brand: null })}
                        className="hover:text-blue-900 p-0.5"
                        aria-label="Quitar filtro de marca"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}

                  {filters.inStockOnly && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                      En stock disponible
                      <button
                        type="button"
                        onClick={() => handleFilterChange({ inStockOnly: false })}
                        className="hover:text-green-900 p-0.5"
                        aria-label="Quitar filtro de stock"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                        className="hover:text-blue-900 p-0.5"
                        aria-label="Quitar filtro de precio"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}

                  {debouncedSearch.trim() && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200">
                      &quot;{debouncedSearch.trim()}&quot;
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="hover:text-gray-900 p-0.5"
                        aria-label="Quitar término de búsqueda"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
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

            {/* Products Grid: 2 Columns on Mobile matching Mockups, 3 Columns on Tablet/Desktop */}
            {!loading && totalItems > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 mb-10">
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
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span>Anterior</span>
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-9 h-9 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white shadow-xs'
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
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>Siguiente</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
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

      {/* Anchored Bottom Bar on Mobile: Filters & Pagination Only */}
      <div className="lg:hidden fixed bottom-3.5 inset-x-4 z-40 max-w-sm mx-auto">
        <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.14)] rounded-2xl px-3.5 py-2 flex items-center justify-between">
          {/* Left: Filters button */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Right: Quick Pagination */}
          <div className="flex items-center gap-1 bg-gray-100/90 px-2 py-1 rounded-xl">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
              className="w-6 h-6 flex items-center justify-center text-gray-700 disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-xs font-bold text-gray-800 px-1">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Página siguiente"
              className="w-6 h-6 flex items-center justify-center text-gray-700 disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

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
