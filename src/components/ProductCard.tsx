import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '../types';
import { formatCOP } from '../utils/currency';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem, openCart } from '../store/slices/cartSlice';

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Sin+imagen';

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cartItems = useAppSelector((s) => s.cart.items);
  const cartItem = cartItems.find((i) => i.productId === product.id);
  const cartQty = cartItem?.quantity ?? 0;
  const availableStock = product.stock - cartQty;
  const outOfStock = product.stock === 0;

  // Compute a realistic promotional original price for strikethrough display (15% discount)
  const originalPrice = Math.round(product.priceInCents * 1.15);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (availableStock <= 0) {
      toast.warning('No hay más unidades disponibles');
      return;
    }
    dispatch(addItem({ product, quantity: 1 }));
    toast.success('Agregado al carrito', {
      description: product.name,
    });
    dispatch(openCart());
  };

  const productSlug = product.slug || product.id;

  const handleCardClick = () => {
    navigate(`/product/${productSlug}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="card flex flex-col justify-between h-full rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-2.5 sm:p-4 hover:shadow-xl hover:border-blue-100 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      <div>
        {/* Image Box */}
        <div className="relative w-full aspect-square bg-gray-50 rounded-xl sm:rounded-2xl p-2.5 flex items-center justify-center overflow-hidden mb-2.5">
          <img
            src={product.imageUrl || PLACEHOLDER_IMAGE}
            alt={product.name}
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          />

          {/* Discount Pill Badge */}
          {!outOfStock && (
            <span className="absolute top-2 left-2 text-[10px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-md shadow-2xs">
              -15%
            </span>
          )}

          {/* Favorite Heart Icon Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            aria-label="Favorito"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-gray-400 hover:text-red-500 shadow-2xs transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Out of Stock Overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <span className="text-white font-bold text-xs bg-red-600 px-2.5 py-1 rounded-full shadow">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-1 sm:line-clamp-2 group-hover:text-blue-600 transition-colors">
          <Link
            to={`/product/${productSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            {product.name}
          </Link>
        </h3>

        {/* Pricing line: Discounted Price + Strikethrough Original Price */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xs sm:text-base font-black text-gray-900">
            {formatCOP(product.priceInCents)}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400 line-through">
            {formatCOP(originalPrice)}
          </span>
        </div>

        {/* Availability / Stock Line */}
        <div className="flex items-center justify-between mt-1 text-[10px] sm:text-[11px] text-gray-500">
          <span>{outOfStock ? 'Agotado' : `${product.stock} disponibles`}</span>
          {product.brand && (
            <span className="text-gray-400 font-medium truncate max-w-[70px]">
              {product.brand}
            </span>
          )}
        </div>
      </div>

      {/* Touch-Friendly Add to Cart Button */}
      <button
        onClick={handleAdd}
        disabled={outOfStock || availableStock <= 0}
        aria-label={`Agregar ${product.name} al carrito`}
        className="w-full mt-2.5 py-1.5 sm:py-2 px-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
      >
        <span>{cartQty > 0 ? `En carrito (${cartQty})` : outOfStock ? 'Agotado' : 'Agregar'}</span>
      </button>
    </article>
  );
};
