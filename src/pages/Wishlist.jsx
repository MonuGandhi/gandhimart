import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/ui/ProductCard';
import { useWishlistStore } from '../store/wishlistStore';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const navigate = useNavigate();
  const wishlistItems = useWishlistStore((s) => s.items);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);

  const handleClearAll = () => {
    if (window.confirm("Bhai, kya aap sachme saare favorite items hatana chahte hain? 💔")) {
      clearWishlist();
      toast.success("Wishlist cleared! 🧹");
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 min-h-[85vh] flex flex-col">
        {/* Header Block */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-600 dark:text-gray-400"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                My Wishlist <Heart size={22} className="text-red-500 fill-red-500 animate-bounce" />
              </h1>
              <p className="text-xs font-semibold text-gray-400 mt-1 dark:text-gray-500">
                {wishlistItems.length === 0 ? 'No saved items' : `${wishlistItems.length} items saved for later`}
              </p>
            </div>
          </div>
          {wishlistItems.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-black transition-colors"
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {/* Content Section */}
        {wishlistItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            {/* Pulsing Heart Illustration */}
            <div className="w-40 h-40 bg-red-50/50 dark:bg-red-950/10 rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-red-100/30 dark:bg-red-900/10 rounded-full animate-ping opacity-70" />
              <div className="w-28 h-28 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg border border-red-100/50 dark:border-slate-800">
                <Heart size={44} className="text-red-300 dark:text-red-800 fill-red-50/50 dark:fill-red-950/10" strokeWidth={1.5} />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aapki Wishlist Khaali Hai! 💔</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-8 leading-relaxed font-semibold">
              Looks like you haven't saved any items yet. Tap the heart (❤️) icon on products to save them for later!
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="bg-[#1CA672] text-white font-black text-base px-10 py-4 rounded-2xl shadow-lg shadow-green-500/20 hover:bg-[#17905F] active:scale-95 transition-all"
            >
              Explore Products 🛍️
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlistItems.map((product) => (
              <div key={product.id} className="animate-in fade-in zoom-in-95 duration-200">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
