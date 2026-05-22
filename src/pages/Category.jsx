import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, ChevronDown } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/ui/ProductCard';
import { useProducts } from '../hooks/useProducts';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Highest Discount' },
];

export default function Category() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { categories, getProductsByCategorySlug } = useProducts();

  const category = categories.find((c) => c.slug === slug);
  const allProducts = getProductsByCategorySlug(slug);

  const [sort, setSort] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const maxCategoryPrice = useMemo(() => {
    if (allProducts.length === 0) return 500;
    const prices = allProducts.map((p) => p.price || 0);
    const maxVal = Math.max(...prices);
    return maxVal > 500 ? Math.ceil(maxVal / 10) * 10 : 500;
  }, [allProducts]);

  const [maxPrice, setMaxPrice] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [showSort, setShowSort] = useState(false);

  const brands = useMemo(() => [...new Set(allProducts.map((p) => p.brand))], [allProducts]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  const currentMaxPrice = maxPrice !== null ? maxPrice : maxCategoryPrice;

  const filtered = useMemo(() => {
    let result = allProducts.filter((p) => p.price <= currentMaxPrice);
    if (minRating > 0) result = result.filter((p) => p.rating >= minRating);
    if (selectedBrands.length > 0) result = result.filter((p) => selectedBrands.includes(p.brand));

    switch (sort) {
      case 'price_asc': return [...result].sort((a, b) => a.price - b.price);
      case 'price_desc': return [...result].sort((a, b) => b.price - a.price);
      case 'rating': return [...result].sort((a, b) => b.rating - a.rating);
      case 'discount': return [...result].sort((a, b) => b.discount - a.discount);
      default: return result;
    }
  }, [allProducts, sort, currentMaxPrice, minRating, selectedBrands]);

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  if (!category) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-lg font-bold">Category not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-[#1CA672] font-semibold">
            Go Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Category Sub-Header */}
      <div className="sticky top-[72px] md:top-[84px] z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100">
            {category.image ? (
              <img src={category.image} className="w-full h-full object-cover" alt={category.name} />
            ) : (
              <span className="text-2xl">{category.emoji}</span>
            )}
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">{category.name}</h1>
            <p className="text-xs text-gray-400">{filtered.length} products</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl"
          >
            Sort <ChevronDown size={13} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
              showFilters ? 'bg-[#1CA672] text-white border-[#1CA672]' : 'text-gray-600 border-gray-200'
            }`}
          >
            <SlidersHorizontal size={13} /> Filter
          </button>
        </div>
      </div>

      {/* Sort dropdown */}
      {showSort && (
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSort(opt.value); setShowSort(false); }}
                className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  sort === opt.value
                    ? 'bg-[#1CA672] text-white border-[#1CA672]'
                    : 'text-gray-600 border-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilters && (
          <aside className="w-44 shrink-0 bg-white border-r border-gray-100 min-h-screen p-3 sticky top-[130px] md:top-[140px] self-start">
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Filters</h3>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Max Price: ₹{currentMaxPrice}</p>
              <input
                type="range"
                min={10} max={maxCategoryPrice} step={10}
                value={currentMaxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#1CA672]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>₹10</span><span>₹{maxCategoryPrice}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Min Rating</p>
              {[4.5, 4, 3.5, 0].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`block w-full text-left text-xs px-2 py-1 rounded-lg mb-1 transition-colors ${
                    minRating === r ? 'bg-[#1CA672] text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {r === 0 ? 'All' : `${r}★ & above`}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Brand</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {brands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      className="accent-[#1CA672]"
                    />
                    {brand}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setMaxPrice(null); setMinRating(0); setSelectedBrands([]); }}
              className="mt-4 w-full text-xs text-[#1CA672] font-semibold py-1"
            >
              Clear All
            </button>
          </aside>
        )}

        {/* Products Grid */}
        <div className="flex-1 p-3 md:p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-4xl mb-3">😕</p>
              <p className="font-semibold text-gray-600">No products found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className={`grid gap-3 md:gap-6 ${showFilters ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
