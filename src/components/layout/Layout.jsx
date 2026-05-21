import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import Footer from './Footer';
import { useCartStore } from '../../store/cartStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '../../utils/helpers';
import { useAdminStore } from '../../store/adminStore';
import FloatingProgressCart from '../cart/FloatingProgressCart';

function DraggableCart({ totalItems, grandTotal }) {
  const navigate = useNavigate();
  const savedPos = JSON.parse(localStorage.getItem('gmart_cart_pos') || 'null');
  const [pos, setPos] = useState(savedPos || { x: window.innerWidth - 90, y: window.innerHeight - 160 });
  const dragging = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const btnRef = useRef(null);

  const onPointerDown = (e) => {
    dragging.current = true;
    moved.current = false;
    startPointer.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...pos };
    btnRef.current?.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPointer.current.x;
    const dy = e.clientY - startPointer.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true;
    const newX = Math.min(Math.max(0, startPos.current.x + dx), window.innerWidth - 90);
    const newY = Math.min(Math.max(0, startPos.current.y + dy), window.innerHeight - 70);
    setPos({ x: newX, y: newY });
  };

  const onPointerUp = () => {
    dragging.current = false;
    localStorage.setItem('gmart_cart_pos', JSON.stringify(pos));
    if (!moved.current) navigate('/cart');
  };

  return (
    <div
      ref={btnRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
      className="fixed z-[45] cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-center gap-3 bg-[#1CA672] text-white pl-4 pr-2 py-2.5 rounded-2xl shadow-[0_20px_40px_rgba(28,166,114,0.4)] border border-white/10 transition-shadow active:shadow-lg backdrop-blur-md">
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{totalItems} ITEMS</span>
          <span className="text-sm font-black">{formatPrice(grandTotal)}</span>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <ShoppingCart size={20} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children, hideHeader = false, hideBottomNav = false }) {
  const items = useCartStore((s) => s.items);
  const computed = useCartStore((s) => s.computed)();
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const location = useLocation();
  const [headerHeight, setHeaderHeight] = useState(0);
  const storeSettings = useAdminStore((s) => s.storeSettings) || {};
  const freeDeliveryAbove = Number(storeSettings?.freeDeliveryAbove) || 0;

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerEl = document.getElementById('main-header');
      if (headerEl) {
        setHeaderHeight(headerEl.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [location.pathname, hideHeader]);

  const hideCartPaths = ['/cart', '/checkout', '/order-success', '/order/', '/orders', '/profile', '/admin', '/install', '/wishlist'];
  const isHidePath = hideCartPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  const shouldHideCart = isHidePath || hideHeader || hideBottomNav;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!hideHeader && <Header />}
      <main
        className={`flex-1 max-w-7xl mx-auto w-full ${location.pathname === '/' ? 'pb-0' : 'pb-16'}`}
        style={{ paddingTop: !hideHeader && headerHeight ? `${headerHeight}px` : undefined }}
      >
        {children}
      </main>
      {location.pathname === '/' && <Footer />}
      {!hideBottomNav && <BottomNav />}
      {/* Dynamic Cart / Progress Toggle */}
      {totalItems > 0 && !shouldHideCart && (
        freeDeliveryAbove > 0 ? (
          <FloatingProgressCart />
        ) : (
          <DraggableCart totalItems={totalItems} grandTotal={computed.grandTotal} />
        )
      )}
    </div>
  );
}
