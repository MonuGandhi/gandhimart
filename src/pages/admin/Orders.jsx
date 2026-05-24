import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Download, X, MessageCircle, Gift, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';
import { useOrdersStore } from '../../store/ordersStore';
import { useNotificationStore } from '../../store/notificationsStore';
import { formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { db } from '../../firebase';
import { doc, updateDoc, increment, query, collection, where, getDocs, addDoc } from 'firebase/firestore';
import { logWalletTransaction } from '../../utils/wallet';

// Helper function to restore stock when order is cancelled
const restoreOrderStock = async (order) => {
  if (!order.items || !Array.isArray(order.items)) return;

  order.items.forEach(item => {
    const qty = item.qty || item.quantity || 1;
    updateDoc(doc(db, 'products', item.id.toString()), {
      stock: increment(qty),
      inStock: true
    })
      .catch(e => console.error('Failed to restore stock for product', item.id, e));
  });
};

export default function Orders() {
  const { orders, updateOrderStep } = useOrdersStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderAreaName, setSelectedOrderAreaName] = useState('');
  const [selectedOrderAreaLoading, setSelectedOrderAreaLoading] = useState(false);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [udhaarConfirmData, setUdhaarConfirmData] = useState(null);
  const [isAddingUdhaar, setIsAddingUdhaar] = useState(false);


  const filteredOrders = useMemo(() => orders.filter(o => {
    const customerName = o.deliveryAddress?.fullName || o.address?.name || '';
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [orders, searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'packing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const [referrerInfo, setReferrerInfo] = useState(null);

  const getCustomerName = (order) => order.deliveryAddress?.fullName || order.address?.name || order.customerName || 'Customer';
  const getCustomerPhone = (order) => order.deliveryAddress?.phone || order.address?.phone || order.phone || '';
  const getOrderTotal = (order) => Number(order.totalAmount || order.total || 0);

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);

    // If cancelling the order, restore stock first
    if (newStatus === 'cancelled' && order && order.status !== 'cancelled') {
      try {
        await restoreOrderStock(order);
      } catch (e) {
        console.error("Failed to restore stock:", e);
        toast.error("Stock restore failed: " + e.message);
      }
    }

    try {
      await updateOrderStep(orderId, newStatus);
      toast.success(`Order ${orderId} updated to ${newStatus}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error("Failed to update status in UI:", err);
      // Detailed error toast already handled in store, fallback here if needed
    }
  };

  const getOrderLocation = (order) => {
    if (!order) return null;
    const lat = Number(order.deliveryLat);
    const lng = Number(order.deliveryLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return null;
  };

  const getAreaNameFromReverseGeocode = (data) => {
    const address = data?.address || {};
    return (
      address.village ||
      address.hamlet ||
      address.town ||
      address.suburb ||
      address.city ||
      address.county ||
      data?.name ||
      data?.display_name?.split(',')?.[0] ||
      'Unknown area'
    );
  };

  useEffect(() => {
    const orderLocation = getOrderLocation(selectedOrder);
    if (!orderLocation) {
      setSelectedOrderAreaName('');
      setSelectedOrderAreaLoading(false);
      return;
    }

    let cancelled = false;
    setSelectedOrderAreaLoading(true);
    setSelectedOrderAreaName('');

    const reverseGeocode = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(orderLocation.lat)}&lon=${encodeURIComponent(orderLocation.lng)}&format=jsonv2&addressdetails=1`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) throw new Error(`Reverse geocode failed (${response.status})`);
        const data = await response.json();
        const areaName = getAreaNameFromReverseGeocode(data);
        if (!cancelled) {
          setSelectedOrderAreaName(areaName);
        }
      } catch (err) {
        console.error('Reverse geocode error:', err);
        if (!cancelled) {
          setSelectedOrderAreaName('Unknown area');
        }
      } finally {
        if (!cancelled) {
          setSelectedOrderAreaLoading(false);
        }
      }
    };

    reverseGeocode();

    return () => {
      cancelled = true;
    };
  }, [selectedOrder]);

  const handleManualCredit = async (order, force = false) => {
    if (!order.referralCode) {
      toast.error('No referral code in this order');
      return;
    }
    
    const loadingToast = toast.loading(force ? 'Force crediting...' : 'Crediting reward...');
    try {
      const qReferrer = query(collection(db, 'users'), where('referralCode', '==', order.referralCode));
      const snapReferrer = await getDocs(qReferrer);
      
      if (!snapReferrer.empty) {
        const referrerDoc = snapReferrer.docs[0];
        const referrerPhone = referrerDoc.id;
        
        // Update user's wallet
        await updateDoc(doc(db, 'users', referrerPhone), {
          walletBalance: increment(10)
        });

        await logWalletTransaction(referrerPhone, 10, 'credit', `Referral reward for order #${order.id}`);

        // Mark order as claimed
        await updateDoc(doc(db, 'orders', order.id), {
          referralRewardClaimed: true
        });

        // Send notification
        try {
          useNotificationStore.getState().addNotification({
            title: 'Referral Reward! 🎁',
            message: `You earned ₹10 because your friend's order was delivered!`,
            type: 'promo',
            email: referrerPhone,
            phone: referrerPhone
          });
        } catch (e) { console.error('Notification failed', e); }

        toast.success(`₹10 credited to ${referrerDoc.data().name || 'referrer'}!`, { id: loadingToast });
        
        // Refresh local state
        setReferrerInfo(prev => ({ ...prev, walletBalance: (prev?.walletBalance || 0) + 10 }));
        setSelectedOrder(prev => ({ ...prev, referralRewardClaimed: true }));
      } else {
        toast.error('Referrer not found in database', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message}`, { id: loadingToast });
    }
  };

  const confirmAddToUdhaar = async () => {
    if (!udhaarConfirmData?.order?.id || isAddingUdhaar) return;

    setIsAddingUdhaar(true);

    const { order, customerName, customerPhone, amount } = udhaarConfirmData;
    const todayDate = new Date().toISOString().split('T')[0];
    if (!order?.id) return;
    const loadingToast = toast.loading('Udhaar mein add kiya ja raha hai...');
    try {
      const udhaarRef = await addDoc(collection(db, 'udhaars'), {
        customer_name: customerName,
        customer_phone: customerPhone,
        order_id: order.id,
        amount,
        date: todayDate,
        created_at: new Date().toISOString(),
        status: 'pending'
      });

      await updateDoc(doc(db, 'orders', order.id), {
        udhaarAdded: true,
        udhaarAmount: amount,
        udhaarId: udhaarRef.id,
        udhaarDate: todayDate,
        udhaarStatus: 'pending'
      });

      setSelectedOrder((prev) => (prev?.id === order.id
        ? {
            ...prev,
            udhaarAdded: true,
            udhaarAmount: amount,
            udhaarId: udhaarRef.id,
            udhaarDate: todayDate,
            udhaarStatus: 'pending'
          }
        : prev));

      toast.success(`₹${amount} udhaar mein add ho gaya`, { id: loadingToast });
      setUdhaarConfirmData(null);
    } catch (err) {
      console.error('Udhaar add error:', err);
      toast.error(`Udhaar add failed: ${err.message}`, { id: loadingToast });
    } finally {
      setIsAddingUdhaar(false);
    }
  };

  const handleAddToUdhaar = async (order) => {
    if (!order?.id) return;

    if (order.udhaarAdded) {
      toast('This order is already added to udhaar.', { icon: 'ℹ️' });
      return;
    }

    const customerName = getCustomerName(order);
    const customerPhone = getCustomerPhone(order);
    const amount = getOrderTotal(order);

    if (!customerPhone) {
      toast.error('Customer phone number not found for this order');
      return;
    }

    if (amount <= 0) {
      toast.error('Invalid order amount for udhaar');
      return;
    }

    setUdhaarConfirmData({
      order,
      customerName,
      customerPhone,
      amount
    });
  };

  const exportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Amount', 'Status', 'Date'];
    const csvData = orders.map(o => [
      o.id,
      o.deliveryAddress?.fullName || 'N/A',
      o.deliveryAddress?.phone || 'N/A',
      o.totalAmount,
      o.status,
      new Date(o.placedAt).toLocaleString()
    ]);
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'orders_export.csv';
    link.click();
  };

  const handleRefund = async (order) => {
    const refundAmount = (order.walletUsed || 0) + (order.paymentMethod !== 'cod' ? (order.total || order.totalAmount || 0) : 0);
    
    if (refundAmount <= 0) {
      toast.error('Nothing to refund for this order');
      return;
    }

    if (!window.confirm(`Refund ₹${refundAmount} to ${order.customerName}'s wallet?`)) return;

    const loadingToast = toast.loading('Processing refund...');
    try {
      let customerEmail = (order.customerEmail || order.id.split('_')[0])?.toLowerCase();
      if (!customerEmail) {
        const phone = order.deliveryAddress?.phone || order.address?.phone || order.customerPhone;
        if (phone) {
          const cleanedPhone = String(phone).replace(/\D/g, '').slice(-10);
          if (cleanedPhone.length === 10) {
            try {
              const qUser = query(collection(db, 'users'), where('phone', '==', cleanedPhone));
              const userSnap = await getDocs(qUser);
              if (!userSnap.empty) {
                customerEmail = userSnap.docs[0].id; // Doc id is lowercase email
              }
            } catch (e) {
              console.error("Fallback refund email lookup failed", e);
            }
          }
        }
      }

      if (!customerEmail) throw new Error('Customer email not found');

      // 1. Update user's wallet
      await updateDoc(doc(db, 'users', customerEmail), {
        walletBalance: increment(refundAmount)
      });

      await logWalletTransaction(customerEmail, refundAmount, 'credit', `Refund for cancelled order #${order.id}`);

      // 2. Mark order as refunded
      await updateDoc(doc(db, 'orders', order.id), {
        refunded: true,
        refundAmount: refundAmount
      });

      // 3. Send notification
      try {
        useNotificationStore.getState().addNotification({
          title: 'Order Refunded! 💰',
          message: `₹${refundAmount} has been credited back to your wallet for order #${order.id}.`,
          type: 'promo',
          email: customerEmail,
          phone: order.deliveryAddress?.phone || order.address?.phone
        });
      } catch (e) { console.error('Notification failed', e); }

      toast.success(`₹${refundAmount} refunded successfully!`, { id: loadingToast });
      
      // Refresh local state
      setSelectedOrder(prev => ({ ...prev, refunded: true, refundAmount: refundAmount }));
    } catch (err) {
      console.error(err);
      toast.error(`Refund failed: ${err.message}`, { id: loadingToast });
    }
  };

  const fetchReferrer = async (code) => {
    if (!code) return;
    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', code));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setReferrerInfo(snap.docs[0].data());
      } else {
        setReferrerInfo(null);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (selectedOrder?.referralCode) {
      setTimeout(() => fetchReferrer(selectedOrder.referralCode), 0);
    } else {
      setTimeout(() => setReferrerInfo(null), 0);
    }
  }, [selectedOrder]);

  useEffect(() => {
    const fetchBoys = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'delivery_boy'));
        const snap = await getDocs(q);
        setDeliveryBoys(snap.docs.map(doc => ({ ...doc.data(), email: doc.id })));
      } catch (err) { console.error(err); }
    };
    fetchBoys();
  }, []);

  const handleAssignBoy = async (orderId, boy) => {
    const loading = toast.loading(boy ? 'Assigning...' : 'Removing...');
    try {
      const deliveryData = boy ? {
        email: boy.email,
        name: boy.name,
        phone: boy.phone
      } : null;

      await useOrdersStore.getState().assignDeliveryBoy(orderId, deliveryData);
      
      toast.success(boy ? `Assigned to ${boy.name}` : 'Delivery boy removed', { id: loading });
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, assignedDeliveryBoy: deliveryData }));
      }
    } catch (err) {
      console.error("Assignment error:", err);
      toast.error('Assignment failed', { id: loading });
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage customer orders and dispatch</p>
        </div>
        <button onClick={exportCSV} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition-colors">
          <Download size={20} /> Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1CA672]"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA672]"
        >
          <option value="all">All Status</option>
          <option value="placed">Placed</option>
          <option value="confirmed">Confirmed</option>
          <option value="packing">Packing</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4">Order Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">#{o.id}</p>
                    <p className="text-xs text-gray-500">{new Date(o.placedAt).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{o.items?.length || 0} items</p>
                    {o.udhaarAdded && (
                      <span className="inline-flex mt-2 bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                        Udhaar ✓
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{o.deliveryAddress?.fullName || o.address?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{o.deliveryAddress?.phone || o.address?.phone || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{formatPrice(o.totalAmount || o.total)}</p>
                    <p className="text-xs text-gray-500 capitalize">{o.paymentMethod || 'COD'}</p>
                  </td>
                  <td className="p-4">
                    <select 
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border focus:outline-none appearance-none cursor-pointer ${getStatusColor(o.status)}`}
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="packing">Packing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedOrder(o)}
                      className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No orders found.
          </div>
        )}
      </div>

      {/* Side Panel for Order Details */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedOrder(null)} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 translate-x-0 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">Order #{selectedOrder.id}</h2>
                {selectedOrder.udhaarAdded && (
                  <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                    Udhaar ✓
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Customer Details</h3>
                <div className="bg-gray-50 p-3 rounded-xl text-sm space-y-2 relative">
                  <p><span className="font-semibold">Name:</span> {selectedOrder.deliveryAddress?.fullName || selectedOrder.address?.name}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedOrder.deliveryAddress?.phone || selectedOrder.address?.phone}</p>
                  <p><span className="font-semibold">Address:</span> {
                    selectedOrder.deliveryAddress 
                      ? `${selectedOrder.deliveryAddress.addressLine1}${selectedOrder.deliveryAddress.addressLine2 ? ', ' + selectedOrder.deliveryAddress.addressLine2 : ''}, ${selectedOrder.deliveryAddress.city} - ${selectedOrder.deliveryAddress.pincode}`
                      : `${selectedOrder.address?.address || selectedOrder.address?.text || ''}${selectedOrder.address?.village ? ', ' + selectedOrder.address.village : ''}${selectedOrder.address?.city ? ', ' + selectedOrder.address.city : ''}${selectedOrder.address?.pincode ? ' - ' + selectedOrder.address.pincode : ''}`
                  }</p>
                  <button 
                    onClick={() => {
                      const phone = selectedOrder.deliveryAddress?.phone || selectedOrder.address?.phone;
                      if (!phone) return toast.error('No phone number found');
                      const name = selectedOrder.deliveryAddress?.fullName || selectedOrder.address?.name || 'Customer';
                      const statusText = selectedOrder.status.replace(/_/g, ' ').toUpperCase();
                      const msg = `Hello ${name},\n\nYour G Mart order *#${selectedOrder.id}* is now *${statusText}*.\n\nThank you for shopping with us! 🛒`;
                      window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="mt-3 w-full bg-[#25D366] text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#1DA851] transition-colors shadow-sm"
                  >
                    <MessageCircle size={18} /> Update via WhatsApp
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Order Location</h3>
                <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-sm space-y-2">
                  {getOrderLocation(selectedOrder) ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-green-700 font-black">Village / Area</p>
                          <p className="font-black text-green-900">
                            {selectedOrderAreaLoading ? 'Checking location...' : (selectedOrderAreaName || selectedOrder.address?.village || 'Area not found')}
                          </p>
                        </div>
                        <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0">
                          Map Ready
                        </span>
                      </div>
                      <p><span className="font-semibold">Latitude:</span> {selectedOrder.deliveryLat}</p>
                      <p><span className="font-semibold">Longitude:</span> {selectedOrder.deliveryLng}</p>
                      <div className="overflow-hidden rounded-lg border border-green-200 bg-white">
                        <iframe
                          title="Order location map"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(selectedOrder.deliveryLng) - 0.01}%2C${Number(selectedOrder.deliveryLat) - 0.01}%2C${Number(selectedOrder.deliveryLng) + 0.01}%2C${Number(selectedOrder.deliveryLat) + 0.01}&layer=mapnik&marker=${selectedOrder.deliveryLat}%2C${selectedOrder.deliveryLng}`}
                          className="w-full h-52"
                          loading="lazy"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const loc = getOrderLocation(selectedOrder);
                          if (!loc) return;
                          window.open(`https://www.google.com/maps?q=${loc.lat},${loc.lng}`, '_blank');
                        }}
                        className="w-full bg-[#1CA672] text-white font-bold py-2 rounded-lg hover:bg-[#17905F] transition-colors shadow-sm"
                      >
                        Open in Google Maps
                      </button>
                      <button
                        onClick={() => {
                          const loc = getOrderLocation(selectedOrder);
                          if (!loc) return;
                          window.open(`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`, '_blank');
                        }}
                        className="w-full bg-white text-green-700 font-bold py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors shadow-sm"
                      >
                        Open in Map
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-600">No customer location was saved for this order.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white border border-gray-100 p-2 rounded-xl shadow-sm">
                      <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt={item.name} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.qty || item.quantity} • {formatPrice(item.price)}</p>
                      </div>
                      <p className="font-bold text-gray-900">{formatPrice(item.price * (item.qty || item.quantity))}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Payment Summary</h3>
                <div className="bg-gray-50 p-3 rounded-xl text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{formatPrice((selectedOrder.totalAmount || selectedOrder.total) - (selectedOrder.deliveryFee||0) + (selectedOrder.discountAmount||0))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Delivery Fee</span><span className="font-semibold">{selectedOrder.deliveryFee === 0 ? 'FREE' : formatPrice(selectedOrder.deliveryFee)}</span></div>
                  {selectedOrder.discountAmount > 0 && <div className="flex justify-between text-[#1CA672]"><span className="font-semibold">Discount</span><span className="font-semibold">-{formatPrice(selectedOrder.discountAmount)}</span></div>}
                  <div className="pt-2 border-t border-gray-200 flex justify-between font-black text-lg"><span className="text-gray-900">Total</span><span className="text-[#1CA672]">{formatPrice(selectedOrder.totalAmount || selectedOrder.total)}</span></div>
                  <div className="pt-2 text-xs text-gray-500 text-center uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">Method: {selectedOrder.paymentMethod?.toUpperCase() || 'COD'}</div>
                  {selectedOrder.paymentDetails && (
                    <div className="mt-2 p-2 bg-white border border-gray-100 rounded-lg text-xs">
                      <p className="font-bold text-gray-700 mb-1">Details:</p>
                      {selectedOrder.paymentMethod === 'upi' && (
                        <p><span className="text-gray-500">Txn ID / UTR:</span> <span className="font-bold text-blue-600">{selectedOrder.paymentDetails.transactionId}</span></p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAddToUdhaar(selectedOrder)}
                  disabled={selectedOrder.udhaarAdded}
                  className={`mt-3 w-full py-2.5 rounded-lg font-black text-sm transition-all ${selectedOrder.udhaarAdded ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                >
                  {selectedOrder.udhaarAdded ? 'Udhaar ✓ Added' : 'Udhaar Mein Add Karo'}
                </button>
              </div>

              {/* Referral & App Info */}
              {(selectedOrder.referralCode || selectedOrder.walletUsed > 0) && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Referral & Wallet</h3>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-sm space-y-2">
                    {selectedOrder.referralCode && (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1 text-amber-700 font-bold">
                          <div className="flex items-center gap-2">
                            <Gift size={16} /> Code: {selectedOrder.referralCode}
                            <button onClick={() => fetchReferrer(selectedOrder.referralCode)} className="p-1 hover:bg-amber-200 rounded"><RefreshCw size={12} /></button>
                          </div>
                          {referrerInfo && (
                            <div className="flex flex-col gap-0.5 mt-1">
                              <p className="text-[10px] bg-amber-100 px-2 py-0.5 rounded-md inline-block self-start">
                                Referrer: {referrerInfo.name} ({referrerInfo.email})
                              </p>
                              <p className="text-[10px] font-black text-amber-800 ml-1">
                                Current Balance: ₹{referrerInfo.walletBalance || 0}
                              </p>
                            </div>
                          )}
                        </div>
                        {selectedOrder.isAppInstalled ? (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1">
                            <Smartphone size={10} /> APP OK
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1">
                            <X size={10} /> BROWSER
                          </span>
                        )}
                      </div>
                    )}
                    {selectedOrder.walletUsed > 0 && (
                      <div className="flex items-center justify-between text-[#1CA672] font-bold border-t border-amber-200 pt-2 mt-1">
                        <span>Wallet Used:</span>
                        <span>-{formatPrice(selectedOrder.walletUsed)}</span>
                      </div>
                    )}
                    {selectedOrder.referralCode && !selectedOrder.isAppInstalled && (
                      <p className="text-[10px] text-red-500 font-bold italic mt-1">* Reward won't be given (Not installed)</p>
                    )}
                    {selectedOrder.referralCode && !selectedOrder.referralRewardClaimed && (
                      <div className="space-y-2 mt-2">
                        {!selectedOrder.isAppInstalled && (
                          <p className="text-[10px] text-red-500 font-bold italic mb-1">* Not installed (Browser order)</p>
                        )}
                        <button 
                          onClick={() => handleManualCredit(selectedOrder)}
                          disabled={!selectedOrder.isAppInstalled}
                          className={`w-full bg-[#1CA672] text-white py-2 rounded-lg font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${!selectedOrder.isAppInstalled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-[#17905F]'}`}
                        >
                          <CheckCircle size={14} /> Credit ₹10 Reward
                        </button>
                        
                        {/* Force Credit Link for Admin */}
                        <button 
                          onClick={() => {
                            if(window.confirm('Force credit reward even if not installed?')) {
                              handleManualCredit(selectedOrder, true);
                            }
                          }}
                          className="w-full text-[10px] text-gray-400 font-bold hover:text-[#1CA672] transition-colors"
                        >
                          Bypass check & credit anyway
                        </button>
                      </div>
                    )}
                    {selectedOrder.status === 'cancelled' && !selectedOrder.refunded && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <p className="text-[10px] text-amber-700 font-bold mb-2 uppercase tracking-wider text-center">Manual Refund Action</p>
                        <button 
                          onClick={() => handleRefund(selectedOrder)}
                          className="w-full bg-red-500 text-white py-2.5 rounded-lg font-black text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-red-600 transition-all"
                        >
                          <CheckCircle size={14} /> Refund ₹{(selectedOrder.walletUsed || 0) + (selectedOrder.paymentMethod !== 'cod' ? (selectedOrder.total || selectedOrder.totalAmount || 0) : 0)} to Wallet
                        </button>
                      </div>
                    )}
                    {selectedOrder.refunded && (
                      <div className="mt-4 bg-blue-100 text-blue-700 py-2 rounded-lg font-black text-xs flex items-center justify-center gap-2 border border-blue-200">
                        <CheckCircle size={14} /> Amount Refunded ✅
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Delivery Boy Assignment */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Delivery Partner</h3>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                  {selectedOrder.assignedDeliveryBoy ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-blue-900">{selectedOrder.assignedDeliveryBoy.name}</p>
                        <p className="text-[10px] text-blue-700 font-medium">{selectedOrder.assignedDeliveryBoy.phone}</p>
                      </div>
                      <button 
                        onClick={() => handleAssignBoy(selectedOrder.id, null)}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-blue-600 font-medium italic">No delivery partner assigned yet</p>
                      <select 
                        onChange={(e) => {
                          const boy = deliveryBoys.find(b => b.email === e.target.value);
                          if (boy) handleAssignBoy(selectedOrder.id, boy);
                        }}
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                        defaultValue=""
                      >
                        <option value="" disabled>Select Delivery Boy</option>
                        {deliveryBoys.map(boy => (
                          <option key={boy.email} value={boy.email}>{boy.name} ({boy.phone})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <label className="block text-sm font-bold text-gray-700 mb-2">Update Status</label>
              <select 
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1CA672] font-semibold"
              >
                <option value="placed">Placed (Pending)</option>
                <option value="confirmed">Confirmed</option>
                <option value="packing">Packing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </>
      )}

      {udhaarConfirmData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => !isAddingUdhaar && setUdhaarConfirmData(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-emerald-200 bg-white animate-[fadeIn_.2s_ease-out]">
            <div className="bg-gradient-to-r from-emerald-600 via-[#1CA672] to-lime-500 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-90">Udhaar Confirmation</p>
              <h3 className="text-2xl font-black mt-1">Confirm Entry</h3>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[15px] text-gray-800 font-semibold leading-relaxed">
                Kya aap <span className="text-emerald-700 font-black">{udhaarConfirmData.customerName}</span> ka{' '}
                <span className="text-emerald-700 font-black">₹{udhaarConfirmData.amount}</span> udhaar mein add karna chahte hain?
              </p>

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-sm space-y-1">
                <p><span className="font-bold text-gray-700">Phone:</span> <span className="font-semibold text-gray-900">{udhaarConfirmData.customerPhone}</span></p>
                <p><span className="font-bold text-gray-700">Order ID:</span> <span className="font-semibold text-gray-900">#{udhaarConfirmData.order.id}</span></p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setUdhaarConfirmData(null)}
                  disabled={isAddingUdhaar}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-black hover:bg-gray-100 transition-colors disabled:opacity-60"
                >
                  No
                </button>
                <button
                  onClick={confirmAddToUdhaar}
                  disabled={isAddingUdhaar}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-colors disabled:opacity-60"
                >
                  {isAddingUdhaar ? 'Adding...' : 'Yes, Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
