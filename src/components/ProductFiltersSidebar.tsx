import React from 'react';
import { Category, Brand } from '../types';

interface FilterState {
  category: string | null;
  brand: string | null;
  inStockOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
}

interface ProductFiltersSidebarProps {
  categories: Category[];
  brands: Brand[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onClearAll: () => void;
  className?: string;
  isMobileModal?: boolean;
  onCloseMobile?: () => void;
}

const PRICE_PRESETS = [
  { label: 'Hasta $100.000', min: null, max: 10000000 },
  { label: '$100.000 a $300.000', min: 10000000, max: 30000000 },
  { label: '$300.000 a $600.000', min: 30000000, max: 60000000 },
  { label: 'Más de $600.000', min: 60000000, max: null },
];

export const ProductFiltersSidebar: React.FC<ProductFiltersSidebarProps> = ({
  categories,
  brands,
  filters,
  onFilterChange,
  onClearAll,
  className = '',
  isMobileModal = false,
  onCloseMobile,
}) => {
  const [customMin, setCustomMin] = React.useState<string>(
    filters.minPrice ? String(filters.minPrice / 100) : ''
  );
  const [customMax, setCustomMax] = React.useState<string>(
    filters.maxPrice ? String(filters.maxPrice / 100) : ''
  );

  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    (filters.brand ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0);

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minCents = customMin ? Number(customMin) * 100 : null;
    const maxCents = customMax ? Number(customMax) * 100 : null;
    onFilterChange({ minPrice: minCents, maxPrice: maxCents });
  };

  return (
    <aside
      className={`bg-white ${
        isMobileModal
          ? 'h-full flex flex-col rounded-none border-none p-0 overflow-hidden'
          : 'rounded-2xl border border-gray-100 p-5 shadow-xs'
      } ${className}`}
      aria-label="Filtros de productos"
    >
      {/* Sidebar Header */}
      <div
        className={`flex items-center justify-between pb-4 mb-4 border-b border-gray-100 shrink-0 ${
          isMobileModal ? 'px-5 pt-4 pb-3.5 mb-0' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Filtros</h2>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors"
          >
            Limpiar todo
          </button>
        )}

        {isMobileModal && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="text-gray-400 hover:text-gray-700 text-lg sm:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar filtros"
          >
            ✕
          </button>
        )}
      </div>

      <div className={`space-y-6 ${isMobileModal ? 'flex-1 overflow-y-auto px-5 py-4 pb-6' : ''}`}>
        {/* 1. Envío & Despacho */}
        <div className="pb-5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-900 mb-2.5">
            Envío y Despacho
          </h3>
          <div className="space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-700 hover:text-blue-600">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-default"
              />
              <div>
                <span className="font-semibold block text-gray-900">Despacho desde bodega</span>
                <span className="text-[11px] text-gray-400">Robledo, Medellín</span>
              </div>
            </label>
          </div>
        </div>

        {/* 2. Disponibilidad de Inventario */}
        <div className="pb-5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-900 mb-2.5">
            Disponibilidad
          </h3>
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 hover:text-blue-600 select-none">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={filters.inStockOnly ? 'font-bold text-blue-700' : ''}>
              Solo con stock disponible
            </span>
          </label>
        </div>

        {/* 3. Categorías */}
        <div className="pb-5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-900 mb-2.5">
            Categoría
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 hover:text-blue-600 select-none">
              <input
                type="radio"
                name="category_filter"
                checked={filters.category === null}
                onChange={() => onFilterChange({ category: null })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className={filters.category === null ? 'font-bold text-blue-700' : ''}>
                Todas las categorías
              </span>
            </label>

            {categories.map((cat) => {
              const isSelected = filters.category === cat.name;
              return (
                <label
                  key={cat.id}
                  className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 hover:text-blue-600 select-none"
                >
                  <input
                    type="radio"
                    name="category_filter"
                    checked={isSelected}
                    onChange={() => onFilterChange({ category: cat.name })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className={isSelected ? 'font-bold text-blue-700' : ''}>
                    {cat.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 4. Marcas (Checkboxes estilo Amazon) */}
        {brands.length > 0 && (
          <div className="pb-5 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-900 mb-2.5">
              Marcas
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 hover:text-blue-600 select-none">
                <input
                  type="radio"
                  name="brand_filter"
                  checked={filters.brand === null}
                  onChange={() => onFilterChange({ brand: null })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className={filters.brand === null ? 'font-bold text-blue-700' : ''}>
                  Todas las marcas
                </span>
              </label>

              {brands.map((b) => {
                const isSelected = filters.brand === b.name;
                return (
                  <label
                    key={b.id}
                    className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 hover:text-blue-600 select-none"
                  >
                    <input
                      type="radio"
                      name="brand_filter"
                      checked={isSelected}
                      onChange={() => onFilterChange({ brand: b.name })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className={isSelected ? 'font-bold text-blue-700' : ''}>
                      {b.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Rango de Precios */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 mb-2.5">
            Precio
          </h3>

          {/* Presets */}
          <div className="space-y-1.5 mb-3.5">
            {PRICE_PRESETS.map((p, idx) => {
              const isSelected =
                filters.minPrice === p.min && filters.maxPrice === p.max;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onFilterChange({ minPrice: p.min, maxPrice: p.max })}
                  className={`block w-full text-left text-xs py-1 transition-colors ${
                    isSelected
                      ? 'font-bold text-blue-700'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Price Range Form */}
          <form onSubmit={handleApplyCustomPrice} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Mín ($)"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Máx ($)"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Aplicar rango
            </button>
          </form>
        </div>
      </div>

      {/* Fixed bottom action footer for mobile */}
      {isMobileModal && (
        <div className="p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 shrink-0 shadow-lg sm:hidden">
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-full btn-primary py-3 text-xs sm:text-sm font-bold shadow-md cursor-pointer"
          >
            Ver resultados
          </button>
        </div>
      )}
    </aside>
  );
};
