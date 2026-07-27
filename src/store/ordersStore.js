import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateOrderId } from '../utils/helpers';
import { useNotificationStore } from './notificationsStore';
import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  updateDoc, 
  query, 
  where,
  increment,
  getDocs
} from 'firebase/firestore';
import { logWalletTransaction } from '../utils/wallet';
import { useAdminStore } from './adminStore';
import toast from 'react-hot-toast';

export const useOrdersStore = create(
  persist(
    (set, get) => ({
      orders: [],

      _unsubscribe: null,

      initFirebase: (userEmail = null, isAdmin = false) => {
        const { _unsubscribe, _currentEmail, _currentRole } = get();

        // ✅ Skip re-init if same user/role is already being listened to
        if (_unsubscribe && _currentEmail === (userEmail || null) && _currentRole === isAdmin) {
          return;
        }

        if (_unsubscribe) {
          _unsubscribe();
        }

        let q;
        if (isAdmin === true) {
          // Super Admin: View all orders
          q = query(collection(db, 'orders'));
        } else if (isAdmin === 'delivery' && userEmail) {
          // Delivery Boy: View only assigned orders
          q = query(collection(db, 'orders'), where('assignedDeliveryBoy.email', '==', userEmail.toLowerCase()));
        } else if (userEmail) {
          // Customer: View only their own orders
          q = query(collection(db, 'orders'), where('customerEmail', '==', userEmail.toLowerCase()));
        } else {
          set({ orders: [], _currentEmail: null, _currentRole: null });
          return;
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          // Sort locally to avoid Firestore composite index errors and handle old orders without placedAt
          fetchedOrders.sort((a, b) => new Date(b.placedAt || 0) - new Date(a.placedAt || 0));
          set({ orders: fetchedOrders });
        }, (err) => {
          console.error("[FIX-06] Orders Sync error:", err);
          toast.error('[FIX-06] Permission Error');
          set({ orders: [] });
        });

        set({ _unsubscribe: unsubscribe, _currentEmail: userEmail || null, _currentRole: isAdmin });
      },

      placeOrder: async (orderData) => {
        const id = generateOrderId();
        const order = {
          id,
          ...orderData,
          status: 'placed',
          placedAt: new Date().toISOString(),
          steps: [
            { key: 'placed', label: 'Order Placed', done: true, time: new Date().toISOString() },
            { key: 'confirmed', label: 'Confirmed', done: false, time: null },
            { key: 'packing', label: 'Packing', done: false, time: null },
            { key: 'out_for_delivery', label: 'Out for Delivery', done: false, time: null },
            { key: 'delivered', label: 'Delivered', done: false, time: null },
          ],
        };
        await setDoc(doc(db, 'orders', id), order);
        // Decrement stock for each ordered item and auto-mark out of stock
        if (orderData.items && Array.isArray(orderData.items)) {
          const { adminProducts } = useAdminStore.getState();
          orderData.items.forEach(item => {
            const qty = item.qty || item.quantity || 1;
            const currentProduct = adminProducts.find(p => String(p.id) === String(item.id));
            if (!currentProduct) return;

            const updateData = {};

            // 1. Decrement variant-level stock if item has variantId and variants exist
            if (item.variantId && currentProduct.variants && Array.isArray(currentProduct.variants)) {
              const updatedVariants = currentProduct.variants.map(v => {
                if (String(v.id) === String(item.variantId)) {
                  const hasVariantStock = v.stock !== undefined && v.stock !== null && v.stock !== '';
                  if (hasVariantStock) {
                    const variantStock = Math.max(0, Number(v.stock) - qty);
                    return {
                      ...v,
                      stock: variantStock,
                      inStock: variantStock > 0 ? (v.inStock !== false) : false
                    };
                  }
                }
                return v;
              });
              updateData.variants = updatedVariants;
            }

            // 2. Decrement base product stock if it has one
            const currentStock = currentProduct.stock;
            const hasStockValue = currentStock !== undefined && currentStock !== null && currentStock !== '';
            if (hasStockValue) {
              const newStock = Math.max(0, Number(currentStock) - qty);
              updateData.stock = newStock;
              if (newStock <= 0) {
                updateData.inStock = false;
              }
            }

            // 3. Update firestore if there is anything to change
            if (Object.keys(updateData).length > 0) {
              updateDoc(doc(db, 'products', item.id.toString()), updateData)
                .catch(e => console.error('Failed to update stock for product', item.id, e));
            }
          });
        }
        return order;
      },

      cancelOrder: async (id) => {
        const order = get().orders.find(o => o.id === id);
        if (!order) return;

        let email = order.customerEmail || '';
        if (!email) {
          const phone = order.deliveryAddress?.phone || order.address?.phone || order.customerPhone;
          if (phone) {
            const cleanedPhone = String(phone).replace(/\D/g, '').slice(-10);
            if (cleanedPhone.length === 10) {
              try {
                const qUser = query(collection(db, 'users'), where('phone', '==', cleanedPhone));
                const userSnap = await getDocs(qUser);
                if (!userSnap.empty) {
                  email = userSnap.docs[0].id; // Doc id is lowercase email
                }
              } catch (e) {
                console.error("Fallback cancel email lookup failed", e);
              }
            }
          }
        }

        if (!email) {
          toast.error('Could not determine customer email for cancellation');
          return;
        }

        const baseSteps = order.steps || [
          { key: 'placed', label: 'Order Placed', done: true, time: order.placedAt || new Date().toISOString() },
          { key: 'confirmed', label: 'Confirmed', done: false, time: null },
          { key: 'packing', label: 'Packing', done: false, time: null },
          { key: 'out_for_delivery', label: 'Out for Delivery', done: false, time: null },
          { key: 'delivered', label: 'Delivered', done: false, time: null },
        ];
        const updatedSteps = [...baseSteps, { key: 'cancelled', label: 'Cancelled by User', done: true, time: new Date().toISOString() }];

        // 1. Update Order Status FIRST (Allowed by new rules)
        try {
          await updateDoc(doc(db, 'orders', id), {
            status: 'cancelled',
            steps: updatedSteps
          });
          toast.success('Order cancelled successfully');
        } catch (err) {
          console.error("Order cancel status update failed:", err);
          toast.error('Could not cancel order. Please contact support.');
          return;
        }

        // 2. Restore stock for all items in the order
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const qty = item.qty || item.quantity || 1;
            updateDoc(doc(db, 'products', item.id.toString()), {
              stock: increment(qty),
              inStock: true
            })
              .catch(e => console.error('Failed to restore stock for product', item.id, e));
          });
        }

        // 3. Handle Refund
        let refundAmount = (order.walletUsed || 0);
        if (order.paymentMethod === 'upi' || order.paymentMethod === 'scanner') {
          refundAmount += (order.total || 0);
        }

        if (refundAmount > 0) {
          try {
            // This will only work if an Admin/Staff is performing the action
            await updateDoc(doc(db, 'users', email), {
              walletBalance: increment(refundAmount)
            });

            await logWalletTransaction(email, refundAmount, 'credit', `Refund for cancelled order #${id}`);

            useNotificationStore.getState().addNotification({
              title: 'Order Refunded! 💰',
              message: `₹${refundAmount} has been added back to your wallet.`,
              type: 'promo',
              email: email,
              phone: order.deliveryAddress?.phone || order.address?.phone
            });
            toast.success(`₹${refundAmount} refunded to wallet`);
          } catch (error) {
            console.error(error);
            console.log("Automated refund failed (expected for non-admins). Admin will process manually.");

            // Notify user about manual refund
            useNotificationStore.getState().addNotification({
              title: 'Refund Processing ⏳',
              message: `Your order #${id} was cancelled. Refund of ₹${refundAmount} will be processed manually by Admin shortly.`,
              type: 'order',
              email: email,
              phone: order.deliveryAddress?.phone || order.address?.phone
            });
            toast('Refund will be processed by Admin shortly.', { icon: '⏳' });
          }
        }
      },

      getOrder: (id) => get().orders.find((o) => o.id === id),


      updateOrderStep: async (id, stepKey) => {
        const order = get().orders.find(o => o.id === id);
        if (!order) return;

        const baseSteps = order.steps || [
          { key: 'placed', label: 'Order Placed', done: true, time: order.placedAt || new Date().toISOString() },
          { key: 'confirmed', label: 'Confirmed', done: false, time: null },
          { key: 'packing', label: 'Packing', done: false, time: null },
          { key: 'out_for_delivery', label: 'Out for Delivery', done: false, time: null },
          { key: 'delivered', label: 'Delivered', done: false, time: null },
        ];

        const updatedSteps = baseSteps.map((s) =>
          s.key === stepKey ? { ...s, done: true, time: new Date().toISOString() } : s
        );

        try {
          await updateDoc(doc(db, 'orders', id), {
            status: stepKey,
            steps: updatedSteps
          });

          // Fallback lookup: If order doesn't have customerEmail, query users by phone
          let email = order.customerEmail || '';
          if (!email) {
            const phone = order.deliveryAddress?.phone || order.address?.phone || order.customerPhone;
            if (phone) {
              const cleanedPhone = String(phone).replace(/\D/g, '').slice(-10);
              if (cleanedPhone.length === 10) {
                try {
                  const qUser = query(collection(db, 'users'), where('phone', '==', cleanedPhone));
                  const userSnap = await getDocs(qUser);
                  if (!userSnap.empty) {
                    email = userSnap.docs[0].id; // Lowercase email is doc id
                  }
                } catch (e) {
                  console.error("Fallback email lookup failed", e);
                }
              }
            }
          }

          // Trigger notification
          const statusText = stepKey.replace(/_/g, ' ').toUpperCase();
          useNotificationStore.getState().addNotification({
            title: `Order Update: ${statusText}`,
            message: `Your order #${id} is now ${stepKey.replace(/_/g, ' ')}.`,
            type: 'order',
            email: email,
            phone: order.deliveryAddress?.phone || order.address?.phone
          });
        } catch (error) {
          console.error("updateOrderStep failed:", error);
          toast.error("Status update failed: " + (error.message || error));
          throw error;
        }
      },

      reorder: (orderId, addItem) => {
        const order = get().getOrder(orderId);
        if (!order) return;
        order.items.forEach((item) => addItem(item));
      },
      
      assignDeliveryBoy: async (orderId, deliveryBoy) => {
        // deliveryBoy = { email, name, phone }
        await updateDoc(doc(db, 'orders', orderId), {
          assignedDeliveryBoy: deliveryBoy
        });
      },
    }),
    {
      name: 'gmart-orders',
    }
  )
);
