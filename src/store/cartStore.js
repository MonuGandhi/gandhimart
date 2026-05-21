import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAdminStore } from './adminStore';
import { getActiveFlashSaleProducts } from '../utils/flashSale';
import toast from 'react-hot-toast';

export const getAdjustedCartItems = (items) => {
  const adminProducts = useAdminStore.getState().adminProducts || [];
  const flashProducts = getActiveFlashSaleProducts(adminProducts);
  
  return items.map(item => {
    const flashMatch = flashProducts.find(fp => String(fp.id) === String(item.id));
    if (flashMatch) {
      return {
        ...item,
        price: flashMatch.price,
        discount: flashMatch.discount,
        originalPrice: flashMatch.originalPrice,
        isFlashSale: true
      };
    }
    const catalogMatch = adminProducts.find(ap => String(ap.id) === String(item.id));
    if (catalogMatch) {
      if (item.variantId) {
        const variant = catalogMatch.variants?.find(v => String(v.id) === String(item.variantId));
        if (variant) {
          return {
            ...item,
            price: variant.price,
            discount: variant.discount || catalogMatch.discount || 0,
            originalPrice: variant.originalPrice || variant.price,
            isFlashSale: false
          };
        }
      }
      return {
        ...item,
        price: catalogMatch.price,
        discount: catalogMatch.discount,
        originalPrice: catalogMatch.originalPrice,
        isFlashSale: false
      };
    }
    return item;
  });
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,

      addItem: (product, variantId = null) => {
        const { items } = get();
        const itemId = variantId ? `${product.id}_${variantId}` : product.id;
        const existing = items.find((i) => i.itemId === itemId);
        
        const variant = product.variants?.find(v => v.id === variantId);
        const hasVariantStock = variant && variant.stock !== undefined && variant.stock !== null && variant.stock !== "";
        const hasProductStock = product.stock !== undefined && product.stock !== null && product.stock !== "";
        
        let stockCount = Infinity;
        let hasStockLimit = false;
        
        if (hasVariantStock) {
          stockCount = Number(variant.stock);
          hasStockLimit = true;
        } else if (hasProductStock) {
          stockCount = Number(product.stock);
          hasStockLimit = true;
        }

        if (existing) {
          if (hasStockLimit && existing.qty >= stockCount) {
            toast.error(`Only ${stockCount} items left in stock!`);
            return;
          }
          set({
            items: items.map((i) =>
              i.itemId === itemId ? { ...i, qty: i.qty + 1 } : i
            ),
          });
        } else {
          if (hasStockLimit && stockCount <= 0) {
            toast.error(`This item is out of stock!`);
            return;
          }
          // If product has a specific variant, use its details
          const variant = product.variants?.find(v => v.id === variantId);
          const price = variant ? variant.price : product.price;
          const originalPrice = variant ? variant.originalPrice : product.originalPrice;
          const weight = variant ? variant.weight : product.weight;
          const unit = variant ? variant.unit : product.unit;

          set({ 
            items: [...items, { 
              ...product, 
              itemId, 
              variantId, 
              price, 
              originalPrice, 
              weight, 
              unit, 
              qty: 1 
            }] 
          });
        }
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.itemId !== itemId) });
      },

      updateQty: (itemId, qty) => {
        if (qty <= 0) {
          get().removeItem(itemId);
          return;
        }
        const item = get().items.find((i) => i.itemId === itemId);
        if (item) {
          const variant = item.variants?.find(v => v.id === item.variantId);
          const hasVariantStock = variant && variant.stock !== undefined && variant.stock !== null && variant.stock !== "";
          const hasProductStock = item.stock !== undefined && item.stock !== null && item.stock !== "";
          
          let stockCount = Infinity;
          let hasStockLimit = false;
          
          if (hasVariantStock) {
            stockCount = Number(variant.stock);
            hasStockLimit = true;
          } else if (hasProductStock) {
            stockCount = Number(item.stock);
            hasStockLimit = true;
          }

          if (hasStockLimit && qty > stockCount) {
            toast.error(`Only ${stockCount} items left in stock!`);
            return;
          }
        }
        set({
          items: get().items.map((i) => (i.itemId === itemId ? { ...i, qty } : i)),
        });
      },

      clearCart: () => set({ items: [], appliedCoupon: null }),

      applyCoupon: (code, userPhone = '') => {
        const { adminCoupons } = useAdminStore.getState();
        const coupon = adminCoupons.find(
          (c) => c.code === code.toUpperCase() && c.isActive
        );
        if (!coupon) return { success: false, message: 'Invalid coupon code' };

        // Customer-specific coupon validation
        if (coupon.targetType === 'specific') {
          if (!userPhone || coupon.targetPhone !== userPhone) {
            return { success: false, message: 'This coupon is not valid for your account' };
          }
        }

        const { subtotal } = get().computed();
        if (subtotal < coupon.minOrder) {
          return {
            success: false,
            message: `Minimum order of ₹${coupon.minOrder} required`,
          };
        }
        set({ appliedCoupon: coupon });
        return { success: true, message: `Coupon "${code.toUpperCase()}" applied!` };
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      computed: () => {
        const { items: rawItems, appliedCoupon } = get();
        const items = getAdjustedCartItems(rawItems);
        const { storeSettings } = useAdminStore.getState();
        
        const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
        const mrpTotal = items.reduce(
          (sum, i) => sum + (i.originalPrice || i.price) * i.qty,
          0
        );
        const subtotal = items.reduce(
          (sum, i) => sum + i.price * i.qty,
          0
        );
        const productDiscount = mrpTotal - subtotal;

        let couponDiscount = 0;
        let freeDelivery = false;
        if (appliedCoupon) {
          if (appliedCoupon.type === 'percentage') {
            couponDiscount = Math.min(
              Math.round((subtotal * appliedCoupon.value) / 100),
              appliedCoupon.maxDiscount || Infinity
            );
          } else if (appliedCoupon.type === 'flat') {
            couponDiscount = Math.min(appliedCoupon.value, appliedCoupon.maxDiscount || Infinity);
          } else if (appliedCoupon.type === 'delivery') {
            freeDelivery = true;
          }
        }

        const deliveryFee =
          freeDelivery || subtotal >= storeSettings.freeDeliveryAbove ? 0 : storeSettings.deliveryFee;
        const amountAfterDiscount = subtotal - couponDiscount;
        const gst = Math.round(amountAfterDiscount * (storeSettings.gstPercentage / 100));
        const grandTotal = amountAfterDiscount + deliveryFee + gst;
        const totalSavings = productDiscount + couponDiscount + (subtotal >= storeSettings.freeDeliveryAbove ? storeSettings.deliveryFee : 0);

        return {
          totalItems,
          mrpTotal,
          subtotal,
          productDiscount,
          couponDiscount,
          deliveryFee,
          gst,
          grandTotal,
          totalSavings,
        };
      },
    }),
    {
      name: 'gmart-cart',
    }
  )
);
