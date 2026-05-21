import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      selectedLocation: 'Madhosinghana',
      recentSearches: [],

      setLocation: (location) => set({ selectedLocation: location }),

      addRecentSearch: (term) => {
        if (!term.trim()) return;
        const existing = get().recentSearches.filter(
          (s) => s.toLowerCase() !== term.toLowerCase()
        );
        set({ recentSearches: [term, ...existing].slice(0, 8) });
      },

      removeRecentSearch: (term) => {
        set({
          recentSearches: get().recentSearches.filter((s) => s !== term),
        });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'gmart-app',
    }
  )
);
