import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, onSnapshot, doc, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [], // Fetched from Firebase
      readIds: [], // Local state for read notifications
      deletedIds: [], // Local state for deleted global notifications
      isFirebaseInitialized: false,

      initFirebase: () => {
        if (get().isFirebaseInitialized) return;
        set({ isFirebaseInitialized: true });

        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
        onSnapshot(q, (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          set({ notifications: notifs });
        }, (error) => {
          console.error('[FIX-07] Notifs Sync Error:', error);
          toast.error('[FIX-07] Permission Error');
        });
      },

      addNotification: async (notification) => {
        const id = Date.now().toString();
        const newNotif = {
          ...notification,
          id,
          createdAt: new Date().toISOString(),
        };
        try {
          await setDoc(doc(db, 'notifications', id), newNotif);
        } catch (error) {
          console.error("Error adding notification:", error);
          toast.error("Error: " + error.message);
        }
      },

      markAsRead: (id) => {
        set({ readIds: [...new Set([...get().readIds, id])] });
      },

      markAllAsRead: () => {
        const allIds = get().notifications.map(n => n.id);
        set({ readIds: [...new Set([...get().readIds, ...allIds])] });
      },

      deleteNotification: async (id) => {
        const notif = get().notifications.find(n => n.id === id);
        if (notif?.type === 'order' || notif?.phone) {
          // If it's a personal order notification, delete from Firebase to save space
          try {
            await deleteDoc(doc(db, 'notifications', id));
          } catch (error) {
            console.error("Failed to delete from firebase", error);
            // Fallback to local hide if no permission
            set({ deletedIds: [...new Set([...get().deletedIds, id])] });
          }
        } else {
          // Global notifications should just be hidden locally
          set({ deletedIds: [...new Set([...get().deletedIds, id])] });
        }
      },

      deleteNotificationPermanently: async (id) => {
        try {
          await deleteDoc(doc(db, 'notifications', id));
        } catch (error) {
          console.error("Failed to delete permanently from firebase", error);
          toast.error("Failed to delete from database: " + error.message);
        }
      },

      clearAll: () => {
        const currentIds = get().notifications.map(n => n.id);
        set({ deletedIds: [...new Set([...get().deletedIds, ...currentIds])] });
      },
    }),
    {
      name: 'gmart-notifications-state',
      partialize: (state) => ({ readIds: state.readIds, deletedIds: state.deletedIds }),
    }
  )
);
