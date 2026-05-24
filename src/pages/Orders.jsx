import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Zap } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useOrdersStore } from '../store/ordersStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatDate, formatPrice } from '../utils/helpers';
import { getOptimizedImageUrl } from '../utils/imageUtils';

import toast from 'react-hot-toast';
import { useAdminStore } from '../store/adminStore';

export default function Orders() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      toast.error('Orders dekhne ke liye login karein! 😊');
      navigate('/profile');
    }
  }, [isLoggedIn, navigate]);

  const orders = useOrdersStore((s) => s.orders);
  const reorder = useOrdersStore((s) => s.reorder);
  const addItem = useCartStore((s) => s.addItem);
  const deliveryTime = useAdminStore((s) => s.storeSettings?.estimatedDeliveryTime || 10);

  const userOrders = orders.filter(o => 
    o.customerEmail?.toLowerCase() === user?.email?.toLowerCase()
  );

  if (!isLoggedIn) return null;

  const handleReorder = (orderId) => {
    reorder(orderId, addItem);
    toast.success('Items added to cart!');
    navigate('/cart');
  };



  const getStatusStyles = (status) => {
    switch (status) {
      case 'delivered': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' };
      case 'cancelled': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', dot: 'bg-rose-500' };
      case 'out_for_delivery': return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', dot: 'bg-indigo-500' };
      default: return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' };
    }
  };

  return (
    <Layout>
      <div className="bg-[#F6F8FA] min-h-screen p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Orders</h2>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
               <Package size={20} className="text-[#1CA672]" />
            </div>
          </div>

          {userOrders.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-10 text-center border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-[#1CA672]" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No orders yet</h3>
              <p className="text-sm text-gray-400 mb-8">Your shopping journey starts here!</p>
              <button onClick={() => navigate('/')} className="w-full bg-[#1CA672] text-white font-black py-4 rounded-2xl shadow-lg shadow-green-100 active:scale-95 transition-transform">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userOrders.map((order) => {
                const styles = getStatusStyles(order.status);
                return (
                  <div key={order.id} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    {/* Status Banner */}
                    <div className={`px-5 py-2.5 ${styles.bg} border-b ${styles.border} flex items-center justify-between`}>
                       <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${styles.color}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                       </div>
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                         {formatDate(order.placedAt)}
                       </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="relative">
                               <img 
                                 src={getOptimizedImageUrl(order.items[0]?.image, 200)} 
                                 className="w-16 h-16 rounded-2xl object-cover bg-gray-50 border border-gray-100 shadow-sm" 
                                 loading="lazy"
                               />
                               {order.items.length > 1 && (
                                 <div className="absolute -bottom-2 -right-2 bg-gray-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                                   +{order.items.length - 1}
                                 </div>
                               )}
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Order Total</p>
                               <h4 className="text-xl font-black text-gray-900 tracking-tighter leading-none">{formatPrice(order.total)}</h4>
                               <p className="text-[10px] font-bold text-[#1CA672] mt-2 flex items-center gap-1 uppercase">
                                 <Zap size={10} fill="#1CA672" /> {deliveryTime} Min Delivery
                               </p>
                            </div>
                         </div>
                         <button onClick={() => navigate(`/order/${order.id}`)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#1CA672] group-hover:text-white transition-all shadow-inner">
                            <ChevronRight size={24} />
                         </button>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-dashed border-gray-100">
                         <button 
                            onClick={() => navigate(`/order/${order.id}`)}
                            className="flex-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-black active:scale-95 transition-all shadow-sm"
                         >
                            Track Order
                         </button>
                         <button 
                            onClick={() => handleReorder(order.id)}
                            className="flex-1 bg-white border-2 border-gray-100 text-gray-900 text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                         >
                            Reorder
                         </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
