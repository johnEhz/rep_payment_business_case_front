import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '../types';
import { formatCOP } from '../utils/currency';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem, openCart } from '../store/slices/cartSlice';

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Sin+imagen';

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cartItems = useAppSelector((s) => s.cart.items);
  const cartItem = cartItems.find((i) => i.productId === product.id);
  const cartQty = cartItem?.quantity ?? 0;
  const availableStock = product.stock - cartQty;
  const outOfStock = product.stock === 0;

  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (availableStock <= 0) {
      toast.warning('No hay más unidades disponibles');
      return;
    }
    dispatch(addItem({ product, quantity: 1 }));
    toast.success('¡Agregado al carrito!', {
      description: `${product.name}`,
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
      className="card flex flex-col h-full overflow-hidden rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-200 cursor-pointer group"
    >
      {/* Image with optimized lazy loading */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden mb-3">
        <img
          src={product.imageUrl || PLACEHOLDER_IMAGE}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
            <span className="text-white font-bold text-xs sm:text-sm bg-red-600 px-3 py-1 rounded-full shadow">
              Agotado
            </span>
          </div>
        )}
        {!outOfStock && product.stock <= 3 && (
          <div className="absolute top-2 right-2">
            <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow">
              ¡Últimas unidades!
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-1">
        {/* Category & Brand */}
        <div className="flex gap-1.5 mb-1.5 flex-wrap">
          {product.category && (
            <span className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
              {product.category}
            </span>
          )}
          {product.brand && (
            <span className="text-[11px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
              {product.brand}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-gray-900 font-bold text-sm sm:text-base leading-snug mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          <Link
            to={`/product/${productSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            {product.name}
          </Link>
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price & Stock */}
        <div className="flex items-end justify-between mb-3 pt-2 border-t border-gray-50">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Precio</span>
            <span className="text-blue-700 font-extrabold text-base sm:text-lg">
              {formatCOP(product.priceInCents)}
            </span>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: product.stock > 3 ? '#ecfdf5' : product.stock > 0 ? '#fffbeb' : '#fef2f2',
              color: product.stock > 3 ? '#047857' : product.stock > 0 ? '#b45309' : '#b91c1c',
            }}
          >
            {outOfStock ? 'Sin stock' : `${product.stock} disp.`}
          </span>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAdd}
          disabled={outOfStock || availableStock <= 0}
          aria-label={`Agregar ${product.name} al carrito`}
          className="btn-primary text-xs sm:text-sm py-2.5 font-semibold"
        >
          {cartQty > 0 ? `En carrito (${cartQty})` : outOfStock ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    </article>
  );
};
