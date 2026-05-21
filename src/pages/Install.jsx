import { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, ArrowRight, CheckCircle2, AlertCircle, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useSearchParams } from 'react-router-dom';

export default function Install() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');

  const [isStandalone] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }
    return false;
  });
  
  const [canInstall, setCanInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Platform Detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isInApp = /FBAN|FBAV|Instagram|WhatsApp|Line|Trill|Twitter/i.test(navigator.userAgent);
  const isSafari = isIOS && !/CriOS/i.test(navigator.userAgent) && !/FxiOS/i.test(navigator.userAgent);

  useEffect(() => {
    // Save referral code if present
    if (ref) {
      localStorage.setItem('gmart_referral_code', ref);
      console.log('Referral code saved:', ref);
    }

    // Check if native install prompt is available
    if (window.__pwaPrompt) {
      setTimeout(() => setCanInstall(true), 0);
    }

    const onReady = () => setCanInstall(true);
    window.addEventListener('pwa-prompt-ready', onReady);
    return () => window.removeEventListener('pwa-prompt-ready', onReady);
  }, [ref]);

  const handleInstall = async () => {
    if (isIOS) {
      if (isInApp) {
        // Show instruction to open in Safari
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      } else {
        setShowIOSGuide(true);
      }
      return;
    }

    const prompt = window.__pwaPrompt;
    if (!prompt) {
      // If no prompt but on Android, maybe they are in-app
      if (isAndroid && isInApp) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
      return;
    }

    setInstalling(true);
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      window.__pwaPrompt = null;
      setCanInstall(false);
      if (outcome === 'accepted') {
        setInstalled(true);
      }
    } catch (e) {
      console.error('Install failed', e);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Layout hideHeader hideBottomNav>
      <div className="min-h-screen bg-white flex flex-col items-center px-6 py-12 relative overflow-hidden">
        
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center w-full max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-[#1CA672] to-[#0a4d35] rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-green-500/30 transform hover:scale-105 transition-transform duration-500">
            <span className="text-5xl font-black text-white tracking-tighter">G</span>
          </div>

          <h1 className="text-3xl font-black text-gray-900 text-center mb-3 tracking-tight">
            Install G Mart App
          </h1>
          <p className="text-gray-500 text-center mb-10 font-medium leading-relaxed px-4">
            Get groceries in <span className="text-[#1CA672] font-bold">10 mins</span> & unlock referral rewards! 🎁
          </p>

          {isStandalone || installed ? (
            <div className="bg-green-50 border-2 border-green-100 rounded-[2.5rem] p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-500 shadow-xl shadow-green-500/5 w-full">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 size={48} className="text-[#1CA672]" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">App Ready! 🎉</h2>
              <p className="text-sm text-gray-600 mb-8 font-medium">
                Aapka swagat hai! You are ready to start shopping.
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-[#1CA672] text-white font-black py-5 rounded-2xl shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
              >
                Go to Shop <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <div className="w-full space-y-6">
              
              {/* Primary Dynamic Button */}
              <button
                onClick={handleInstall}
                disabled={installing}
                className={`w-full bg-[#1CA672] text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-green-500/30 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all disabled:opacity-70 group`}
              >
                {installing ? (
                  <span className="flex items-center gap-3 py-1">
                    <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Installing...
                  </span>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-lg">
                      <Download size={22} className="group-hover:bounce" />
                      {isIOS ? (isInApp ? 'Open in Safari' : 'Install on iPhone') : 'Install Now'}
                    </div>
                    <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold">
                      {isIOS ? 'Takes 20 seconds' : '1-Tap Installation'}
                    </span>
                  </>
                )}
              </button>

              {/* In-App Browser Warning */}
              {isInApp && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 animate-pulse">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-[11px] font-bold text-amber-800 leading-tight">
                    WhatsApp/Instagram browser detect hua hai. <br/>
                    Install karne ke liye <span className="underline">Safari (iOS)</span> ya <span className="underline">Chrome (Android)</span> mein open karein.
                  </p>
                </div>
              )}

              {/* Steps/Info */}
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3 text-gray-300 px-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Manual Steps</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* iOS Instructions */}
                {(isIOS || (!isIOS && !isAndroid)) && (
                  <div className={`bg-gray-50 rounded-[2rem] p-6 border border-gray-100 ${isIOS && isSafari ? 'border-[#1CA672]/30 bg-green-50/30 ring-4 ring-green-500/5' : ''}`}>
                    <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                      <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                        {isIOS ? '1' : 'A'}
                      </span>
                      For iPhone Users
                    </h3>
                    <div className="space-y-4 text-xs font-bold text-gray-600">
                      <p className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <Share size={16} />
                        </div>
                        <span>Tap the <span className="text-gray-900 font-black">Share</span> icon in Safari's bottom toolbar.</span>
                      </p>
                      <p className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gray-200 text-gray-900 rounded-xl flex items-center justify-center shrink-0">
                          <PlusSquare size={16} />
                        </div>
                        <span>Scroll down and select <span className="text-gray-900 font-black">'Add to Home Screen'</span>.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Android Instructions */}
                {(isAndroid || (!isIOS && !isAndroid)) && (
                  <div className={`bg-gray-50 rounded-[2rem] p-6 border border-gray-100 ${isAndroid && !canInstall ? 'border-[#1CA672]/30 bg-green-50/30' : ''}`}>
                    <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                      <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                        {isAndroid ? '1' : 'B'}
                      </span>
                      For Android Users
                    </h3>
                    <div className="space-y-4 text-xs font-bold text-gray-600">
                      <p className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gray-200 text-gray-900 rounded-xl flex items-center justify-center shrink-0 font-black">⋮</div>
                        <span>Tap the <span className="text-gray-900 font-black">three dots (⋮)</span> in Chrome browser.</span>
                      </p>
                      <p className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-green-100 text-[#1CA672] rounded-xl flex items-center justify-center shrink-0">
                          <Download size={16} />
                        </div>
                        <span>Select <span className="text-gray-900 font-black">'Install App'</span> or 'Add to Home Screen'.</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full text-[#1CA672] font-black text-[10px] uppercase tracking-widest py-2 hover:opacity-70 transition-opacity"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full text-gray-400 font-black py-2 text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                  Skip & Use Website
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-12 pb-6 text-center w-full max-w-md relative z-10">
          <div className="h-px bg-gray-100 w-full mb-6" />
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
            G Mart Premium Experience
          </p>
        </div>

        {/* iOS Guide Overlay */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 sm:items-center animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowIOSGuide(false)} />
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
              
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Share size={32} />
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 mb-2">Final Step! 🚀</h2>
              <p className="text-sm text-gray-500 font-medium mb-8">
                Install karne ke liye ye 2 steps karein:
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">1</div>
                  <p className="text-sm font-bold text-gray-700">
                    Bottom menu mein <span className="text-blue-600 font-black">'Share'</span> icon par tap karein.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">2</div>
                  <p className="text-sm font-bold text-gray-700">
                    Niche scroll karke <span className="text-gray-900 font-black">'Add to Home Screen'</span> select karein.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl active:scale-95 transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
