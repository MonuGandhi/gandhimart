import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="flex flex-col items-center gap-2 group min-w-[72px]"
    >
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 group-active:scale-95 transition-transform overflow-hidden ${category.color?.startsWith('bg-') ? category.color : ''}`}
        style={!category.color?.startsWith('bg-') ? { backgroundColor: category.color } : {}}
      >
        {category.image ? (
          <img 
            src={getOptimizedImageUrl(category.image, 150)} 
            className="w-full h-full object-cover" 
            alt={category.name} 
            loading="lazy"
            decoding="async"
          />
        ) : (
          category.emoji
        )}
      </div>
      <p className="text-[11px] font-semibold text-gray-700 text-center leading-tight w-full max-w-[76px] px-0.5 line-clamp-2 break-words">
        {category.name}
      </p>
    </Link>
  );
}
