/**
 * Dynamic Flash Sale utility for G Mart.
 * Handles deterministic 2-hour interval time-block calculation,
 * seeded product selection, and dynamic FOMO stock simulations.
 */

const BLOCK_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours in ms

// Simple seeded pseudo-random number generator
export function getSeededRandom(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return function () {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

/**
 * Returns current flash sale block data:
 * - remainingSeconds: seconds remaining in the current 2-hour block
 * - elapsedRatio: ratio of block already elapsed (0.0 to 1.0)
 * - seed: string unique to this day + block index for seeding
 */
export function getFlashSaleTimeData() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  // Calculate elapsed seconds inside the current 2-hour block
  const elapsedSecondsInBlock = ((hours % 2) * 3600) + (minutes * 60) + seconds;
  const totalSeconds = 2 * 60 * 60; // 7200 seconds
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSecondsInBlock);
  const elapsedRatio = elapsedSecondsInBlock / totalSeconds;
  
  // Seed string based on today's date and the current 2-hour block index (0 to 11)
  const dayString = now.toDateString(); // e.g. "Wed May 20 2026"
  const blockIndex = Math.floor(hours / 2);
  const seed = `${dayString}-${blockIndex}`;
  
  return {
    remainingSeconds,
    elapsedRatio,
    seed
  };
}

import { useAdminStore } from '../store/adminStore';

/**
 * Selects 4 deterministic flash sale products from the catalog.
 * Applies a fallback 15% discount if the item has no discount.
 * Attaches real-time simulated FOMO stock left and claimed percentage metrics.
 */
export function getActiveFlashSaleProducts(products = []) {
  if (!products || products.length === 0) return [];

  const flashSaleConfig = useAdminStore.getState().homepageSections?.flashSale || {};
  if (flashSaleConfig.isActive === false) return []; // Explicitly turned off

  const manualProductIds = flashSaleConfig.productIds || [];
  const customConfigs = flashSaleConfig.customConfigs || {};
  const { seed, elapsedRatio } = getFlashSaleTimeData();
  
  // Filter for active in stock products
  const allCategories = useAdminStore.getState().adminCategories || [];
  const inStockProducts = products.filter(p => {
    if (p.inStock !== true) return false;
    const hasStock = p.stock !== undefined && p.stock !== null && p.stock !== '';
    if (hasStock && Number(p.stock) <= 0) return false;
    const cat = allCategories.find(c => String(c.id) === String(p.categoryId));
    if (cat && cat.isActive === false) return false;
    return true;
  });
  if (inStockProducts.length === 0) return [];

  let selectedProducts = [];

  // If Admin manually selected products, use ONLY those
  if (manualProductIds.length > 0) {
    selectedProducts = inStockProducts.filter(p => manualProductIds.includes(String(p.id)));
  } else {
    // Zero-maintenance Fallback logic
    // Candidate pool: products that have a discount >= 10%
    let candidates = inStockProducts.filter(p => p.discount >= 10);

    // If candidates pool is less than 3, grab trending/bestsellers as fallback candidates
    if (candidates.length < 3) {
      const fallbacks = inStockProducts.filter(
        p => p.tags && (p.tags.includes('trending') || p.tags.includes('bestseller'))
      );
      const combined = [...candidates];
      fallbacks.forEach(fb => {
        if (!combined.some(c => String(c.id) === String(fb.id))) {
          combined.push(fb);
        }
      });
      candidates = combined;
    }

    if (candidates.length < 3) {
      candidates = inStockProducts;
    }

    // Seeded selection of up to 4 items
    const rand = getSeededRandom(seed);
    const pool = [...candidates];
    while (selectedProducts.length < 4 && pool.length > 0) {
      const randomIndex = Math.floor(rand() * pool.length);
      const item = pool.splice(randomIndex, 1)[0];
      selectedProducts.push(item);
    }
  }

  return selectedProducts.map(p => {
    let discount = p.discount;
    let price = p.price;
    let originalPrice = p.originalPrice || p.price;
    let itemClaimedPercent = 0;
    let itemStockLeft = 0;

    // Check if it's a manually configured item
    const customConfig = manualProductIds.length > 0 ? customConfigs[p.id] : null;

    if (customConfig) {
      // Use manual price
      price = customConfig.flashPrice || Math.round(originalPrice * 0.85);
      discount = Math.round(((originalPrice - price) / originalPrice) * 100);

      // Use manual stock and calculate left based on elapsed time
      const initialStock = customConfig.initialStock || 15;
      itemStockLeft = Math.max(1, Math.floor(initialStock - (elapsedRatio * (initialStock - 1))));
      itemClaimedPercent = Math.min(98, Math.max(0, Math.floor(((initialStock - itemStockLeft) / initialStock) * 100)));
      
      // Add artificial FOMO base if too low initially
      if (itemClaimedPercent < 30) itemClaimedPercent = 30 + (itemClaimedPercent * 2);
      itemClaimedPercent = Math.min(98, itemClaimedPercent);

    } else {
      // Automated Fallback logic
      const hasOriginalDiscount = p.discount >= 10;
      if (!hasOriginalDiscount) {
        discount = 15;
        price = Math.round(originalPrice * 0.85);
      }
      
      // High-FOMO stock metrics based on elapsedRatio
      itemClaimedPercent = Math.min(98, Math.max(45, Math.floor(45 + elapsedRatio * 50)));
      itemStockLeft = Math.max(1, Math.min(15, Math.floor(15 - elapsedRatio * 14)));
    }

    return {
      ...p,
      isFlashSale: true,
      discount,
      price,
      originalPrice,
      claimedPercent: itemClaimedPercent,
      stockLeft: itemStockLeft
    };
  });
}
