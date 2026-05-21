import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import Layout from '../components/layout/Layout';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');

  useEffect(() => {
    if (!orderId) {
      navigate('/', { replace: true });
      return;
    }

    // Launch Confetti (Fast & Quick fading)
    const count = 120;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 1000,
      ticks: 70,       // Disappear much quicker (about 1.1s instead of 3.3s)
      gravity: 1.6,    // Fall down faster (1.6 instead of 1.0)
      decay: 0.88      // Slow down and fade out faster
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.85,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.86,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [orderId, navigate]);

  if (!orderId) return null;

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-20">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle size={48} className="text-[#1CA672]" />
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 text-center mb-2">Order Placed!</h1>
        <p className="text-gray-500 text-center mb-8 px-4">
          Your order <span className="font-bold text-gray-800">{orderId}</span> has been confirmed and is being packed.
        </p>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 w-full max-w-sm shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
              <Package size={20} className="text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Estimated Delivery</p>
              <p className="text-sm font-bold text-gray-900">10 - 15 Minutes</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => navigate(`/order/${orderId}`)}
            className="w-full bg-[#1CA672] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#17905F] transition-colors"
          >
            Track Order <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </Layout>
  );
}
