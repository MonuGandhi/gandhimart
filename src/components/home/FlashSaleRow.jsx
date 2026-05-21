import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Zap, Heart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAdminStore } from '../../store/adminStore';
import { formatPrice } from '../../utils/helpers';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import { getActiveFlashSaleProducts, getFlashSaleTimeData } from '../../utils/flashSale';

export default function FlashSaleRow({ isDarkActive }) {
  const adminProducts = useAdminStore((s) => s.adminProducts) || [];
  const deliveryTime = useAdminStore((s) => s.storeSettings?.estimatedDeliveryTime || 10);
  
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const wishlistItems = useWishlistStore((s) => s.items);

  // Time remaining states
  const [timeData, setTimeData] = useState(() => getFlashSaleTimeData());
  const [flashProducts, setFlashProducts] = useState([]);

  // Timer Tick & Dynamic Products Update
  useEffect(() => {
    // Initial fetch of active flash sale products
    setFlashProducts(getActiveFlashSaleProducts(adminProducts));

    const interval = setInterval(() => {
      const currentData = getFlashSaleTimeData();
      setTimeData(currentData);

      // Every hour block change, update the products selection deterministically
      const newProducts = getActiveFlashSaleProducts(adminProducts);
      setFlashProducts(newProducts);
    }, 1000);

    return () => clearInterval(interval);
  }, [adminProducts]);

  if (flashProducts.length === 0) return null;

  // Formatting function for hh:mm:ss
  const formatTime = (totalSeconds) => {
    const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <div className="px-4 mt-1.5 mb-3.5">
      {/* Container with premium glassmorphism and pulsing neon effects */}
      <div className="bg-gradient-to-br from-red-500/5 via-orange-500/5 to-amber-500/5 dark:from-red-950/20 dark:via-orange-950/20 dark:to-amber-950/20 rounded-3xl p-4 md:p-5 border border-red-500/10 dark:border-red-500/20 shadow-[0_8px_30px_rgb(239,68,68,0.03)] dark:shadow-[0_8px_30px_rgb(239,68,68,0.08)] relative overflow-hidden transition-all duration-300">
        
        {/* Glowing background blurs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Title bar with real clock sync digital display */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-500/10 dark:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center shrink-0 animate-pulse border border-red-500/20">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base md:text-lg font-black tracking-tight text-gray-900 dark:text-white leading-none italic">
                  HAPPY HOUR FLASH SALE
                </h3>
                <span className="hidden xs:inline-block bg-red-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md animate-bounce">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 leading-none">
                High discount locked in! checkout fast before time runs out.
              </p>
            </div>
          </div>

          {/* Glowing monospace countdown capsule */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Ends In:</span>
            <div className="text-red-500 dark:text-red-400 font-mono font-black text-xs md:text-sm tracking-wider bg-red-500/10 dark:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-500/20 dark:border-red-500/30 shadow-inner flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400 animate-ping shrink-0" />
              {formatTime(timeData.remainingSeconds)}
            </div>
          </div>
        </div>

        {/* Cards Row - Horizontal Scroll with snap alignment */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory relative z-10">
          {flashProducts.map((product) => {
            const isWishlisted = wishlistItems.some((i) => String(i.id) === String(product.id));
            const cartItem = items.find((i) => i.id === product.id);
            const qty = cartItem?.qty || 0;

            return (
              <div 
                key={product.id} 
                className="w-[140px] md:w-[170px] shrink-0 snap-start bg-white dark:bg-[#0b0f19] rounded-2xl border border-gray-100 dark:border-slate-800/80 p-2 md:p-3 flex flex-col justify-between shadow-sm hover:shadow-md dark:shadow-none transition-all group relative"
              >
                {/* Product Image Link */}
                <Link to={`/product/${product.id}`} className="relative block aspect-square rounded-xl overflow-hidden bg-white mb-2 shrink-0">
                  <img
                    src={getOptimizedImageUrl(product.image, 300)}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-1.5"
                    loading="lazy"
                  />
                  
                  {/* Floating Heart Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all active:scale-90 z-20 border border-gray-100/50 dark:border-slate-700/50"
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart 
                      size={12} 
                      className={`transition-all duration-300 ${
                        isWishlisted 
                          ? 'text-red-500 fill-red-500 scale-110 animate-heart-pop' 
                          : 'text-gray-400 group-hover:text-red-500'
                      }`} 
                    />
                  </button>

                  {!product.inStock && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                      <span className="text-[8px] md:text-[9px] font-black text-gray-800 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-slate-700 shadow-sm uppercase">
                        Sold Out
                      </span>
                    </div>
                  )}
                </Link>

                {/* Badge Row (Discount + Delivery Time) */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none shadow-sm shadow-red-500/10">
                    {product.discount}% OFF
                  </span>
                  <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md leading-none">
                    <Zap size={8} className="text-amber-500 fill-amber-500" />
                    <span className="text-[7.5px] md:text-[8px] font-black text-gray-700 dark:text-gray-300 uppercase shrink-0">{deliveryTime} MINS</span>
                  </div>
                </div>

                {/* Product Title and Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/product/${product.id}`}>
                      <h4 
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                        className="text-[10px] md:text-[11px] font-extrabold text-gray-800 dark:text-slate-100 leading-tight h-[28px] md:h-[30px] group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors"
                      >
                        {product.name}
                      </h4>
                    </Link>
                    <p className="text-[8px] md:text-[9px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {product.weight} {product.unit}
                    </p>
                  </div>

                  {/* HIGH-FOMO STOCK BAR & CLAIMS COUNT */}
                  <div className="my-2 space-y-1 select-none">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-0.5 animate-pulse">
                        🔥 {product.stockLeft} left
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">
                        {product.claimedPercent}% Sold
                      </span>
                    </div>
                    {/* Progress track with fire pulse */}
                    <div className="relative w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden border border-gray-100/50 dark:border-slate-800/80 shadow-inner">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 transition-all duration-1000 ease-out animate-pulse"
                        style={{ width: `${product.claimedPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Pricing + Add Button controls */}
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-50 dark:border-slate-800/30">
                    <div className="flex flex-col">
                      <span className="text-[13px] md:text-[16px] font-black text-gray-900 dark:text-white leading-none">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-[10px] md:text-[12px] text-gray-400 dark:text-slate-500 line-through font-medium mt-1 leading-none">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Qty Controls */}
                    {product.inStock && (
                      qty === 0 ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            addItem(product);
                          }}
                          className="border-2 border-red-500 text-red-500 dark:border-red-400 dark:text-red-400 text-[11px] md:text-[13px] font-black px-3 py-1 md:px-4.5 md:py-1.5 rounded-xl hover:bg-red-500 hover:text-white dark:hover:bg-red-400 dark:hover:text-black active:scale-95 transition-all shadow-sm shrink-0"
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center bg-red-500 dark:bg-red-400 rounded-lg md:rounded-xl overflow-hidden shadow-sm shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              updateQty(product.id, qty - 1);
                            }}
                            className="text-white dark:text-black p-1 md:p-1.5 hover:bg-black/10 transition-colors"
                          >
                            <Minus size={12} strokeWidth={3} className="md:w-4 md:h-4" />
                          </button>
                          <span className="text-white dark:text-black text-[12px] md:text-[14px] font-black w-5 md:w-7 text-center">{qty}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              addItem(product);
                            }}
                            className="text-white dark:text-black p-1 md:p-1.5 hover:bg-black/10 transition-colors"
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
          })}
        </div>
      </div>
    </div>
  );
}
