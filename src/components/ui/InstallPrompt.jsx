import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

// Expose a global trigger so Install.jsx can call it directly
export let triggerInstallPrompt = null;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const isInstallPage = window.location.pathname === '/install';

  useEffect(() => {
    // Helper: should we show the prompt?
    const shouldShow = () => {
      // Never show on /install page (redundant)
      if (isInstallPage) return false;
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      return !dismissed;
    };

    // Case 1: event was captured BEFORE React mounted (stored globally)
    if (window.__pwaPrompt) {
      setTimeout(() => setDeferredPrompt(window.__pwaPrompt), 0);
      if (shouldShow()) setTimeout(() => setShowPrompt(true), 0);
    }

    // Case 2: event fires AFTER React mounts (normal flow)
    const onReady = () => {
      if (window.__pwaPrompt) {
        setTimeout(() => setDeferredPrompt(window.__pwaPrompt), 0);
        if (shouldShow()) setTimeout(() => setShowPrompt(true), 0);
      }
    };

    window.addEventListener('pwa-prompt-ready', onReady);
    return () => window.removeEventListener('pwa-prompt-ready', onReady);
  }, [isInstallPage]);

  // Expose trigger so Install page button can fire it
  useEffect(() => {
    triggerInstallPrompt = async () => {
      const prompt = deferredPrompt || window.__pwaPrompt;
      if (!prompt) return false;
      prompt.prompt();
      const outcome = (await prompt.userChoice).outcome;
      window.__pwaPrompt = null;
      setDeferredPrompt(null);
      setShowPrompt(false);
      return outcome === 'accepted';
    };
    return () => { triggerInstallPrompt = null; };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    const prompt = deferredPrompt || window.__pwaPrompt;
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    window.__pwaPrompt = null;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Only save dismissed flag if NOT on install/referral page
    if (!isInstallPage) {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-10 duration-500 pointer-events-none">
      <div className="max-w-md mx-auto bg-gray-900 rounded-[2rem] p-4 sm:p-5 shadow-2xl border border-white/10 flex items-center gap-4 relative pointer-events-auto">
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-gray-800 text-gray-400 hover:text-white rounded-full p-1.5 shadow-lg border border-gray-700 transition-colors"
        >
          <X size={14} />
        </button>

        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-[#1CA672] to-green-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-green-900/50">
          <span className="text-white font-black text-2xl">G</span>
        </div>

        <div className="flex-1">
          <h3 className="text-white font-black leading-tight text-sm sm:text-base">Install G Mart App</h3>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Order groceries in 10 mins!</p>
        </div>

        <button
          onClick={handleInstall}
          className="bg-[#1CA672] hover:bg-[#158F5F] text-white text-xs sm:text-sm font-black px-4 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-[#1CA672]/30 shrink-0 flex items-center gap-2 transition-transform active:scale-95"
        >
          <Download size={16} /> Install
        </button>
      </div>
    </div>
  );
}
