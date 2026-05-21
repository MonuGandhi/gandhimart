import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import BannerCarousel from '../components/home/BannerCarousel';
import CategoryRow from '../components/home/CategoryRow';
import ProductSection from '../components/home/ProductSection';
import { useProducts } from '../hooks/useProducts';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useAdminStore } from '../store/adminStore';
import ServiceHighlights from '../components/home/ServiceHighlights';
import FlashSaleRow from '../components/home/FlashSaleRow';

export default function Home() {
  const { 
    products,
    categories, 
    getProductsByCategory, 
    getTrending, 
    getBestSellers, 
    getFreshPicks 
  } = useProducts();
  
  const trendingProducts = useMemo(() => getTrending(), [products]);
  const bestSellers = useMemo(() => getBestSellers(), [products]);
  const freshPicks = useMemo(() => getFreshPicks(), [products]);

  const productsByCategory = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const catId = String(p.categoryId);
      if (!map[catId]) {
        map[catId] = [];
      }
      map[catId].push(p);
    });
    return map;
  }, [products]);

  const homepageSections = useAdminStore((s) => s.homepageSections) || {};
  const homepageLayoutOrder = useAdminStore((s) => s.homepageLayoutOrder) || ['flashSale', 'trending', 'bestseller', 'fresh'];
  const storeSettings = useAdminStore((s) => s.storeSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categories?.length > 0) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [categories]);

  const [isDarkActive, setIsDarkActive] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const handleTheme = () => {
      setIsDarkActive(document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('theme-change', handleTheme);
    return () => window.removeEventListener('theme-change', handleTheme);
  }, []);

  return (
    <Layout>
      {storeSettings?.announcementText && (
        <div 
          className="w-full text-[11px] md:text-sm font-black flex items-center justify-center min-h-[36px] px-4 animate-pulse"
          style={!isDarkActive ? { 
            backgroundColor: storeSettings.announcementBgColor || '#1CA672',
            color: storeSettings.announcementTextColor || '#ffffff'
          } : {
            backgroundColor: '#0a2319',
            color: '#34d399',
            borderBottom: '1px solid #143a2b'
          }}
        >
          {storeSettings.announcementText}
        </div>
      )}
      <BannerCarousel />
      <CategoryRow categories={categories} />

      {loading ? (
        <div className="mt-6 px-4 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="pb-2">
          {/* Featured Sections - Dynamic Order from Admin Store */}
          {homepageLayoutOrder.map((sectionId) => {
            
            if (sectionId === 'flashSale') {
              return <FlashSaleRow key={sectionId} isDarkActive={isDarkActive} />;
            }

            if (sectionId === 'trending' && homepageSections.trending?.isActive && trendingProducts.length > 0) {
              return (
                <ProductSection 
                  key={sectionId}
                  title={homepageSections.trending.title} 
                  products={trendingProducts} 
                  horizontal 
                  variant="trending" 
                  customStyles={{ 
                    bgColor: homepageSections.trending.bgColor, 
                    textColor: homepageSections.trending.textColor 
                  }}
                  isDarkActive={isDarkActive}
                />
              );
            }

            if (sectionId === 'bestseller' && homepageSections.bestseller?.isActive && bestSellers.length > 0) {
              return (
                <ProductSection 
                  key={sectionId}
                  title={homepageSections.bestseller.title} 
                  products={bestSellers} 
                  horizontal 
                  variant="bestseller"
                  customStyles={{ bgColor: homepageSections.bestseller.bgColor, textColor: homepageSections.bestseller.textColor }}
                  isDarkActive={isDarkActive}
                />
              );
            }

            if (sectionId === 'fresh' && homepageSections.fresh?.isActive && freshPicks.length > 0) {
              return (
                <ProductSection 
                  key={sectionId}
                  title={homepageSections.fresh.title} 
                  products={freshPicks} 
                  horizontal 
                  variant="fresh"
                  customStyles={{ bgColor: homepageSections.fresh.bgColor, textColor: homepageSections.fresh.textColor }}
                  isDarkActive={isDarkActive}
                />
              );
            }

            return null;
          })}

          <div className="my-3 border-t border-gray-100" />

          {/* Category Sections */}
          {categories?.map((cat) => {
            const categoryProducts = productsByCategory[String(cat.id)] || [];
            if (categoryProducts.length === 0) return null;

            // Find banners for this category
            const catBanners = (useAdminStore.getState().adminBanners || []).filter(
              b => String(b.categoryId) === String(cat.id) && b.isActive
            );

            return (
              <div key={cat.id}>
                {catBanners.length > 0 && (
                  <div className="-mb-2"> {/* Reduce gap between carousel and products */}
                    <BannerCarousel customBanners={catBanners} />
                  </div>
                )}
                <ProductSection 
                  title={cat.name} 
                  products={categoryProducts} 
                  viewAllLink={`/category/${cat.slug}`} 
                  horizontal 
                  image={cat.image}
                  emoji={cat.emoji}
                  isDarkActive={isDarkActive}
                />
              </div>
            );
          })}

          <ServiceHighlights />

          {/* Fallback if no category products found */}
          {categories?.every(cat => (productsByCategory[String(cat.id)] || []).length === 0) && trendingProducts.length === 0 && (
            <div className="text-center py-20 px-4">
              <p className="text-gray-500 font-medium">Add products to your categories to see them here!</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
