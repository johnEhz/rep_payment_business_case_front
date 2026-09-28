import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProductById, clearSelectedProduct } from '../../store/slices/catalogSlice';
import { addItem, selectCartItems } from '../../store/slices/cartSlice';
import { AppHeader } from '../../components/AppHeader';
import { CartDrawer } from '../../components/CartDrawer';
import { ProductDetailSkeleton } from '../../components/skeletons/ProductDetailSkeleton';
import { formatCOP } from '../../utils/currency';

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600/f3f4f6/9ca3af?text=Sin+imagen';

export const ProductDetailPage: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const productIdentifier = slug || id;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedProduct, loading, error } = useAppSelector((s) => s.catalog);
  const cartItems = useAppSelector(selectCartItems);

  const [quantity, setQuantity] = useState<number>(1);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Touch and drag swipe state for mobile carousel
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    if (productIdentifier) {
      dispatch(fetchProductById(productIdentifier));
    }
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [productIdentifier, dispatch]);

  const selectedProductId = selectedProduct?.id;
  const selectedProductSlug = selectedProduct?.slug;

  useEffect(() => {
    if (selectedProduct) {
      setCurrentImageIndex(0);
      setQuantity(1);

      // Si el usuario navegó con ID o formato anterior, normalizamos la URL con el slug amigable
      if (selectedProductSlug && productIdentifier !== selectedProductSlug) {
        window.history.replaceState(null, '', `/product/${selectedProductSlug}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId, selectedProductSlug, productIdentifier]);

  // Compile image list safely
  const allImages = useMemo(() => {
    if (!selectedProduct) return [];
    return Array.from(
      new Set([
        selectedProduct.imageUrl,
        ...(selectedProduct.images || []),
      ].filter((img): img is string => typeof img === 'string' && img.trim().length > 0))
    );
  }, [selectedProduct]);

  // Handle Loading & Skeletons: prevent blank screen when data is fetching
  if (loading || (!selectedProduct && !error)) {
    return <ProductDetailSkeleton />;
  }

  if (error || !selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <AppHeader />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="card p-8 inline-block max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
            <p className="text-gray-500 text-sm mb-6">
              {error || 'El producto que buscas no existe o ha sido retirado.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Volver al catálogo
            </button>
          </div>
        </main>
      </div>
    );
  }

  const inCart = cartItems.find((i) => i.productId === selectedProduct.id);
  const cartQty = inCart?.quantity ?? 0;
  const availableStock = Math.max(0, selectedProduct.stock - cartQty);
  const isOutOfStock = selectedProduct.stock <= 0;

  // Swipe / Carousel Navigation
  const handleNextImage = () => {
    if (allImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    if (allImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    if (allImages.length <= 1) return;
    setTouchStartX(clientX);
    setTouchStartY(clientY);
    setDragOffset(0);
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || touchStartX === null) return;
    const deltaX = clientX - touchStartX;
    const deltaY = clientY - (touchStartY ?? 0);

    if (Math.abs(deltaX) > Math.abs(deltaY) || Math.abs(deltaX) > 10) {
      setDragOffset(deltaX * 0.7);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || allImages.length <= 1) {
      setIsDragging(false);
      setDragOffset(0);
      setTouchStartX(null);
      setTouchStartY(null);
      return;
    }

    const threshold = 40;
    if (dragOffset < -threshold) {
      handleNextImage();
    } else if (dragOffset > threshold) {
      handlePrevImage();
    }

    setIsDragging(false);
    setDragOffset(0);
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleAddToCart = () => {
    if (availableStock <= 0) {
      toast.warning('No hay más stock disponible para este producto');
      return;
    }

    const qtyToAdd = Math.min(quantity, availableStock);
    dispatch(addItem({ product: selectedProduct, quantity: qtyToAdd }));
    toast.success('¡Agregado al carrito!', {
      description: `${qtyToAdd}x ${selectedProduct.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <AppHeader />
      <CartDrawer />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 md:py-8 w-full pb-28 sm:pb-8">
        {/* Breadcrumb navigation */}
        <nav aria-label="Breadcrumb" className="mb-3.5 sm:mb-5">
          <ol className="flex items-center space-x-2 text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
            <li className="shrink-0">
              <Link to="/" className="hover:text-primary-600 transition-colors flex items-center gap-1 font-semibold text-primary-600 sm:text-gray-500">
                <span>←</span>
                <span>Catálogo</span>
              </Link>
            </li>
            <li className="shrink-0">
              <span className="text-gray-300">/</span>
            </li>
            {selectedProduct.category && (
              <>
                <li className="shrink-0 hidden xs:inline">
                  <span className="text-gray-500">{selectedProduct.category}</span>
                </li>
                <li className="shrink-0 hidden xs:inline">
                  <span className="text-gray-300">/</span>
                </li>
              </>
            )}
            <li className="text-gray-900 font-semibold truncate max-w-[170px] sm:max-w-md">
              {selectedProduct.name}
            </li>
          </ol>
        </nav>

        {/* Product Detail Layout: 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 md:p-10 shadow-xs border border-gray-100">
          {/* Column 1: Image Gallery & Drag/Swipe Carousel (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            {/* Main Hero Image Carousel */}
            <div
              className="relative w-full aspect-square max-w-md bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center select-none cursor-grab active:cursor-grabbing touch-pan-y"
              onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={handleDragEnd}
              onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
              onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              {/* Soft Slide Track */}
              <div
                className="w-full h-full flex"
                style={{
                  transform: isDragging
                    ? `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))`
                    : `translateX(-${currentImageIndex * 100}%)`,
                  transition: isDragging ? 'none' : 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {allImages.length > 0 ? (
                  allImages.map((imgUrl, idx) => (
                    <div key={idx} className="w-full h-full shrink-0 flex items-center justify-center bg-gray-100">
                      <img
                        src={imgUrl}
                        alt={`${selectedProduct.name} - ${idx + 1}`}
                        decoding="async"
                        draggable={false}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full shrink-0 flex items-center justify-center bg-gray-100">
                    <img
                      src={PLACEHOLDER_IMAGE}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </div>
                )}
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-20">
                  <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg">
                    Agotado
                  </span>
                </div>
              )}

              {/* Navigation Arrows for multi-image products */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    aria-label="Imagen anterior"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-gray-700 shadow-md flex items-center justify-center transition-all z-20 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    aria-label="Imagen siguiente"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-gray-700 shadow-md flex items-center justify-center transition-all z-20 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Counter Badge */}
                  <span className="absolute top-3 right-3 z-20 text-[10px] font-bold bg-black/50 backdrop-blur-xs text-white px-2 py-0.5 rounded-full pointer-events-none">
                    {currentImageIndex + 1} / {allImages.length}
                  </span>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full pointer-events-auto">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`transition-all rounded-full cursor-pointer ${
                          idx === currentImageIndex
                            ? 'w-4 h-1.5 bg-white'
                            : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                        }`}
                        aria-label={`Ver foto ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails Carousel */}
            {allImages.length > 1 && (
              <div className="flex gap-2 sm:gap-2.5 mt-3 sm:mt-4 overflow-x-auto pb-1.5 w-full max-w-md scrollbar-none justify-start sm:justify-center px-0.5">
                {allImages.map((imgUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      currentImageIndex === index
                        ? 'border-primary-600 ring-2 ring-primary-100 scale-105'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Miniatura ${index + 1}`}
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Product Info & Actions (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                {selectedProduct.category && (
                  <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200">
                    {selectedProduct.category}
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedProduct.stock > 5
                      ? 'bg-green-100 text-green-800'
                      : selectedProduct.stock > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isOutOfStock
                    ? 'Agotado'
                    : selectedProduct.stock <= 3
                    ? `¡Últimas ${selectedProduct.stock} unidades!`
                    : `${selectedProduct.stock} unidades disponibles`}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">
                {selectedProduct.name}
              </h1>

              {/* Price */}
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mb-3.5 sm:mb-4">
                <span className="text-2xl sm:text-3xl font-black text-primary-700">
                  {formatCOP(selectedProduct.priceInCents)}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-gray-400">
                  COP • Impuestos incluidos
                </span>
              </div>

              {/* Structured Product Specifications (Brand, Category, Stock) */}
              <div className="bg-gray-50/90 border border-gray-100 rounded-xl p-3 sm:p-3.5 mb-4">
                <div className="grid grid-cols-3 gap-2 divide-x divide-gray-200/70 text-xs">
                  {/* Marca */}
                  <div className="pr-1 min-w-0">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                      Marca
                    </span>
                    <span className="font-semibold text-gray-900 truncate block mt-0.5 text-xs sm:text-sm">
                      {selectedProduct.brand || 'N/A'}
                    </span>
                  </div>

                  {/* Categoría */}
                  <div className="px-2 min-w-0">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                      Categoría
                    </span>
                    <span className="font-semibold text-gray-900 truncate block mt-0.5 text-xs sm:text-sm">
                      {selectedProduct.category || 'General'}
                    </span>
                  </div>

                  {/* Stock */}
                  <div className="pl-2 min-w-0">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                      Stock
                    </span>
                    <span
                      className={`font-bold block mt-0.5 text-xs sm:text-sm ${
                        isOutOfStock ? 'text-red-600' : 'text-green-700'
                      }`}
                    >
                      {isOutOfStock ? 'Agotado' : `${selectedProduct.stock} uds`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-b border-gray-100 py-3 sm:py-4 mb-4">
                <h2 className="text-xs font-bold text-gray-900 mb-1.5">
                  Descripción
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {selectedProduct.description || 'Sin descripción detallada disponible.'}
                </p>
              </div>

              {/* Quantity selector */}
              {!isOutOfStock && (
                <div className="mb-4 sm:mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                      Cantidad a comprar
                    </label>
                    {cartQty > 0 && (
                      <span className="text-xs text-primary-600 font-medium">
                        Ya tienes {cartQty} en carrito
                      </span>
                    )}
                  </div>

                  {availableStock > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          aria-label="Disminuir cantidad"
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors text-base font-bold cursor-pointer"
                        >
                          −
                        </button>
                        <span className="w-9 text-center font-bold text-gray-900 text-xs sm:text-sm">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (quantity >= availableStock) {
                              toast.warning(`Solo hay ${availableStock} unidades disponibles`);
                              return;
                            }
                            setQuantity((q) => Math.min(availableStock, q + 1));
                          }}
                          disabled={quantity >= availableStock}
                          aria-label="Aumentar cantidad"
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-base font-bold cursor-pointer ${
                            quantity >= availableStock ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[11px] sm:text-xs text-gray-400">
                        (Máx {availableStock} adicionales)
                      </span>
                    </div>
                  ) : (
                    <div className="bg-primary-50 border border-primary-200 text-primary-800 text-xs rounded-xl p-2.5">
                      Ya tienes todas las unidades disponibles ({cartQty}) en tu carrito.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Action: Only Add to Cart */}
            <div className="pt-2 hidden sm:block">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || availableStock <= 0}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold text-sm px-6 cursor-pointer shadow-sm"
              >
                <span>
                  {isOutOfStock
                    ? 'Agotado'
                    : availableStock <= 0
                    ? `En carrito (${cartQty})`
                    : 'Agregar al carrito'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Sticky Action Bar for Mobile Screens */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2.5 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          {/* Price preview */}
          <div className="shrink-0 pr-1 flex flex-col justify-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none">Total</span>
            <span className="text-sm font-extrabold text-primary-700 leading-tight mt-0.5">
              {formatCOP(selectedProduct.priceInCents * quantity)}
            </span>
          </div>

          {/* Add to Cart button only */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || availableStock <= 0}
            className="btn-primary flex-1 py-3 px-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold rounded-xl shadow-md active:scale-95 transition-transform"
          >
            <span>
              {isOutOfStock
                ? 'Agotado'
                : availableStock <= 0
                ? `En carrito (${cartQty})`
                : 'Agregar al carrito'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
