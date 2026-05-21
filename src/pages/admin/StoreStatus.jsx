import { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import toast from 'react-hot-toast';
import { Power, CheckCircle2, XCircle, Image as ImageIcon, Save } from 'lucide-react';

const ANIMATIONS = [
  { id: 'shutter_down', label: 'SHUTTER DOWN' },
  { id: 'bowing_sorry', label: 'BOWING SORRY' },
  { id: 'sleepy_night', label: 'SLEEPY / NIGHT' },
  { id: 'raining_wait', label: 'RAINING / WAIT' },
  { id: 'fixing_system', label: 'FIXING/SYSTEM' },
  { id: 'break_coffee', label: 'BREAK/COFFEE' },
];

export default function StoreStatus() {
  const storeSettings = useAdminStore((state) => state.storeSettings);
  const updateSettings = useAdminStore((state) => state.updateSettings);

  const [formData, setFormData] = useState({
    isStoreOpen: storeSettings.isStoreOpen ?? true,
    offlineMessage: storeSettings.offlineMessage || '',
    showSocialButtons: storeSettings.showSocialButtons ?? true,
    whatsappLink: storeSettings.whatsappLink || '',
    supportPhone: storeSettings.supportPhone || '',
    animationType: storeSettings.animationType || 'sleepy_night',
    customGifUrl: storeSettings.customGifUrl || '',
    isPreOrderMode: storeSettings.isPreOrderMode ?? false,
    launchDateText: storeSettings.launchDateText || '15 July',
    preOrderMessage: storeSettings.preOrderMessage || '🛒 Ordering starts on 15 July! Explore G Mart catalog until then! 🎉'
  });

  // Sync with store settings when they load or change
  useEffect(() => {
    if (storeSettings) {
      setTimeout(() => {
        setFormData({
        isStoreOpen: storeSettings.isStoreOpen ?? true,
        offlineMessage: storeSettings.offlineMessage || '🌙 Aaj ke liye shop band ho gayi hai!\n\nHum kal subah 7 baje se phir ready honge aapki service ke liye. 😊\n\nKoi zaruri order hai? Hume WhatsApp karein, hum try karenge! 💚',
        showSocialButtons: storeSettings.showSocialButtons ?? true,
        whatsappLink: storeSettings.whatsappLink || 'https://wa.me/918607424026',
        supportPhone: storeSettings.supportPhone || '8607424026',
        animationType: storeSettings.animationType || 'sleepy_night',
        customGifUrl: storeSettings.customGifUrl || '',
        isPreOrderMode: storeSettings.isPreOrderMode ?? false,
        launchDateText: storeSettings.launchDateText || '15 July',
        preOrderMessage: storeSettings.preOrderMessage || '🛒 Ordering starts on 15 July! Explore G Mart catalog until then! 🎉'
        });
      }, 0);
    }
  }, [storeSettings]);

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      toast.success('App status saved successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save status');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Status Bar */}
      <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${formData.isStoreOpen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            <Power size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Current App Status</p>
            <h1 className={`text-3xl font-black italic tracking-tight ${formData.isStoreOpen ? 'text-green-500' : 'text-red-500'}`}>
              {formData.isStoreOpen ? 'STORE IS OPEN (LIVE)' : 'STORE IS CLOSED (OFFLINE)'}
            </h1>
          </div>
        </div>

        <div className="flex bg-[#1F2937] p-2 rounded-2xl border border-gray-700 w-full md:w-auto">
          <button 
            onClick={() => setFormData({...formData, isStoreOpen: true})}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${formData.isStoreOpen ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white'}`}
          >
            <CheckCircle2 size={18} /> OPEN
          </button>
          <button 
            onClick={() => setFormData({...formData, isStoreOpen: false})}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${!formData.isStoreOpen ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'}`}
          >
            <XCircle size={18} /> CLOSED
          </button>
        </div>
      </div>

      {/* Catalog Mode Control Box */}
      <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${formData.isPreOrderMode ? 'bg-purple-500/10 text-purple-400 animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
            <span className="text-3xl">🚀</span>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Pre-Launch / Catalog Only Mode</p>
            <h2 className={`text-2xl font-black tracking-tight ${formData.isPreOrderMode ? 'text-purple-400' : 'text-gray-400'}`}>
              {formData.isPreOrderMode ? 'CATALOG ONLY ACTIVE (ORDERING BLOCKED)' : 'NORMAL MODE (ORDERING ALLOWED)'}
            </h2>
            <p className="text-gray-500 text-xs mt-1 font-medium">If active, customers can browse products normally, but checkout & placement of orders will be blocked with a customized launch date banner & popup.</p>
          </div>
        </div>

        <div className="flex bg-[#1F2937] p-2 rounded-2xl border border-gray-700 w-full md:w-auto shrink-0">
          <button 
            onClick={() => setFormData({...formData, isPreOrderMode: false})}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${!formData.isPreOrderMode ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white'}`}
          >
            ORDER ALLOWED
          </button>
          <button 
            onClick={() => setFormData({...formData, isPreOrderMode: true})}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${formData.isPreOrderMode ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'}`}
          >
            BLOCK ORDERING
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Settings */}
        <div className="space-y-6">
          <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800 shadow-xl space-y-6">
            
            {formData.isPreOrderMode && (
              <div className="space-y-4 border border-purple-500/20 p-4 rounded-2xl bg-purple-500/5 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-purple-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
                  <span>📅</span> Configure Pre-Launch Message
                </h4>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Launch Date Text</label>
                  <input 
                    type="text" 
                    value={formData.launchDateText}
                    onChange={(e) => setFormData({...formData, launchDateText: e.target.value})}
                    placeholder="e.g. 15 July"
                    className="w-full bg-[#1F2937] border border-gray-700 text-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pre-Launch Custom Message (Customer Popup)</label>
                  <textarea 
                    value={formData.preOrderMessage}
                    onChange={(e) => setFormData({...formData, preOrderMessage: e.target.value})}
                    placeholder="e.g. G Mart is launching soon! Ordering starts on 15 July..."
                    className="w-full h-24 bg-[#1F2937] border border-gray-700 text-gray-200 rounded-xl p-3.5 focus:outline-none focus:border-purple-500 resize-none text-sm font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <h3 className="flex items-center gap-2 text-white font-bold text-lg mb-4">
                <span className="text-purple-400">📄</span> Offline Mode Message (When closed)
              </h3>
              <textarea 
                value={formData.offlineMessage}
                onChange={(e) => setFormData({...formData, offlineMessage: e.target.value})}
                className="w-full h-32 bg-[#1F2937] border border-gray-700 text-gray-200 rounded-2xl p-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none font-medium text-sm"
                placeholder="Write your custom offline message here..."
              />
            </div>

            <div className="h-px bg-gray-800 w-full" />

            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Show Social Buttons</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.showSocialButtons}
                  onChange={(e) => setFormData({...formData, showSocialButtons: e.target.checked})}
                />
                <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            {formData.showSocialButtons && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">WhatsApp Link</label>
                  <input 
                    type="text" 
                    value={formData.whatsappLink}
                    onChange={(e) => setFormData({...formData, whatsappLink: e.target.value})}
                    placeholder="https://wa.me/91XXXXXXXXXX"
                    className="w-full bg-[#1F2937] border border-gray-700 text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Support Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({...formData, supportPhone: e.target.value})}
                    className="w-full bg-[#1F2937] border border-gray-700 text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-purple-600/20"
          >
            <Save size={20} /> SAVE APP STATUS
          </button>
        </div>

        {/* Right Column: Animation Selection */}
        <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col">
          <h3 className="flex items-center gap-2 text-white font-bold text-lg mb-6">
            <span className="text-orange-400">🎞️</span> Choose Animation
          </h3>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
            {ANIMATIONS.map(anim => (
              <button
                key={anim.id}
                onClick={() => setFormData({...formData, animationType: anim.id, customGifUrl: ''})}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center text-center ${
                  formData.animationType === anim.id && !formData.customGifUrl 
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                  : 'border-gray-800 bg-[#1F2937] hover:border-gray-600 text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-black tracking-widest">{anim.label}</span>
              </button>
            ))}
          </div>

          <div className="h-px bg-gray-800 w-full my-6" />

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Or Use Custom GIF Link</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Paste any stable GIF URL..."
                value={formData.customGifUrl}
                onChange={(e) => setFormData({...formData, customGifUrl: e.target.value, animationType: 'custom_gif'})}
                className="w-full bg-[#1F2937] border border-gray-700 text-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
