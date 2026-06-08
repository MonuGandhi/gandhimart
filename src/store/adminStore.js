import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';
import categoriesFromJSON from '../data/categories.json';
import productsFromJSON from '../data/products.json';
import bannersFromJSON from '../data/banners.json';
import { db } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { logWalletTransaction } from '../utils/wallet';

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const getCleanupRange = (rangeKey) => {
  const now = new Date();
  const end = now.getTime();

  if (rangeKey === 'this_week') {
    const start = new Date(now);
    const dayOffset = (now.getDay() + 6) % 7; // Monday as start of week
    start.setDate(now.getDate() - dayOffset);
    start.setHours(0, 0, 0, 0);
    return { start: start.getTime(), end };
  }

  if (rangeKey === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { start: start.getTime(), end };
  }

  return { start: 0, end };
};

const deleteRefsInBatches = async (refs) => {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
};

export const useAdminStore = create(
  persist(
    (set, get) => ({
      isAdminLoggedIn: false,
      adminRole: 'admin',
      currentAdminUsername: null,
      adminAccounts: {}, // Synced from Firestore settings/admins
      _unsubscribers: [],
      _referralUnsub: null,
      login: async (username, password) => {


        // Fetch latest from Firestore if possible
        try {
          const adminSnap = await getDoc(doc(db, 'settings', 'admins'));
          const admins = adminSnap.exists() ? adminSnap.data() : {};

          const enteredUser = username.trim().toLowerCase();
          if (admins[enteredUser] && admins[enteredUser].pin === password) {
            console.log("[Login] Success for user:", enteredUser);
            const userRole = admins[enteredUser].role || 'admin';
            if (userRole === 'pro_admin') localStorage.setItem('gmart_is_pro_admin', '1');
            set({
              isAdminLoggedIn: true,
              adminRole: userRole,
              currentAdminUsername: enteredUser
            });

            // Start admin-only sync
            get().initAdminSync();

            return true;
          } else {
            console.warn("[Login] Failed: Incorrect PIN or Username for", enteredUser);
          }
        } catch (error) {
          console.error("Firestore Admin Login Error:", error);
        }



        return false;
      },
      updateAdminAccount: async (username, data) => {
        const adminRef = doc(db, 'settings', 'admins');
        const adminSnap = await getDoc(adminRef);
        const currentAdmins = adminSnap.exists() ? adminSnap.data() : {};

        const updatedAdmins = {
          ...currentAdmins,
          [username]: { ...currentAdmins[username], ...data }
        };

        await setDoc(adminRef, updatedAdmins);
        set({ adminAccounts: updatedAdmins });
      },
      logout: () => {
        localStorage.removeItem('gmart_is_pro_admin');
        // Unsubscribe from all listeners
        get()._unsubscribers.forEach(unsub => unsub());
        set({
          isAdminLoggedIn: false,
          adminRole: 'admin',
          currentAdminUsername: null,
          _unsubscribers: []
        });
      },

      storeSettings: {
        storeName: 'G Mart',
        storePhone: '8607424026',
        storeAddress: 'Madhosinghana, Sirsa, Haryana',
        minOrderAmount: 0,
        freeDeliveryAbove: 0,
        deliveryFee: 0,
        gstPercentage: 0,
        estimatedDeliveryTime: 0,
        isStoreOpen: true,
        offlineMessage: '',
        showSocialButtons: true,
        whatsappLink: 'https://wa.me/918607424026',
        supportPhone: '8607424026',
        supportEmail: 'monugandhi03@gmail.com',
        instagramLink: 'https://www.instagram.com/monugandhi_/',
        facebookLink: 'https://facebook.com',
        twitterLink: 'https://twitter.com',
        animationType: 'none',
        customGifUrl: '',
        announcementText: '',
        announcementBgColor: '#1CA672',
        announcementTextColor: '#ffffff',
        isPreOrderMode: false,
        launchDateText: '15 July',
        preOrderMessage: '🛒 Ordering starts on 15 July! Explore G Mart catalog until then! 🎉',
        // Location Service Settings
        locationService: {
          enabled: false,
          villageName: 'Madhosinghana',
          center: { lat: 29.5833, lng: 75.1667 }, // Default center coordinates for Sirsa, Haryana
          radius: 10000, // 10km default radius in meters
          message: 'Sorry, we currently deliver only within our village area. Thank you for your understanding!'
        },
      },
      homepageSections: {
        trending: { id: 'trending', title: 'Trending Now 🔥', bgColor: '#1a1a1a', textColor: '#ffffff', isActive: true, variant: 'trending' },
        bestseller: { id: 'bestseller', title: 'Best Sellers 🏆', bgColor: '#fffdf0', textColor: '#78350f', isActive: true, variant: 'bestseller' },
        fresh: { id: 'fresh', title: 'Fresh Picks 🥬', bgColor: '#f0f9f1', textColor: '#064e3b', isActive: true, variant: 'fresh' }
      },
      homepageLayoutOrder: ['flashSale', 'trending', 'bestseller', 'fresh'],
      updateHomepageSection: async (id, settings) => {
        const store = useAdminStore.getState();
        const updated = {
          ...store.homepageSections,
          [id]: { ...store.homepageSections[id], ...settings }
        };
        set({ homepageSections: updated });
        await setDoc(doc(db, 'settings', 'homepage'), updated);
      },
      updateHomepageOrder: async (orderArray) => {
        set({ homepageLayoutOrder: orderArray });
        await setDoc(doc(db, 'settings', 'homepageOrder'), { order: orderArray });
      },
      updateSettings: async (newSettings) => {
        const store = useAdminStore.getState();
        const updated = { ...store.storeSettings, ...newSettings };
        set({ storeSettings: updated });
        await setDoc(doc(db, 'settings', 'store'), updated);
      },

      // Update location service settings
      updateLocationSettings: async (locationSettings) => {
        const store = useAdminStore.getState();
        const updated = {
          ...store.storeSettings,
          locationService: {
            ...store.storeSettings.locationService,
            ...locationSettings
          }
        };
        set({ storeSettings: updated });
        await setDoc(doc(db, 'settings', 'store'), updated);
      },

      adminProducts: [],
      adminCategories: [],
      adminBanners: [],
      adminOffers: [],
      referralSettings: {},
      blacklist: { emails: [], phones: [] },
      isFirebaseInitialized: false,
      isSettingsLoaded: false,

      // Initialize Firebase Listeners
      initFirebase: () => {
        if (get().isFirebaseInitialized) return;
        set({ isFirebaseInitialized: true });
        console.log('[Store] Initializing Firebase Listeners...');

        // Auto-resume admin sync if already logged in
        if (get().isAdminLoggedIn) {
          get().initAdminSync();
        }

        const unsubs = [];

        // Sync Categories
        const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
          const cats = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          cats.sort((a, b) => (a.index || 0) - (b.index || 0));
          set({ adminCategories: cats });
        }, (error) => {
          console.error('[FIX-01] Categories Sync Error:', error);
          toast.error('[FIX-01] Permission Error');
        });

        // Sync Products
        const unsubProds = onSnapshot(collection(db, 'products'), (snapshot) => {
          const prods = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          set({ adminProducts: prods });
        }, (error) => {
          console.error('[FIX-02] Products Sync Error:', error);
          toast.error('[FIX-02] Permission Error');
        });

        // Sync Coupons
        const unsubCoups = onSnapshot(collection(db, 'coupons'), (snapshot) => {
          const coups = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          set({ adminCoupons: coups });
        }, (error) => {
          console.error('[FIX-03] Coupons Sync Error:', error);
          toast.error('[FIX-03] Permission Error');
        });

        // Sync Settings
        const unsubSettings = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
          if (docSnap.exists()) set({ storeSettings: docSnap.data(), isSettingsLoaded: true });
          else set({ isSettingsLoaded: true }); // Even if it doesn't exist, we consider it loaded (defaults)
        }, (error) => {
          console.error('Store Settings Sync Error:', error);
          set({ isSettingsLoaded: true });
        });

        const unsubHomepage = onSnapshot(doc(db, 'settings', 'homepage'), (docSnap) => {
          if (docSnap.exists()) set({ homepageSections: docSnap.data() });
        }, (error) => console.error('Homepage Settings Sync Error:', error));

        const unsubBlacklist = onSnapshot(doc(db, 'settings', 'blacklist'), (docSnap) => {
          if (docSnap.exists()) {
            set({ blacklist: docSnap.data() });
          } else {
            set({ blacklist: { emails: [], phones: [] } });
          }
        }, (error) => console.error('Blacklist Sync Error:', error));

        const unsubHomepageOrder = onSnapshot(doc(db, 'settings', 'homepageOrder'), (docSnap) => {
          if (docSnap.exists()) {
            const orderData = docSnap.data();
            if (orderData.order && Array.isArray(orderData.order)) {
              set({ homepageLayoutOrder: orderData.order });
            }
          }
        }, (error) => console.error('Homepage Order Sync Error:', error));

        // Sync Users (ONLY IF ADMIN)
        // Moved to initAdminSync to prevent permission errors for regular users

        const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
          const banners = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          // Removed console.log(`[Store] Banners Sync: ${banners.length} items found`);
          set({ adminBanners: banners });
        }, (error) => {
          console.error('[FIX-04] Banners Sync Error:', error);
          toast.error('[FIX-04] Permission Error');
        });

        unsubs.push(unsubCats, unsubProds, unsubCoups, unsubSettings, unsubHomepage, unsubHomepageOrder, unsubBanners, unsubBlacklist);
        set({ _unsubscribers: [...get()._unsubscribers, ...unsubs] });
      },

      initAdminSync: () => {
        if (!get().isAdminLoggedIn) return;
        console.log('[Store] Initializing Admin-only Sync...');
        const adminUnsubs = [];

        // Sync Admin Accounts
        const unsubAdminAccounts = onSnapshot(doc(db, 'settings', 'admins'), (docSnap) => {
          if (docSnap.exists()) set({ adminAccounts: docSnap.data().list || [] });
        }, (error) => {
          // Silently handle permission denial during role changes
          if (error.code === 'permission-denied') {
            console.log('[FIX-10] Admin access revoked silently');
          } else {
            console.error('[FIX-10] Admin Accounts Error:', error);
            toast.error('Session update required');
          }
        });

        // Sync Users
        const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          set({ registeredUsers: users });
        }, (error) => {
          if (error.code === 'permission-denied') {
            console.log('[FIX-11] Users access revoked silently');
          } else {
            console.error('[FIX-11] Users Sync Error:', error);
          }
        });

        // Sync Offers (Admin Only)
        const unsubOffers = onSnapshot(collection(db, 'offers'), (snapshot) => {
          const offers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          console.log(`[Store] Offers Sync: ${offers.length} items found`);
          set({ adminOffers: offers });
        }, (error) => {
          console.error('[FIX-06] Offers Sync Error:', error);
        });

        adminUnsubs.push(unsubAdminAccounts, unsubUsers, unsubOffers);
        set({ _unsubscribers: [...get()._unsubscribers, ...adminUnsubs] });
      },

      initializeStore: async (authUser = null) => {
        try {
          const currentUserEmail = authUser?.email?.toLowerCase();

          const isMaster = ['monugandhi5911@gmail.com', 'monugandhi03@gmail.com'].includes(currentUserEmail);
          const isStaff = authUser?.role === 'admin' || authUser?.role === 'pro_admin' || authUser?.role === 'delivery_boy';

          // Clean up old referral listener if it exists
          const { _referralUnsub } = get();
          if (_referralUnsub) {
            _referralUnsub();
          }

          // Public Sync (Referral settings for everyone)
          const referralRef = doc(db, 'settings', 'referral');
          const unsub = onSnapshot(referralRef, (snap) => {
            if (snap.exists()) set({ referralSettings: snap.data() });
          }, (error) => {
            console.error('[FIX-08] Referral Sync Error:', error);
          });
          set({ _referralUnsub: unsub });

          // SECURITY: If current user is not master and not staff, clear admin flags to prevent stale access.
          if (currentUserEmail && !isMaster && !isStaff) {
            if (get().isAdminLoggedIn) {
              console.log('[Store] Non-admin detected, clearing stale admin state.');
              set({ isAdminLoggedIn: false, adminRole: null, currentAdminUsername: null });
            }
          }
        } catch (error) {
          console.error('[FIX-09] Init Error:', error);
        }
      },

      wipeAllNonAdminUsers: async () => {
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          const adminEmails = ['monugandhi5911@gmail.com', 'monugandhi03@gmail.com'];
          const batch = writeBatch(db);
          let count = 0;

          usersSnap.forEach(userDoc => {
            if (!adminEmails.includes(userDoc.id)) {
              batch.delete(userDoc.ref);
              count++;
            }
          });

          if (count > 0) {
            await batch.commit();
            toast.success(`Successfully deleted ${count} users.`);
          } else {
            toast.error('No non-admin users found to delete.');
          }
        } catch (error) {
          console.error('Wipe failed:', error);
          toast.error('Failed to wipe users.');
        }
      },

      syncData: async () => {
        const store = get();
        const banners = store.adminBanners;
        if (banners.length > 0) {
          const batch = writeBatch(db);
          let needsUpdate = false;
          banners.forEach(b => {
            if (b.isActive === undefined) {
              batch.update(doc(db, 'banners', b.id.toString()), { isActive: true });
              needsUpdate = true;
            }
          });
          if (needsUpdate) await batch.commit();
        }

        await store.initializeStore();
        store.fixCoupons();
      },

      cleanupAdminData: async ({ range = 'this_month' } = {}) => {
        const normalizedRange = range === 'all' ? 'all' : range;
        const { start, end } = getCleanupRange(normalizedRange);

        const targets = [
          { collectionName: 'orders', field: 'placedAt' },
          { collectionName: 'udhaars', field: 'created_at', fallbackField: 'date' },
          { collectionName: 'notifications', field: 'createdAt' },
          { collectionName: 'delivery_tracking', field: 'updated_at' },
        ];

        const summary = {};

        for (const target of targets) {
          const snap = await getDocs(collection(db, target.collectionName));
          const refsToDelete = [];

          snap.forEach((docSnap) => {
            const data = docSnap.data();
            const rawValue = data?.[target.field] ?? (target.fallbackField ? data?.[target.fallbackField] : null);
            const millis = toMillis(rawValue);
            const shouldDelete = normalizedRange === 'all' || (millis !== null && millis >= start && millis <= end);

            if (shouldDelete) {
              refsToDelete.push(docSnap.ref);
            }
          });

          if (refsToDelete.length > 0) {
            await deleteRefsInBatches(refsToDelete);
          }

          summary[target.collectionName] = refsToDelete.length;
        }

        return summary;
      },

      resetToDefaultData: async () => {
        const batch = writeBatch(db);

        // Reset Products
        productsFromJSON.forEach(p => {
          batch.set(doc(db, 'products', p.id.toString()), p);
        });

        // Reset Categories
        categoriesFromJSON.forEach(c => {
          batch.set(doc(db, 'categories', c.id.toString()), c);
        });

        // Reset Banners
        const bannerSnap = await getDocs(collection(db, 'banners'));
        bannerSnap.docs.forEach(d => batch.delete(d.ref));
        bannersFromJSON.forEach(b => {
          const id = b.id.toString();
          batch.set(doc(db, 'banners', id), { ...b, id, isActive: true });
        });

        await batch.commit();
        toast.success('All data reset to defaults!');
      },

      addProduct: async (product) => {
        const id = `prod_${Date.now()}`;
        const newProd = {
          ...product,
          id,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'products', id), newProd);
      },
      updateProduct: async (id, updatedProduct) => {
        await updateDoc(doc(db, 'products', id.toString()), updatedProduct);
      },
      deleteProduct: async (id) => {
        await deleteDoc(doc(db, 'products', id.toString()));
      },

      addCategory: async (category) => {
        const id = category.id.toString();
        await setDoc(doc(db, 'categories', id), category);
      },
      updateCategory: async (id, updatedCategory) => {
        await updateDoc(doc(db, 'categories', id.toString()), updatedCategory);
      },
      deleteCategory: async (id) => {
        await deleteDoc(doc(db, 'categories', id.toString()));
      },
      reorderCategory: async (id, direction) => {
        const store = get();
        const categories = [...store.adminCategories];
        const index = categories.findIndex((c) => c.id === id);
        if (index === -1) return;

        const newCategories = [...categories];
        if (direction === 'up' && index > 0) {
          [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
        } else if (direction === 'down' && index < newCategories.length - 1) {
          [newCategories[index + 1], newCategories[index]] = [newCategories[index], newCategories[index + 1]];
        }

        const batch = writeBatch(db);
        newCategories.forEach((c, i) => {
          batch.update(doc(db, 'categories', c.id.toString()), { index: i });
        });
        await batch.commit();
      },

      adminCoupons: [
        { code: 'WELCOME10', type: 'flat', value: 10, minOrder: 100, isActive: true, targetType: 'global' },
        { code: 'SAVE20', type: 'percentage', value: 20, minOrder: 500, isActive: true, targetType: 'global' }
      ],

      fixCoupons: () => {
        const store = get();
        const coupons = store.adminCoupons;
        const fixed = coupons.map(c => ({
          ...c,
          targetType: (c.targetType === 'all' || !c.targetType) ? 'global' : c.targetType,
          type: c.type === 'fixed' ? 'flat' : c.type
        }));
        set({ adminCoupons: fixed });
      },

      addCoupon: async (coupon) => {
        const newCoupon = {
          ...coupon,
          targetType: (coupon.targetType === 'all' || !coupon.targetType) ? 'global' : coupon.targetType,
          type: coupon.type === 'fixed' ? 'flat' : coupon.type
        };
        await setDoc(doc(db, 'coupons', newCoupon.code), newCoupon);
      },
      updateCoupon: async (code, updatedCoupon) => {
        await updateDoc(doc(db, 'coupons', code), updatedCoupon);
      },
      deleteCoupon: async (code) => {
        await deleteDoc(doc(db, 'coupons', code));
      },

      registeredUsers: [],
      proAdminConfig: {
        name: 'Monu',
        phone: '8607424026',
        pin: '9365524026'
      },

      trackUser: async (userData) => {
        if (!userData.email) return;
        const currentEmail = userData.email.toLowerCase();

        try {
          const userRef = doc(db, 'users', currentEmail);
          const userSnap = await getDoc(userRef);

          const proEmail = 'monugandhi5911@gmail.com';
          const secondaryAdminEmail = 'monugandhi03@gmail.com';

          const isProUser = currentEmail === proEmail;
          const isSecondaryAdmin = currentEmail === secondaryAdminEmail;

          // Generate this user's OWN referral code
          const myGeneratedCode = (userData.name && userData.phone)
            ? `GM${userData.name.slice(0, 3).toUpperCase()}${userData.phone.slice(-3)}`
            : null;

          // Final Role Assignment
          let finalRole = 'user';
          if (isProUser) finalRole = 'pro_admin';
          else if (isSecondaryAdmin) finalRole = 'admin';

          if (!userSnap.exists()) {
            // New user
            await setDoc(userRef, {
              ...userData,
              uid: userData.uid || null, // Ensure ID is saved from start
              email: currentEmail,
              role: finalRole,
              walletBalance: 0,
              referralCode: myGeneratedCode, // Their OWN code
              referredBy: (userData.referralCode && userData.referralCode !== myGeneratedCode) ? userData.referralCode : null, // Who referred them (Must NOT be themselves)
              referralRewardClaimed: false,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            });
          } else {
            // Existing user
            const existingData = userSnap.data();
            const updates = {
              name: userData.name,
              phone: userData.phone,
              email: currentEmail,
              lastLogin: serverTimestamp()
            };

            // Critical: Ensure valid UID is stored/updated
            if (userData.uid) {
              updates.uid = userData.uid;
            }

            // Add referralCode if they don't have one saved
            if (!existingData.referralCode && myGeneratedCode) {
              updates.referralCode = myGeneratedCode;
            }
            // Fix: If referredBy was accidentally set to their own code, clear it
            if (existingData.referredBy && existingData.referredBy === (existingData.referralCode || myGeneratedCode)) {
              updates.referredBy = null;
            }
            // If they don't have referredBy yet but one is provided now
            if (!existingData.referredBy && userData.referralCode && userData.referralCode !== myGeneratedCode) {
              updates.referredBy = userData.referralCode;
            }

            await updateDoc(userRef, updates);
          }

          // NEW: Publicly searchable referral registry
          if (myGeneratedCode) {
            await setDoc(doc(db, 'referral_codes', myGeneratedCode), {
              ownerName: userData.name,
              ownerEmail: currentEmail,
              updatedAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("User tracking failed:", error);
          throw error;
        }
      },

      toggleUserBlock: async (email, phone, isBlocked) => {
        if (!email && !phone) return;
        
        try {
          if (email) {
            const targetEmail = email.toLowerCase();
            if (targetEmail === 'monugandhi5911@gmail.com') {
              toast.error('Cannot block Master Admin');
              return;
            }
            await setDoc(doc(db, 'users', targetEmail), { isBlocked }, { merge: true });
          }

          const blacklistRef = doc(db, 'settings', 'blacklist');
          const snap = await getDoc(blacklistRef);
          let emails = snap.exists() ? snap.data().emails || [] : [];
          let phones = snap.exists() ? snap.data().phones || [] : [];

          if (isBlocked) {
            if (email && !emails.includes(email.toLowerCase())) emails.push(email.toLowerCase());
            if (phone && !phones.includes(phone)) phones.push(phone);
          } else {
            if (email) emails = emails.filter(e => e !== email.toLowerCase());
            if (phone) phones = phones.filter(p => p !== phone);
          }

          await setDoc(blacklistRef, { emails, phones }, { merge: true });
          toast.success(`User ${isBlocked ? 'blocked' : 'unblocked'} successfully!`);
        } catch (error) {
          console.error("Block User Error:", error);
          toast.error("Failed to update block status");
        }
      },

      updateUserRole: async (email, role, staffPin = null) => {
        if (!email) return;
        const targetEmail = email.toLowerCase();

        // Security: Master Admin Protection
        if (targetEmail === 'monugandhi5911@gmail.com') {
          toast.error('Security: Cannot change role of Master Admin');
          return;
        }

        const updates = { role };
        if (staffPin) updates.staffPin = staffPin;

        // Use setDoc with merge so it works even if document doesn't exist
        await setDoc(doc(db, 'users', targetEmail), updates, { merge: true });
      },

      updateWalletBalance: async (email, amount) => {
        if (!email) throw new Error("Email is required");
        const userRef = doc(db, 'users', email.toLowerCase());
        await setDoc(userRef, {
          walletBalance: increment(amount)
        }, { merge: true });

        await logWalletTransaction(email.toLowerCase(), amount, amount >= 0 ? 'credit' : 'debit', 'Admin manual adjustment');
      },

      deleteUser: async (email) => {
        if (!email) return;
        await deleteDoc(doc(db, 'users', email.toLowerCase()));
      },

      updateBanner: async (id, data) => {
        await updateDoc(doc(db, 'banners', id.toString()), data);
      },
      addBanner: async (banner) => {
        const id = `banner_${Date.now()}`;
        await setDoc(doc(db, 'banners', id), { ...banner, id, isActive: true });
      },
      deleteBanner: async (id) => {
        await deleteDoc(doc(db, 'banners', id));
      },
      toggleBanner: async (id) => {
        const store = get();
        const banner = store.adminBanners.find(b => b.id === id);
        if (banner) {
          await updateDoc(doc(db, 'banners', id), { isActive: !banner.isActive });
        }
      },

      addOffer: async (offer) => {
        const newOffer = {
          ...offer,
          id: `offer_${Date.now()}`,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'offers', newOffer.id), newOffer);
      },

      updateOffer: async (offerId, updatedOffer) => {
        await updateDoc(doc(db, 'offers', offerId), updatedOffer);
      },

      deleteOffer: async (offerId) => {
        await deleteDoc(doc(db, 'offers', offerId));
      },

      toggleOffer: async (offerId) => {
        const store = get();
        const offer = store.adminOffers.find(o => o.id === offerId);
        if (offer) {
          await updateDoc(doc(db, 'offers', offerId), { isActive: !offer.isActive });
        }
      },

      customers: [],
    }),
    {
      name: 'gmart-admin-store-v5',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isAdminLoggedIn: state.isAdminLoggedIn,
        adminRole: state.adminRole,
        currentAdminUsername: state.currentAdminUsername
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Fix: Always restore pro_admin for master username after refresh
          if (state.isAdminLoggedIn && state.currentAdminUsername === 'monugandhi5911') {
            state.adminRole = 'pro_admin';
          }
          state.initializeStore();
        }
      }
    }
  )
);
