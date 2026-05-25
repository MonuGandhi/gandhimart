import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useCartStore, getAdjustedCartItems } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOrdersStore } from '../store/ordersStore';
import { useAdminStore } from '../store/adminStore';
import { formatPrice } from '../utils/helpers';
import locationService from '../utils/locationService';
import LocationPermissionModal from '../components/LocationPermissionModal';

import toast from 'react-hot-toast';
import {
    MapPin, Tag, Wallet, Smartphone, Truck,
    CheckCircle2, Zap, X, ArrowLeft, Edit2, Gift, ChevronRight, ShoppingBag
} from 'lucide-react';
import { writeBatch, doc, increment, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { logWalletTransaction } from '../utils/wallet';

export default function Checkout() {
    const navigate = useNavigate();
    const { user, isLoggedIn } = useAuthStore();
    const storeSettings = useAdminStore((s) => s.storeSettings);

    // Redirect if not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            toast.error('Pehle login karo bhai! 😊');
            navigate('/profile');
        }
    }, [isLoggedIn, navigate]);

    // Redirect if pre-order mode is active
    useEffect(() => {
        if (storeSettings?.isPreOrderMode) {
            toast.error(storeSettings.preOrderMessage || '🛒 Ordering starts soon! Explore the catalog until then. 🎉');
            navigate('/cart');
        }
    }, [storeSettings?.isPreOrderMode, storeSettings?.preOrderMessage, navigate]);

    const saveAddress = useAuthStore((s) => s.saveAddress);
    const rawItems = useCartStore((s) => s.items);
    const adminProducts = useAdminStore((s) => s.adminProducts);
    const items = getAdjustedCartItems(rawItems);
    const appliedCoupon = useCartStore((s) => s.appliedCoupon);
    const applyCoupon = useCartStore((s) => s.applyCoupon);
    const removeCoupon = useCartStore((s) => s.removeCoupon);
    const clearCart = useCartStore((s) => s.clearCart);
    const computeFn = useCartStore((s) => s.computed);
    const computed = computeFn();
    const placeOrder = useOrdersStore((s) => s.placeOrder);
    const adminCoupons = useAdminStore((s) => s.adminCoupons);

    const [couponCode, setCouponCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [useWallet, setUseWallet] = useState(false);
    const [referralInput, setReferralInput] = useState('');
    const [appliedReferral, setAppliedReferral] = useState(null); // { code, referrerName }
    const [showLocationModal, setShowLocationModal] = useState(false);
    const locModalResolver = useRef(null);

    const handleModalAllow = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    try { locModalResolver.current && locModalResolver.current(true); } catch(e){}
                },
                () => {
                    try { locModalResolver.current && locModalResolver.current(false); } catch(e){}
                },
                { timeout: 10000 }
            );
        } else {
            try { locModalResolver.current && locModalResolver.current(false); } catch(e){}
        }
    };

    const handleModalCancel = () => {
        try { locModalResolver.current && locModalResolver.current(false); } catch(e){}
        setShowLocationModal(false);
    };



    const savedAddress = user?.savedAddresses?.find(a => a.id === 'primary') || user?.savedAddresses?.[0] || null;

    // Start in edit mode if no complete address saved
    const hasCompleteAddress = !!(savedAddress?.name && savedAddress?.phone && savedAddress?.address);
    const [editingAddress, setEditingAddress] = useState(!hasCompleteAddress);

    const [addressForm, setAddressForm] = useState({
        name: savedAddress?.name || user?.name || '',
        phone: savedAddress?.phone || user?.phone || '',
        address: savedAddress?.address || '',
        village: 'Madhosinghana',
    });

    // Sirf ek baar - jab page pehli baar load ho, tab profile ka address fill karo
    const addressInitialized = useRef(false);
    useEffect(() => {
        if (!addressInitialized.current && savedAddress?.address) {
            addressInitialized.current = true;
            setAddressForm({
                name: savedAddress.name || user?.name || '',
                phone: savedAddress.phone || user?.phone || '',
                address: savedAddress.address || '',
                village: savedAddress.village || 'Madhosinghana',
            });
            setEditingAddress(false);
        }
    }, [savedAddress, user?.name, user?.phone]);

    const walletBalance = user?.walletBalance || 0;
    const walletDeduction = useWallet ? Math.min(walletBalance, computed.grandTotal) : 0;
    const finalTotal = Math.max(0, computed.grandTotal - walletDeduction);



    const handleSaveAddress = async () => {
        if (!addressForm.name || !addressForm.phone || !addressForm.address) {
            toast.error('Naam, phone aur address fill karo');
            return;
        }
        
        const cleanedPhone = String(addressForm.phone).replace(/\D/g, '').slice(-10);
        if (cleanedPhone.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }

        try {
            await saveAddress({ ...addressForm, phone: cleanedPhone, village: addressForm.village || 'Madhosinghana', id: 'primary' });
            setAddressForm(prev => ({ ...prev, phone: cleanedPhone }));
            setEditingAddress(false);
            toast.success('Address saved to profile! ✅');
        } catch (err) {
            console.error('Save address error:', err);
            toast.error('Address save karne mein error aaya');
        }
    };

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) return;
        const result = applyCoupon(couponCode.trim(), user?.phone);
        if (result.success) toast.success(result.message);
        else toast.error(result.message);
        setCouponCode('');
    };

    const handleApplyReferral = async (codeToApply = null) => {
        // If user is already referred in DB, don't allow applying another one
        if (user?.referredBy) return;

        // Fix: If called from onClick, first arg is an event object. Ignore it.
        const actualCode = typeof codeToApply === 'string' ? codeToApply : referralInput;
        const code = actualCode.trim().toUpperCase();
        if (!code) return;

        // Don't allow user to enter their own referral code
        const myCode = (user?.name && user?.phone)
            ? `GM${user.name.slice(0, 3).toUpperCase()}${user.phone.slice(-3)}`
            : '';
        if (code === myCode) {
            if (!codeToApply) toast.error('Apna khud ka referral code nahi laga sakte! 😅');
            return;
        }

        const loadToast = !codeToApply ? toast.loading('Validating code...') : null;
        try {
            // Fetch directly from referral_codes registry (Publicly readable)
            const refDoc = await getDoc(doc(db, 'referral_codes', code));

            if (refDoc.exists()) {
                const referrerData = refDoc.data();
                setAppliedReferral({ code, referrerName: referrerData.ownerName });
                if (loadToast) toast.success(`Referral code applied! Referred by ${referrerData.ownerName} 🎉`, { id: loadToast });
            } else {
                if (loadToast) toast.error('Invalid referral code', { id: loadToast });
            }
        } catch (err) {
            console.error('Referral validation failed:', err);
            if (loadToast) toast.error('Validation failed. Try again.', { id: loadToast });
        }
        setReferralInput('');
    };

    // Auto-apply referral code from localStorage (if user clicked a link)
    useEffect(() => {
        const savedRefCode = localStorage.getItem('gmart_referral_code');
        if (savedRefCode && !appliedReferral && !user?.referredBy) {
            setTimeout(() => handleApplyReferral(savedRefCode), 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.referredBy, appliedReferral]);

    const deliveryAddress = { ...addressForm };
    const isAddressComplete = addressForm.name && addressForm.phone && addressForm.address;

    const handlePlaceOrder = async () => {
        if (!isLoggedIn) {
            toast.error('Please login to place an order');
            navigate('/profile');
            return;
        }
        if (items.length === 0) { toast.error('Your cart is empty'); return; }
        if (!isAddressComplete) { toast.error('Pehle delivery address fill karo'); setEditingAddress(true); return; }

        // Always require fresh device location before placing an order.
        // If service-area restriction is enabled, we also validate that the
        // customer is inside the configured delivery area.
        const isLocationRestrictionEnabled = !!storeSettings?.locationService?.enabled;
        try {
            // Check permission state first to provide a friendlier UX.
            try {
                if (navigator.permissions && navigator.permissions.query) {
                    const perm = await navigator.permissions.query({ name: 'geolocation' });
                    if (perm.state === 'prompt') {
                        // Show our modal and wait for user's action.
                        const allowed = await new Promise((resolve) => {
                            locModalResolver.current = resolve;
                            setShowLocationModal(true);
                        });
                        setShowLocationModal(false);
                        if (!allowed) {
                            toast.error('Location is required to place an order.');
                            return;
                        }
                    } else if (perm.state === 'denied') {
                        toast.error('Location permission is denied. Enable it in browser settings and try again.');
                        return;
                    }
                }
            } catch (permErr) {
                // ignore and proceed to actual request which will prompt
                console.warn('Permissions API not available or failed', permErr);
            }

            const currentLocation = await locationService.getCurrentLocation();

            if (isLocationRestrictionEnabled) {
                const settings = storeSettings.locationService || {};
                locationService.updateServiceArea({
                    ...settings,
                    name: settings.villageName || settings.name || 'My Village',
                });

                const isWithinArea = await locationService.isWithinServiceArea(currentLocation);

                if (!isWithinArea) {
                    const outOfAreaMessage = locationService.getOutOfAreaMessage();
                    toast.error(outOfAreaMessage?.message || 'Sorry, we do not deliver to your area yet.');
                    return;
                }
            }

            if (!currentLocation) {
                toast.error('Location permission is required to place an order.');
                return;
            }
        } catch (locationError) {
            console.error('Location validation error:', locationError);
            // Try to get permission status if available for better messaging
            try {
                if (navigator.permissions && navigator.permissions.query) {
                    const perm = await navigator.permissions.query({ name: 'geolocation' });
                    if (perm.state === 'denied') {
                        toast.error('Location permission is denied in your browser. Enable it in site settings and try again.');
                        return;
                    }
                }
            } catch (permErr) {
                console.warn('Permission query failed:', permErr);
            }

            // Provide more detailed feedback to user
            const code = locationError?.code || locationError?.name || 'UNKNOWN';
            const msg = locationError?.message || String(locationError);
            toast.error(`Location check failed (${code}): ${msg}. Please enable location and retry.`);
            return;
        }

        const cleanedPhone = String(addressForm.phone).replace(/\D/g, '').slice(-10);
        if (cleanedPhone.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            setEditingAddress(true);
            return;
        }

        setLoading(true);

        const normalizedAddress = { ...addressForm, phone: cleanedPhone };

        // Auto-save address to profile if it's complete
        try {
            await saveAddress({ ...normalizedAddress, village: normalizedAddress.village || 'Madhosinghana', id: 'primary' });
            setAddressForm(prev => ({ ...prev, phone: cleanedPhone }));
        } catch (err) {
            console.error('Auto-save address error:', err);
            // Non-blocking error, we still want to place the order
        }
        // Attach last-known user location (if available) so tracking can use it
        const finalUserLocation = locationService.userLocation || locationService.getCachedLocation() || null;
        const batch = writeBatch(db);
        const orderId = `GM${Date.now()}`;
        const orderRef = doc(collection(db, 'orders'), orderId);

        try {
            const orderData = {
                id: orderId,
                items: items.filter(i => i && i.name), // Safety filter
                customerName: user?.name || 'Customer',
                customerEmail: user?.email?.toLowerCase() || '',
                customerPhone: cleanedPhone || user?.phone || '',
                address: normalizedAddress, // Consistency: use 'address' key
                paymentMethod,
                subtotal: computed.subtotal,
                productDiscount: computed.productDiscount,
                couponDiscount: computed.couponDiscount,
                couponCode: appliedCoupon?.code || null,
                deliveryFee: computed.deliveryFee,
                gst: computed.gst,
                walletUsed: walletDeduction,
                total: finalTotal,
                status: 'placed',
                placedAt: new Date().toISOString(),
                referralCode: appliedReferral?.code || null, // ✅ Customer ne jo referral code daala
                isAppInstalled: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true, // ✅ Check if ordered from PWA
                deliveryLat: finalUserLocation?.lat || null,
                deliveryLng: finalUserLocation?.lng || null,
            };

            // Add order to batch
            batch.set(orderRef, orderData);

            if (walletDeduction > 0 && user?.email) {
                const userRef = doc(db, 'users', user.email.toLowerCase());
                batch.update(userRef, {
                    walletBalance: increment(-walletDeduction)
                });
                await logWalletTransaction(user.email.toLowerCase(), -walletDeduction, 'debit', `Used for order #${orderId}`);
            }

            if (appliedReferral && user?.email && !user?.referredBy) {
                const userRef = doc(db, 'users', user.email.toLowerCase());
                batch.update(userRef, {
                    referredBy: appliedReferral.code
                });
            }

            await batch.commit();
            clearCart();
            navigate(`/order-success?id=${orderId}`);
        } catch (err) {
            console.error('Order error:', err);
            toast.error('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoggedIn) return null; // Prevent flicker while redirecting

    if (items.length === 0) {
        return (
            <>
                <Layout hideBottomNav>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                        <ShoppingBag size={56} className="text-gray-200 mb-4" />
                        <h2 className="text-xl font-black text-gray-800 mb-2">Cart is empty</h2>
                        <p className="text-gray-400 mb-6 text-sm">Add some items before checking out</p>
                        <button onClick={() => navigate('/')} className="bg-[#1CA672] text-white font-black px-8 py-3 rounded-2xl active:scale-95 transition-transform">
                            Start Shopping
                        </button>
                    </div>
                </Layout>
                <LocationPermissionModal open={showLocationModal} onAllow={handleModalAllow} onCancel={handleModalCancel} />
            </>
        );
    }

    return (
        <Layout hideBottomNav>
            <div className="max-w-2xl mx-auto px-4 py-6 pb-48 space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 active:scale-95 transition-transform">
                        <ArrowLeft size={18} className="text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-black text-gray-900">Checkout</h1>
                </div>

                {/* Delivery Address */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                                <MapPin size={16} className="text-blue-500" />
                            </div>
                            <span className="text-sm font-black text-gray-800 uppercase tracking-wider">Delivery Address</span>
                        </div>
                        {isAddressComplete && !editingAddress && (
                            <button onClick={() => setEditingAddress(true)} className="flex items-center gap-1 text-[#1CA672] text-xs font-black">
                                <Edit2 size={12} /> Edit
                            </button>
                        )}
                    </div>

                    <div className="px-5 pb-5">
                        {/* Show address preview if complete and not editing */}
                        {isAddressComplete && !editingAddress ? (
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                <p className="font-black text-gray-900 text-sm">{addressForm.name}</p>
                                <p className="text-sm text-gray-600 mt-0.5">{addressForm.address}, {addressForm.village}</p>
                                <p className="text-sm text-gray-600">{addressForm.phone}</p>
                            </div>
                        ) : (
                            /* Address Form */
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Name *</label>
                                        <input
                                            type="text"
                                            value={addressForm.name}
                                            onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                                            placeholder="Enter your name"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#1CA672] focus:ring-1 focus:ring-[#1CA672]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone *</label>
                                        <input
                                            type="tel"
                                            value={addressForm.phone}
                                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                                            placeholder="Mobile number"
                                            maxLength={10}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#1CA672] focus:ring-1 focus:ring-[#1CA672]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pura Address *</label>
                                    <textarea
                                        value={addressForm.address}
                                        onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                                        placeholder="Ghar no., gali, mohalla, landmark..."
                                        rows={2}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#1CA672] focus:ring-1 focus:ring-[#1CA672] resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Village</label>
                                    <input
                                        type="text"
                                        value="Madhosinghana"
                                        readOnly
                                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveAddress}
                                    className="w-full bg-[#1CA672] text-white font-black py-3 rounded-2xl text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Address Save Karo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Delivery time badge */}
                    <div className="bg-green-50 border-t border-green-100 px-5 py-3 flex items-center gap-2">
                        <Zap size={14} className="text-[#1CA672] fill-[#1CA672]" />
                        <span className="text-xs font-black text-[#1CA672]">
                            Estimated delivery in {storeSettings?.estimatedDeliveryTime || 10} minutes
                        </span>
                    </div>
                </div>

                {/* Coupon Code */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Tag size={16} className="text-purple-500" />
                        </div>
                        <span className="text-sm font-black text-gray-800 uppercase tracking-wider">Coupons & Offers</span>
                    </div>
                    <div className="px-5 pb-5">
                        {appliedCoupon ? (
                            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
                                <div>
                                    <p className="text-xs font-black text-[#1CA672]">"{appliedCoupon.code}" Applied! 🎉</p>
                                    <p className="text-[10px] text-gray-500">You save {formatPrice(computed.couponDiscount)}</p>
                                </div>
                                <button onClick={removeCoupon} className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                                    <X size={12} className="text-red-500" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                        placeholder="Enter coupon code"
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#1CA672] focus:ring-1 focus:ring-[#1CA672] uppercase tracking-widest"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        className="bg-[#1CA672] text-white font-black px-5 py-3 rounded-2xl text-sm active:scale-95 transition-transform"
                                    >
                                        Apply
                                    </button>
                                </div>

                                {/* Available Coupons List */}
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Available Coupons</p>
                                    {adminCoupons && adminCoupons
                                        .filter(c => c.isActive && (c.targetType === 'global' || (user?.phone && c.targetPhone === user.phone)))
                                        .length > 0 ? (
                                        adminCoupons
                                            .filter(c => c.isActive && (c.targetType === 'global' || (user?.phone && c.targetPhone === user.phone)))
                                            .map((c) => (
                                                <button
                                                    key={c.code}
                                                    onClick={() => {
                                                        const result = applyCoupon(c.code, user?.phone);
                                                        if (result.success) toast.success(result.message);
                                                        else toast.error(result.message);
                                                    }}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-gray-200 hover:border-[#1CA672] hover:bg-green-50 transition-all text-left group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${c.targetType === 'specific' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                                            <Tag size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-900 text-xs tracking-wider group-hover:text-[#1CA672]">{c.code}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium">
                                                                {c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                                                                {c.targetType === 'specific' && ' • For You 🎁'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-[#1CA672] opacity-0 group-hover:opacity-100 uppercase tracking-widest">Tap</span>
                                                </button>
                                            ))
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">No coupons available for this order.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Referral Code (Hide if already referred or rewarded) */}
                {(!user?.referredBy && !user?.referralRewardClaimed) ? (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                                <Gift size={16} className="text-amber-500" />
                            </div>
                            <span className="text-sm font-black text-gray-800 uppercase tracking-wider">Referral Code</span>
                        </div>
                        <div className="px-5 pb-5">
                            {appliedReferral ? (
                                <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 animate-in zoom-in-95 duration-300">
                                    <div>
                                        <p className="text-xs font-black text-amber-700">"{appliedReferral.code}" Applied! 🎁</p>
                                        <p className="text-[10px] text-gray-500">Referred by <span className="font-bold text-gray-700">{appliedReferral.referrerName}</span></p>
                                    </div>
                                    <button onClick={() => setAppliedReferral(null)} className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                                        <X size={12} className="text-red-500" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={referralInput}
                                        onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyReferral()}
                                        placeholder="Enter friend's referral code"
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 uppercase tracking-widest"
                                    />
                                    <button
                                        onClick={() => handleApplyReferral()}
                                        className="bg-amber-500 text-white font-black px-5 py-3 rounded-2xl text-sm active:scale-95 transition-transform"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Wallet */}
                {walletBalance > 0 && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setUseWallet(!useWallet)}
                            className="w-full px-5 py-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                                    <Wallet size={16} className="text-amber-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black text-gray-800">Use Wallet Balance</p>
                                    <p className="text-xs text-gray-400">Available: {formatPrice(walletBalance)}</p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-colors relative ${useWallet ? 'bg-[#1CA672]' : 'bg-gray-200'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${useWallet ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </div>
                        </button>
                        {useWallet && (
                            <div className="px-5 pb-4">
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2 text-xs font-bold text-amber-700">
                                    {formatPrice(walletDeduction)} will be deducted from your wallet
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment Method */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Smartphone size={16} className="text-indigo-500" />
                        </div>
                        <span className="text-sm font-black text-gray-800 uppercase tracking-wider">Payment Method</span>
                    </div>
                    <div className="px-5 pb-5 space-y-2">
                        {[
                            { id: 'cod', label: 'Cash on Delivery', icon: <Truck size={18} className="text-green-500" />, desc: 'Pay when you receive' },
                            ...(storeSettings?.upiId ? [{ id: 'scanner', label: 'Pay by Scanner', icon: <Smartphone size={18} className="text-indigo-500" />, desc: `UPI: ${storeSettings.upiId}` }] : []),
                        ].map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all ${paymentMethod === method.id
                                    ? 'border-[#1CA672] bg-green-50'
                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                    }`}
                            >
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    {method.icon}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-black text-gray-800">{method.label}</p>
                                    <p className="text-[10px] text-gray-400">{method.desc}</p>
                                </div>
                                {paymentMethod === method.id && (
                                    <CheckCircle2 size={20} className="text-[#1CA672] shrink-0" />
                                )}
                            </button>
                        ))}
                        {/* UPI QR shown when scanner selected */}
                        {paymentMethod === 'scanner' && storeSettings?.upiId && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-center">
                                <p className="text-xs font-black text-indigo-700 mb-3 uppercase tracking-wider">Payment Details</p>

                                <div className="bg-white border border-indigo-100 rounded-2xl p-4 mb-4 shadow-sm">
                                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1">UPI ID</p>
                                    <p className="text-lg font-black text-gray-900 tracking-wide break-all">{storeSettings.upiId}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(storeSettings.upiId);
                                            toast.success('UPI ID Copied! Paste in your app.');
                                        }}
                                        className="mt-2 text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-black uppercase hover:bg-indigo-100 transition-colors"
                                    >
                                        Copy UPI ID
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <a
                                        href={`upi://pay?pa=${storeSettings.upiId}&cu=INR&am=${finalTotal}`}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-black py-3.5 rounded-xl text-sm active:scale-95 transition-transform shadow-lg shadow-indigo-200"
                                    >
                                        <Smartphone size={18} /> Open UPI App
                                    </a>

                                    <div className="flex items-center gap-2 justify-center text-gray-400">
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                        <span className="text-[10px] font-bold uppercase">Or</span>
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                    </div>

                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                        Agar "Security Reasons" error aaye, toh <span className="font-bold text-indigo-600">UPI ID Copy</span> karke GPay/PhonePe mein manually pay karein.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-2">
                        <span className="text-sm font-black text-gray-800 uppercase tracking-wider">Bill Summary</span>
                    </div>
                    <div className="px-5 pb-5 space-y-2.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">MRP Total</span>
                            <span className="font-bold text-gray-800">{formatPrice(computed.mrpTotal)}</span>
                        </div>
                        {computed.productDiscount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Product Discount</span>
                                <span className="font-bold text-[#1CA672]">-{formatPrice(computed.productDiscount)}</span>
                            </div>
                        )}
                        {computed.couponDiscount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Coupon Discount</span>
                                <span className="font-bold text-[#1CA672]">-{formatPrice(computed.couponDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Delivery Fee</span>
                            <span className={`font-bold ${computed.deliveryFee === 0 ? 'text-[#1CA672]' : 'text-gray-800'}`}>
                                {computed.deliveryFee === 0 ? 'FREE' : formatPrice(computed.deliveryFee)}
                            </span>
                        </div>
                        {computed.gst > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">GST ({storeSettings?.gstPercentage || 0}%)</span>
                                <span className="font-bold text-gray-800">+{formatPrice(computed.gst)}</span>
                            </div>
                        )}
                        {walletDeduction > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Wallet Deduction</span>
                                <span className="font-bold text-[#1CA672]">-{formatPrice(walletDeduction)}</span>
                            </div>
                        )}
                        <div className="h-px bg-gray-100 my-1" />
                        <div className="flex justify-between">
                            <span className="font-black text-gray-900 text-base">Total Payable</span>
                            <span className="font-black text-gray-900 text-base">{formatPrice(finalTotal)}</span>
                        </div>
                        {computed.totalSavings > 0 && (
                            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-2.5 text-center">
                                <p className="text-xs font-black text-[#1CA672]">🎉 You're saving {formatPrice(computed.totalSavings)} on this order!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Floating Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] pt-8 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
                <div className="max-w-2xl mx-auto pointer-events-auto bg-white rounded-3xl p-2.5 flex items-center shadow-[0_10px_40px_-10px_rgba(28,166,114,0.15)] border border-green-50">
                    <div className="flex-1 pl-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Total Payable</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{formatPrice(finalTotal)}</p>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="bg-[#1CA672] text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 active:scale-95 hover:bg-[#168a5e] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Place Order <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
            <LocationPermissionModal open={showLocationModal} onAllow={handleModalAllow} onCancel={handleModalCancel} />
        </Layout>
    );
}
