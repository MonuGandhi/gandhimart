import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useAdminStore } from '../../store/adminStore';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../../utils/imageUtils';



export default function BannerCarousel({ customBanners }) {
  const adminBanners = useAdminStore((state) => state.adminBanners);
  
  const banners = (() => {
    if (customBanners) return customBanners;
    if (adminBanners && adminBanners.length > 0) {
      return adminBanners.filter(b => !b.categoryId && b.isActive !== false);
    }
    return []; // Return empty instead of local bannersFromJSON fallback
  })();
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    // Auto-play
    const timer = setInterval(() => emblaApi.scrollNext(), 3500);
    return () => {
      clearInterval(timer);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // If there are absolutely no banners to display, hide the entire carousel cleanly!
  if (banners.length === 0) return null;

  return (
    <div className="mt-2 md:px-4">
      <div className="overflow-hidden md:rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => {
            const Content = (
              <div
                className={`relative aspect-[2.5/1] md:aspect-[3/1] w-full md:rounded-2xl overflow-hidden bg-gray-100 flex items-center ${banner.linkTo ? 'cursor-pointer' : ''}`}
              >
                {/* Full-width Image */}
                <img
                  src={getOptimizedImageUrl(banner.image, 1000)}
                  alt={banner.title || 'Banner'}
                  className={`absolute inset-0 w-full h-full transition-transform duration-500 ${banner.objectFit === 'contain' ? 'object-contain px-2' : 'object-cover'}`}
                  style={{ 
                    transform: banner.objectFit === 'contain' ? 'none' : `scale(${banner.scale / 100 || 1})`,
                    objectPosition: `center ${50 + (banner.yOffset || 0)}%`
                  }}
                  loading={banners.indexOf(banner) === 0 ? "eager" : "lazy"}
                  fetchPriority={banners.indexOf(banner) === 0 ? "high" : "low"}
                  decoding="async"
                />
                
                {/* Overlay for Text (Only if Title exists) */}
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-black/20 flex items-center px-6 md:px-12 lg:px-20 text-left">
                    <div className="z-10 max-w-[70%]">
                      {banner.badge && (
                        <span className="text-[10px] md:text-sm font-bold bg-white/30 backdrop-blur-md text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full mb-2 md:mb-4 inline-block">
                          {banner.badge}
                        </span>
                      )}
                      {banner.title && <h3 className="text-xl md:text-4xl lg:text-6xl font-black text-white leading-tight drop-shadow-md">{banner.title}</h3>}
                      {banner.subtitle && <p className="text-xs md:text-xl lg:text-2xl text-white/90 mt-1 md:mt-3 lg:mt-4 font-medium drop-shadow-sm">{banner.subtitle}</p>}
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <div key={banner.id} className="flex-[0_0_100%] min-w-0">
                {banner.linkTo ? (
                  <Link to={banner.linkTo} className="block w-full h-full">
                    {Content}
                  </Link>
                ) : Content}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all ${
              i === selectedIndex
                ? 'w-5 h-1.5 bg-[#1CA672]'
                : 'w-1.5 h-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
