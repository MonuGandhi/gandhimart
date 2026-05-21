import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../ui/ProductCard';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

export default function ProductSection({ 
  title, 
  products, 
  viewAllLink, 
  horizontal = true, 
  variant = 'default', 
  customStyles = {},
  image = null,
  emoji = null,
  isDarkActive = false
}) {
  if (!products?.length) return null;

  const getVariantStyles = () => {
    const base = {
      container: "py-4 my-3 relative overflow-hidden rounded-[2.5rem] mx-2",
      title: "font-black tracking-tight text-lg md:text-xl",
      cardWrapper: "p-1 rounded-[1.8rem] shadow-sm",
      headerIcon: "",
      badge: "bg-gray-600 text-white"
    };

    let variantStyle;
    switch (variant) {
      case 'trending':
        variantStyle = {
          container: `${base.container} bg-[#1a1a1a]`,
          title: `${base.title} text-white italic tracking-tighter`,
          cardWrapper: "bg-[#2a2a2a] border-2 border-orange-500/20 shadow-xl",
          headerIcon: "🔥",
          badge: "bg-orange-600 text-white"
        };
        break;
      case 'bestseller':
        variantStyle = {
          container: `${base.container} bg-[#fffdf0] border-2 border-amber-100`,
          title: `${base.title} text-amber-900`,
          cardWrapper: "bg-white border border-amber-200 shadow-md",
          headerIcon: "🏆",
          badge: "bg-amber-500 text-white"
        };
        break;
      case 'fresh':
        variantStyle = {
          container: `${base.container} bg-[#f0f9f1] border border-green-100`,
          title: `${base.title} text-green-900`,
          cardWrapper: "bg-white border border-green-50 shadow-sm",
          headerIcon: "🥬",
          badge: "bg-green-600 text-white"
        };
        break;
      default:
        variantStyle = {
          container: "mt-4 py-0",
          title: "text-gray-900 font-bold",
          cardWrapper: "bg-white rounded-2xl shadow-sm border border-gray-100",
          headerIcon: "",
          badge: ""
        };
    }

    // Apply manual overrides if provided (only in light mode)
    return {
      ...variantStyle,
      containerStyle: !isDarkActive ? {
        backgroundColor: customStyles.bgColor || undefined,
        color: customStyles.textColor || undefined
      } : {},
      titleStyle: !isDarkActive ? {
        color: customStyles.textColor || undefined
      } : {}
    };
  };

  const styles = getVariantStyles();

  return (
    <div className={styles.container} style={styles.containerStyle}>
      {/* Decorative Elements */}
      {variant === 'trending' && !customStyles.bgColor && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-2xl -z-0" />
      )}

      <div className={`flex items-center justify-between ${variant === 'default' ? 'px-4' : 'px-4 md:px-6'} mb-4 relative z-10`}>
        <div className="flex items-center gap-2.5">
          {image ? (
            <img 
              src={getOptimizedImageUrl(image, 100)} 
              className="w-7 h-7 md:w-8 md:h-8 rounded-lg object-cover shadow-sm bg-gray-50 border border-gray-100" 
              alt={title} 
              loading="lazy"
            />
          ) : emoji ? (
            <span className="text-xl md:text-2xl animate-bounce">{emoji}</span>
          ) : styles.headerIcon ? (
            <span className="text-xl md:text-2xl animate-bounce">{styles.headerIcon}</span>
          ) : null}
          <h2 className={styles.title} style={styles.titleStyle}>
            {title}
          </h2>
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className={`text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm transition-all hover:scale-105 ${variant === 'trending' ? 'bg-orange-600 text-white' : 'bg-white text-gray-900 border border-gray-100'}`}>
            VIEW ALL
          </Link>
        )}
      </div>

      {horizontal ? (
        <div className={`overflow-x-auto scrollbar-hide -mx-0 ${variant === 'default' ? 'px-4' : 'px-4 md:px-6'} pb-2 relative z-10`}>
          <div className="flex gap-2 md:gap-4" style={{ width: 'max-content' }}>
            {products.map((p, i) => (
              <div key={p.id} className={`w-[120px] md:w-[155px] transition-all hover:scale-[1.02] overflow-hidden rounded-2xl ${styles.cardWrapper}`}>
                <ProductCard
                  product={p}
                  rank={variant !== 'default' ? i + 1 : null}
                  rankBadgeClass={variant !== 'default' ? styles.badge : ''}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 relative z-10">
          {products.map((p) => (
            <div key={p.id} className={styles.cardWrapper}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
