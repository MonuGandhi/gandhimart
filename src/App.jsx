import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { lazy, Suspense } from 'react';

const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        // Clear caches to force service worker to update
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          } catch (e) {
            console.error('Error clearing caches', e);
          }
        }
        // Force reload by appending a timestamp query string to break out of SW cache
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('v', new Date().getTime().toString());
        window.location.href = currentUrl.toString();
        // Return a promise that never resolves to prevent further rendering
        return new Promise(() => {});
      }
      throw error;
    }
  });

// Lazy loaded Pages
const Home = lazyWithRetry(() => import('./pages/Home'));
const Category = lazyWithRetry(() => import('./pages/Category'));
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'));
const Search = lazyWithRetry(() => import('./pages/Search'));
const Cart = lazyWithRetry(() => import('./pages/Cart'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const OrderSuccess = lazyWithRetry(() => import('./pages/OrderSuccess'));
const OrderTracking = lazyWithRetry(() => import('./pages/OrderTracking'));
const Orders = lazyWithRetry(() => import('./pages/Orders'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const Wishlist = lazyWithRetry(() => import('./pages/Wishlist'));
const Notifications = lazyWithRetry(() => import('./pages/Notifications'));
const Install = lazyWithRetry(() => import('./pages/Install'));
const Policies = lazyWithRetry(() => import('./pages/Policies'));
const DeliveryDashboard = lazyWithRetry(() => import('./pages/DeliveryDashboard'));
const AdminLayout = lazyWithRetry(() => import('./components/admin/AdminLayout'));
const AdminLogin = lazyWithRetry(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazyWithRetry(() => import('./pages/admin/Dashboard'));
const Products = lazyWithRetry(() => import('./pages/admin/Products'));
const Categories = lazyWithRetry(() => import('./pages/admin/Categories'));
const OrdersAdmin = lazyWithRetry(() => import('./pages/admin/Orders'));
const Coupons = lazyWithRetry(() => import('./pages/admin/Coupons'));
const SpecialOffers = lazyWithRetry(() => import('./pages/admin/SpecialOffers'));
const Customers = lazyWithRetry(() => import('./pages/admin/Customers'));
const BannersAdmin = lazyWithRetry(() => import('./pages/admin/Banners'));
const AdminNotifications = lazyWithRetry(() => import('./pages/admin/Notifications'));
const Appearance = lazyWithRetry(() => import('./pages/admin/Appearance'));
const Reviews = lazyWithRetry(() => import('./pages/admin/Reviews'));
const Settings = lazyWithRetry(() => import('./pages/admin/Settings'));
const StoreStatus = lazyWithRetry(() => import('./pages/admin/StoreStatus'));
const LayoutManager = lazyWithRetry(() => import('./pages/admin/LayoutManager'));
const Udhaars = lazyWithRetry(() => import('./pages/admin/Udhaars'));
import { Navigate } from 'react-router-dom';

const TrackOrder = lazyWithRetry(() => import('./pages/TrackOrder'));
const DeliveryTracker = lazyWithRetry(() => import('./pages/DeliveryTracker'));
const ActiveDeliveries = lazyWithRetry(() => import('./pages/admin/ActiveDeliveries'));
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
import locationService from './utils/locationService';

const AppContent = () => {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { isAdminLoggedIn } = useAdminStore();
  const initAdminFirebase = useAdminStore((s) => s.initFirebase);
  const initializeAdminStore = useAdminStore((s) => s.initializeStore);
  const initNotifsFirebase = useNotificationStore((s) => s.initFirebase);
  const initOrdersFirebase = useOrdersStore((s) => s.initFirebase);
  const initAuthFirebase = useAuthStore((s) => s.initFirebase);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const logout = useAuthStore((s) => s.logout);

  // Sync Firebase Auth with Zustand to fix permission errors on session expiry
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser && isLoggedIn) {
        console.warn('Firebase Auth state mismatch (user is null). Logging out from Zustand to prevent permission errors.');
        logout();
      }
    });
    return () => unsubscribeAuth();
  }, [isLoggedIn, logout]);

  // Background Silent Location Fetching (No annoying popups)
  useEffect(() => {
    if ('permissions' in navigator && navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' }).then((perm) => {
        // Sirf tabhi fetch karo jab user ne already permission de rakhi ho
        // Isse naye users ko faaltu me permission popup nahi dikhega jab wo app open karenge
        if (perm.state === 'granted') {
          locationService.getCurrentLocation().catch(() => {});
        }
      });
    }
  }, []);

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
          // Link user to OneSignal using Firebase UID only if not already synced in this session
          if (window.__oneSignalSyncedUid !== user.uid) {
            try {
              await OneSignal.login(user.uid);
              // Send tags in one batch
              const tagsToSet = {};
              if (user.phone) tagsToSet.phone = user.phone;
              if (user.name) tagsToSet.name = user.name;
              if (isAdminLoggedIn || user.role === 'admin' || user.role === 'pro_admin') {
                tagsToSet.role = 'admin';
                tagsToSet.username = user.username || user.name || 'admin';
              }
              
              if (Object.keys(tagsToSet).length > 0) {
                await OneSignal.User.addTags(tagsToSet);
              }
              window.__oneSignalSyncedUid = user.uid;
            } catch (e) {
              console.error("OneSignal Global Sync Error:", e);
            }
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
  }, [user?.email, user?.role, user?.uid, isAdminLoggedIn, initOrdersFirebase, initAuthFirebase]);

  const isStoreOpen = useAdminStore((state) => state.storeSettings?.isStoreOpen ?? true);
  const isSettingsLoaded = useAdminStore((state) => state.isSettingsLoaded);
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Check if current user has admin privileges
  const isUserAdmin = isAdminLoggedIn || user?.role === 'admin' || user?.role === 'pro_admin';

  const blacklist = useAdminStore((state) => state.blacklist) || { emails: [], phones: [] };
  const isBlocked = user?.isBlocked || 
                    (user?.email && blacklist.emails?.includes(user.email.toLowerCase())) || 
                    (user?.phone && blacklist.phones?.includes(user.phone));

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
      ) : isBlocked && !isAdminRoute ? (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center z-50">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-200">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-red-800 mb-4 uppercase tracking-widest">Access Denied</h1>
          <p className="text-red-700 max-w-md font-bold text-[15px] leading-relaxed border border-red-200 py-6 bg-white px-5 rounded-2xl shadow-sm">
            Aapke account par suspicious (sandigdh) activity detect hui hai. Hamari policies ka ulanghan karne ki wajah se aapka access permanently block kar diya gaya hai. Ab aap hamari services ka istemal nahi kar sakte.
          </p>
        </div>
      ) : (
        <Suspense fallback={<SplashLoading />}>
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
        </Suspense>
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
