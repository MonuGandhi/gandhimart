import { useAdminStore } from '../../store/adminStore';
import { Eye, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Appearance() {
  const homepageSections = useAdminStore((state) => state.homepageSections);
  const updateHomepageSection = useAdminStore((state) => state.updateHomepageSection);
  const syncData = useAdminStore((state) => state.syncData);

  const sections = [
    { id: 'trending', label: 'Trending Now Section', icon: '🔥' },
    { id: 'bestseller', label: 'Best Sellers Section', icon: '🏆' },
    { id: 'fresh', label: 'Fresh Picks Section', icon: '🥬' }
  ];

  const handleUpdate = (id, field, value) => {
    updateHomepageSection(id, { [field]: value });
  };

  const handleSave = () => {
    syncData();
    toast.success('Appearance settings saved and synced!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Appearance</h1>
          <p className="text-gray-500">Customize how your homepage sections look</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1CA672] text-white rounded-xl font-bold hover:bg-[#158F5F] transition-all shadow-lg shadow-[#1CA672]/30"
        >
          <Save size={20} /> Save & Publish
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((sec) => {
          const config = homepageSections[sec.id];
          if (!config) return null;

          return (
            <div key={sec.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sec.icon}</span>
                  <h3 className="font-black text-gray-900 uppercase tracking-tight">{sec.label}</h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active</span>
                  <input 
                    type="checkbox" 
                    checked={config.isActive} 
                    onChange={(e) => handleUpdate(sec.id, 'isActive', e.target.checked)}
                    className="w-10 h-5 bg-gray-200 rounded-full appearance-none checked:bg-[#1CA672] transition-colors relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 before:transition-transform shadow-inner"
                  />
                </label>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Title Setting */}
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Section Title</label>
                  <input 
                    type="text" 
                    value={config.title}
                    onChange={(e) => handleUpdate(sec.id, 'title', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1CA672] outline-none font-bold"
                  />
                </div>

                {/* Colors Settings */}
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={config.bgColor}
                      onChange={(e) => handleUpdate(sec.id, 'bgColor', e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-100 p-1"
                    />
                    <input 
                      type="text" 
                      value={config.bgColor}
                      onChange={(e) => handleUpdate(sec.id, 'bgColor', e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-mono text-sm uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Text Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={config.textColor}
                      onChange={(e) => handleUpdate(sec.id, 'textColor', e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-100 p-1"
                    />
                    <input 
                      type="text" 
                      value={config.textColor}
                      onChange={(e) => handleUpdate(sec.id, 'textColor', e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-mono text-sm uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="px-6 pb-6">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Eye size={14} /> Live Preview
                </label>
                <div 
                  className="p-8 rounded-3xl flex items-center justify-center text-center transition-all duration-300 shadow-inner border border-gray-100"
                  style={{ backgroundColor: config.bgColor, color: config.textColor }}
                >
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black">{config.title}</h4>
                    <p className="text-xs opacity-70 font-bold uppercase tracking-[0.2em]">Sample Product Display</p>
                    <div className="flex gap-2 justify-center mt-4">
                       <div className="w-12 h-16 bg-white/20 rounded-lg backdrop-blur-sm" />
                       <div className="w-12 h-16 bg-white/20 rounded-lg backdrop-blur-sm" />
                       <div className="w-12 h-16 bg-white/20 rounded-lg backdrop-blur-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
          <RefreshCw size={24} className="animate-spin-slow" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 mb-1">How it works?</h4>
          <p className="text-sm text-blue-700 leading-relaxed">
            Changes made here are saved to your local storage. For these to reflect on the customer side, make sure to click <strong>Save & Publish</strong>. If the customer site doesn't update immediately, use the <strong>Sync</strong> button on the Dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
