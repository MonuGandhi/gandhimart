import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, MapPin, Phone, CheckCircle, Clock, 
  MessageCircle, Navigation, ChevronRight, LogOut, X,
  Package, User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useOrdersStore } from '../store/ordersStore';
import { formatPrice } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { orders, initFirebase, updateOrderStep } = useOrdersStore();
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'delivery_boy') {
      navigate('/profile');
      return;
    }
    initFirebase(user.email, 'delivery');
  }, [user, navigate, initFirebase]);

  const assignedOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'delivered');

  const handleStatusUpdate = async (orderId, newStatus) => {
    const loading = toast.loading(`Updating status to ${newStatus.replace(/_/g, ' ')}...`);
    try {
      await updateOrderStep(orderId, newStatus);
      toast.success('Status updated! ✅', { id: loading });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status', { id: loading });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-6 rounded-b-[2.5rem] shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Delivery Panel</h1>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{user.name}</p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Active Tasks</p>
            <p className="text-2xl font-black text-gray-900">{assignedOrders.length}</p>
          </div>
          <div className="bg-green-50/50 p-4 rounded-3xl border border-green-100/50">
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Delivered Today</p>
            <p className="text-2xl font-black text-gray-900">{completedOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1 mb-4">Assigned Orders</h2>
        
        <div className="space-y-4">
          {assignedOrders.length > 0 ? (
            assignedOrders.map((order) => (
              <div 
                key={order.id}
                className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-gray-900">#{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-black text-gray-900">{order.deliveryAddress?.fullName || order.address?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-[#1CA672]">{formatPrice(order.totalAmount || order.total)}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{order.paymentMethod || 'COD'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-500 mb-4">
                  <MapPin size={14} className="shrink-0 text-blue-500" />
                  <p className="text-xs font-medium line-clamp-2">
                    {selectedOrder?.address?.address || order.address?.address || order.deliveryAddress?.addressLine1 || 'Address not set'}
                    {(order.address?.village || order.deliveryAddress?.city) && 
                      `, ${order.address?.village || order.deliveryAddress?.city}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const phone = order.address?.phone || order.deliveryAddress?.phone || order.customerPhone;
                      if (phone) window.open(`tel:+91${phone}`);
                    }}
                    className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-gray-100"
                  >
                    <Phone size={14} /> Call
                  </button>
                  <button 
                    className="flex-1 bg-[#1CA672] text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
                  >
                    Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 font-bold">No active orders assigned to you</p>
              <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Take a break! 🍵</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Side Panel (Bottom Sheet Style on Mobile) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-6 pb-10 z-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Order #{selectedOrder.id}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={12} className="text-gray-400" />
                  <p className="text-xs font-bold text-gray-400">Placed on {new Date(selectedOrder.placedAt).toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Section */}
            <div className="bg-gray-50 rounded-3xl p-5 mb-6 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-500">
                  <User size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer Details</p>
                  <p className="text-sm font-black text-gray-900 mb-0.5">{selectedOrder.address?.name || selectedOrder.deliveryAddress?.fullName || selectedOrder.customerName || 'Customer'}</p>
                  <p className="text-xs font-bold text-blue-600">{selectedOrder.address?.phone || selectedOrder.deliveryAddress?.phone || selectedOrder.customerPhone || ''}</p>
                </div>
              </div>

              {/* Full Address */}
              <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#1CA672] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery Address</p>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">
                      {selectedOrder.address?.address || selectedOrder.deliveryAddress?.addressLine1 || 'Address not available'}
                      {(selectedOrder.address?.village || selectedOrder.deliveryAddress?.addressLine2) && 
                        `, ${selectedOrder.address?.village || selectedOrder.deliveryAddress?.addressLine2}`}
                      {(selectedOrder.address?.city || selectedOrder.deliveryAddress?.city) && 
                        `, ${selectedOrder.address?.city || selectedOrder.deliveryAddress?.city}`}
                      {(selectedOrder.address?.pincode || selectedOrder.deliveryAddress?.pincode) && 
                        ` - ${selectedOrder.address?.pincode || selectedOrder.deliveryAddress?.pincode}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Map */}
              {(selectedOrder.deliveryLat && selectedOrder.deliveryLng) && (
                <div className="mt-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">📍 Customer Location on Map</p>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <iframe
                      title="Delivery location map"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(selectedOrder.deliveryLng) - 0.008}%2C${Number(selectedOrder.deliveryLat) - 0.008}%2C${Number(selectedOrder.deliveryLng) + 0.008}%2C${Number(selectedOrder.deliveryLat) + 0.008}&layer=mapnik&marker=${selectedOrder.deliveryLat}%2C${selectedOrder.deliveryLng}`}
                      className="w-full h-48"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button 
                  onClick={() => window.open(`tel:+91${selectedOrder.address?.phone || selectedOrder.deliveryAddress?.phone || selectedOrder.customerPhone}`)}
                  className="flex items-center justify-center gap-1.5 bg-white text-gray-900 font-bold py-3 rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-100 text-xs"
                >
                  <Phone size={15} className="text-[#1CA672]" /> Call
                </button>
                <button 
                  onClick={() => {
                    const lat = selectedOrder.deliveryLat;
                    const lng = selectedOrder.deliveryLng;
                    if (lat && lng) {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                    } else {
                      const addr = selectedOrder.address?.address 
                        ? `${selectedOrder.address.address}, ${selectedOrder.address.village || ''}`
                        : selectedOrder.deliveryAddress?.addressLine1 || '';
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 bg-gray-900 text-white font-bold py-3 rounded-2xl shadow-lg hover:bg-black text-xs"
                >
                  <Navigation size={15} className="text-blue-400" /> Navigate
                </button>
                <button 
                  onClick={() => {
                    const phone = selectedOrder.address?.phone || selectedOrder.deliveryAddress?.phone || selectedOrder.customerPhone;
                    const name = selectedOrder.address?.name || selectedOrder.deliveryAddress?.fullName || selectedOrder.customerName || 'Customer';
                    const msg = `Hello ${name}, main aapka G Mart delivery partner hoon. Main aapke order #${selectedOrder.id} ke saath aapke ghar ke paas aaya hoon. Kripya apna order collect karein. Thank you! 🛒`;
                    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-1.5 bg-[#25D366] text-white font-bold py-3 rounded-2xl shadow-sm hover:bg-[#1DA851] text-xs"
                >
                  <MessageCircle size={15} /> Chat
                </button>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-[#1CA672]/5 rounded-3xl p-5 mb-6 border border-[#1CA672]/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-[#1CA672] uppercase tracking-widest mb-1">Collect Amount</p>
                <p className="text-2xl font-black text-gray-900">{formatPrice(selectedOrder.totalAmount || selectedOrder.total)}</p>
              </div>
              <div className="text-right">
                <span className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 border border-gray-100 shadow-sm">
                  {selectedOrder.paymentMethod === 'upi' ? 'PREPAID (UPI)' : 'CASH ON DELIVERY'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {selectedOrder.status !== 'out_for_delivery' && (
                <button 
                  onClick={() => handleStatusUpdate(selectedOrder.id, 'out_for_delivery')}
                  className="w-full bg-orange-500 text-white font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
                >
                  <Package size={20} /> Mark Out for Delivery
                </button>
              )}
              
              <button 
                onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}
                className="w-full bg-[#1CA672] text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
              >
                <CheckCircle size={24} /> Confirm Delivery
              </button>
              
              <button 
                onClick={() => {
                  const phone = selectedOrder.address?.phone || selectedOrder.deliveryAddress?.phone || selectedOrder.customerPhone;
                  const name = selectedOrder.address?.name || selectedOrder.deliveryAddress?.fullName || selectedOrder.customerName || 'Customer';
                  const msg = `Hello ${name}, main aapka G Mart delivery partner hoon. Main aapke order #${selectedOrder.id} ke saath aapke ghar ke paas hoon. Kripya apna order collect karein. Thank you! 🛒`;
                  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full bg-white text-gray-900 font-bold py-4 rounded-[1.5rem] flex items-center justify-center gap-3 border-2 border-gray-100 active:scale-95 transition-transform"
              >
                <MessageCircle size={20} className="text-[#25D366]" /> Chat on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
