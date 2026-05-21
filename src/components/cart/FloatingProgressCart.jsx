import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Zap, X } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAdminStore } from '../../store/adminStore';

export default function FloatingProgressCart() {
  const navigate = useNavigate();
  const location = useLocation();
  const items = useCartStore((s) => s.items);
  const computed = useCartStore((s) => s.computed)();
  const subtotal = computed.subtotal;
  const storeSettings = useAdminStore((s) => s.storeSettings) || {};

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const freeDeliveryAbove = Number(storeSettings?.freeDeliveryAbove) || 0;

  const [isDismissed, setIsDismissed] = useState(false);

  // Auto-reset dismissal when items are added/removed to show updated status
  useEffect(() => {
    setIsDismissed(false);
  }, [totalItems]);

  // Paths where the floating cart should be HIDDEN
  const hidePaths = [
    '/cart', 
    '/checkout', 
    '/order-success', 
    '/profile', 
    '/orders', 
    '/admin', 
    '/install', 
    '/delivery-dashboard'
  ];
  const shouldHide = hidePaths.some(p => location.pathname.startsWith(p)) || totalItems === 0 || isDismissed;

  if (shouldHide) return null;

  // Calculate progress metrics
  const amountNeeded = Math.max(0, freeDeliveryAbove - subtotal);
  const rawPercent = freeDeliveryAbove > 0 ? (subtotal / freeDeliveryAbove) * 100 : 100;
  const percentage = Math.min(100, Math.round(rawPercent));

  // Determine localized Hinglish psychological message & color theme
  let statusMessage = '';
  let accentColor = 'bg-amber-500';
  let messageColor = 'text-amber-700 dark:text-amber-300';
  let bannerBg = 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20';

  if (percentage < 30) {
    statusMessage = `Cart me kuch aur daalo! 🛒 ₹${amountNeeded} add kijiye free delivery ke liye.`;
    accentColor = 'bg-rose-500';
    messageColor = 'text-rose-700 dark:text-rose-300';
    bannerBg = 'from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-red-950/10';
  } else if (percentage >= 30 && percentage < 75) {
    statusMessage = `Mast deal! Bas ₹${amountNeeded} aur chahiye FREE delivery ke liye. 🌟`;
    accentColor = 'bg-amber-500';
    messageColor = 'text-amber-700 dark:text-amber-300';
    bannerBg = 'from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-yellow-950/10';
  } else if (percentage >= 75 && percentage < 100) {
    statusMessage = `Bohot pass ho! Bas ₹${amountNeeded} aur, fir FREE delivery! 🚀`;
    accentColor = 'bg-emerald-500';
    messageColor = 'text-emerald-700 dark:text-emerald-300';
    bannerBg = 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10';
  } else {
    statusMessage = `Arre waah! FREE delivery unlocked! 🥳 zero delivery charge lagega.`;
    accentColor = 'bg-[#1CA672]';
    messageColor = 'text-green-700 dark:text-green-400';
    bannerBg = 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10';
  }

  return (
    <div className="fixed bottom-[76px] md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-[360px] z-[45] animate-in slide-in-from-bottom duration-300">
      <div className="relative bg-white/97 dark:bg-gray-900/97 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden">
        
        {/* Dismiss Close Button */}
        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white transition-all z-50 cursor-pointer"
          aria-label="Dismiss cart alert"
        >
          <X size={12} strokeWidth={2.5} />
        </button>

        {/* Progress Section (Only show if threshold is active (> 0)) */}
        {freeDeliveryAbove > 0 && (
          <div className={`px-3 pt-2 pb-1.5 bg-gradient-to-r ${bannerBg} border-b border-gray-100 dark:border-gray-800`}>
            
            {/* Contextual Message */}
            <div className="flex items-center gap-1.5 mb-1 pr-6">
              <Zap size={11} className={`${percentage >= 100 ? 'text-green-500 animate-pulse' : 'text-amber-500 animate-bounce'}`} fill="currentColor" />
              <span className={`text-[10px] font-black tracking-tight leading-none ${messageColor}`}>
                {statusMessage}
              </span>
            </div>

            {/* Premium Animated Progress Track */}
            <div className="relative h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-visible mt-1.5">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${
                  percentage >= 100 ? 'bg-gradient-to-r from-emerald-500 to-[#1CA672] rainbow-glow-bar' : accentColor
                }`}
                style={{ width: `${percentage}%` }}
              />
              
              {/* Animated delivery truck sitting on the progress node */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-[0_1.5px_6px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-gray-700 text-xs transition-all duration-500 ease-out animate-truck-drive"
                style={{ left: `${percentage}%` }}
              >
                <span className="inline-block text-[9px] transform -scale-x-100">🚚</span>
              </div>
            </div>
          </div>
        )}

        {/* CTA Banner Section */}
        <div className="p-2.5 md:p-3 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-50 dark:bg-green-950/30 text-[#1CA672] rounded-xl flex items-center justify-center shrink-0">
              <ShoppingBag size={16} className="animate-bounce" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest leading-none">Your Cart</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-black text-gray-900 dark:text-white">₹{subtotal}</span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">({totalItems} items)</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/cart')}
            className="flex items-center gap-1.5 bg-[#1CA672] hover:bg-[#17905F] text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md shadow-green-500/10 active:scale-95 transition-all"
          >
            <span>View Cart</span>
            <ArrowRight size={14} className="animate-pulse" />
          </button>
        </div>

      </div>
    </div>
  );
}
