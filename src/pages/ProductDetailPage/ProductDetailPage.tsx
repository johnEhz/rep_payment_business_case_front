import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProductById, clearSelectedProduct } from '../../store/slices/catalogSlice';
import { addItem, openCart, selectCartItems } from '../../store/slices/cartSlice';
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

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (productIdentifier) {
      dispatch(fetchProductById(productIdentifier));
    }
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [productIdentifier, dispatch]);

  const selectedProductId = selectedProduct?.id;
  useEffect(() => {
    if (selectedProduct) {
      const primary =
        selectedProduct.imageUrl ||
        (selectedProduct.images && selectedProduct.images[0]) ||
        PLACEHOLDER_IMAGE;
      setSelectedImage(primary);
      setQuantity(1);

      // Si el usuario navegó con ID o formato anterior, normalizamos la URL con el slug amigable
      if (selectedProduct.slug && productIdentifier !== selectedProduct.slug) {
        window.history.replaceState(null, '', `/product/${selectedProduct.slug}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  if (loading) {
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

  // Compile image list safely (main image + images array)
  const allImages = Array.from(
    new Set([
      selectedProduct.imageUrl,
      ...(selectedProduct.images || []),
    ].filter((img): img is string => typeof img === 'string' && img.trim().length > 0))
  );

  const handleAddToCart = () => {
    if (availableStock <= 0) {
      toast.warning('No hay más stock disponible para este producto');
      return;
    }

    const qtyToAdd = Math.min(quantity, availableStock);
    dispatch(addItem({ product: selectedProduct, quantity: qtyToAdd }));
    toast.success(`¡Agregado al carrito!`, {
      description: `${qtyToAdd}x ${selectedProduct.name}`,
    });
    dispatch(openCart());
  };

  const handleBuyNow = () => {
    if (availableStock <= 0) {
      toast.warning('Producto sin stock disponible');
      return;
    }
    const qtyToAdd = Math.min(quantity, availableStock);
    dispatch(addItem({ product: selectedProduct, quantity: qtyToAdd }));
    navigate('/checkout');
  };

  const handleSelectThumbnail = (imgUrl: string) => {
    if (imgUrl !== selectedImage) {
      setImageLoaded(false);
      setSelectedImage(imgUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <AppHeader />
      <CartDrawer />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 md:py-8 w-full">
        {/* Breadcrumb navigation */}
        <nav aria-label="Breadcrumb" className="mb-3.5 sm:mb-5">
          <ol className="flex items-center space-x-2 text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
            <li className="shrink-0">
              <Link to="/" className="hover:text-blue-600 transition-colors flex items-center gap-1 font-semibold text-blue-600 sm:text-gray-500">
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
          {/* Column 1: Image Gallery (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            {/* Main Hero Image */}
            <div className="relative w-full aspect-square max-w-md bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse z-0" />
              )}
              <img
                key={selectedImage}
                src={selectedImage || PLACEHOLDER_IMAGE}
                alt={selectedProduct.name}
                decoding="async"
                ref={(img) => {
                  if (img && img.complete && img.naturalWidth > 0 && !imageLoaded) {
                    setImageLoaded(true);
                  }
                }}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                  setImageLoaded(true);
                }}
                className={`w-full h-full object-cover transition-opacity duration-200 relative z-10 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-20">
                  <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg">
                    Agotado
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails Carousel */}
            {allImages.length > 1 && (
              <div className="flex gap-2 sm:gap-2.5 mt-3 sm:mt-4 overflow-x-auto pb-1.5 w-full max-w-md scrollbar-none justify-start sm:justify-center px-0.5">
                {allImages.map((imgUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectThumbnail(imgUrl)}
                    className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImage === imgUrl
                        ? 'border-blue-600 ring-2 ring-blue-100 scale-105'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Miniatura ${index + 1}`}
                      loading="lazy"
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
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
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
                <span className="text-2xl sm:text-3xl font-black text-blue-700">
                  {formatCOP(selectedProduct.priceInCents)}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-gray-400">
                  COP • Impuestos incluidos
                </span>
              </div>

              {/* Structured Product Specifications (Brand, Category, Stock in Sleek 3-Col Bar) */}
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
                    {cartQty > 0 && !isOutOfStock && (
                      <span className="text-[10px] text-blue-600 font-medium block truncate">
                        ({cartQty} en carrito)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-b border-gray-100 py-3 sm:py-4 mb-4">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
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
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Cantidad a comprar
                    </label>
                    {cartQty > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
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
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl p-2.5">
                      Ya tienes todas las unidades disponibles ({cartQty}) en tu carrito.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions: Clean 2-column buttons on mobile & desktop */}
            <div className="pt-2">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || availableStock <= 0}
                  className="btn-secondary py-3 flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm px-2 sm:px-4"
                >
                  <svg className="w-4 h-4 text-gray-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="truncate">
                    {isOutOfStock
                      ? 'Agotado'
                      : availableStock <= 0
                      ? `En carrito (${cartQty})`
                      : cartQty > 0
                      ? `+ Más (${cartQty})`
                      : 'Al carrito'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="btn-primary py-3 flex items-center justify-center gap-1.5 font-bold shadow-md shadow-blue-500/10 text-xs sm:text-sm px-2 sm:px-4"
                >
                  Comprar ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
