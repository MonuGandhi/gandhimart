import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Plus, Minus, Share2, Shield, Leaf, Zap, ArrowLeft, Heart } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/ui/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../utils/helpers';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import toast from 'react-hot-toast';
import ReviewModal from '../components/ui/ReviewModal';
import ReviewList from '../components/ui/ReviewList';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById, getSimilarProducts } = useProducts();
  const product = getProductById(id);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.items.some((i) => String(i.id) === String(product?.id)));

  // Initialize selected variant: either the first one or null
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  if (!product) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-gray-600">Product not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-[#1CA672] font-semibold">Go Home</button>
        </div>
      </Layout>
    );
  }

  const similar = getSimilarProducts(product);
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  
  const currentVariant = hasVariants ? variants[selectedVariantIdx] : null;
  const currentPrice = currentVariant ? currentVariant.price : product.price;
  const currentOriginalPrice = currentVariant ? currentVariant.originalPrice : product.originalPrice;
  const currentWeight = currentVariant ? `${currentVariant.weight}${currentVariant.unit}` : `${product.weight}${product.unit}`;
  
  const itemId = currentVariant ? `${product.id}_${currentVariant.id}` : product.id;
  const cartItem = items.find((i) => i.itemId === itemId);
  const qty = cartItem?.qty || 0;

  const hasVariantStock = currentVariant && currentVariant.stock !== undefined && currentVariant.stock !== null && currentVariant.stock !== "";
  const hasProductStock = product.stock !== undefined && product.stock !== null && product.stock !== "";
  
  let stockCount = Infinity;
  let hasStockLimit = false;
  
  if (hasVariantStock) {
    stockCount = Number(currentVariant.stock);
    hasStockLimit = true;
  } else if (hasProductStock) {
    stockCount = Number(product.stock);
    hasStockLimit = true;
  }

  const isOutOfStock = !product.inStock || 
                      (currentVariant ? !currentVariant.inStock : false) || 
                      (hasStockLimit && stockCount <= 0);

  const isMaxQtyReached = hasStockLimit && qty >= stockCount;

  const handleAddToCart = () => {
    if (isMaxQtyReached) {
      toast.error(`Only ${stockCount} items left in stock!`);
      return;
    }
    addItem(product, currentVariant?.id);
    if (qty === 0) {
      toast.success(`${currentWeight} added to cart!`);
    } else {
      toast.success(`Increased quantity to ${qty + 1}!`);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pb-36 md:pb-12">
        <div className="max-w-6xl mx-auto md:p-6 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 md:bg-white md:rounded-[40px] md:border md:border-gray-100 md:shadow-[0_15px_40px_rgba(0,0,0,0.03)] md:overflow-hidden p-0 md:p-4">
            
            {/* Unique Product Image Section - Floating gallery container */}
            <div className="relative bg-gradient-to-tr from-green-50/40 via-gray-50 to-white flex items-center justify-center p-6 h-[340px] md:h-[500px] md:rounded-[32px] overflow-hidden border-b md:border border-gray-100/50 shadow-inner">
              
              {/* Back & Share Float Controls */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border border-gray-100 text-gray-700">
                  <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                
                <div className="flex items-center gap-2">
                  {/* Premium Heart Wishlist Button */}
                  <button 
                    onClick={() => toggleWishlist(product)} 
                    className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center hover:scale-[1.08] active:scale-90 transition-all duration-300 border border-gray-100 text-gray-700"
                    title={isWishlisted ? "Remove from Favorites" : "Save to Favorites"}
                  >
                    <Heart 
                      size={18} 
                      strokeWidth={2.5}
                      className={`transition-all duration-300 ${isWishlisted ? 'text-red-500 fill-red-500 animate-heart-pop' : 'text-gray-600 hover:text-red-500'}`} 
                    />
                  </button>

                  <button onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard! 📋');
                    }
                  }} className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border border-gray-100 text-gray-700">
                    <Share2 size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <img
                src={getOptimizedImageUrl(product.image, 800)}
                alt={product.name}
                className="max-h-[85%] max-w-[85%] object-contain mix-blend-multiply drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] transform hover:scale-110 transition-transform duration-500"
                decoding="async"
                onError={(e) => { e.target.src = `https://picsum.photos/seed/${product.id}/400/400`; }}
              />
              {product.discount > 0 && (
                <span className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black px-3.5 py-1.5 rounded-2xl text-[10px] shadow-lg tracking-widest uppercase animate-pulse">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            {/* Product Details Section - Slide-up sheet aesthetics */}
            <div className="bg-white rounded-t-[40px] -mt-10 relative z-10 px-6 pt-8 pb-8 md:rounded-none md:mt-0 md:p-6 lg:p-8 flex flex-col justify-between">
              <div>
                {/* Mobile top pull-bar indicator */}
                <div className="w-16 h-1.5 bg-gray-200/80 rounded-full mx-auto mb-6 md:hidden" />

                {/* Price & Add to Cart Row (Separated side-by-side) directly below image */}
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100/80">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Price</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-gray-900 leading-none">{formatPrice(currentPrice)}</span>
                      {currentOriginalPrice > currentPrice && (
                        <span className="text-xs text-gray-400 line-through font-medium">{formatPrice(currentOriginalPrice)}</span>
                      )}
                    </div>
                  </div>

                  <div className="w-auto">
                    {!isOutOfStock ? (
                      qty === 0 ? (
                        <button
                          onClick={handleAddToCart}
                          className="bg-[#1CA672] hover:bg-[#17905F] text-white font-black px-5 py-2.5 rounded-xl shadow-md shadow-green-100 active:scale-95 transition-all flex items-center gap-1.5 text-xs uppercase tracking-wider"
                        >
                          <Plus size={14} strokeWidth={3} /> Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-3.5 bg-[#1CA672] text-white font-black px-3.5 py-2 rounded-xl shadow-md shadow-green-100 text-xs">
                          <button onClick={() => updateQty(itemId, qty - 1)} className="hover:scale-110 active:scale-95 transition-transform">
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="font-black w-4 text-center">{qty}</span>
                          <button 
                            onClick={handleAddToCart} 
                            className={`hover:scale-110 active:scale-95 transition-transform ${isMaxQtyReached ? 'opacity-40 cursor-not-allowed' : ''}`}
                            disabled={isMaxQtyReached}
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-xs font-bold text-red-500 border border-red-200 px-3.5 py-2 rounded-xl bg-red-50">Out of Stock</span>
                    )}
                  </div>
                </div>

                {/* Brand + Name */}
                <span className="text-[10px] text-[#1CA672] font-black uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">{product.brand || 'G Mart'}</span>
                <h2 className="text-2xl md:text-4xl font-black text-gray-900 mt-3 leading-tight tracking-tight">{product.name}</h2>

                {/* Rating & Delivery Badges */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-lg">
                    <Star size={13} fill="#D97706" className="text-amber-500" />
                    <span className="text-xs font-black text-amber-700">{product.rating}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-bold">{product.reviewCount.toLocaleString()} reviews</span>
                  <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                  <span className="text-[10px] text-gray-600 font-black bg-gray-100 px-2.5 py-1 rounded-lg uppercase tracking-wide">10 MIN DELIVERY</span>
                </div>

                {/* Size/Variant Selector */}
                {hasVariants && (
                  <div className="mt-8">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Variant</p>
                    <div className="grid grid-cols-2 gap-3">
                      {variants.map((v, i) => {
                        const isVarOutOfStock = !v.inStock || (v.stock !== undefined && v.stock !== null && v.stock !== "" && Number(v.stock) <= 0);
                        return (
                          <button
                            key={v.id}
                            disabled={isVarOutOfStock}
                            onClick={() => setSelectedVariantIdx(i)}
                            className={`px-4 py-3 rounded-2xl text-xs font-black border-2 transition-all relative text-left flex flex-col justify-between h-16 ${
                              selectedVariantIdx === i
                                ? 'border-[#1CA672] bg-green-50/40 text-[#1CA672] shadow-md shadow-green-100/50 scale-[1.02]'
                                : isVarOutOfStock 
                                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                  : 'border-gray-100 text-gray-700 hover:border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                          >
                            <span className="opacity-90">{v.weight}{v.unit}</span>
                            <span className="text-sm font-black">{formatPrice(v.price)}</span>
                            {isVarOutOfStock && (
                              <span className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">OUT</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unique G Mart Trust Highlights Dashboard */}
                <div className="grid grid-cols-3 gap-3 mt-8 border-t border-b border-gray-100 py-6">
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-2xl hover:scale-102 transition-transform duration-300">
                    <Shield size={22} className="text-[#1CA672] mb-1.5" />
                    <span className="text-[10px] font-black text-gray-800">100% Quality</span>
                    <span className="text-[8px] text-gray-400 font-bold mt-0.5">Assured</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-2xl hover:scale-102 transition-transform duration-300">
                    <Zap size={22} className="text-amber-500 mb-1.5" />
                    <span className="text-[10px] font-black text-gray-800">10 Min Delivery</span>
                    <span className="text-[8px] text-gray-400 font-bold mt-0.5">Instant dispatch</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-2xl hover:scale-102 transition-transform duration-300">
                    <Leaf size={22} className="text-emerald-600 mb-1.5" />
                    <span className="text-[10px] font-black text-gray-800">Fresh & Safe</span>
                    <span className="text-[8px] text-gray-400 font-bold mt-0.5">Hygienic pack</span>
                  </div>
                </div>

                {/* Description Block */}
                <div className="mt-6">
                  <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-2.5">Product Description</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-semibold">{product.description}</p>
                </div>

                {/* Reviews Section */}
                <div className="mt-10 pt-8 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-gray-900 text-lg tracking-tight">Customer Reviews</h3>
                    <button 
                      onClick={() => {
                        if (!user) {
                          toast.error('Please log in to write a review');
                          navigate('/profile');
                          return;
                        }
                        setIsReviewModalOpen(true);
                      }}
                      className="text-xs font-black text-[#1CA672] bg-green-50 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      Write a Review
                    </button>
                  </div>
                  <ReviewList productId={product.id} />
                </div>
              </div>
            </div>

          </div>

          <ReviewModal 
            isOpen={isReviewModalOpen} 
            onClose={() => setIsReviewModalOpen(false)} 
            product={product} 
          />

          {/* Similar Products */}
          {similar.length > 0 && (
            <div className="mt-8 bg-white md:rounded-[32px] md:border md:border-gray-100 md:p-8 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.02)]">
              <h3 className="font-black text-gray-900 text-lg mb-5 tracking-tight">You May Also Like</h3>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4" style={{ width: 'max-content' }}>
                  {similar.map((p) => (
                    <div key={p.id} className="w-40">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </Layout>
  );
}
