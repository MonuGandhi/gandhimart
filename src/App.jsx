import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Pages
import Home from './pages/Home';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import Install from './pages/Install';
import Policies from './pages/Policies';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import OrdersAdmin from './pages/admin/Orders';
import Coupons from './pages/admin/Coupons';
import SpecialOffers from './pages/admin/SpecialOffers';
import Customers from './pages/admin/Customers';
import BannersAdmin from './pages/admin/Banners';
import AdminNotifications from './pages/admin/Notifications';
import Appearance from './pages/admin/Appearance';
import Reviews from './pages/admin/Reviews';
import Settings from './pages/admin/Settings';
import StoreStatus from './pages/admin/StoreStatus';
import LayoutManager from './pages/admin/LayoutManager';
import Udhaars from './pages/admin/Udhaars';
import { Navigate } from 'react-router-dom';

import TrackOrder from './pages/TrackOrder';
import DeliveryTracker from './pages/DeliveryTracker';
import ActiveDeliveries from './pages/admin/ActiveDeliveries';
import { useAuthStore } from './store/authStore';

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Global Referral Listener
const ReferralListener = () => {
  const { search } = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('gmart_referral_code', ref);
      console.log('Global Referral Captured:', ref);
    }
  }, [search]);
  return null;
};

import InstallPrompt from './components/ui/InstallPrompt';
import StoreClosed from './components/ui/StoreClosed';
import SplashLoading from './components/ui/SplashLoading';
import { useAdminStore } from './store/adminStore';

import { useOrdersStore } from './store/ordersStore';
import { useNotificationStore } from './store/notificationsStore';

const AppContent = () => {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { isAdminLoggedIn } = useAdminStore();
  const initAdminFirebase = useAdminStore((s) => s.initFirebase);
  const initializeAdminStore = useAdminStore((s) => s.initializeStore);
  const initNotifsFirebase = useNotificationStore((s) => s.initFirebase);
  const initOrdersFirebase = useOrdersStore((s) => s.initFirebase);
  const initAuthFirebase = useAuthStore((s) => s.initFirebase);

  useEffect(() => {
    initializeAdminStore(user);
  }, [user?.email, user?.role, initializeAdminStore]);

  useEffect(() => {
    initAdminFirebase();
    initNotifsFirebase();
  }, [initAdminFirebase, initNotifsFirebase]);

  useEffect(() => {
    let orderRole = isAdminLoggedIn;
    if (user?.role === 'delivery_boy') {
      orderRole = 'delivery';
    }

    initOrdersFirebase(user?.email, orderRole);
    if (user?.email) {
      initAuthFirebase(user.email);
    }

    // Global OneSignal Sync
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        if (user?.uid) {
          // Link user to OneSignal using Firebase UID
          try {
            await OneSignal.login(user.uid);
            // Also keep tags synced
            if (user.phone) await OneSignal.User.addTag("phone", user.phone);
            if (user.name) await OneSignal.User.addTag("name", user.name);
          } catch (e) {
            console.error("OneSignal Global Sync Error:", e);
          }
        } else {
          // Clear OneSignal session on logout
          try {
            await OneSignal.logout();
          } catch (e) {
            console.error("OneSignal Logout Error:", e);
          }
        }
      });
    }
  }, [user?.email, user?.role, user?.uid, user?.phone, user?.name, isAdminLoggedIn, initOrdersFirebase, initAuthFirebase]);

  const isStoreOpen = useAdminStore((state) => state.storeSettings?.isStoreOpen ?? true);
  const isSettingsLoaded = useAdminStore((state) => state.isSettingsLoaded);
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Check if current user has admin privileges
  const isUserAdmin = isAdminLoggedIn || user?.role === 'admin' || user?.role === 'pro_admin';

  // Check if splash was already shown in this session
  const hasSeenSplash = sessionStorage.getItem('gmart_splash_seen');

  useEffect(() => {
    if (isSettingsLoaded) {
      sessionStorage.setItem('gmart_splash_seen', 'true');
    }
  }, [isSettingsLoaded]);

  if (!isSettingsLoaded && !isAdminRoute) {
    if (hasSeenSplash) {
      // Prevent flicker by showing a blank screen until settings are loaded
      return <div className="min-h-screen bg-white" />;
    }
    return <SplashLoading />;
  }

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50 min-h-screen relative overflow-x-hidden">
      <ScrollToTop />
      <ReferralListener />
      <InstallPrompt />
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '16px',
            padding: '12px 20px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#1CA672',
              secondary: '#fff',
            },
          },
        }}
      />
      


      {(!isStoreOpen && !isAdminRoute && !isUserAdmin) ? (
        <StoreClosed />
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/delivery-tracker" element={<DeliveryTracker />} />
            <Route path="/admin/active-deliveries" element={<ActiveDeliveries />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/order/:id" element={<OrderTracking />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/install" element={<Install />} />
          <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
          <Route path="/privacy" element={<Policies />} />
          <Route path="/terms" element={<Policies />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="udhaars" element={<Udhaars />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="special-offers" element={<SpecialOffers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="banners" element={<BannersAdmin />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="appearance" element={<Appearance />} />
            <Route path="store-status" element={<StoreStatus />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="layout" element={<LayoutManager />} />
        </Route>
        </Routes>
      )}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
