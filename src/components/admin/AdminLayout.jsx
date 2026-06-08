import { Navigate, Outlet } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { useOrdersStore } from '../../store/ordersStore';
import AdminSidebar from './AdminSidebar';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function AdminLayout() {
  const isAdminLoggedIn = useAdminStore((state) => state.isAdminLoggedIn);
  const adminRole = useAdminStore((state) => state.adminRole);
  const currentAdminUsername = useAdminStore((state) => state.currentAdminUsername);
  const logout = useAdminStore((state) => state.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('adminTheme') === 'dark');

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Get Auth user for double-checking
  const user = useAuthStore((state) => state.user);
  const isEmailAdmin = user?.role === 'admin' || user?.role === 'pro_admin';

  // Derived: isProAdmin based on username (stable, localStorage-backed)
  const isProAdmin = currentAdminUsername === 'monugandhi5911' || 
                     adminRole === 'pro_admin' || 
                     localStorage.getItem('gmart_is_pro_admin') === '1';

  // Audio & Alert State for New Order
  const lastOrderTimeRef = useRef(Date.now());
  const [activeAlert, setActiveAlert] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false); // To handle browser auto-play policy
  const activeAlertRef = useRef(null);
  const audioInstanceRef = useRef(null);
  const alertQueueRef = useRef([]);
  const orders = useOrdersStore((state) => state.orders);

  useEffect(() => {
    activeAlertRef.current = activeAlert;
  }, [activeAlert]);

  const stopCurrentAudio = () => {
    const audio = audioInstanceRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audioInstanceRef.current = null;
    }
  };

  const playAlertAudio = () => {
    stopCurrentAudio();

    if (!audioEnabled) return;

    const audio = new Audio(ALERT_SOUND_URL);
    audio.loop = true;
    audio.play().catch(e => {
      console.error('Audio play failed (even after enabled):', e);
    });
    audioInstanceRef.current = audio;
  };

  const showBrowserNotification = (orderId) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = '🚨 NEW ORDER!';
      const options = {
        body: `Order #${orderId} received!`,
        icon: 'https://gandhimart-c9e7.vercel.app/logo.png',
        badge: 'https://gandhimart-c9e7.vercel.app/logo.png',
        tag: 'new-order',
        requireInteraction: true
      };

      try {
        // Works on Desktop browsers
        new Notification(title, options);
      } catch (e) {
        // Fails on Android Chrome with TypeError: Illegal constructor
        if (e.name === 'TypeError' || e.message.includes('Illegal constructor')) {
          if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(title, options);
            });
          }
        }
      }
    }
  };

  const showNextAlert = () => {
    const nextAlert = alertQueueRef.current.shift() || null;

    if (!nextAlert) {
      setActiveAlert(null);
      toast.dismiss('new-order-alert');
      return;
    }

    setActiveAlert(nextAlert);

    // Send browser notification (works in background!)
    showBrowserNotification(nextAlert.id);

    if (audioEnabled) {
      playAlertAudio();
    } else {
      console.warn('New order received but audio is not enabled by user.');
      toast.error('Audio Disabled! Enable it from top header to hear rings.', { duration: 10000 });
    }

    toast.error(`NEW ORDER: #${nextAlert.id}`, {
      id: 'new-order-alert',
      duration: Infinity,
      position: 'top-center',
      style: {
        background: '#ef4444',
        color: '#fff',
        fontSize: '18px',
        fontWeight: '900',
        padding: '24px',
        borderRadius: '24px',
        border: '4px solid #fff',
        zIndex: 99999
      }
    });
  };

  const enableAudio = () => {
    // Play a silent sound to "unlock" audio on this browser session
    const audio = new Audio(ALERT_SOUND_URL);
    audio.volume = 0;
    audio.play().then(() => {
      setAudioEnabled(true);
      toast.success('Alerts Enabled! 🔔', { id: 'audio-enabled' });

      // Request notification permission for background alerts
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      if (activeAlertRef.current && !audioInstanceRef.current) {
        playAlertAudio();
      }
    }).catch(e => {
      console.error("Audio activation failed:", e);
      toast.error('Click again to enable alerts');
    });
  };

  const stopAlert = () => {
    stopCurrentAudio();
    toast.dismiss('new-order-alert'); // Dismiss the persistent toast
    showNextAlert();
  };

  const dismissAllAlerts = () => {
    stopCurrentAudio();
    alertQueueRef.current = [];
    setActiveAlert(null);
    toast.dismiss('new-order-alert');
  };

  useEffect(() => {
    if (orders.length > 0) {
      const freshOrders = orders
        .filter(order => order.status === 'placed')
        .map(order => ({
          order,
          orderTime: new Date(order.placedAt).getTime()
        }))
        .filter(({ orderTime }) => orderTime > lastOrderTimeRef.current)
        .sort((a, b) => a.orderTime - b.orderTime);

      if (freshOrders.length > 0) {
        lastOrderTimeRef.current = freshOrders[freshOrders.length - 1].orderTime;
        const currentAlertId = activeAlertRef.current?.id;
        const existingQueueIds = new Set(alertQueueRef.current.map(item => item.id));
        const nextQueue = [...alertQueueRef.current];

        freshOrders.forEach(({ order }) => {
          if (order.id === currentAlertId || existingQueueIds.has(order.id)) return;
          existingQueueIds.add(order.id);
          nextQueue.push(order);
        });

        alertQueueRef.current = nextQueue;

        if (!activeAlertRef.current) {
          showNextAlert();
        }
      }
    }
  }, [orders, audioEnabled]);

  // Note: OneSignal tag syncing (role, username, phone, name) is handled globally in App.jsx

  // If PIN login is not active OR Email session is gone/not admin, redirect to profile
  if (!isAdminLoggedIn || !isEmailAdmin) {
    if (isAdminLoggedIn && !isEmailAdmin) {
      logout();
    }
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm md:text-base admin-dashboard">
      
      {/* PERSISTENT ALERT OVERLAY */}
      {activeAlert && (
        <div className="fixed inset-0 z-[9999] bg-red-600/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-pulse">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-sm w-full space-y-6">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Bell size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 leading-none">NAYA ORDER!</h2>
              {alertQueueRef.current.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-black bg-red-100 text-red-700 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                    + {alertQueueRef.current.length} Naye Orders Queue Mein
                  </span>
                </div>
              )}
              <p className="text-gray-500 font-bold mt-3">Order ID: #{activeAlert.id}</p>
              <p className="text-2xl font-black text-red-600 mt-1">Amount: ₹{activeAlert.totalAmount || activeAlert.total}</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={stopAlert}
                className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl text-xl hover:bg-black transition-all active:scale-95 shadow-xl"
              >
                STOP ALERT
              </button>
              {alertQueueRef.current.length > 0 && (
                <button 
                  onClick={dismissAllAlerts}
                  className="w-full bg-red-100 text-red-600 font-black py-3 rounded-2xl hover:bg-red-200 transition-all active:scale-95 border border-red-200"
                >
                  DISMISS ALL ({alertQueueRef.current.length + 1})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1a2e] text-white transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <AdminSidebar onClose={() => setMobileMenuOpen(false)} isProAdmin={isProAdmin} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Admin Panel</h1>
            
            {/* Audio Toggle Button */}
            <button 
              onClick={enableAudio}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${audioEnabled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-600 border-red-200 animate-pulse'} border`}
            >
              <Bell size={16} className={audioEnabled ? '' : 'animate-bounce'} />
              {audioEnabled ? 'ALERTS ACTIVE' : 'ENABLE ALERTS'}
            </button>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => {
                const newMode = !isDarkMode;
                setIsDarkMode(newMode);
                localStorage.setItem('adminTheme', newMode ? 'dark' : 'light');
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isDarkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} />}
            </button>

            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${isProAdmin ? 'bg-amber-500 shadow-lg shadow-amber-200' : 'bg-gradient-to-tr from-[#1CA672] to-green-400'}`}>
                {isProAdmin ? 'S' : 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-gray-500 font-bold uppercase leading-none">Account</p>
                <p className="font-bold text-gray-800">{isProAdmin ? 'Super Admin' : 'Admin'}</p>
              </div>
            </div>
            <button 
              onClick={() => { logout(); }}
              className="text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
