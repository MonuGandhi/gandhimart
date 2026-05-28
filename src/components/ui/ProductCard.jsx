import { Link } from 'react-router-dom';
import { Plus, Minus, Zap, Heart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { formatPrice } from '../../utils/helpers';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

import { useAdminStore } from '../../store/adminStore';

export default function ProductCard({ product, rank, rankBadgeClass }) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const deliveryTime = useAdminStore((s) => s.storeSettings?.estimatedDeliveryTime || 10);
  
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.items.some((i) => String(i.id) === String(product?.id)));

  const cartItem = items.find((i) => i?.id === product?.id);
  const qty = cartItem?.qty || 0;

  if (!product) return null;

  const hasStockLimit = product.stock !== undefined && product.stock !== null && product.stock !== "";
  const stockCount = hasStockLimit ? Number(product.stock) : Infinity;
  const isOutOfStock = !product.inStock || (hasStockLimit && stockCount <= 0);
  const isMaxQtyReached = hasStockLimit && qty >= stockCount;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all duration-300 group h-full">

      {/* #Rank Badge — Top Left above image */}
      {rank && (
        <div className="px-2 pt-2 md:px-2.5 md:pt-2.5">
          <span className={`text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm inline-block ${rankBadgeClass || 'bg-gray-600 text-white'}`}>
            #{rank}
          </span>
        </div>
      )}

      {/* Image — Clean, Rounded */}
      <Link to={`/product/${product.id}`} className={`relative block aspect-square mx-2 mt-2 md:mx-2.5 md:mt-2.5 rounded-xl overflow-hidden bg-white`}>
        <img
          src={getOptimizedImageUrl(product.image, 400)}
          alt={product.name}
          className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2 ${isOutOfStock ? 'blur-[2px] brightness-75' : ''}`}
          loading="lazy"
          decoding="async"
        />
        
        {/* Floating Heart Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-1.5 right-1.5 md:top-2.5 md:right-2.5 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all active:scale-90 group/heart z-20 border border-gray-100/50 dark:border-slate-700/50"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            size={14} 
            className={`transition-all duration-300 ${
              isWishlisted 
                ? 'text-red-500 fill-red-500 scale-110 animate-heart-pop' 
                : 'text-gray-400 group-hover/heart:text-red-500 group-hover/heart:scale-110'
            }`} 
          />
        </button>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded-xl">
            <span className="text-[10px] md:text-[12px] font-black text-white bg-red-600 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg shadow-lg tracking-widest uppercase border border-red-400">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Discount + 10 MIN — Below image */}
      <div className="flex items-center justify-between px-2 mt-1.5">
        {product.discount > 0 ? (
          <span className="bg-[#1CA672] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
            {product.discount}% OFF
          </span>
        ) : <span />}
        <div className="flex items-center gap-0.5 md:gap-1 bg-gray-100 px-1.5 py-0.5 rounded-md">
          <Zap size={8} className="text-amber-500 fill-amber-500" />
          <span className="text-[8px] font-black text-gray-700 uppercase">{deliveryTime} MINS</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-2 pt-1 md:p-3 md:pt-2 flex flex-col flex-1">
        <div className="flex-1">
          <Link to={`/product/${product.id}`}>
            <h3 
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
              className="text-[11px] md:text-xs font-bold text-gray-800 leading-tight h-[28px] md:h-[32px] group-hover:text-[#1CA672] transition-colors"
            >
              {product.name}
            </h3>
          </Link>
          <p className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-0.5 md:mt-1 uppercase tracking-wider">
            {product.weight} {product.unit}
          </p>
        </div>

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-2 md:mt-3">
          <div className="flex flex-col">
            <span className="text-[13.5px] md:text-[16px] font-black text-gray-900 leading-none">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[10px] md:text-[12px] text-gray-400 line-through font-medium mt-1 leading-none">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Add / Qty control */}
          {!isOutOfStock && (
            qty === 0 ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (navigator.vibrate) navigator.vibrate(50);
                  addItem(product);
                }}
                className="border-2 border-[#1CA672] text-[#1CA672] text-[11.5px] md:text-[13.5px] font-black px-3 py-1 md:px-4.5 md:py-1.5 rounded-xl hover:bg-[#1CA672] hover:text-white active:scale-95 transition-all shadow-sm shrink-0"
              >
                ADD
              </button>
            ) : (
              <div className="flex items-center bg-[#1CA672] rounded-lg md:rounded-xl overflow-hidden shadow-md shadow-green-100 shrink-0">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (navigator.vibrate) navigator.vibrate(50);
                    updateQty(product.id, qty - 1);
                  }}
                  className="text-white p-1 md:p-1.5 hover:bg-black/10 active:scale-90 transition-all"
                >
                  <Minus size={12} strokeWidth={3} className="md:w-4 md:h-4" />
                </button>
                <span className="text-white text-[12px] md:text-[14px] font-black w-5 md:w-7 text-center">{qty}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (navigator.vibrate) navigator.vibrate(50);
                    if (isMaxQtyReached) {
                      toast.error(`Only ${stockCount} items left in stock!`);
                      return;
                    }
                    addItem(product);
                  }}
                  className={`text-white p-1 md:p-1.5 hover:bg-black/10 active:scale-90 transition-all ${isMaxQtyReached ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <Plus size={12} strokeWidth={3} className="md:w-4 md:h-4" />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
