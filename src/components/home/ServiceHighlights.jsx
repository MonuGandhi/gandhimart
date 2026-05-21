import { ShieldCheck, Clock, Utensils } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export default function ServiceHighlights() {
  const deliveryTime = useAdminStore((s) => s.storeSettings?.estimatedDeliveryTime || 10);
  
  const highlights = [
    {
      icon: Clock,
      colorClass: "text-orange-500",
      bg: 'bg-orange-50',
      title: `${deliveryTime}-Minute Delivery`,
      desc: "Get your groceries in a flash"
    },
    {
      icon: ShieldCheck,
      colorClass: "text-blue-500",
      bg: 'bg-blue-50',
      title: "Best Prices & Offers",
      desc: "Cheaper than your local store"
    },
    {
      icon: Utensils,
      colorClass: "text-green-500",
      bg: 'bg-green-50',
      title: "Wide Assortment",
      desc: "Choose from 5000+ products"
    }
  ];

  return (
    <div className="bg-white border-y border-gray-100 py-4 md:py-6 mt-3 md:mt-4">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {highlights.map((h, i) => {
          const IconComponent = h.icon;
          return (
            <div key={i} className="flex items-center gap-3 md:gap-4 group cursor-default">
              <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${h.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/60`}>
                <IconComponent className={`${h.colorClass} w-5 h-5 md:w-7 md:h-7`} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-[13px] md:text-base leading-snug">{h.title}</h3>
                <p className="text-[11px] md:text-sm text-gray-500 font-bold mt-0.5">{h.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
