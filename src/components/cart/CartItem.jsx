import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../utils/helpers';

export default function CartItem({ item }) {
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 dark:border-slate-800/80 last:border-0">
      <img
        src={item.image}
        alt={item.name}
        className="w-12 h-12 rounded-lg object-cover border border-gray-100 dark:border-slate-800/80 shrink-0"
        onError={(e) => { e.target.src = `https://picsum.photos/seed/${item.id}/200/200`; }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 dark:text-slate-400 leading-none">{item.brand}</p>
        <h4 className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-snug truncate mt-0.5">{item.name}</h4>
        <p className="text-[10px] text-gray-400 dark:text-slate-400">{item.weight} {item.unit}</p>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.qty)}</span>
            {item.isFlashSale && (
              <span className="bg-red-500 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded leading-none flex items-center gap-0.5 animate-pulse shrink-0">
                ⚡ FLASH
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => removeItem(item.itemId)}
              className="p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
            >
              <Trash2 size={12} />
            </button>
            <div className="flex items-center gap-0.5 border border-[#1CA672] dark:border-[#34d399]/40 rounded-lg px-1 py-0.5">
              <button
                onClick={() => updateQty(item.itemId, item.qty - 1)}
                className="text-[#1CA672] dark:text-[#34d399] p-0.5 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-md"
              >
                <Minus size={11} />
              </button>
              <span className="text-xs font-bold text-gray-900 dark:text-white w-4 text-center">{item.qty}</span>
              <button
                onClick={() => updateQty(item.itemId, item.qty + 1)}
                className="text-[#1CA672] dark:text-[#34d399] p-0.5 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-md"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
