import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Phone, MessageCircle, MapPin } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useAdminStore } from '../../store/adminStore';

export default function Footer() {
  const { categories } = useProducts();
  const storeSettings = useAdminStore((s) => s.storeSettings) || {};
  const storeName = storeSettings.storeName || 'G Mart';
  const storePhone = storeSettings.supportPhone || storeSettings.storePhone || '8607424026';
  const supportEmail = storeSettings.supportEmail || 'monugandhi03@gmail.com';
  const storeAddress = storeSettings.storeAddress || 'Madhosinghana, Sirsa, Haryana';
  const instagramLink = storeSettings.instagramLink || '#';
  const facebookLink = storeSettings.facebookLink || '#';
  const twitterLink = storeSettings.twitterLink || '#';
  const rawLink = storeSettings.whatsappLink || `https://wa.me/91${storeSettings.supportPhone || '8607424026'}`;
  const whatsappMsg = storeSettings.whatsappMessage ? `?text=${encodeURIComponent(storeSettings.whatsappMessage)}` : '';
  const whatsappLink = rawLink.includes('?') ? `${rawLink}${storeSettings.whatsappMessage ? '&text=' + encodeURIComponent(storeSettings.whatsappMessage) : ''}` : `${rawLink}${whatsappMsg}`;
  return (
    <footer className="bg-white border-t border-gray-100 pt-6 pb-24 md:pt-8 md:pb-24 mt-3 md:mt-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mb-8 md:mb-12">
          {/* Brand */}
          <div className="space-y-3 md:space-y-4">
            <Link to="/" className="flex items-center gap-2 mb-3 md:mb-4 group">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-[#1CA672] to-green-400 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-green-200 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-sm md:text-xl">G</span>
              </div>
              <span className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{storeName}</span>
            </Link>
            <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-xs">
              Bringing fresh groceries, vegetables, and daily essentials directly to your village within minutes.
            </p>
            <div className="flex gap-3">
              <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 bg-pink-50 rounded-full text-[#E4405F] hover:bg-[#E4405F] hover:text-white transition-all duration-300 shadow-sm"><Instagram size={16} /></a>
              <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 bg-blue-50 rounded-full text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all duration-300 shadow-sm"><Facebook size={16} /></a>
              <a href={twitterLink} target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 bg-sky-50 rounded-full text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white transition-all duration-300 shadow-sm"><Twitter size={16} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black text-gray-900 mb-3 md:mb-6 uppercase text-[10px] md:text-xs tracking-widest">Quick Links</h4>
            <ul className="space-y-2 md:space-y-4">
              <li><Link to="/" className="text-xs md:text-sm text-gray-500 hover:text-[#1CA672] font-medium transition-colors">Home</Link></li>
              <li><Link to="/orders" className="text-xs md:text-sm text-gray-500 hover:text-[#1CA672] font-medium transition-colors">My Orders</Link></li>
              <li><Link to="/profile" className="text-xs md:text-sm text-gray-500 hover:text-[#1CA672] font-medium transition-colors">My Wallet</Link></li>
              <li><Link to="/profile" className="text-xs md:text-sm text-gray-500 hover:text-[#1CA672] font-medium transition-colors">Profile Settings</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-black text-gray-900 mb-3 md:mb-6 uppercase text-[10px] md:text-xs tracking-widest">Categories</h4>
            <ul className="space-y-2 md:space-y-4 text-xs md:text-sm text-gray-500 font-medium">
              {categories && categories.length > 0 ? categories.slice(0, 5).map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`} className="hover:text-[#1CA672] transition-colors">
                    {cat.name}
                  </Link>
                </li>
              )) : (
                <>
                  <li>Fresh Vegetables</li>
                  <li>Daily Fruits</li>
                  <li>Dairy & Bakery</li>
                  <li>Snacks & Drinks</li>
                </>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-black text-gray-900 mb-3 md:mb-6 uppercase text-[10px] md:text-xs tracking-widest">Contact Us</h4>
            <ul className="space-y-2 md:space-y-4">
              <li className="flex items-start gap-2 text-xs md:text-sm text-gray-500 font-medium">
                <MapPin size={16} className="shrink-0 text-gray-400 mt-0.5" />
                <span>{storeAddress}</span>
              </li>
              <li className="flex items-center gap-2 text-xs md:text-sm text-gray-500 font-medium">
                <Phone size={16} className="shrink-0 text-gray-400" />
                <a href={`tel:+91${storePhone}`} className="hover:text-[#1CA672] transition-colors">+91 {storePhone}</a>
              </li>
              <li className="flex items-center gap-2 text-xs md:text-sm text-gray-500 font-medium">
                <MessageCircle size={16} className="shrink-0 text-gray-400" />
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-[#1CA672] transition-colors">WhatsApp Support</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400 font-medium">
            © 2026 {storeName} • Built for Madhosinghana
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-[10px] text-gray-400 font-black uppercase hover:text-[#1CA672] transition-colors">Privacy</Link>
            <Link to="/terms" className="text-[10px] text-gray-400 font-black uppercase hover:text-[#1CA672] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
