/**
 * Optimizes a Cloudinary image URL by injecting transformation parameters
 * @param {string} url - Original image URL
 * @param {number} width - Target width for optimization
 * @returns {string} - Optimized URL
 */
export const getOptimizedImageUrl = (url, width = 800) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Inject q_auto:eco (quality), f_auto (format), and width optimization with limit crop
  // Cloudinary URLs look like .../image/upload/v12345/...
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/q_auto:eco,f_auto,w_${width},c_limit/`);
  }
  
  return url;
};
