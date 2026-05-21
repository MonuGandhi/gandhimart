export const formatPrice = (price) => {
  const safePrice = Number(price) || 0;
  return `₹${safePrice.toLocaleString('en-IN')}`;
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateOrderId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'GM-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getDiscountedPrice = (price, discount) => {
  return Math.round(price - (price * discount) / 100);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const getTimeSlots = () => {
  return [
    { id: 1, label: 'ASAP', sublabel: '10-15 mins', available: true },
    { id: 2, label: '11:00 AM - 12:00 PM', sublabel: 'Today', available: true },
    { id: 3, label: '4:00 PM - 6:00 PM', sublabel: 'Today', available: true },
    { id: 4, label: '8:00 PM - 9:30 PM', sublabel: 'Today', available: true },
    { id: 5, label: '6:00 AM - 8:00 AM', sublabel: 'Tomorrow', available: true },
    { id: 6, label: '10:00 AM - 12:00 PM', sublabel: 'Tomorrow', available: true },
  ];
};

/**
 * Optimizes Cloudinary image URLs by adding auto-format and auto-quality parameters
 * @param {string} url - The original image URL
 * @param {number} width - Optional width for resizing
 * @returns {string} - Optimized URL
 */
export const optimizeImage = (url, width = null) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Detect if it's an upload URL
  if (url.includes('/upload/')) {
    const parts = url.split('/upload/');
    const transformation = width ? `f_auto,q_auto,w_${width},c_limit` : 'f_auto,q_auto';
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  }
  
  return url;
};
