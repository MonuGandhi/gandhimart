import { Truck, CheckCircle } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAdminStore } from '../../store/adminStore';
import { formatPrice } from '../../utils/helpers';

export default function PriceSummary() {
  const computed = useCartStore((s) => s.computed)();
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const adminProducts = useAdminStore((s) => s.adminProducts);

  const rows = [
    { label: 'MRP Total', value: computed.mrpTotal },
    { label: 'Product Discount', value: -computed.productDiscount, green: true },
    ...(appliedCoupon ? [{ label: `Coupon (${appliedCoupon.code})`, value: -computed.couponDiscount, green: true }] : []),
    { label: `Delivery Fee${computed.deliveryFee === 0 ? ' 🎉' : ''}`, value: computed.deliveryFee, free: computed.deliveryFee === 0 },
    { label: 'GST (5%)', value: computed.gst },
  ];

  return (
    <div className="bg-white dark:bg-[#0b0f19] rounded-2xl p-4 border border-gray-100 dark:border-slate-800/80">
      <h3 className="font-bold text-gray-900 dark:text-white mb-3">Price Breakdown</h3>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-slate-400">{row.label}</span>
            {row.free ? (
              <span className="text-[#1CA672] dark:text-[#34d399] font-semibold flex items-center gap-1">
                <Truck size={13} /> FREE
              </span>
            ) : (
              <span className={row.green ? 'text-[#1CA672] dark:text-[#34d399] font-semibold' : 'text-gray-800 dark:text-slate-200 font-medium'}>
                {row.green ? `- ${formatPrice(Math.abs(row.value))}` : formatPrice(row.value)}
              </span>
            )}
          </div>
        ))}

        <div className="border-t border-dashed border-gray-200 dark:border-slate-800/80 pt-2.5 mt-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-white">Grand Total</span>
            <span className="font-black text-lg text-gray-900 dark:text-white">{formatPrice(computed.grandTotal)}</span>
          </div>
        </div>

        {computed.totalSavings > 0 && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl px-3 py-2 flex items-center gap-2 mt-2">
            <CheckCircle size={15} className="text-[#1CA672] dark:text-[#34d399] shrink-0" />
            <p className="text-xs text-[#1CA672] dark:text-[#34d399] font-semibold">
              You save {formatPrice(computed.totalSavings)} on this order 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
