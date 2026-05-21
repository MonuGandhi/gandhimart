import { Link } from 'react-router-dom';
import CategoryCard from '../ui/CategoryCard';

export default function CategoryRow({ categories }) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-base font-bold text-gray-900">Shop by Category</h2>
        <Link to="/category/fruits-vegetables" className="text-xs text-[#1CA672] font-semibold">
          See all
        </Link>
      </div>
      <div className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-2.5 px-0.5">
          {categories.map((cat) => (
            <div key={cat.id} className="shrink-0">
              <CategoryCard category={cat} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
