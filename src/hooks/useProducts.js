import { useAdminStore } from '../store/adminStore';

export const useProducts = () => {
  const products = useAdminStore((state) => state.adminProducts) || [];
  const categories = useAdminStore((state) => state.adminCategories) || [];

  const getProductById = (id) => products.find((p) => String(p.id) === String(id));

  const getProductsByCategory = (categoryId) =>
    products
      .filter((p) => String(p.categoryId) === String(categoryId))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const getProductsByCategorySlug = (slug) => {
    const category = categories.find((c) => c.slug === slug);
    if (!category) return [];
    return getProductsByCategory(category.id);
  };

  const getBestSellers = () => {
    const section = useAdminStore.getState().homepageSections?.bestseller;
    if (section && section.productIds && section.productIds.length > 0) {
      return products.filter((p) => section.productIds.includes(String(p.id)));
    }
    return products.filter((p) => p.tags && p.tags.includes('bestseller')).slice(0, 10);
  };

  const getFreshPicks = () => {
    const section = useAdminStore.getState().homepageSections?.fresh;
    if (section && section.productIds && section.productIds.length > 0) {
      return products.filter((p) => section.productIds.includes(String(p.id)));
    }
    return products.filter((p) => p.tags && p.tags.includes('fresh')).slice(0, 8);
  };

  const getTrending = () => {
    const section = useAdminStore.getState().homepageSections?.trending;
    if (section && section.productIds && section.productIds.length > 0) {
      return products.filter((p) => section.productIds.includes(String(p.id)));
    }
    return products.filter((p) => p.tags && p.tags.includes('trending')).slice(0, 10);
  };


  const getDealOfDay = () =>
    products.filter((p) => p.discount >= 15).slice(0, 6);

  const searchProducts = (query) => {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        ((p.name || '').toLowerCase().includes(q)) ||
        ((p.brand || '').toLowerCase().includes(q)) ||
        ((p.description || '').toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => (t || '').toLowerCase().includes(q)))
    );
  };

  const getSimilarProducts = (product) =>
    products
      .filter((p) => String(p.categoryId) === String(product.categoryId) && String(p.id) !== String(product.id))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 8);

  return {
    products,
    categories,
    getProductById,
    getProductsByCategory,
    getProductsByCategorySlug,
    getBestSellers,
    getFreshPicks,
    getTrending,
    getDealOfDay,
    searchProducts,
    getSimilarProducts,
  };
};
