import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCartStore } from './cartStore';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAdminStore } from './adminStore';
import { useOrdersStore } from './ordersStore';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      savedAddresses: [],
      _unsubscribe: null,

      login: (name, phone, email, photoURL, uid) => {
        // Clear cart from previous session upon new login
        useCartStore.getState().clearCart();
        
        const userData = { name, phone, email, photoURL, uid, joinedAt: new Date().toISOString() };
        set({
          user: userData,
          isLoggedIn: true,
        });

        // Start sync
        get().initFirebase(email);
        
        // Also init orders!
        const isAdmin = useAdminStore.getState().isAdminLoggedIn;
        useOrdersStore.getState().initFirebase(email, isAdmin);
      },

      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }));
      },

      initFirebase: (email) => {
        if (!email) return;
        const normalizedEmail = email.toLowerCase();

        // Clean up previous user listener
        const { _unsubscribe } = get();
        if (_unsubscribe) {
          _unsubscribe();
        }

        const unsub = onSnapshot(doc(db, 'users', normalizedEmail), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            set({ 
              user: { ...get().user, ...data },
              savedAddresses: data.savedAddresses || get().savedAddresses
            });
          }
        }, (error) => {
          console.error('[FIX-05] Profile Sync Error:', error);
          // Only show toast if authenticated, otherwise it's expected
          if (email) toast.error('[FIX-05] Permission Error');
        });

        set({ _unsubscribe: unsub });
        return unsub;
      },

      logout: () => {
        useCartStore.getState().clearCart();
        
        // Clean up user listener
        const { _unsubscribe } = get();
        if (_unsubscribe) {
          _unsubscribe();
        }

        set({ user: null, isLoggedIn: false, savedAddresses: [] });
        
        useOrdersStore.getState().initFirebase(null, false);
      },

      saveAddress: async (address) => {
        const newAddresses = [
          { ...address, id: address.id || Date.now() },
          ...get().savedAddresses.filter((a) => a.id !== (address.id || 'new')),
        ].slice(0, 5); // Keep most recent 5 addresses
        
        const currentUser = get().user;
        set({ 
          savedAddresses: newAddresses,
          user: currentUser ? { ...currentUser, savedAddresses: newAddresses } : null
        });
 
        if (currentUser?.email) {
          try {
            await updateDoc(doc(db, 'users', currentUser.email.toLowerCase()), {
              savedAddresses: newAddresses
            });
          } catch (e) {
            console.error("Sync addresses error:", e);
          }
        }
      },

      removeAddress: async (id) => {
        const newAddresses = get().savedAddresses.filter((a) => a.id !== id);
        const currentUser = get().user;
        set({ 
          savedAddresses: newAddresses,
          user: currentUser ? { ...currentUser, savedAddresses: newAddresses } : null
        });
 
        if (currentUser?.email) {
          try {
            await updateDoc(doc(db, 'users', currentUser.email.toLowerCase()), {
              savedAddresses: newAddresses
            });
          } catch (e) {
            console.error("Sync addresses error:", e);
          }
        }
      },
    }),
    {
      name: 'gmart-auth',
    }
  )
);
