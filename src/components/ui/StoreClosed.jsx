import { Phone, MessageCircle } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export default function StoreClosed() {
  const storeSettings = useAdminStore((state) => state.storeSettings);
  
  const message = storeSettings?.offlineMessage || 'Shop thodi der ke liye rest pe hai...';
  const showSocial = storeSettings?.showSocialButtons ?? true;
  const whatsapp = storeSettings?.whatsappLink;
  const phone = storeSettings?.supportPhone;
  const animType = storeSettings?.animationType || 'sleepy_night';
  const customGif = storeSettings?.customGifUrl;

  // Render a placeholder or actual image based on selection
  const renderAnimation = () => {
    if (customGif) {
      return <img src={customGif} alt="Store Status" className="w-48 h-48 object-cover rounded-3xl shadow-2xl mb-8" />;
    }
    
    // Map of emoji placeholders for the built-in animations (Ideally replace with Lottie URLs later)
    const animMap = {
      'shutter_down': '🏬',
      'bowing_sorry': '🙇',
      'sleepy_night': '😴',
      'raining_wait': '🌧️',
      'fixing_system': '⚙️',
      'break_coffee': '☕'
    };

    return (
      <div className="w-40 h-40 bg-gray-100 rounded-[3rem] flex items-center justify-center text-6xl shadow-xl mb-8 border-4 border-white">
        {animMap[animType] || '🏬'}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 overflow-y-auto">
      
      {renderAnimation()}

      <h1 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">We're Currently Closed</h1>
      
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 max-w-sm w-full mb-8 relative">
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm shadow-sm border-2 border-white">💬</div>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed font-semibold whitespace-pre-wrap text-left">
          {message}
        </p>
      </div>
      
      {showSocial && (
        <div className="flex items-center gap-4 animate-in slide-in-from-bottom-4">
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-6 py-3 rounded-2xl transition-colors">
              <Phone size={18} /> Call Us
            </a>
          )}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 font-bold px-6 py-3 rounded-2xl transition-colors">
              <MessageCircle size={18} /> WhatsApp
            </a>
          )}
        </div>
      )}


    </div>
  );
}
