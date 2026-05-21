import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      toggleWishlist: (product) => {
        if (!product || !product.id) return;
        const { items } = get();
        const exists = items.some((i) => String(i.id) === String(product.id));

        if (exists) {
          set({ items: items.filter((i) => String(i.id) !== String(product.id)) });
          toast.success(`Removed "${product.name}" from favorites! 💔`, {
            style: {
              background: '#ef4444',
              color: '#fff',
            }
          });
        } else {
          set({ items: [...items, product] });
          toast.success(`Saved "${product.name}" to favorites! ❤️`, {
            style: {
              background: '#1CA672',
              color: '#fff',
            }
          });
        }
      },

      isWishlisted: (productId) => {
        return get().items.some((i) => String(i.id) === String(productId));
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'gmart-wishlist',
    }
  )
);
