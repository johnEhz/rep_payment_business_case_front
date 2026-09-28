import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '../types';
import { formatCOP } from '../utils/currency';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem } from '../store/slices/cartSlice';

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
  };

  const productSlug = product.slug || product.id;

  const handleCardClick = () => {
    navigate(`/product/${productSlug}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="card flex flex-col justify-between h-full rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-2 sm:p-3 hover:shadow-xl hover:border-primary-100 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      <div>
        {/* Product Image: Fills the card width, rounded corners (matching reference) */}
        <div className="relative w-full aspect-square bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden mb-2">
          <img
            src={product.imageUrl || PLACEHOLDER_IMAGE}
            alt={product.name}
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Price Pill Badge on bottom-left of image (matching reference design) */}
          <div className="absolute bottom-2 left-2 bg-primary-600 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold shadow-xs">
            {formatCOP(product.priceInCents)}
          </div>

          {/* Out of Stock Overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-white font-bold text-xs bg-red-600 px-2.5 py-1 rounded-full shadow">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Stock line */}
        <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium px-0.5">
          {outOfStock ? 'Agotado' : `${product.stock} disponibles`}
        </p>

        {/* Product Title */}
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors mt-0.5 px-0.5">
          <Link
            to={`/product/${productSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            {product.name}
          </Link>
        </h3>
      </div>

      {/* Action Row: Grounded footer with brand/category on left and centered (+) button on right */}
      <div className="mt-auto pt-2 flex items-center justify-between px-0.5">
        <span className="text-[11px] text-gray-400 font-medium truncate max-w-[65%]">
          {product.brand || product.category || (outOfStock ? 'Agotado' : 'En stock')}
        </span>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || availableStock <= 0}
          aria-label={`Agregar ${product.name} al carrito`}
          className="bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center
                     w-8 h-8 rounded-full sm:w-auto sm:px-3 sm:py-1.5 sm:rounded-xl text-xs font-bold ml-auto"
        >
          {/* Mobile (+) Centered SVG Icon (No bouncy animation) */}
          <span className="sm:hidden flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          {/* Desktop Text */}
          <span className="hidden sm:inline">
            {cartQty > 0 ? `+ (${cartQty})` : outOfStock ? 'Agotado' : 'Agregar'}
          </span>
        </button>
      </div>
    </article>
  );
};
