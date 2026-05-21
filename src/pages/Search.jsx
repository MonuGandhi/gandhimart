import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X, Clock, TrendingUp } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/ui/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useDebounce } from '../hooks/useDebounce';
import { useAppStore } from '../store/appStore';

const TRENDING_SEARCHES = ['Onion', 'Tomato', 'Milk', 'Bread', 'Eggs'];

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  
  const { searchProducts } = useProducts();
  const debouncedQuery = useDebounce(query, 300);
  
  const recentSearches = useAppStore((s) => s.recentSearches);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);
  const removeRecentSearch = useAppStore((s) => s.removeRecentSearch);
  const clearRecentSearches = useAppStore((s) => s.clearRecentSearches);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = debouncedQuery ? searchProducts(debouncedQuery) : [];

  const handleSearch = (term) => {
    setQuery(term);
    if (term.trim()) {
      addRecentSearch(term);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  return (
    <Layout>
      {/* Search Input Bar */}
      <div className="sticky top-[60px] md:top-[72px] z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 shrink-0">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for groceries, veggies, snacks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1CA672] focus:bg-white transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {!query ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" /> Recent Searches
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs font-semibold text-[#1CA672]"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                    >
                      <button
                        onClick={() => handleSearch(term)}
                        className="text-sm text-gray-600 font-medium"
                      >
                        {term}
                      </button>
                      <button
                        onClick={() => removeRecentSearch(term)}
                        className="text-gray-400 hover:text-gray-600 ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-[#FF6B35]" /> Trending Now
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="bg-orange-50 text-[#FF6B35] border border-orange-100 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-orange-100 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Results */
          <div>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <SearchIcon size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No results found</h3>
                <p className="text-sm text-gray-500">We couldn't find anything for "{query}"</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                  Found {results.length} results
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {results.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
