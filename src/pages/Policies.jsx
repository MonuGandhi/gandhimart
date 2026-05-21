import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAdminStore } from '../store/adminStore';

export default function Policies() {
  const navigate = useNavigate();
  const location = useLocation();
  const isTerms = location.pathname === '/terms';
  const storeSettings = useAdminStore((s) => s.storeSettings) || {};
  const supportEmail = storeSettings.supportEmail || 'monugandhi03@gmail.com';
  const supportPhone = storeSettings.supportPhone || '8607424026';

  const sections = isTerms ? [
    {
      title: "1. Order & Delivery",
      content: "GandhiMart delivers groceries within 10-15 minutes in Madhosinghana. Delivery times may vary during peak hours or bad weather."
    },
    {
      title: "2. Cancellation Policy",
      content: "Orders can be cancelled within 3 minutes of placement. Once an order is confirmed by the store, it cannot be cancelled or refunded."
    },
    {
      title: "3. Payments & Refunds",
      content: "We accept Cash on Delivery and UPI. All refunds for cancelled orders or failed payments will be credited to your G Mart Wallet within 24 hours."
    },
    {
      title: "4. Returns",
      content: "Items can only be returned at the time of delivery if they are damaged or incorrect. Please check your items before the delivery partner leaves."
    }
  ] : [
    {
      title: "1. Information We Collect",
      content: "We collect your Name, Phone Number, and Delivery Address to process your orders. We also use your email for account recovery and notifications."
    },
    {
      title: "2. How We Use Data",
      content: "Your data is used solely for delivering your groceries and improving your shopping experience. We never sell or share your data with 3rd party marketing agencies."
    },
    {
      title: "3. Wallet Security",
      content: "Your wallet balance is securely stored in our encrypted database and is linked to your verified account. Only you can use your balance for purchases."
    },
    {
      title: "4. Contact Us",
      content: `If you have any questions regarding your privacy, please contact us at ${supportEmail}.`
    }
  ];

  return (
    <Layout>
      <div className="bg-[#f8f9fa] min-h-screen pb-20">
        {/* Header */}
        <div className="bg-white px-4 py-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-20">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            {isTerms ? 'Terms of Service' : 'Privacy Policy'}
          </h1>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-4">
          {/* Main Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
              {isTerms ? <FileText size={32} className="text-[#1CA672]" /> : <ShieldCheck size={32} className="text-[#1CA672]" />}
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
              {isTerms ? 'Our Rules & Regulations' : 'Your Data is Safe'}
            </h2>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-8">Last Updated: April 2026</p>

            <div className="space-y-8">
              {sections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <span className="text-[#1CA672] text-xs">●</span> {section.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium pl-5">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-gray-900 rounded-3xl p-6 text-white">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Still have questions?</p>
            <button 
              onClick={() => window.open(`tel:+91${supportPhone}`)}
              className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl flex items-center justify-between px-6 transition-all group"
            >
              <span className="font-black text-sm">Call Support</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
