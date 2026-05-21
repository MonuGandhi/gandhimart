import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Truck, Clock, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import CartItem from '../components/cart/CartItem';
import PriceSummary from '../components/cart/PriceSummary';
import { useCartStore, getAdjustedCartItems } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useAdminStore } from '../store/adminStore';
import { formatPrice } from '../utils/helpers';
import { getFlashSaleTimeData } from '../utils/flashSale';
import toast from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const rawItems = useCartStore((s) => s.items);
  const adminProducts = useAdminStore((s) => s.adminProducts);
  const items = getAdjustedCartItems(rawItems);
  const computed = useCartStore((s) => s.computed)();
  const user = useAuthStore((s) => s.user);
  const storeSettings = useAdminStore((s) => s.storeSettings);
  const [showPreOrderModal, setShowPreOrderModal] = useState(false);

  const hasFlashSaleItems = items.some(item => item.isFlashSale);
  const [timeData, setTimeData] = useState(() => getFlashSaleTimeData());

  useEffect(() => {
    if (!hasFlashSaleItems) return;
    const interval = setInterval(() => {
      setTimeData(getFlashSaleTimeData());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasFlashSaleItems]);

  const formatTime = (totalSeconds) => {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag size={64} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Looks like you haven't added anything to your cart yet.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#1CA672] text-white font-bold px-8 py-3.5 rounded-2xl w-full active:scale-95 transition-transform"
          >
            Start Shopping
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 md:grid md:grid-cols-12 md:gap-8 max-w-7xl mx-auto pb-32">
        <div className="md:col-span-8 space-y-4">
          
          {/* Happy Hour Price Lock Alert */}
          {hasFlashSaleItems && (
            <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 dark:from-red-950/20 dark:via-orange-950/20 dark:to-amber-950/20 rounded-3xl p-4 border border-red-500/20 dark:border-red-500/30 flex items-start gap-3.5 shadow-md shadow-red-500/5 transition-all duration-300">
              <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 shrink-0 border border-red-500/15">
                <Clock size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tight">
                  ⚡ "Happy Hour" Price Lock Active
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold mt-1 leading-relaxed">
                  Discount prices are locked! Complete checkout in <span className="font-mono font-black text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/10 select-none inline-block">{formatTime(timeData.remainingSeconds)}</span> to secure this rate before standard prices revert.
                </p>
              </div>
            </div>
          )}

          {/* Premium Free Delivery Progress Bar */}
          {storeSettings?.freeDeliveryAbove > 0 && (() => {
            const freeDeliveryAbove = Number(storeSettings.freeDeliveryAbove) || 0;
            const amountNeeded = Math.max(0, freeDeliveryAbove - computed.subtotal);
            const percentage = Math.min(100, Math.round((computed.subtotal / freeDeliveryAbove) * 100));
            
            let hinglishText = '';
            let colorClass = 'text-amber-600 dark:text-amber-400';
            let progressBg = 'bg-gradient-to-r from-amber-400 to-emerald-500';
            let bannerBg = 'from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10';

            if (percentage < 30) {
              hinglishText = `Cart me kuch aur daalo! 🛒 Bachaayein delivery charges.`;
              colorClass = 'text-rose-600 dark:text-rose-400';
              progressBg = 'bg-gradient-to-r from-rose-400 to-red-500';
              bannerBg = 'from-rose-50/40 to-rose-100/30 dark:from-rose-950/10 dark:to-red-950/10';
            } else if (percentage >= 30 && percentage < 75) {
              hinglishText = `Mast deal! Bas ₹${amountNeeded} ki zaroorat hai free delivery ke liye. 🌟`;
              colorClass = 'text-amber-600 dark:text-amber-400';
              progressBg = 'bg-gradient-to-r from-amber-400 to-yellow-500';
              bannerBg = 'from-amber-50/50 to-amber-100/30 dark:from-amber-950/10 dark:to-yellow-950/10';
            } else if (percentage >= 75 && percentage < 100) {
              hinglishText = `Bohot pass ho! Bas ₹${amountNeeded} aur daalo, delivery fee absolute ZERO! 🚀`;
              colorClass = 'text-emerald-600 dark:text-[#34d399]';
              progressBg = 'bg-gradient-to-r from-emerald-400 to-teal-500';
              bannerBg = 'from-emerald-50/40 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10';
            } else {
              hinglishText = `Arre waah! FREE delivery unlocked! 🥳 Zero delivery charges applied!`;
              colorClass = 'text-emerald-600 dark:text-[#34d399]';
              progressBg = 'bg-gradient-to-r from-emerald-500 to-[#1CA672] rainbow-glow-bar';
              bannerBg = 'from-green-50/40 to-emerald-50/30 dark:from-green-950/10 dark:to-emerald-950/10';
            }

            return (
              <div className={`bg-gradient-to-b ${bannerBg} dark:bg-[#0b0f19] rounded-3xl p-5 border border-gray-100 dark:border-slate-800/80 shadow-md transition-all duration-300 relative overflow-visible`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-2xl shrink-0 ${
                      percentage >= 100 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-[#34d399]' 
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                    }`}>
                      <Truck size={20} className={percentage >= 100 ? 'animate-bounce text-[#1CA672]' : 'animate-pulse text-amber-500'} />
                    </div>
                    <div>
                      {percentage >= 100 ? (
                        <h4 className="text-base font-black text-emerald-600 dark:text-[#34d399] leading-tight">
                          Free Delivery Unlocked! 🎉
                        </h4>
                      ) : (
                        <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                          Add <span className="text-[#1CA672] dark:text-[#34d399] font-black">{formatPrice(amountNeeded)}</span> more for <span className="font-black text-[#1CA672] dark:text-[#34d399]">FREE Delivery</span>!
                        </h4>
                      )}
                      <p className={`text-xs font-bold ${colorClass} mt-1 leading-tight`}>
                        {hinglishText}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1.5">
                        Cart Subtotal: {formatPrice(computed.subtotal)} / Threshold: {formatPrice(freeDeliveryAbove)}
                      </p>
                    </div>
                  </div>
                  {percentage < 100 && (
                    <button 
                      onClick={() => navigate('/')} 
                      className="text-[10px] font-black text-[#1CA672] dark:text-[#34d399] uppercase tracking-widest bg-green-50/80 dark:bg-green-950/30 px-3.5 py-2 rounded-xl hover:bg-[#1CA672] hover:text-white dark:hover:bg-[#34d399] dark:hover:text-black active:scale-95 transition-all shrink-0 shadow-sm"
                    >
                      Shop More
                    </button>
                  )}
                </div>
                
                {/* Premium riding truck progress track */}
                <div className="relative w-full h-3.5 bg-gray-200/80 dark:bg-slate-800 rounded-full mt-4 shadow-inner overflow-visible">
                  {/* Dynamic animated progress fill */}
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${progressBg}`}
                    style={{ width: `${percentage}%` }}
                  />
                  
                  {/* Animated delivery truck sitting on the progress node */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-100 dark:border-gray-700 text-xs transition-all duration-700 ease-out animate-truck-drive"
                    style={{ left: `${percentage}%` }}
                  >
                    <span className="inline-block text-[12px] transform -scale-x-100">🚚</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Items List */}
          <div className="bg-white dark:bg-[#0b0f19] rounded-2xl p-4 md:p-6 border border-gray-100 dark:border-slate-800/80 transition-colors duration-300">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 md:text-lg">Items in Cart</h3>
            <div>
              {items.map((item) => (
                <CartItem key={item.itemId} item={item} />
              ))}
            </div>
          </div>

          {/* Pre-Launch / Catalog Only Banner */}
          {storeSettings?.isPreOrderMode && (
            <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-2xl p-5 border border-purple-500/20 relative overflow-hidden shadow-sm dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20">
              {/* Decorative elements */}
              <div className="absolute right-0 top-0 text-7xl opacity-10 pointer-events-none transform translate-x-4 -translate-y-4 animate-pulse">
                🚀
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-pink-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md animate-bounce-slow">
                  <span className="text-xl">🚀</span>
                </div>
                <div className="space-y-1">
                  <span className="inline-block bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Catalog Only Mode
                  </span>
                  <h4 className="font-extrabold text-gray-900 dark:text-white leading-tight">
                    Ordering is Paused (Launching Soon)
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
                    {storeSettings.preOrderMessage || `Ordering starts on ${storeSettings.launchDateText || '15 July'}! Explore G Mart catalog until then! 🎉`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-4 space-y-4 mt-4 md:mt-0">
          {/* Price Summary */}
          <PriceSummary />

          {/* Desktop Checkout Bar */}
          <div className="hidden md:block">
            <button
              onClick={() => {
                if (storeSettings?.isPreOrderMode) {
                  setShowPreOrderModal(true);
                  return;
                }
                if (!user) {
                  toast.error('Pehle login karo bhai! 😊');
                  navigate('/profile');
                } else {
                  navigate('/checkout');
                }
              }}
              className="w-full bg-[#1CA672] text-white flex items-center justify-between px-6 py-4 rounded-2xl shadow-lg hover:bg-[#17905F] hover:-translate-y-0.5 transition-all"
            >
              <div className="text-left">
                <p className="text-sm text-green-100 font-medium mb-0.5">Total Amount</p>
                <p className="font-black text-2xl leading-none">{formatPrice(computed.grandTotal)}</p>
              </div>
              <div className="flex items-center gap-1 font-bold text-lg">
                Proceed to Checkout <ChevronRight size={24} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="md:hidden fixed bottom-[66px] left-0 w-full bg-white dark:bg-[#0b0f19] border-t border-gray-100 dark:border-slate-800/80 p-4 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => {
            if (storeSettings?.isPreOrderMode) {
              setShowPreOrderModal(true);
              return;
            }
            if (!user) {
              toast.error('Pehle login karo bhai! 😊');
              navigate('/profile');
            } else {
              navigate('/checkout');
            }
          }}
          className="w-full bg-[#1CA672] text-white flex items-center justify-between px-5 py-3.5 rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
        >
          <div className="text-left">
            <p className="text-xs text-green-100 font-medium mb-0.5">Total Amount</p>
            <p className="font-black text-lg leading-none">{formatPrice(computed.grandTotal)}</p>
          </div>
          <div className="flex items-center gap-1 font-bold">
            Proceed to Checkout <ChevronRight size={18} />
          </div>
        </button>
      </div>

      {/* Pre-Launch / Catalog Only Modal overlay */}
      {showPreOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-all duration-300 animate-in fade-in">
          <div className="bg-white dark:bg-[#0b0f19] w-full max-w-md rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Glowing gradient background blur inside the modal card for rich premium look */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center relative z-10">
              {/* Close Button */}
              <button 
                onClick={() => setShowPreOrderModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Bouncing Rocket */}
              <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6 relative animate-bounce-slow">
                <span className="text-5xl">🚀</span>
                {/* Tiny stars/sparks floating around */}
                <span className="absolute -top-2 -left-2 text-xl animate-pulse">✨</span>
                <span className="absolute -bottom-2 -right-2 text-xl animate-pulse">✨</span>
              </div>

              {/* Breathtaking Title */}
              <h3 className="text-2xl font-black italic tracking-tight text-gray-900 dark:text-white mb-2">
                G Mart Launching Soon!
              </h3>
              
              {/* Glowing launch date chip */}
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md shadow-indigo-600/20 mb-6">
                <span>📅</span> LAUNCHING: {storeSettings?.launchDateText || '15 July'}
              </div>

              {/* Custom description text */}
              <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold leading-relaxed mb-8 max-w-sm">
                {storeSettings?.preOrderMessage || '🛒 Ordering starts on 15 July! Explore G Mart catalog until then! 🎉'}
              </p>

              {/* Premium Close button */}
              <button
                onClick={() => setShowPreOrderModal(false)}
                className="w-full bg-gradient-to-r from-[#1CA672] to-[#158F5F] text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-green-500/20 hover:brightness-105 active:scale-98 transition-all"
              >
                Okay, Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
