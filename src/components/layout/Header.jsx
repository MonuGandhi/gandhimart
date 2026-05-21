import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Search, ShoppingCart, Zap, Bell, MoreVertical, User, ClipboardList, LogOut, Mic, Sun, Moon, Heart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAppStore } from '../../store/appStore';
import { useNotificationStore } from '../../store/notificationsStore';
import { useAuthStore } from '../../store/authStore';
import { useProducts } from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';
import { useAdminStore } from '../../store/adminStore';
import { useWishlistStore } from '../../store/wishlistStore';

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    window.dispatchEvent(new Event('theme-change'));
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };
  const items = useCartStore((s) => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const clearCart = useCartStore((s) => s.clearCart);
  const { notifications, readIds, deletedIds } = useNotificationStore();
  const { user, logout } = useAuthStore();
  const storeSettings = useAdminStore((s) => s.storeSettings);
  const wishlistItems = useWishlistStore((s) => s.items);
  const totalWishlistItems = wishlistItems.length;

  const visibleNotifications = notifications.filter(
    n => !deletedIds.includes(n.id) && 
         (!n.phone || n.phone === user?.phone) && 
         (!n.email || n.email === user?.email)
  );
  const unreadCount = visibleNotifications.filter(n => !readIds.includes(n.id)).length;
  const location = useAppStore((s) => s.selectedLocation);

  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const moreMenuRef = useRef(null);

  const { products } = useProducts();
  const debouncedQuery = useDebounce(query, 300);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Simple Fuzzy Match Helper
  const isFuzzyMatch = (str, target) => {
    if (!str || !target) return false;
    const s = str.toLowerCase().trim();
    const t = target.toLowerCase().trim();
    
    // 1. Direct match
    if (t.includes(s)) return true;
    
    // 2. Word by word match
    const sWords = s.split(/\s+/);
    const tWords = t.split(/\s+/);
    return sWords.some(sw => tWords.some(tw => {
      if (tw.includes(sw) || sw.includes(tw)) return true;
      // Simple edit distance for small words (allow 1 char mistake)
      if (sw.length > 3 && tw.length > 3) {
        let mistakes = 0;
        const minLen = Math.min(sw.length, tw.length);
        for(let i=0; i<minLen; i++) if(sw[i] !== tw[i]) mistakes++;
        return mistakes <= 1;
      }
      return false;
    }));
  };

  const results = products.filter(p => {
    if (!debouncedQuery) return false;
    return (
      isFuzzyMatch(debouncedQuery, p.name) ||
      isFuzzyMatch(debouncedQuery, p.brand) ||
      (p.tags || []).some(tag => isFuzzyMatch(debouncedQuery, tag))
    );
  }).slice(0, 8);

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice search not supported on this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Prefer Indian English to get "Aloo" instead of "आलू"
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Listening... Speak now!", { id: 'voice-search', icon: '🎤' });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setShowResults(true);
      setIsListening(false);
      toast.success(`Searching for "${transcript}"`, { id: 'voice-search' });
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      console.error("Speech recognition error:", event.error);
      toast.error(`Voice Error: ${event.error}`, { id: 'voice-search' });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      let isOutsideSearch = true;
      if (desktopSearchRef.current && desktopSearchRef.current.contains(e.target)) isOutsideSearch = false;
      if (mobileSearchRef.current && mobileSearchRef.current.contains(e.target)) isOutsideSearch = false;

      if (isOutsideSearch) {
        setShowResults(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearSearch = () => {
    setQuery('');
    setShowResults(false);
  };

  return (
    <header 
      id="main-header" 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'backdrop-blur-xl border-b border-gray-100/50 shadow-sm' 
          : 'backdrop-blur-none border-b border-gray-100/20'
      }`}
      style={{ 
        backgroundColor: isScrolled 
          ? (storeSettings?.headerBgColor ? `${storeSettings.headerBgColor}E6` : 'rgba(255, 255, 255, 0.9)')
          : (storeSettings?.headerBgColor || '#ffffff'),
        color: storeSettings?.headerTextColor || '#111827'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 md:py-3">
        {/* Top Row: Logo & Right Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link 
              to="/" 
              onClick={() => {
                if (pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex items-center gap-1.5 shrink-0 group"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-tr from-[#1CA672] to-green-400 rounded-xl flex items-center justify-center shadow-md shadow-green-200">
                <ShoppingCart size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span 
                  className="text-lg md:text-xl font-black tracking-tighter leading-none"
                  style={{ color: storeSettings?.headerTextColor || '#111827' }}
                >G</span>
                <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-[#1CA672] leading-none">MART</span>
              </div>
            </Link>

            {/* Location Section - Restored */}
            <button className="flex items-start gap-1 shrink-0 border-l border-gray-100 pl-3 md:pl-4">
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] md:text-xs text-gray-500">Delivery in</span>
                  <span className="text-[10px] md:text-xs font-bold text-[#1CA672] flex items-center gap-0.5">
                    <Zap size={10} fill="#1CA672" className="md:w-3 md:h-3" /> 10 mins
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span 
                    className="text-xs md:text-sm font-semibold truncate max-w-[100px] md:max-w-[200px]"
                    style={{ color: storeSettings?.headerTextColor || '#111827' }}
                  >
                    {location}
                  </span>
                  <ChevronDown size={14} style={{ color: storeSettings?.headerTextColor || '#9ca3af' }} />
                </div>
              </div>
            </button>

            {/* Desktop Search - Only on Home */}
            {isHome && (
              <div className="hidden md:flex relative w-[400px] lg:w-[600px]" ref={desktopSearchRef}>
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for groceries, snacks..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                  className="w-full pl-11 pr-12 py-2.5 bg-gray-100 dark:bg-white/5 dark:text-white rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1CA672] dark:focus:ring-[#39FF14] focus:bg-white dark:focus:bg-white/10 transition-all"
                />
                <button 
                  onClick={startVoiceSearch}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-[#1CA672]'}`}
                >
                  <Mic size={18} />
                </button>
                {showResults && query && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[60vh] overflow-y-auto z-[100]">
                    {results.map(p => (
                      <Link key={p.id} to={`/product/${p.id}`} onClick={clearSearch} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                        <img 
                          src={getOptimizedImageUrl(p.image, 100)} 
                          alt={p.name} 
                          className="w-10 h-10 object-contain" 
                          loading="lazy"
                        />
                        <div className="flex-1 truncate">
                          <p className="text-sm font-bold">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.weight} {p.unit}</p>
                        </div>
                        <span className="text-sm font-black">₹{p.price}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 md:gap-3" ref={moreMenuRef}>
            {/* Night Mode Toggle Button */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all ${
                isDark 
                  ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Toggle Night Mode"
              title="Toggle Night Mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Premium Header Wishlist Icon */}
            <button 
              onClick={() => navigate('/wishlist')}
              className="p-2 bg-red-50 text-red-600 rounded-full relative border border-red-100 transition-transform active:scale-90"
              title="My Wishlist"
            >
              <Heart 
                size={20} 
                className={`text-red-500 transition-all duration-300 ${totalWishlistItems > 0 ? 'fill-red-500 animate-heart-pop' : ''}`} 
              />
              {totalWishlistItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {totalWishlistItems}
                </span>
              )}
            </button>

            <button 
              onClick={() => navigate('/notifications')}
              className="p-2 bg-red-50 text-red-600 rounded-full relative border border-red-100"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`p-2 rounded-full border transition-all ${showMoreMenu ? 'bg-gray-200 border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                <MoreVertical size={20} />
              </button>

              {showMoreMenu && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[110]">
                  <button onClick={() => { navigate('/cart'); setShowMoreMenu(false); }} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3"><ShoppingCart size={18} className="text-[#1CA672]" /><span className="text-sm font-bold">My Cart</span></div>
                    {totalItems > 0 && <span className="bg-[#1CA672] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{totalItems}</span>}
                  </button>
                  <button onClick={() => { navigate('/wishlist'); setShowMoreMenu(false); }} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Heart 
                        size={18} 
                        className={`text-red-500 transition-transform ${totalWishlistItems > 0 ? 'fill-red-500 animate-heart-pop' : ''}`} 
                      />
                      <span className="text-sm font-bold">My Wishlist</span>
                    </div>
                    {totalWishlistItems > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{totalWishlistItems}</span>}
                  </button>
                  <button onClick={() => { navigate('/profile'); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <User size={18} className="text-purple-600" /><span className="text-sm font-bold">My Profile</span>
                  </button>
                  <button onClick={() => { navigate('/orders'); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <ClipboardList size={18} className="text-blue-500" /><span className="text-sm font-bold">My Orders</span>
                  </button>
                  <div className="my-1 border-t border-gray-100"></div>
                  <button onClick={() => { 
                    clearCart();
                    logout(); 
                    navigate('/'); 
                    setShowMoreMenu(false); 
                  }} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50">
                    <LogOut size={18} /><span className="text-sm font-bold">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Only on Home, below Top Row */}
        {isHome && (
          <div className="md:hidden mt-2 relative" ref={query ? mobileSearchRef : undefined}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for groceries..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                className="w-full pl-9 pr-10 py-2 bg-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1CA672]"
              />
              <button 
                onClick={startVoiceSearch}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400'}`}
              >
                <Mic size={16} />
              </button>
              {showResults && query && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-[60vh] overflow-y-auto z-[100]">
                  {results.map(p => (
                    <Link key={p.id} to={`/product/${p.id}`} onClick={clearSearch} className="flex items-center gap-3 p-2.5 hover:bg-gray-50">
                      <img src={p.image} alt={p.name} className="w-8 h-8 object-contain" />
                      <div className="flex-1 truncate">
                        <p className="text-xs font-bold truncate">{p.name}</p>
                      </div>
                      <span className="text-xs font-black">₹{p.price}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
