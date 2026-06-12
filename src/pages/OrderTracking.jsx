import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, Clock, Package, Truck, MapPin, X, Phone, MessageCircle,
  ShoppingBag, ShieldCheck, Box, PartyPopper, AlertCircle, ShoppingCart, RotateCcw, Wallet
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useOrdersStore } from '../store/ordersStore';
import { useAdminStore } from '../store/adminStore';
import { formatDate, formatPrice } from '../utils/helpers';
import { getOptimizedImageUrl } from '../utils/imageUtils';

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const getOrder = useOrdersStore((s) => s.getOrder);
  
  const [order, setOrder] = useState(getOrder(id));
  const [showHelp, setShowHelp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const storeSettings = useAdminStore((s) => s.storeSettings) || {};
  const cancelOrder = useOrdersStore((s) => s.cancelOrder);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    // Keep local order state in sync with store
    const interval = setInterval(() => {
      const freshOrder = getOrder(id);
      if (freshOrder) setOrder(freshOrder);
    }, 1000);
    return () => clearInterval(interval);
  }, [id, getOrder]);

  useEffect(() => {
    if (!order || order.status !== 'placed') {
      setTimeout(() => setTimeLeft(0), 0);
      return;
    }
    
    const placedTime = new Date(order.placedAt).getTime();
    const expiryTime = placedTime + (3 * 60 * 1000); // 3 minutes
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeft(diff);
      if (diff === 0) clearInterval(timer);
    }, 1000);
    
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.placedAt, order?.status]);

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setCancelling(true);
    await cancelOrder(order.id);
    setCancelling(false);
    setShowCancelModal(false);
  };

  if (!order) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] dark:bg-slate-950">
          <p className="text-gray-500 font-medium dark:text-gray-400">Order not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-[#1CA672] dark:text-[#34d399] font-semibold">Go Back</button>
        </div>
      </Layout>
    );
  }

  const getIcon = (key) => {
    switch (key) {
      case 'placed': return ShoppingBag;
      case 'confirmed': return ShieldCheck;
      case 'packing': return Box;
      case 'out_for_delivery': return Truck;
      case 'delivered': return PartyPopper;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const getStepStyles = (key, done, isNext) => {
    if (done) {
      return { 
        bg: 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-500 dark:border-emerald-600 shadow-sm', 
        line: 'bg-emerald-500 dark:bg-emerald-600', 
        textClass: 'text-gray-900 dark:text-white font-black' 
      };
    }
    if (isNext) {
      let glowClass = 'animate-glow-emerald border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
      if (key === 'packing') glowClass = 'animate-glow-amber border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20';
      if (key === 'out_for_delivery') glowClass = 'animate-glow-blue border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      if (key === 'confirmed') glowClass = 'animate-glow-teal border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-950/20';
      if (key === 'cancelled') glowClass = 'animate-glow-red border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20';

      return { 
        bg: glowClass, 
        line: 'timeline-line-animated', 
        textClass: 'text-[#1CA672] dark:text-[#34d399] font-black' 
      };
    }
    return { 
      bg: 'bg-white dark:bg-slate-900 text-gray-300 dark:text-gray-700 border-gray-200 dark:border-gray-800', 
      line: 'bg-gray-100 dark:bg-gray-800', 
      textClass: 'text-gray-400 dark:text-gray-600 font-medium' 
    };
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'placed': 
        return "Aapka order hum tak pahunch chuka hai. Hum jaldi hi isko swikar karke tayyari shuru karenge! 🛒";
      case 'confirmed': 
        return "Aapka order store ne swikar kar liya hai. Humare retail partners jaldi hi packing suru karenge! ✨";
      case 'packing': 
        return "Aapke products ko extreme hygiene ke sath pack kiya ja raha hai. Freshness guaranteed! 📦";
      case 'out_for_delivery': 
        return "Mubarak ho! Aapka delivery partner order lekar nikal chuka hai. Palkein bichayein! 🛵💨";
      case 'delivered': 
        return "Congratulations! Order safely deliver ho chuka hai. Hame aasha hai aapko products pasand aaye honge! 🎉🛍️";
      case 'cancelled': 
        return "Ye order cancel kar diya gaya hai. Agar aapne online payment kiya tha toh refund wallet me credit ho gaya hai. 💸";
      default: 
        return "Aapka order process ho raha hai. Hum real-time updates bhejte rahenge.";
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'placed': return "🛒";
      case 'confirmed': return "✨";
      case 'packing': return "📦";
      case 'out_for_delivery': return "🛵";
      case 'delivered': return "🎉";
      case 'cancelled': return "💸";
      default: return "⏳";
    }
  };

  const getStatusIllustration = (status) => {
    switch (status) {
      case 'placed':
        return (
          <div className="relative w-20 h-20 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl animate-breathe border border-emerald-100 dark:border-emerald-900/30">
            <ShoppingBag className="w-10 h-10 text-emerald-500 animate-bounce-slow" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>
        );
      case 'confirmed':
        return (
          <div className="relative w-20 h-20 flex items-center justify-center bg-teal-50 dark:bg-teal-950/20 rounded-3xl animate-breathe border border-teal-100 dark:border-teal-900/30">
            <ShieldCheck className="w-10 h-10 text-teal-500" />
            <div className="absolute top-1 left-2 text-teal-400 text-xs animate-pulse">✦</div>
            <div className="absolute bottom-2 right-2 text-teal-400 text-xs animate-bounce">✦</div>
          </div>
        );
      case 'packing':
        return (
          <div className="relative w-20 h-20 flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 rounded-3xl animate-breathe border border-amber-100 dark:border-amber-900/30">
            <Box className="w-10 h-10 text-amber-500 animate-pulse" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce" />
          </div>
        );
      case 'out_for_delivery':
        return (
          <div className="relative w-24 h-20 flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/20 rounded-3xl overflow-hidden border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-1 animate-bounce-slow">
              <Truck className="text-blue-500 w-9 h-9 animate-pulse" />
            </div>
            <svg className="w-16 h-2 mt-1" viewBox="0 0 60 4">
              <line x1="0" y1="2" x2="60" y2="2" stroke="#3b82f6" strokeWidth="2.5" className="animate-road-flow" />
            </svg>
          </div>
        );
      case 'delivered':
        return (
          <div className="relative w-20 h-20 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl animate-breathe border border-emerald-100 dark:border-emerald-900/30">
            <PartyPopper className="w-10 h-10 text-emerald-500 animate-bounce-slow" />
            <div className="absolute -top-1 left-2 text-emerald-400 text-[10px] animate-ping">✦</div>
            <div className="absolute bottom-1 right-2 text-amber-400 text-xs animate-bounce">★</div>
          </div>
        );
      case 'cancelled':
        return (
          <div className="relative w-20 h-20 flex items-center justify-center bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/30">
            <AlertCircle className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
        );
      default:
        return (
          <div className="relative w-20 h-20 flex items-center justify-center bg-gray-50 dark:bg-slate-900 rounded-3xl animate-pulse">
            <Clock className="w-10 h-10 text-gray-400" />
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="bg-[#f8f9fa] dark:bg-slate-950 min-h-screen pb-24 transition-colors duration-300">
        {/* Top Navigation */}
        <div className="bg-white dark:bg-[#0b0f19] px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 sticky top-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-900 dark:text-white">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none">Order Status</h1>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">ID: {order.id.toString().slice(-8)}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHelp(true)}
            className="text-[10px] font-black text-[#1CA672] dark:text-[#34d399] uppercase tracking-widest border-2 border-[#1CA672]/20 dark:border-[#34d399]/20 px-3 py-1.5 rounded-full hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
          >
             Need Help?
          </button>
        </div>

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Celebrating complete orders */}
          {order.status === 'delivered' && (
            <div className="relative bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-500/20 rounded-[2rem] p-5 border border-emerald-500/20 dark:border-emerald-500/30 overflow-hidden text-center shadow-inner">
              <div className="absolute top-2 left-4 text-emerald-400 text-xs animate-pulse">✦</div>
              <div className="absolute top-3 right-5 text-teal-400 text-sm animate-ping">★</div>
              <div className="absolute bottom-2 left-6 text-emerald-300 text-sm animate-bounce">✦</div>
              <h3 className="text-base font-black text-emerald-700 dark:text-emerald-400 leading-none mb-1">Hurray! Delivered successfully 🎉</h3>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Aapka order deliver ho chuka hai!</p>
            </div>
          )}

          {/* Cancellation Section (Top & Compact) */}
          {order.status === 'placed' && timeLeft > 0 && (
            <div className="bg-white dark:bg-[#0b0f19] rounded-3xl p-4 border border-red-100 dark:border-red-950/30 shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white leading-none">Cancel Order?</h3>
                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-1">Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                  </div>
                </div>
                <button 
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-black px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/30 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {cancelling ? '...' : 'CANCEL NOW'}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight font-medium bg-gray-50 dark:bg-slate-900 p-2 rounded-lg">
                Aap 3 minutes ke andar cancel kar sakte hain. Confirm hone ke baad cancel nahi hoga.
              </p>
            </div>
          )}

          {/* Main Status Card */}
          <div className="bg-white dark:bg-[#0b0f19] rounded-[2.5rem] p-6 shadow-md border border-gray-100 dark:border-slate-800/80 relative overflow-hidden transition-colors duration-300">
             {/* Sparkle decorative background */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#1CA672]/5 to-transparent pointer-events-none rounded-full blur-xl" />
             
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                   {order.status === 'delivered' ? (
                     <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">Order <br/><span className="text-emerald-500">Delivered! 🎉</span></h2>
                   ) : order.status === 'cancelled' ? (
                     <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">Order <br/><span className="text-red-500">Cancelled ✕</span></h2>
                   ) : (
                     <div>
                       <p className="text-[10px] font-black text-[#1CA672] dark:text-[#34d399] uppercase tracking-widest mb-1 animate-pulse">Live Tracking</p>
                       <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                         Arriving in <br/>
                         <span className="text-[#1CA672] dark:text-[#34d399] animate-pulse">
                           {storeSettings.estimatedDeliveryTime || 10}-{parseInt(storeSettings.estimatedDeliveryTime || 10) + 5} Mins
                         </span>
                       </h2>
                     </div>
                   )}
                </div>
                {/* SVG Live Illustration based on status */}
                <div className="shrink-0">
                  {getStatusIllustration(order.status)}
                </div>
             </div>

             {/* Live contextual status text banner */}
             <div className="bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-4 mb-8 text-xs font-bold text-gray-600 dark:text-gray-300 leading-relaxed shadow-inner">
               <div className="flex items-start gap-2.5">
                 <span className="text-base select-none shrink-0">{getStatusEmoji(order.status)}</span>
                 <p className="flex-1">{getStatusDescription(order.status)}</p>
               </div>
             </div>

             {/* Modern Stepper */}
             <div className="relative pl-1">
                {(() => {
                  const orderSteps = order.steps || [
                    { key: 'placed', label: 'Order Placed', done: true, time: order.placedAt },
                    { key: 'confirmed', label: 'Confirmed', done: ['confirmed', 'packing', 'out_for_delivery', 'delivered'].includes(order.status), time: null },
                    { key: 'packing', label: 'Packing', done: ['packing', 'out_for_delivery', 'delivered'].includes(order.status), time: null },
                    { key: 'out_for_delivery', label: 'Out for Delivery', done: ['out_for_delivery', 'delivered'].includes(order.status), time: null },
                    { key: 'delivered', label: 'Delivered', done: order.status === 'delivered', time: null },
                    ...(order.status === 'cancelled' ? [{ key: 'cancelled', label: 'Cancelled by User', done: true, time: null }] : [])
                  ];

                  return orderSteps.map((step, index) => {
                    const Icon = getIcon(step.key);
                    const isLast = index === orderSteps.length - 1;
                    const isNext = !step.done && (index === 0 || orderSteps[index - 1].done);
                    const styles = getStepStyles(step.key, step.done, isNext);

                    return (
                      <div key={step.key} className="relative flex items-start gap-5 mb-9 last:mb-0">
                        {/* Vertical Line */}
                        {!isLast && (
                          <div className={`absolute top-8 left-[13px] w-[3px] h-10 rounded-full ${styles.line}`} />
                        )}

                        {/* Status Icon */}
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 border-2 ${styles.bg} text-xs font-bold`}>
                          {isNext && (
                            <span className="absolute -inset-1 rounded-full animate-ping bg-current opacity-20 pointer-events-none" />
                          )}
                          <Icon size={14} strokeWidth={2.5} />
                        </div>
                        
                        {/* Text Content */}
                        <div className={`flex-1 transition-opacity duration-300 ${step.done || isNext ? 'opacity-100' : 'opacity-35'}`}>
                          <h4 className={`text-sm tracking-tight ${styles.textClass}`}>
                            {step.label}
                          </h4>
                          {step.time ? (
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(step.time)}</p>
                          ) : isNext && (
                            <p className="text-[10px] font-black text-orange-500 dark:text-orange-400 mt-0.5 animate-pulse">Processing live...</p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
             </div>
          </div>

          {/* Delivery Partner Hero Card (if assigned) */}
          {order.assignedDeliveryBoy && (
            <div className="bg-white dark:bg-[#0b0f19] rounded-[2rem] p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 dark:border-[#34d399]/20">
                  <Truck size={24} className="text-[#1CA672] dark:text-[#34d399]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Your Delivery Hero</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{order.assignedDeliveryBoy.name}</p>
                  <p className="text-[10px] font-bold text-[#1CA672] dark:text-[#34d399] mt-0.5">Fast & Safe Delivery</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { window.open(`tel:+91${order.assignedDeliveryBoy.phone || '8607424026'}`); }} 
                  className="w-10 h-10 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors border border-green-100/30"
                >
                  <Phone size={18} />
                </button>
                <button 
                  onClick={() => { 
                    const waLink = `https://wa.me/91${order.assignedDeliveryBoy.phone || '8607424026'}?text=${encodeURIComponent(`Hi ${order.assignedDeliveryBoy.name || 'Rider'}, please update about order #${order.id.slice(-8)}`)}`;
                    window.open(waLink); 
                  }} 
                  className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors border border-emerald-100/30"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Location & Contact Section */}
          <div className="grid grid-cols-1 gap-4">
             <div className="bg-white dark:bg-[#0b0f19] rounded-[2rem] p-5 border border-gray-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4 transition-colors duration-300">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100/30">
                   <MapPin size={24} className="text-blue-500 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Delivering to</p>
                   <p className="text-sm font-black text-gray-900 dark:text-white truncate">{(order.address || order.deliveryAddress)?.name || 'Customer'}</p>
                   <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">{(order.address || order.deliveryAddress)?.address || (order.address || order.deliveryAddress)?.text || 'No address details'}</p>
                </div>
             </div>
          </div>

          {/* Items Summary - Clean List */}
          <div className="bg-white dark:bg-[#0b0f19] rounded-[2rem] p-6 border border-gray-100 dark:border-slate-800/80 shadow-sm transition-colors duration-300">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Order Summary</h3>
                <span className="text-[10px] font-black bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-md">{order.items.length} ITEMS</span>
             </div>
             
             <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden relative">
                         <img 
                           src={getOptimizedImageUrl(item.image, 200)} 
                           className="w-full h-full object-cover" 
                           loading="lazy"
                           alt={item.name}
                         />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1">{item.weight}{item.unit} x {item.qty}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(item.price * item.qty)}</p>
                  </div>
                ))}
             </div>

             <div className="mt-6 space-y-2 border-t border-dashed border-gray-100 dark:border-slate-800 pt-6">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{formatPrice(order.subtotal || order.totalAmount)}</span>
                </div>
                {order.productDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Product Discount</span>
                        <span className="font-bold text-[#1CA672]">-{formatPrice(order.productDiscount)}</span>
                    </div>
                )}
                {order.couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Coupon ({order.couponCode})</span>
                        <span className="font-bold text-[#1CA672]">-{formatPrice(order.couponDiscount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className={`font-bold ${order.deliveryFee === 0 ? 'text-[#1CA672]' : 'text-gray-800 dark:text-gray-200'}`}>
                        {order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}
                    </span>
                </div>
                {order.walletUsed > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Paid from Wallet</span>
                        <span className="font-bold text-[#1CA672]">-{formatPrice(order.walletUsed)}</span>
                    </div>
                )}
                <div className="h-px bg-gray-100 dark:bg-slate-800 my-2" />
                <div className="flex justify-between items-center">
                    <span className="text-base font-black text-gray-900 dark:text-white">Total Paid</span>
                    <span className="text-lg font-black text-gray-900 dark:text-white">{formatPrice(order.total)}</span>
                </div>
             </div>
          </div>

          {order.status === 'cancelled' && (
            <div className="relative overflow-hidden rounded-[2.5rem] border border-red-100 dark:border-red-900/30 bg-white dark:bg-[#0b0f19] shadow-lg">
              {/* Gradient Header */}
              <div className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 left-4 text-white text-4xl">✕</div>
                  <div className="absolute bottom-3 right-6 text-white text-3xl">✕</div>
                  <div className="absolute top-6 right-10 text-white text-2xl">✕</div>
                </div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                    <X size={36} strokeWidth={3} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Order Cancelled</h3>
                  <p className="text-white/80 text-sm font-bold mt-1">#{order.id?.slice(-8)}</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Refund Info */}
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <Wallet size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-900 dark:text-amber-300">Refund Status</p>
                    <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
                      {(order.walletUsed > 0 || order.paymentMethod === 'upi' || order.paymentMethod === 'scanner')
                        ? 'Aapka refund wallet mein process ho raha hai ya ho chuka hai. 💸'
                        : 'COD order tha, koi refund nahi tha. ✓'}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="flex items-start gap-3 bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 rounded-2xl p-4">
                  <span className="text-xl shrink-0">😔</span>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed">
                    Ye order cancel kar diya gaya hai. Hume umeed hai aap dobara order karenge! Hum hamesha aapki service ke liye taiyaar hain.
                  </p>
                </div>

                {/* Reorder CTA */}
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1CA672] to-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 active:scale-95 transition-all"
                >
                  <ShoppingCart size={20} />
                  Order Again
                </button>
              </div>
            </div>
          )}
        </div>


        {/* ─────────── Cancel Confirmation Modal ─────────── */}
        {showCancelModal && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => !cancelling && setShowCancelModal(false)}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-sm z-10 animate-in slide-in-from-bottom-12 duration-300">
              {/* Red gradient top bar */}
              <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 rounded-t-[2.5rem] p-6 text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/30">
                  <X size={28} strokeWidth={3} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-white">Cancel Order?</h3>
                <p className="text-white/80 text-xs font-bold mt-1">Ye action undo nahi ho sakta</p>
              </div>

              {/* White body */}
              <div className="bg-white dark:bg-[#0b0f19] rounded-b-[2.5rem] p-6 space-y-4">
                {/* Order info pill */}
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center shrink-0">
                    <Package size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Order ID</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">#{order?.id?.slice(-8)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Amount</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(order?.total || order?.totalAmount)}</p>
                  </div>
                </div>

                {/* Refund notice */}
                {(order?.walletUsed > 0 || order?.paymentMethod === 'upi' || order?.paymentMethod === 'scanner') && (
                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3">
                    <Wallet size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                      Aapka refund automatically wallet mein credit ho jayega.
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                    className="py-3.5 rounded-2xl font-black text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 text-sm"
                  >
                    Nahi, Rakho
                  </button>
                  <button
                    onClick={confirmCancel}
                    disabled={cancelling}
                    className="py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-red-200 dark:shadow-red-900/20 text-sm"
                  >
                    {cancelling ? (
                      <span className="flex items-center justify-center gap-2">
                        <RotateCcw size={14} className="animate-spin" /> Cancel ho raha...
                      </span>
                    ) : 'Haan, Cancel Karo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" onClick={() => setShowHelp(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div 
              className="relative w-full max-w-sm bg-white dark:bg-[#0b0f19] rounded-[2rem] p-6 z-10 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700">
                <X size={16} />
              </button>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Need Help?</h3>
              <div className="space-y-3">
                <button onClick={() => { window.open(`tel:+91${storeSettings.supportPhone || '8607424026'}`); setShowHelp(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-800">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Phone size={22} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-black text-gray-900 dark:text-white text-sm">Call Us</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">+91 {storeSettings.supportPhone || '8607424026'}</p>
                  </div>
                </button>
                <button 
                  onClick={() => { 
                    const rawLink = storeSettings.whatsappLink || `https://wa.me/91${storeSettings.supportPhone || '8607424026'}`;
                    const whatsappMsg = storeSettings.whatsappMessage ? `?text=${encodeURIComponent(storeSettings.whatsappMessage)}` : '';
                    const whatsappLink = rawLink.includes('?') ? `${rawLink}${storeSettings.whatsappMessage ? '&text=' + encodeURIComponent(storeSettings.whatsappMessage) : ''}` : `${rawLink}${whatsappMsg}`;
                    window.open(whatsappLink);
                    setShowHelp(false); 
                  }} 
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-800"
                >
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center shrink-0">
                    <MessageCircle size={22} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-black text-gray-900 dark:text-white text-sm">WhatsApp Chat</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Instant Support</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
