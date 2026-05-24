import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, ShoppingCart, User, Heart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/wishlist', icon: Heart, label: 'Wishlist' },
  { path: '/cart', icon: ShoppingCart, label: 'Cart' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const items = useCartStore((s) => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const wishlistItems = useWishlistStore((s) => s.items);
  const totalWishlistItems = wishlistItems.length;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-50 safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = pathname === path || (path !== '/' && pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => {
                if (path === '/' && pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                active ? 'text-[#1CA672]' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className={label === 'Wishlist' && active ? 'text-red-500 fill-red-500 animate-heart-pop' : ''} />
                {label === 'Cart' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF6B35] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
                {label === 'Wishlist' && totalWishlistItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-heart-pop">
                    {totalWishlistItems}
                  </span>
                )}
              </div>
               <span className={`text-[10px] font-medium ${active ? 'text-[#1CA672] dark:text-[#39FF14]' : 'text-gray-400 dark:text-gray-500'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
