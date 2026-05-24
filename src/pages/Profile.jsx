import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, MapPin, Tag, HelpCircle, Info, LogOut, ChevronRight,
  ShieldCheck, FileText, Gift, Copy, Share2, Phone, Mail,
  MessageCircle, X, Bell, ShoppingBag, Wallet, RefreshCw, Heart
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { useOrdersStore } from '../store/ordersStore';
import { useAdminStore } from '../store/adminStore';
import { useNotificationStore } from '../store/notificationsStore';
import { useWishlistStore } from '../store/wishlistStore';
import toast from 'react-hot-toast';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, query, orderBy, getDocs, getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';

// ── Bottom Sheet Modal Wrapper ──────────────────────────────────────────────
function BottomSheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 animate-in fade-in duration-300" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-6 pb-8 z-10 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

// Helper to compare phone numbers safely by matching last 10 digits
const comparePhones = (phone1, phone2) => {
  if (!phone1 || !phone2) return false;
  const p1 = String(phone1).replace(/\D/g, '');
  const p2 = String(phone2).replace(/\D/g, '');
  if (p1.length < 10 || p2.length < 10) return p1 === p2;
  return p1.slice(-10) === p2.slice(-10);
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoggedIn, login, logout, savedAddresses } = useAuthStore();
  const orders = useOrdersStore((s) => s.orders);
  const trackUser = useAdminStore((s) => s.trackUser);
  const adminCoupons = useAdminStore((s) => s.adminCoupons);
  const { notifications, readIds, deletedIds } = useNotificationStore();
  const storeSettings = useAdminStore((s) => s.storeSettings) || {};
  const wishlistItems = useWishlistStore((s) => s.items);
  const wishlistItemsCount = wishlistItems.length;
  const visibleNotifications = notifications.filter(n => {
    if (deletedIds.includes(n.id)) return false;
    // If notification has email → only show to that email user
    if (n.email) return n.email.toLowerCase() === user?.email?.toLowerCase();
    // If notification has phone but no email → fallback phone match
    if (n.phone) return comparePhones(n.phone, user?.phone);
    // Global notification (no email, no phone) → show to everyone
    return true;
  });
  const unreadNotifications = visibleNotifications.filter(n => !readIds.includes(n.id)).length;

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [modal, setModal] = useState(null);
  const [staffPinModal, setStaffPinModal] = useState({ open: false, target: null, pin: '', loading: false });
  const [masterPinModal, setMasterPinModal] = useState({ open: false, pin: '', loading: false });
  const [pushLoading, setPushLoading] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [showWalletHistory, setShowWalletHistory] = useState(false);
  const [walletTx, setWalletTx] = useState([]);
  const [loadingWalletTx, setLoadingWalletTx] = useState(false);

  const fetchWalletHistory = async () => {
    if (!user?.email) return;
    setLoadingWalletTx(true);
    setShowWalletHistory(true);
    try {
      const q = query(
        collection(db, `users/${user.email}/wallet_transactions`),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      setWalletTx(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      toast.error('Could not fetch wallet history');
    }
    setLoadingWalletTx(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        // Get initial state
        const currentState = OneSignal.User.PushSubscription.optedIn || false;
        setIsPushEnabled(currentState);
        
        // Tag user with phone and name and login with Firebase UID if logged in
        if (isLoggedIn && user?.uid) {
          try {
            await OneSignal.login(user.uid);
            await OneSignal.User.addTag("phone", user.phone);
            if (user.name) {
              await OneSignal.User.addTag("name", user.name);
            }
          } catch (e) {
            console.error("OneSignal addTag/login error:", e);
          }
        }

        // Listen for changes
        OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
          const isOptedIn = event.current.optedIn;
          setIsPushEnabled(isOptedIn);
          setPushLoading(false);

          // Update Firestore when subscription status changes
          if (isLoggedIn && user?.email) {
            try {
              const userRef = doc(db, 'users', user.email.toLowerCase());
              await updateDoc(userRef, {
                pushEnabled: isOptedIn,
                lastPushUpdate: new Date().toISOString()
              });
              console.log("[PushSync] Firestore updated:", isOptedIn);
            } catch (err) {
              console.error("[PushSync] Firestore error:", err);
            }
          }
        });
      });
    }
  }, [isLoggedIn, user]);

  const togglePush = async () => {
    if (pushLoading) return; 

    // Sabse pehle phone / browser ki setting check karo
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'denied') {
        toast.error('❌ Phone ne notifications Block kiye hain! Browser bar me Lock(🔒) icon par dabayein aur "Allow" karein.', { duration: 6000 });
        return; // Agar blocked hai toh ghumna shuru hi mat karo
      }
    }

    setPushLoading(true);
    const safetyTimeout = setTimeout(() => {
      setPushLoading(false);
    }, 5000); 

    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          const currentlyOptedIn = OneSignal.User.PushSubscription.optedIn;
          
          if (currentlyOptedIn) {
            await OneSignal.User.PushSubscription.optOut();
            setIsPushEnabled(false);
            toast.success('🔕 Notifications band ho gayi');
          } else {
            if (Notification.permission === 'granted') {
               await OneSignal.User.PushSubscription.optIn();
               setIsPushEnabled(true);
               toast.success('🔔 Notifications chalu ho gayi!');
            } else if (Notification.permission === 'denied') {
               toast.error('❌ Browser Lock (🔒) icon mein notification allow karein.');
            } else {
               await OneSignal.Slidedown.promptPush({ force: true });
               toast('Screen par OneSignal ka message check karein', { icon: '👀' });
            }
          }
        } catch (err) {
          console.error('Push toggle error:', err);
          toast.error('Error: ' + err.message);
        } finally {
          clearTimeout(safetyTimeout);
          setPushLoading(false);
        }
      });
    } else {
      clearTimeout(safetyTimeout);
      setPushLoading(false);
    }
  };

  const referralCode = (user && user.name && user.phone)
    ? `GM${user.name.slice(0, 3).toUpperCase()}${user.phone.slice(-3)}`
    : '';

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      setTempUser({
        name: googleUser.displayName || 'Customer',
        email: googleUser.email,
        photoURL: googleUser.photoURL,
        uid: googleUser.uid,
      });
      setNeedsPhone(true);
      toast.success(`Welcome ${googleUser.displayName || 'Customer'}!`);
    } catch (error) {
      console.error("Sign-in error details:", error);
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized in Firebase Console! Please check Step 1.');
      } else {
        toast.error(`Sign-In Error: ${error.message}`);
      }
    }
    setLoading(false);
  };

  const handleSavePhone = (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    const PRO_PHONE = useAdminStore.getState().proAdminConfig?.phone || "8607424026";
    const PRO_PIN = "9365524026"; // Fallback if not in config

    if (phone === PRO_PHONE) {
      if (pin !== PRO_PIN) {
        toast.error('Admin PIN is required and must be correct!');
        return;
      }
    }

    const completeLogin = async () => {
      setLoading(true);
      try {
        const savedRefCode = localStorage.getItem('gmart_referral_code');
        await trackUser({ 
          name: tempUser.name, 
          phone, 
          email: tempUser.email,
          photoURL: tempUser.photoURL,
          uid: tempUser.uid,
          referralCode: savedRefCode 
        });
        
        login(tempUser.name, phone, tempUser.email, tempUser.photoURL, tempUser.uid);
        
        if (savedRefCode) {
          localStorage.removeItem('gmart_referral_code');
        }
        
        // OneSignal login (external_id linking) and permission prompting
        if (typeof window !== 'undefined') {
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async function(OneSignal) {
            try {
              if (tempUser.uid) {
                await OneSignal.login(tempUser.uid);
                await OneSignal.User.addTag("phone", phone);
                if (tempUser.name) {
                  await OneSignal.User.addTag("name", tempUser.name);
                }
              }
              // Explicitly prompt push permission
              await OneSignal.Slidedown.promptPush();
            } catch (e) {
              console.error("OneSignal login error during auth flow:", e);
            }
          });
        }
        
        toast.success('Logged in successfully! 🎉');
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Phone check failed');
      } finally {
        setLoading(false);
      }
    };
    completeLogin();
  };

  const submitStaffPin = () => {
    if (staffPinModal.pin !== user?.staffPin) {
      toast.error('Invalid PIN');
      return;
    }
    
    setStaffPinModal(prev => ({ ...prev, loading: true }));
    
    setTimeout(() => {
      if (staffPinModal.target === 'admin') {
        // Clear any pro admin flag just in case
        localStorage.removeItem('gmart_is_pro_admin');
        
        // Force set the admin state directly since PIN is already verified
        useAdminStore.setState({
          isAdminLoggedIn: true,
          adminRole: 'admin',
          currentAdminUsername: user.name || 'Staff'
        });
        
        navigate('/admin');
        toast.success('Welcome to Admin Panel');
      } else if (staffPinModal.target === 'delivery') {
        navigate('/delivery-dashboard');
      }
      setStaffPinModal({ open: false, target: null, pin: '', loading: false });
    }, 500); // small delay for UX
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          await OneSignal.logout();
        } catch (e) {
          console.error("OneSignal logout error:", e);
        }
      });
    }
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied! 🎉');
  };

  const handleShare = async () => {
    const installUrl = `https://gandhimart-c9e7.vercel.app/install?ref=${referralCode}`;
    const text = `🛒 G Mart: Get Fresh Groceries in 10 Mins!\n\n1️⃣ Install App: ${installUrl}\n2️⃣ Use Code: ${referralCode}\n3️⃣ Enable Notifications (🔔) to qualify!\n\nGet ₹10 reward after your first order! 🎁`;
    if (navigator.share) {
      try { await navigator.share({ title: 'G Mart - Refer & Earn ₹10', text }); }
      catch (error) {
        console.error(error);
        // Share cancelled or failed
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Referral link copied! 🎉');
    }
  };

  const userOrders = orders.filter((o) => {
    // 1. Email check
    if (o.customerEmail && user?.email && o.customerEmail.toLowerCase() === user.email.toLowerCase()) {
      return true;
    }
    // 2. Safe Phone number check
    const orderPhone = o.deliveryAddress?.phone || o.address?.phone || o.phone;
    return comparePhones(orderPhone, user?.phone);
  });

  // ── Login Screen ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <User size={40} className="text-[#1CA672]" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Welcome!</h2>
          <p className="text-sm text-gray-500 font-medium text-center mb-8 max-w-xs">
            {needsPhone ? 'Just one last step to complete your profile.' : 'Login to access your orders, saved addresses and exclusive offers.'}
          </p>

          {!needsPhone ? (
            <div className="w-full max-w-sm flex flex-col items-center gap-4">
              <button 
                onClick={handleGoogleSignIn} 
                disabled={loading}
                className="w-full bg-white border-2 border-gray-200 text-gray-800 font-bold text-lg py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-70"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                {loading ? 'Please wait...' : 'Continue with Google'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSavePhone} className="w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex gap-2">
                <div className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm text-gray-500 font-bold flex items-center justify-center">+91</div>
                <input
                  type="tel" placeholder="Mobile Number" value={phone}
                  onChange={(e) => setPhone(e.target.value)} maxLength={10}
                  className="flex-1 bg-white border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-[#1CA672] transition-colors"
                  autoFocus
                />
              </div>

              {phone === (useAdminStore.getState().proAdminConfig?.phone || "8607424026") && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <input
                    type="password"
                    placeholder="Enter Admin PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={12}
                    className="w-full bg-orange-50 border-2 border-orange-200 text-orange-900 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-orange-500 text-center tracking-widest"
                  />
                  <p className="text-[10px] font-black text-orange-500 mt-1 px-2 uppercase tracking-widest text-center">
                    Admin Verification Required
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400 text-center px-4">
                We need your phone number so our delivery partner can contact you.
              </p>
              <button type="submit" className="w-full bg-[#1CA672] text-white font-black text-lg py-4 rounded-xl hover:bg-[#17905F] active:scale-95 transition-all shadow-lg shadow-green-500/20 mt-4">
                Save & Login
              </button>
            </form>
          )}
        </div>
      </Layout>
    );
  }

  // ── Logged-in Profile ───────────────────────────────────────────────────────
  return (
    <Layout>
      {/* ── Refer & Earn Modal ── */}
      <BottomSheet open={modal === 'refer'} onClose={() => setModal(null)}>
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <Gift size={36} className="text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Refer & Earn ₹10</h3>
          <p className="text-sm text-gray-500 mt-2 font-medium">Share your code with friends. You earn ₹10 when they place their first order!</p>
        </div>
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Your Code</p>
            <p className="text-xl font-black text-gray-900 tracking-widest">{referralCode}</p>
          </div>
          <button onClick={handleCopyCode} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors">
            <Copy size={16} /> Copy
          </button>
        </div>
        <button onClick={handleShare} className="w-full bg-[#1CA672] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-500/20">
          <Share2 size={20} /> Share Link
        </button>
      </BottomSheet>

      {/* ── Help Modal ── */}
      <BottomSheet open={modal === 'help'} onClose={() => setModal(null)}>
        <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Help & Support</h3>
        <div className="space-y-3">
          {[
            { 
              icon: MessageCircle, 
              label: 'WhatsApp Chat', 
              sub: 'Instant support on WhatsApp', 
              color: 'text-green-600', 
              bg: 'bg-green-50', 
              action: () => {
                const rawLink = storeSettings.whatsappLink || `https://wa.me/91${storeSettings.supportPhone || '8607424026'}`;
                const whatsappMsg = storeSettings.whatsappMessage ? `?text=${encodeURIComponent(storeSettings.whatsappMessage)}` : '';
                const whatsappLink = rawLink.includes('?') ? `${rawLink}${storeSettings.whatsappMessage ? '&text=' + encodeURIComponent(storeSettings.whatsappMessage) : ''}` : `${rawLink}${whatsappMsg}`;
                window.open(whatsappLink);
              }
            },
            { icon: Phone, label: 'Call Us', sub: `+91 ${storeSettings.supportPhone || '8607424026'}`, color: 'text-blue-600', bg: 'bg-blue-50', action: () => window.open(`tel:+91${storeSettings.supportPhone || '8607424026'}`) },
          ].map((item, i) => (
            <button key={i} onClick={item.action} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-100">
              <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shrink-0`}>
                <item.icon size={22} />
              </div>
              <div className="text-left">
                <p className="font-black text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 font-medium">{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 ml-auto" />
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* ── About Modal ── */}
      <BottomSheet open={modal === 'about'} onClose={() => setModal(null)}>
        <div className="text-center py-4">
          <div className="w-20 h-20 bg-[#1CA672] rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/20">
            <span className="text-4xl font-black text-white tracking-tighter">G</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">G Mart</h3>
          <p className="text-xs text-[#1CA672] font-black uppercase tracking-widest mt-1">Premium</p>
          <p className="text-sm text-gray-500 mt-4 leading-relaxed font-medium px-4">
            G Mart is your local grocery delivery partner. We deliver fresh vegetables, groceries, and daily essentials straight to your doorstep in just 10 minutes!
          </p>
          <p className="text-[10px] text-gray-400 mt-8 font-bold uppercase tracking-widest">Version 1.0.0 • Made with ❤️</p>
        </div>
      </BottomSheet>

      {/* ── Saved Addresses Modal ── */}
      <BottomSheet open={modal === 'address'} onClose={() => setModal(null)}>
        <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Saved Addresses</h3>
        {savedAddresses.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-bold">No saved addresses</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Add one during checkout</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedAddresses.map((addr, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm">{addr.name || 'Home'}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                    {addr.address || addr.text || ''}
                    {(addr.village || addr.city) ? `, ${addr.village || addr.city}` : ''}
                  </p>
                  {addr.phone && (
                    <p className="text-xs text-gray-400 font-medium mt-0.5">📞 {addr.phone}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* ── Available Coupons Modal ── */}
      <BottomSheet open={modal === 'coupons'} onClose={() => setModal(null)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <Tag size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Coupons & Offers</h3>
            <p className="text-xs text-gray-500 font-medium">Available discounts for you</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {adminCoupons && adminCoupons.filter(c => c.isActive && (c.targetType === 'global' || (user?.phone && c.targetPhone === user.phone))).length > 0 ? (
            adminCoupons
              .filter(c => c.isActive && (c.targetType === 'global' || (user?.phone && c.targetPhone === user.phone)))
              .map((c) => (
                <div key={c.code} className="p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.targetType === 'specific' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                      <Tag size={18} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm tracking-widest uppercase">{c.code}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                        {c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                        {c.targetType === 'specific' && ' • Special Offer 🎁'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(c.code);
                      toast.success('Code copied!');
                    }}
                    className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              ))
          ) : (
            <div className="text-center py-10">
              <Tag size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-bold">No coupons available right now</p>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ── Main Content ── */}
      <div className="bg-[#f4f6f8] min-h-screen pb-24">
        
        {/* Sleek Header */}
        <div className="bg-white px-5 pt-12 pb-6 rounded-b-[2rem] shadow-sm relative z-10 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1CA672] to-green-400 rounded-full flex items-center justify-center shrink-0 shadow-inner">
               <span className="text-2xl font-black text-white">{user?.name?.charAt(0).toUpperCase() || 'G'}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{user?.name || 'Guest User'}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">+91 {user?.phone}</span>
                {user?.email && (
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-black lowercase truncate max-w-[150px]">{user.email}</span>
                )}
              </div>
            </div>
            
            {/* Highlighted Wallet Balance */}
            <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex flex-col items-end shadow-sm relative group">
              <p className="text-[9px] font-black text-[#1CA672] uppercase tracking-widest leading-none mb-1">Wallet</p>
              <div className="flex items-center gap-1">
                <Wallet size={14} className="text-[#1CA672]" />
                <span className="text-base font-black text-gray-900">₹{user?.walletBalance || 0}</span>
                <button 
                  onClick={async () => {
                    const loading = toast.loading('Syncing balance...');
                    try {
                      const userRef = doc(db, 'users', user.email);
                      const snap = await getDoc(userRef);
                      
                      if (snap.exists()) {
                        useAuthStore.setState({ user: { ...user, ...snap.data() } });
                        toast.success('Balance updated!', { id: loading });
                      } else {
                        // If doc doesn't exist, create it (init)
                        const userNamePrefix = (user?.name || 'USER').slice(0,3).toUpperCase();
                        const userPhoneSuffix = (user?.phone || '000').slice(-3);
                        const newUser = { ...user, walletBalance: 0, referralCode: `GM${userNamePrefix}${userPhoneSuffix}` };
                        await setDoc(userRef, newUser);
                        useAuthStore.setState({ user: newUser });
                        toast.success('Wallet initialized!', { id: loading });
                      }
                    } catch (e) {
                      console.error('Sync Error:', e);
                      toast.error('Sync failed: ' + e.message, { id: loading });
                    }
                  }}
                  className="p-1 hover:bg-green-100 rounded-full transition-colors ml-1"
                >
                  <RefreshCw size={10} className="text-[#1CA672]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-6 space-y-4 relative z-0">

          {/* Main Action Cards replacing Wishlist */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/orders')}
              className="bg-white rounded-[1.5rem] p-5 flex flex-col items-start gap-3 shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <ShoppingBag size={24} />
              </div>
              <div className="text-left mt-2">
                <p className="text-base font-black text-gray-900">My Orders</p>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">{userOrders.length} Total Orders</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="bg-white rounded-[1.5rem] p-5 flex flex-col items-start gap-3 shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center relative">
                <Bell size={24} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              <div className="text-left mt-2">
                <p className="text-base font-black text-gray-900">Updates</p>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">{unreadNotifications} Unread</p>
              </div>
            </button>
          </div>

          {/* Premium Wishlist Action Card */}
          <button
            onClick={() => navigate('/wishlist')}
            className="w-full bg-white rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm border border-gray-100 active:scale-95 transition-transform overflow-hidden relative"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center relative">
                <Heart size={24} className={wishlistItemsCount > 0 ? "fill-red-500 animate-heart-pop text-red-500" : "text-red-400"} />
                {wishlistItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {wishlistItemsCount}
                  </span>
                )}
              </div>
              <div className="text-left">
                <h3 className="font-black text-base text-gray-900 tracking-tight">My Wishlist</h3>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                  {wishlistItemsCount > 0 
                    ? `Aapke ${wishlistItemsCount} saved products ❤️` 
                    : "Products save karke baad me kharidein!"}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>
          
          {/* Wallet History Card */}
          <button
            onClick={fetchWalletHistory}
            className="w-full bg-white rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-[#1CA672] rounded-xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-black text-base text-gray-900 tracking-tight">Wallet History</h3>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">Track your credits & debits</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          {/* Quick Info & Promos */}
          <button
            onClick={() => setModal('refer')}
            className="w-full bg-[#1a1a2e] rounded-[1.5rem] p-5 flex items-center justify-between text-white active:scale-95 transition-transform shadow-lg shadow-gray-900/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Gift size={24} className="text-amber-400" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-base tracking-tight">Refer & Earn ₹10</h3>
                <p className="text-[11px] font-medium text-gray-400 mt-0.5">Invite friends & get rewards</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-600" />
          </button>

          {/* Account Settings List */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden mt-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-5 pt-5 pb-2">Account Settings</h2>
            
            {[
              { icon: MapPin, label: 'Saved Addresses', sub: `${savedAddresses.length} Addresses`, bg: 'bg-emerald-50', color: 'text-emerald-500', action: () => setModal('address') },
              { icon: Tag, label: 'Coupons & Offers', sub: 'View available discounts', bg: 'bg-purple-50', color: 'text-purple-500', action: () => setModal('coupons') },
              { 
                icon: Bell, 
                label: 'Push Notifications', 
                sub: isPushEnabled ? 'On - Receiving alerts' : 'Off - Alerts disabled', 
                bg: isPushEnabled ? 'bg-orange-50' : 'bg-gray-50', 
                color: isPushEnabled ? 'text-orange-500' : 'text-gray-400', 
                isToggle: true,
                action: togglePush 
              },
              { icon: HelpCircle, label: 'Help & Support', sub: 'Chat, Email, Call', bg: 'bg-blue-50', color: 'text-blue-500', action: () => setModal('help') },
              { icon: ShieldCheck, label: 'Privacy Policy', sub: 'How we handle your data', bg: 'bg-green-50', color: 'text-[#1CA672]', action: () => navigate('/privacy') },
              { icon: FileText, label: 'Terms of Service', sub: 'Rules and regulations', bg: 'bg-gray-50', color: 'text-gray-600', action: () => navigate('/terms') },
              { icon: Info, label: 'About G Mart', sub: 'Version 1.0.0', bg: 'bg-gray-50', color: 'text-gray-600', action: () => setModal('about') },
              // Admin Panel Check (For Staff Admins)
              ...(user?.role === 'admin' ? [
                { 
                  icon: ShieldCheck, 
                  label: 'Admin Panel', 
                  sub: 'Management access', 
                  bg: 'bg-purple-50', 
                  color: 'text-purple-600', 
                  action: () => {
                    setStaffPinModal({ open: true, target: 'admin', pin: '', loading: false });
                  }
                }
              ] : []),

              // Delivery Panel Check
              ...(user?.role === 'delivery_boy' ? [
                { 
                  icon: ShoppingBag, 
                  label: 'Delivery Dashboard', 
                  sub: 'Manage deliveries', 
                  bg: 'bg-blue-50', 
                  color: 'text-blue-600', 
                  action: () => {
                    setStaffPinModal({ open: true, target: 'delivery', pin: '', loading: false });
                  }
                }
              ] : []),

              // Master Pro Admin Dashboard - ONLY for pro_admin role
              ...(user?.role === 'pro_admin' ? [
                { icon: ShieldCheck, label: 'Master Admin Dashboard', sub: 'Full control access', bg: 'bg-red-50', color: 'text-red-500', action: () => {
                  setMasterPinModal({ open: true, pin: '', loading: false });
                }}
              ] : []),
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-gray-900">{item.label}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                </div>
                {item.isToggle ? (
                  <div className={`w-10 h-5 rounded-full relative transition-all ${isPushEnabled ? 'bg-[#1CA672]' : 'bg-gray-200'} ${pushLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {pushLoading ? (
                      <div className="absolute top-1 left-1.5 w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${isPushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    )}
                  </div>
                ) : (
                  <ChevronRight size={16} className="text-gray-300" />
                )}
              </button>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-white text-red-500 font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-2 border border-red-100 shadow-sm hover:bg-red-50 transition-colors mt-6"
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </div>

      <BottomSheet open={staffPinModal.open} onClose={() => !staffPinModal.loading && setStaffPinModal(prev => ({ ...prev, open: false }))}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#1CA672]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-[#1CA672]" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">Security Check</h2>
          <p className="text-gray-500 mt-2 font-medium">Please enter your 4-digit Staff PIN</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Staff PIN</label>
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-center text-2xl tracking-[1em] font-black focus:outline-none focus:ring-2 focus:ring-[#1CA672] transition-shadow"
              value={staffPinModal.pin}
              onChange={(e) => setStaffPinModal(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
              placeholder="••••"
            />
          </div>

          <button 
            onClick={submitStaffPin}
            disabled={staffPinModal.loading || staffPinModal.pin.length < 4}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-green-200 ${staffPinModal.loading || staffPinModal.pin.length < 4 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1CA672] hover:bg-[#17905F]'}`}
          >
            {staffPinModal.loading ? '⏳ Verifying...' : 'Access Dashboard'}
          </button>
        </div>
      </BottomSheet>

        {/* Master Admin PIN Modal */}
        <BottomSheet open={masterPinModal.open} onClose={() => !masterPinModal.loading && setMasterPinModal(prev => ({ ...prev, open: false }))}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Master Admin Access</h2>
            <p className="text-gray-500 mt-2 font-medium text-sm">Enter your secure PIN to access full control</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Secure PIN</label>
              <input
                type="password"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-3xl tracking-[0.5em] font-black focus:outline-none focus:border-red-500 transition-colors"
                value={masterPinModal.pin}
                onChange={(e) => setMasterPinModal(prev => ({ ...prev, pin: e.target.value }))}
                placeholder="••••"
                autoFocus
              />
            </div>

            <button 
              onClick={async () => {
                setMasterPinModal(prev => ({ ...prev, loading: true }));
                const success = await useAdminStore.getState().login('monugandhi5911', masterPinModal.pin);
                if (success) {
                  toast.success('Master access granted! 🛡️');
                  navigate('/admin');
                  setMasterPinModal({ open: false, pin: '', loading: false });
                } else {
                  toast.error('❌ Invalid Master PIN');
                  setMasterPinModal(prev => ({ ...prev, loading: false }));
                }
              }}
              disabled={masterPinModal.loading || !masterPinModal.pin}
              className={`w-full py-4 rounded-2xl font-black text-white transition-all active:scale-95 shadow-xl ${masterPinModal.loading || !masterPinModal.pin ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 shadow-red-200'}`}
            >
              {masterPinModal.loading ? '⏳ Verifying...' : 'Unlock Dashboard'}
            </button>
          </div>
        </BottomSheet>

        {/* Wallet History Bottom Sheet */}
        <BottomSheet open={showWalletHistory} onClose={() => setShowWalletHistory(false)}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Wallet className="text-[#1CA672]" size={24} /> Wallet History
            </h2>
            <button onClick={() => setShowWalletHistory(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {loadingWalletTx ? (
              <div className="text-center py-6 text-gray-400 font-bold text-sm">Loading transactions...</div>
            ) : walletTx.length > 0 ? (
              walletTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{tx.description || 'Transaction'}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                      {tx.date?.toDate ? new Date(tx.date.toDate()).toLocaleString() : 'Recent'}
                    </p>
                  </div>
                  <div className={`font-black text-base ${tx.type === 'credit' ? 'text-[#1CA672]' : 'text-red-500'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Wallet size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-sm">No transactions yet</p>
              </div>
            )}
          </div>
        </BottomSheet>

        {/* Coupons Bottom Sheet */}
        <BottomSheet open={modal === 'coupons'} onClose={() => setModal(null)}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Tag className="text-purple-500" size={24} /> Available Coupons
            </h2>
            <button onClick={() => setModal(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {adminCoupons && adminCoupons.length > 0 ? (
              adminCoupons.map((coupon) => (
                <div key={coupon.id} className="relative bg-white rounded-[1.5rem] p-5 shadow-sm border-2 border-purple-100 overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[100px] -z-10" />
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 font-black text-sm tracking-widest rounded-lg mb-2 uppercase">
                        {coupon.code}
                      </div>
                      <h4 className="font-black text-lg text-gray-900 leading-tight">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                      </h4>
                      <p className="text-xs font-bold text-gray-500 mt-1">
                        On orders above ₹{coupon.minOrderAmount}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.code);
                        toast.success('Coupon code copied!');
                      }}
                      className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-purple-600 rounded-xl transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Tag size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-sm">No coupons available right now</p>
              </div>
            )}
          </div>
        </BottomSheet>
    </Layout>
  );
}
