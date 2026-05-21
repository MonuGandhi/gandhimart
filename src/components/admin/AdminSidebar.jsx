import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FolderTree, ShoppingBag, TicketPercent, Users, Settings, LogOut, Image as ImageIcon, Bell, Palette, Power, Star, LayoutGrid, Gift } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Store Status', path: '/admin/store-status', icon: Power },
  { name: 'Home Page', path: '/admin/layout', icon: LayoutGrid },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Categories', path: '/admin/categories', icon: FolderTree },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Coupons', path: '/admin/coupons', icon: TicketPercent },
  { name: 'Special Offers', path: '/admin/special-offers', icon: Gift },
  { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell },
  { name: 'Reviews', path: '/admin/reviews', icon: Star },
  { name: 'Staff & Users', path: '/admin/customers', icon: Users },
  { name: 'Appearance', path: '/admin/appearance', icon: Palette },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ onClose, isProAdmin }) {
  const logout = useAdminStore((state) => state.logout);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <span className="text-[#1CA672]">G</span> Mart
        </h2>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Admin Panel</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // Only show Staff & Users for Pro Admin
          if (item.name === 'Staff & Users' && !isProAdmin) return null;
          
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#1CA672] text-white shadow-lg shadow-[#1CA672]/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={20} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => { logout(); onClose(); }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors w-full"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}
