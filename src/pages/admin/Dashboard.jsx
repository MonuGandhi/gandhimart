import React, { useMemo } from 'react';
import { useOrdersStore } from '../../store/ordersStore';
import { useAdminStore } from '../../store/adminStore';
import { Package, ShoppingBag, IndianRupee, Users, TicketPercent, AlertCircle, TrendingUp, ChevronRight, Gift, CheckCircle2, Trophy } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { formatPrice } from '../../utils/helpers';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { products } = useProducts();
  const orders = useOrdersStore((state) => state.orders) || [];
  const registeredUsers = useAdminStore((state) => state.registeredUsers) || [];
  const adminCoupons = useAdminStore((state) => state.adminCoupons) || [];
  const syncData = useAdminStore((state) => state.syncData);
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = React.useState('weekly');

  const handleSync = () => {
    syncData();
    toast.success('Site data synchronized successfully!');
    // Small delay and reload to ensure everything is fresh
    setTimeout(() => window.location.reload(), 1000);
  };

  const totalRevenue = useMemo(() => orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0), [orders]);
    
  const totalProfit = useMemo(() => {
    return orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => {
        const orderProfit = (order.items || []).reduce((itemSum, item) => {
          const matchedProduct = products.find(p => p.id === item.id || (p.variants && p.variants.some(v => v.id === item.id)));
          const itemCost = item.costPrice || (matchedProduct?.costPrice) || 0;
          const itemSell = item.price || 0;
          const qty = item.qty || item.quantity || 1;
          
          if (itemCost > 0) {
            return itemSum + ((itemSell - itemCost) * qty);
          }
          return itemSum;
        }, 0);
        return sum + orderProfit;
      }, 0);
  }, [orders, products]);
    
  const outOfStockCount = useMemo(() => products.filter(p => !p.inStock || (p.stock !== null && p.stock !== undefined && p.stock !== '' && Number(p.stock) < 10)).length, [products]);
  
  // Dynamic unique customers count (Orders + Registered Users)
  const totalCustomersCount = useMemo(() => {
    const uniqueCustomerPhones = new Set(
      [
        ...orders.map(o => o.deliveryAddress?.phone || o.address?.phone),
        ...registeredUsers.map(u => u.phone)
      ]
      .filter(Boolean)
      .map(phone => {
        const cleaned = String(phone).replace(/\D/g, '');
        return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
      })
    );
    return uniqueCustomerPhones.size;
  }, [orders, registeredUsers]);

  const calcProfitForOrders = (ords) => ords.reduce((sum, o) => {
    return sum + (o.items || []).reduce((itemSum, item) => {
      const matchedProduct = products.find(p => p.id === item.id || (p.variants && p.variants.some(v => v.id === item.id)));
      const itemCost = item.costPrice || (matchedProduct?.costPrice) || 0;
      if (itemCost > 0) return itemSum + ((item.price || 0) - itemCost) * (item.qty || item.quantity || 1);
      return itemSum;
    }, 0);
  }, 0);

  const revenueData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    return last7Days.map(day => {
      const dayOrders = orders.filter(o => {
        const orderDate = o.placedAt ? new Date(o.placedAt).toLocaleDateString('en-US', { weekday: 'short' }) : null;
        return orderDate === day && o.status === 'delivered';
      });
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
      const dayProfit = calcProfitForOrders(dayOrders);
      return { name: day, value: dayRevenue, profit: dayProfit };
    });
  }, [orders, products]);

  // Monthly revenue (last 12 months)
  const monthlyRevenueData = useMemo(() => {
    const last12Months = [...Array(12)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return { name: d.toLocaleDateString('en-US', { month: 'short' }), date: new Date(d.getFullYear(), d.getMonth(), 1) };
    });

    return last12Months.map(month => {
      const monthOrders = orders.filter(o => {
        if (!o.placedAt || o.status !== 'delivered') return false;
        const orderDate = new Date(o.placedAt);
        return orderDate.getFullYear() === month.date.getFullYear() && orderDate.getMonth() === month.date.getMonth();
      });
      const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
      const monthProfit = calcProfitForOrders(monthOrders);
      return { name: month.name, value: monthRevenue, profit: monthProfit };
    });
  }, [orders, products]);

  // Yearly revenue (last 5 years)
  const yearlyRevenueData = useMemo(() => {
    const last5Years = [...Array(5)].map((_, i) => {
      const year = new Date().getFullYear() - (4 - i);
      return { name: year.toString(), year };
    });

    return last5Years.map(yearObj => {
      const yearOrders = orders.filter(o => {
        if (!o.placedAt || o.status !== 'delivered') return false;
        const orderDate = new Date(o.placedAt);
        return orderDate.getFullYear() === yearObj.year;
      });
      const yearRevenue = yearOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
      const yearProfit = calcProfitForOrders(yearOrders);
      return { name: yearObj.name, value: yearRevenue, profit: yearProfit };
    });
  }, [orders, products]);

  // Get data based on selected period
  const chartData = timePeriod === 'weekly' ? revenueData : timePeriod === 'monthly' ? monthlyRevenueData : yearlyRevenueData;

  const orderStats = useMemo(() => ({
    pending: orders.filter(o => o.status === 'placed').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  const topSellingProducts = useMemo(() => {
    const productSales = {};
    
    // Process only delivered orders for accurate sales
    orders.filter(o => o.status === 'delivered').forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          // Exclude products that have been deleted from the catalog
          const matchedProduct = products.find(p => p.id === item.id || (p.variants && p.variants.some(v => v.id === item.id)));
          if (!matchedProduct) return;

          const qty = item.qty || item.quantity || 1;
          if (!productSales[item.id]) {
            productSales[item.id] = {
              id: item.id,
              name: item.name,
              image: item.image,
              category: matchedProduct.category || 'Uncategorized',
              totalSold: 0,
              revenue: 0
            };
          }
          productSales[item.id].totalSold += qty;
          productSales[item.id].revenue += qty * (item.price || 0);
        });
      }
    });

    // Convert to array and sort by totalSold (all products, no slice)
    return Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold);
  }, [orders, products]);

  // Group top selling products by category
  const topSellingByCategory = useMemo(() => {
    const grouped = {};
    topSellingProducts.forEach((p, globalIndex) => {
      const cat = p.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ ...p, globalRank: globalIndex + 1 });
    });
    // Sort categories by total revenue descending
    return Object.entries(grouped)
      .sort(([, a], [, b]) => {
        const revA = a.reduce((s, p) => s + p.revenue, 0);
        const revB = b.reduce((s, p) => s + p.revenue, 0);
        return revB - revA;
      });
  }, [topSellingProducts]);

  // Smart Inventory Alerts with Predictions
  const inventoryAlerts = useMemo(() => {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const productMetrics = products.map(product => {
      const last7DaysSales = orders
        .filter(o => o.status === 'delivered' && new Date(o.placedAt) >= last7Days)
        .reduce((acc, order) => {
          const item = order.items?.find(i => i.id === product.id);
          return acc + (item?.qty || item?.quantity || 0);
        }, 0);

      const dailySalesRate = last7DaysSales / 7;
      const currentStock = Number(product.stock) || 0;
      const daysUntilStockout = dailySalesRate > 0 ? Math.ceil(currentStock / dailySalesRate) : 999;
      const isLowStock = currentStock < 10 || !product.inStock;
      const isUrgent = currentStock < 5 || (daysUntilStockout < 3 && daysUntilStockout > 0);

      return {
        id: product.id,
        name: product.name,
        image: product.image,
        currentStock,
        dailySalesRate: dailySalesRate.toFixed(2),
        last7DaysSales,
        daysUntilStockout,
        isLowStock,
        isUrgent,
        suggestedReorderQty: Math.max(20, Math.ceil(dailySalesRate * 14)),
        priority: isUrgent ? 1 : isLowStock ? 2 : 3
      };
    });

    return productMetrics
      .filter(p => p.isLowStock)
      .sort((a, b) => a.priority - b.priority || a.daysUntilStockout - b.daysUntilStockout)
      .slice(0, 8);
  }, [products, orders]);

  // Customer Insights Analytics
  const customerInsights = useMemo(() => {
    const customerMap = {};

    const cleanPhone = (p) => {
      if (!p) return '';
      const cleaned = String(p).replace(/\D/g, '');
      return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
    };

    // Build customer data from orders
    orders.forEach(order => {
      const rawPhone = order.deliveryAddress?.phone || order.address?.phone;
      const name = order.deliveryAddress?.fullName || order.address?.name || 'Unknown';
      const phone = cleanPhone(rawPhone);

      if (!phone) return;

      if (!customerMap[phone]) {
        customerMap[phone] = {
          phone,
          name,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
          deliveredOrders: 0,
          daysInactive: 0
        };
      }

      customerMap[phone].totalOrders += 1;
      customerMap[phone].totalSpent += order.totalAmount || order.total || 0;

      if (order.status === 'delivered') {
        customerMap[phone].deliveredOrders += 1;
      }

      const orderDate = new Date(order.placedAt);
      if (!customerMap[phone].lastOrderDate || orderDate > customerMap[phone].lastOrderDate) {
        customerMap[phone].lastOrderDate = orderDate;
      }
    });

    // Add registered users who haven't ordered
    registeredUsers.forEach(user => {
      const phone = cleanPhone(user.phone);
      if (!phone) return;

      if (!customerMap[phone]) {
        customerMap[phone] = {
          phone,
          name: user.name || user.fullName || 'Unknown',
          email: user.email,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
          deliveredOrders: 0,
          daysInactive: 0,
          signupDate: user.createdAt || new Date(),
          isRegisteredOnly: true
        };
      } else {
        if (user.email) customerMap[phone].email = user.email;
        customerMap[phone].signupDate = user.createdAt || new Date();
      }
    });

    // Calculate metrics
    const customers = Object.values(customerMap);
    const today = new Date();

    const topCustomers = customers
      .filter(c => !c.isRegisteredOnly)
      .map(c => ({
        ...c,
        daysInactive: c.lastOrderDate ? Math.floor((today - c.lastOrderDate) / (1000 * 60 * 60 * 24)) : 999,
        isRepeat: c.totalOrders > 1,
        isVIP: c.totalOrders >= 5,
        avgOrderValue: (c.totalSpent / c.totalOrders).toFixed(0),
        churnRisk: c.totalOrders > 1 && (today - c.lastOrderDate) > 30 * 24 * 60 * 60 * 1000
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const neverOrderedCustomers = customers
      .filter(c => c.isRegisteredOnly && c.totalOrders === 0)
      .map(c => ({
        ...c,
        daysRegistered: Math.floor((today - new Date(c.signupDate)) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => b.daysRegistered - a.daysRegistered)
      .slice(0, 8);

    const repeatCustomers = topCustomers.filter(c => c.isRepeat);
    const inactiveCustomers = topCustomers.filter(c => c.daysInactive >= 30 && c.daysInactive < 999).slice(0, 5);
    const churnRiskCustomers = topCustomers.filter(c => c.churnRisk).slice(0, 5);

    const totalRevenue = topCustomers.reduce((s, c) => s + c.totalSpent, 0);
    const avgOrderValue = orders.length > 0 ? (totalRevenue / orders.length).toFixed(0) : 0;
    const repeatRate = topCustomers.length > 0 ? ((repeatCustomers.length / topCustomers.length) * 100).toFixed(1) : 0;

    return {
      topCustomers: topCustomers.slice(0, 5),
      repeatRate,
      totalCustomers: topCustomers.length,
      avgOrderValue,
      inactiveCustomers,
      churnRiskCustomers,
      neverOrderedCustomers,
      totalRegisteredUsers: registeredUsers.length,
      opportunityCount: neverOrderedCustomers.length
    };
  }, [orders, registeredUsers]);

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

  return (
    <div className="admin-dashboard space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSync} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            title="Synchronize all data between Admin and Customer panels"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            Sync Site Data
          </button>
          <button onClick={() => navigate('/admin/products')} className="px-4 py-2 bg-[#1CA672] text-white rounded-lg font-semibold hover:bg-[#158F5F] transition-colors">
            + Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <button 
          onClick={() => navigate('/admin/products')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-[#1CA672] hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
            <Package className="text-blue-500" size={20} />
          </div>
          <p className="text-gray-500 text-sm font-semibold mb-1">Total Products</p>
          <h3 className="text-2xl font-black text-gray-900">{products.length}</h3>
        </button>

        <button 
          onClick={() => navigate('/admin/products')}
          className="bg-gradient-to-br from-[#1CA672]/10 to-[#158F5F]/10 p-5 rounded-2xl border border-[#1CA672]/20 shadow-sm text-left hover:border-[#1CA672] hover:shadow-md transition-all active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#1CA672]/10 rounded-full blur-2xl"></div>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
            <TrendingUp className="text-[#1CA672]" size={20} />
          </div>
          <p className="text-[#1CA672] text-sm font-bold mb-1">Net Profit</p>
          <h3 className="text-2xl font-black text-gray-900">{formatPrice(totalProfit)}</h3>
        </button>

        <button 
          onClick={() => navigate('/admin/orders')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-[#1CA672] hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
            <IndianRupee className="text-green-500" size={20} />
          </div>
          <p className="text-gray-500 text-sm font-semibold mb-1">Total Revenue</p>
          <h3 className="text-2xl font-black text-gray-900">{formatPrice(totalRevenue)}</h3>
        </button>

        <button 
          onClick={() => navigate('/admin/orders')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-[#1CA672] hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
            <ShoppingBag className="text-purple-500" size={20} />
          </div>
          <p className="text-gray-500 text-sm font-semibold mb-1">Total Orders</p>
          <h3 className="text-2xl font-black text-gray-900">{orders.length}</h3>
        </button>

        <button 
          onClick={() => navigate('/admin/customers')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-[#1CA672] hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
            <Users className="text-orange-500" size={20} />
          </div>
          <p className="text-gray-500 text-sm font-semibold mb-1">Total Customers</p>
          <h3 className="text-2xl font-black text-gray-900">{totalCustomersCount}</h3>
        </button>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/admin/coupons')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 text-left hover:border-[#1CA672] hover:shadow-md transition-all active:scale-95"
        >
          <TicketPercent className="text-purple-400" size={20} />
          <div>
            <p className="text-xs text-gray-500 font-semibold">Active Coupons</p>
            <p className="text-lg font-black text-gray-900">{adminCoupons.filter(c => c.isActive).length}</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/admin/customers?filter=referral')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 text-left hover:border-amber-400 hover:shadow-md transition-all active:scale-95"
        >
          <Gift className="text-amber-400" size={20} />
          <div>
            <p className="text-xs text-gray-500 font-semibold">Referred Users</p>
            <p className="text-lg font-black text-gray-900">{registeredUsers.filter(u => u.referralCode).length}</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/admin/orders')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 text-left hover:border-green-400 hover:shadow-md transition-all active:scale-95"
        >
          <CheckCircle2 className="text-green-400" size={20} />
          <div>
            <p className="text-xs text-gray-500 font-semibold">Rewards Given</p>
            <p className="text-lg font-black text-gray-900">{orders.filter(o => o.referralRewardClaimed).length}</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/admin/products')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 text-left hover:border-red-200 hover:shadow-md transition-all active:scale-95"
        >
          <AlertCircle className="text-red-400" size={20} />
          <div>
            <p className="text-xs text-gray-500 font-semibold">Out of Stock</p>
            <p className="text-lg font-black text-red-600">{outOfStockCount}</p>
          </div>
        </button>
      </div>

      {/* Charts Section (Pure CSS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart with Time Period Toggle */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#1CA672]" />
              Revenue
            </h3>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setTimePeriod('weekly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timePeriod === 'weekly' ? 'bg-white text-[#1CA672] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimePeriod('monthly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timePeriod === 'monthly' ? 'bg-white text-[#1CA672] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimePeriod('yearly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timePeriod === 'yearly' ? 'bg-white text-[#1CA672] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2.5 pb-4 border-b border-gray-200 relative px-2" style={{ height: '280px' }}>
            {chartData.map((day, i) => {
              const maxVal = Math.max(...chartData.map(d => d.value), 1);
              const heightPercent = (day.value / maxVal) * 100;
              const heightPx = (heightPercent / 100) * 280;
              const colors = [
                'from-blue-500 to-blue-600',
                'from-purple-500 to-purple-600',
                'from-pink-500 to-pink-600',
                'from-orange-500 to-orange-600',
                'from-green-500 to-green-600',
                'from-cyan-500 to-cyan-600',
                'from-indigo-500 to-indigo-600'
              ];
              const barColor = colors[i % colors.length];
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-200 z-20 font-semibold shadow-lg">
                    {formatPrice(day.value)}
                  </div>
                  <div
                    className={`w-full bg-gradient-to-t ${barColor} rounded-t-lg shadow-md group-hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group-hover:scale-y-105`}
                    style={{
                      height: `${heightPx}px`,
                      minHeight: '2px'
                    }}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-600 mt-3 group-hover:text-gray-900 transition-colors whitespace-nowrap">
                    {day.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-2 flex justify-center">
            <div className="flex gap-1.5 flex-wrap justify-center">
              {chartData.map((item, i) => {
                const colors = [
                  'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500', 'bg-cyan-500', 'bg-indigo-500'
                ];
                return (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]} shadow-sm`} />
                    <span className="text-[10px] font-semibold text-gray-500">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Profit Chart with Time Period Toggle */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" />
              Net Profit
            </h3>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setTimePeriod('weekly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timePeriod === 'weekly' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimePeriod('monthly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timePeriod === 'monthly' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimePeriod('yearly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timePeriod === 'yearly' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2.5 pb-4 border-b border-gray-200 relative px-2" style={{ height: '280px' }}>
            {chartData.map((day, i) => {
              const maxVal = Math.max(...chartData.map(d => d.profit), 1);
              const heightPercent = (day.profit / maxVal) * 100;
              const heightPx = (heightPercent / 100) * 280;
              const barColor = 'from-green-400 to-emerald-600';
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-200 z-20 font-semibold shadow-lg">
                    {formatPrice(day.profit)}
                  </div>
                  <div
                    className={`w-full bg-gradient-to-t ${barColor} rounded-t-lg shadow-md group-hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group-hover:scale-y-105`}
                    style={{
                      height: `${heightPx}px`,
                      minHeight: '2px'
                    }}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-600 mt-3 group-hover:text-gray-900 transition-colors whitespace-nowrap">
                    {day.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-2 flex justify-center">
            <div className="flex gap-1.5 flex-wrap justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
                <span className="text-[10px] font-semibold text-gray-500">Realized Profit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Low & Out of Stock Alert */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-red-500" />
              Low & Out of Stock
            </h3>
          </div>
          <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 scrollbar-hide">
            {products.filter(p => !p.inStock || (p.stock !== null && p.stock !== undefined && p.stock !== '' && p.stock < 10)).length > 0 ? (
              products.filter(p => !p.inStock || (p.stock !== null && p.stock !== undefined && p.stock !== '' && p.stock < 10)).map(p => (
                <div key={p.id} className={`flex items-center gap-3 p-2 rounded-xl border ${p.stock === 0 || !p.inStock ? 'bg-red-50/80 border-red-100' : 'bg-orange-50/50 border-orange-50'}`}>
                  <img 
                    src={getOptimizedImageUrl(p.image, 100)} 
                    className="w-8 h-8 rounded-lg object-cover" 
                    alt={p.name} 
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-800 truncate">{p.name}</p>
                    <p className={`text-[9px] font-bold ${p.stock === 0 || !p.inStock ? 'text-red-600' : 'text-orange-500'}`}>
                      {p.stock === 0 || !p.inStock ? 'Out of Stock' : `Only ${p.stock} left`}
                    </p>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${p.stock === 0 || !p.inStock ? 'bg-red-600' : p.stock < 5 ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`} />
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-xs text-gray-500">All items stocked! ✅</p>
            )}
          </div>
        </div>

        {/* Smart Inventory Alerts with Predictions */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-600" />
              Smart Inventory Alerts
            </h3>
            <span className="text-[10px] font-bold text-orange-600 bg-white px-2 py-1 rounded-md">
              {inventoryAlerts.length} alerts
            </span>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
            {inventoryAlerts.length > 0 ? (
              inventoryAlerts.map(p => (
                <div key={p.id} className={`p-3 rounded-xl border-2 transition-all ${p.isUrgent ? 'bg-red-100 border-red-300' : 'bg-orange-100 border-orange-300'}`}>
                  <div className="flex items-start gap-3">
                    <img
                      src={getOptimizedImageUrl(p.image, 100)}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      alt={p.name}
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[11px] font-bold text-gray-900 truncate">{p.name}</p>
                        {p.isUrgent && <span className="text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-md animate-pulse">URGENT</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                        <div className="bg-white/60 p-1.5 rounded-lg">
                          <p className="text-gray-500">Current Stock</p>
                          <p className={`text-lg font-black ${p.currentStock === 0 ? 'text-red-600' : 'text-orange-600'}`}>{p.currentStock}</p>
                        </div>
                        <div className="bg-white/60 p-1.5 rounded-lg">
                          <p className="text-gray-500">Days Left</p>
                          <p className={`text-lg font-black ${p.daysUntilStockout < 3 ? 'text-red-600' : 'text-orange-600'}`}>
                            {p.daysUntilStockout === 999 ? '∞' : p.daysUntilStockout}
                          </p>
                        </div>
                        <div className="bg-white/60 p-1.5 rounded-lg">
                          <p className="text-gray-500">Daily Sold</p>
                          <p className="text-lg font-black text-[#1CA672]">{p.dailySalesRate} units</p>
                        </div>
                        <div className="bg-white/60 p-1.5 rounded-lg">
                          <p className="text-gray-500">Reorder Qty</p>
                          <p className="text-lg font-black text-blue-600">{p.suggestedReorderQty}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-sm text-gray-600 font-semibold">✅ सभी products में अच्छा stock है!</p>
            )}
          </div>
        </div>

        {/* Customer Insights */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              Customer Insights
            </h3>
            <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 rounded-md">
              {customerInsights.totalCustomers} customers
            </span>
          </div>

          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/70 p-3 rounded-xl border border-blue-100">
                <p className="text-[10px] text-gray-600 font-semibold mb-1">Repeat Rate</p>
                <p className="text-2xl font-black text-blue-600">{customerInsights.repeatRate}%</p>
                <p className="text-[9px] text-gray-500 mt-1">re-order करते हैं</p>
              </div>
              <div className="bg-white/70 p-3 rounded-xl border border-indigo-100">
                <p className="text-[10px] text-gray-600 font-semibold mb-1">Avg Order Value</p>
                <p className="text-2xl font-black text-indigo-600">₹{customerInsights.avgOrderValue}</p>
                <p className="text-[9px] text-gray-500 mt-1">per order</p>
              </div>
            </div>

            {/* Top Customers */}
            <div>
              <p className="text-[11px] font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Trophy size={14} className="text-amber-500" />
                Top Customers
              </p>
              <div className="space-y-2">
                {customerInsights.topCustomers.map((customer, idx) => (
                  <div key={customer.phone} className="bg-white/70 p-2.5 rounded-lg border border-blue-100 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-600">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                          <p className="text-[10px] font-bold text-gray-900 truncate">{customer.name}</p>
                          {customer.isVIP && <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">VIP</span>}
                        </div>
                        <p className="text-[9px] text-gray-500 ml-6">
                          {customer.totalOrders}x orders · {formatPrice(customer.totalSpent)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Churn Risk */}
            {customerInsights.churnRiskCustomers.length > 0 && (
              <div className="bg-red-100/50 border border-red-200 p-3 rounded-xl">
                <p className="text-[11px] font-bold text-red-700 mb-2 flex items-center gap-2">
                  <AlertCircle size={14} />
                  Churn Risk ({customerInsights.churnRiskCustomers.length})
                </p>
                <div className="space-y-1">
                  {customerInsights.churnRiskCustomers.map(customer => (
                    <p key={customer.phone} className="text-[9px] text-red-700 font-semibold">
                      {customer.name} - {customer.daysInactive} दिन पहले order किया था
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Customers */}
            {customerInsights.inactiveCustomers.length > 0 && (
              <div className="bg-yellow-100/50 border border-yellow-200 p-3 rounded-xl">
                <p className="text-[11px] font-bold text-yellow-700 mb-2">
                  Inactive ({customerInsights.inactiveCustomers.length})
                </p>
                <div className="space-y-1">
                  {customerInsights.inactiveCustomers.map(customer => (
                    <p key={customer.phone} className="text-[9px] text-yellow-700 font-semibold">
                      {customer.name} - {customer.daysInactive} दिन से inactive
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Never Ordered - OFFER OPPORTUNITY */}
            {customerInsights.neverOrderedCustomers.length > 0 && (
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 p-3 rounded-xl">
                <p className="text-[11px] font-bold text-purple-700 mb-2 flex items-center gap-2">
                  <Gift size={14} />
                  🎯 Never Ordered ({customerInsights.neverOrderedCustomers.length})
                </p>
                <div className="space-y-1.5 text-[8.5px]">
                  {customerInsights.neverOrderedCustomers.map(customer => (
                    <div key={customer.phone} className="bg-white/80 p-1.5 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-purple-900 truncate">{customer.name}</span>
                        <span className="text-purple-600 font-semibold whitespace-nowrap">{customer.daysRegistered}d ago</span>
                      </div>
                      {customer.email && <p className="text-gray-600 truncate">{customer.email}</p>}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/admin/special-offers')}
                  className="w-full mt-2 text-[9px] font-bold bg-purple-600 text-white py-1.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  📱 Create Custom Offers
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Orders by Status</h3>
          <div className="flex items-center justify-between gap-8">
            <div className="w-32 h-32 rounded-full flex-shrink-0" style={{
              background: `conic-gradient(
                #fcd34d 0% 25%, 
                #60a5fa 25% 60%, 
                #34d399 60% 90%, 
                #f87171 90% 100%
              )`
            }} />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600"><div className="w-3 h-3 rounded-full bg-yellow-400"/> Pending</span>
                <span className="font-bold text-gray-900">{orderStats.pending}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600"><div className="w-3 h-3 rounded-full bg-blue-400"/> Confirmed</span>
                <span className="font-bold text-gray-900">{orderStats.confirmed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600"><div className="w-3 h-3 rounded-full bg-green-400"/> Delivered</span>
                <span className="font-bold text-gray-900">{orderStats.delivered}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600"><div className="w-3 h-3 rounded-full bg-red-400"/> Cancelled</span>
                <span className="font-bold text-gray-900">{orderStats.cancelled}</span>
              </div>
            </div>
          </div>
          {/* Top Selling Products — Category-wise with Rankings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              Top Selling Products
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {topSellingProducts.length} products · {topSellingByCategory.length} categories
            </span>
          </div>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
            {topSellingByCategory.length > 0 ? (
              topSellingByCategory.map(([category, catProducts]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white z-10 py-1">
                    <span className="text-[10px] font-black text-white bg-gray-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {category}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400">
                      {catProducts.reduce((s, p) => s + p.totalSold, 0)} sold · {formatPrice(catProducts.reduce((s, p) => s + p.revenue, 0))}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    {catProducts.map((p) => {
                      const rankBg = p.globalRank === 1 ? 'bg-amber-100 border-amber-200 text-amber-700' 
                        : p.globalRank === 2 ? 'bg-gray-100 border-gray-200 text-gray-600' 
                        : p.globalRank === 3 ? 'bg-orange-50 border-orange-200 text-orange-600' 
                        : 'bg-gray-50 border-gray-100 text-gray-400';
                      const medal = p.globalRank === 1 ? '🥇' : p.globalRank === 2 ? '🥈' : p.globalRank === 3 ? '🥉' : `#${p.globalRank}`;
                      return (
                        <div key={p.id} className={`flex items-center gap-3 p-2 rounded-xl border ${rankBg} transition-all hover:shadow-sm`}>
                          <div className="w-7 flex justify-center text-xs font-black shrink-0">
                            {medal}
                          </div>
                          <img 
                            src={getOptimizedImageUrl(p.image, 100)} 
                            className="w-8 h-8 rounded-lg object-cover shrink-0" 
                            alt={p.name} 
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-gray-800 truncate">{p.name}</p>
                            <p className="text-[9px] text-[#1CA672] font-bold">{p.totalSold} items sold</p>
                          </div>
                          <div className="text-xs font-black text-gray-900 shrink-0">
                            {formatPrice(p.revenue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-xs text-gray-500">No sales data yet.</p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Orders</h3>
          <button onClick={() => navigate('/admin/orders')} className="text-[#1CA672] text-sm font-semibold hover:underline flex items-center">
            View All <ChevronRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Items</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/admin/orders')}>
                  <td className="p-4 text-sm font-bold text-gray-900">
                    #{order.id}
                    {order.isLocationVerified === false && (
                      <div className="mt-1 flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-md border border-red-200 w-max">
                        <span className="text-[10px] font-black uppercase tracking-wider">⚠️ Loc Not Verified</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">{order.items?.length || 0} items</td>
                  <td className="p-4 text-sm font-bold text-gray-900">{formatPrice(order.totalAmount || order.total)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(order.placedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
