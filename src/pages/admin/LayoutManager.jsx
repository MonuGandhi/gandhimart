import { useState, useEffect, useMemo } from 'react';
import { useAdminStore } from '../../store/adminStore';
import toast from 'react-hot-toast';
import { Zap, TrendingUp, Trophy, Leaf, Save, Search, X, Check, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';

const SECTION_CONFIG = [
  { 
    id: 'flashSale', 
    label: 'Flash Sale ⚡', 
    description: 'Happy Hour countdown deals with FOMO timers',
    icon: Zap, 
    color: 'amber',
    bgGradient: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500',
    bgTint: 'bg-amber-500/10',
    textColor: 'text-amber-500'
  },
  { 
    id: 'trending', 
    label: 'Trending Now 🔥', 
    description: 'Hot products your customers love',
    icon: TrendingUp, 
    color: 'red',
    bgGradient: 'from-red-500 to-pink-500',
    borderColor: 'border-red-500',
    bgTint: 'bg-red-500/10',
    textColor: 'text-red-500'
  },
  { 
    id: 'bestseller', 
    label: 'Best Sellers 🏆', 
    description: 'Top selling products featured on home',
    icon: Trophy, 
    color: 'yellow',
    bgGradient: 'from-yellow-500 to-amber-500',
    borderColor: 'border-yellow-500',
    bgTint: 'bg-yellow-500/10',
    textColor: 'text-yellow-500'
  },
  { 
    id: 'fresh', 
    label: 'Fresh Picks 🥬', 
    description: 'New & fresh items in your store',
    icon: Leaf, 
    color: 'emerald',
    bgGradient: 'from-emerald-500 to-green-500',
    borderColor: 'border-emerald-500',
    bgTint: 'bg-emerald-500/10',
    textColor: 'text-emerald-500'
  },
];

function ProductPickerModal({ isOpen, onClose, allProducts, selectedIds, initialConfigs, onSave, sectionLabel, sectionColor, isFlashSale }) {
  const [search, setSearch] = useState('');
  const [localSelected, setLocalSelected] = useState([...selectedIds]);
  const [localConfigs, setLocalConfigs] = useState({ ...initialConfigs });

  useEffect(() => {
    setLocalSelected([...selectedIds]);
    setLocalConfigs({ ...initialConfigs });
  }, [selectedIds, initialConfigs, isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allProducts;
    const q = search.toLowerCase();
    return allProducts.filter(
      p => (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)
    );
  }, [allProducts, search]);

  const toggleProduct = (p) => {
    const idStr = String(p.id);
    setLocalSelected(prev => {
      if (prev.includes(idStr)) {
        // Deselect
        const newConfigs = { ...localConfigs };
        delete newConfigs[idStr];
        setLocalConfigs(newConfigs);
        return prev.filter(x => x !== idStr);
      } else {
        // Select
        if (isFlashSale && !localConfigs[idStr]) {
          setLocalConfigs(c => ({
            ...c,
            [idStr]: { flashPrice: Math.round(p.price * 0.85), initialStock: 15 }
          }));
        }
        return [...prev, idStr];
      }
    });
  };

  const updateConfig = (id, field, value) => {
    const numVal = parseInt(value, 10) || 0;
    setLocalConfigs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: numVal
      }
    }));
  };

  const handleSave = () => {
    onSave(localSelected, localConfigs);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111827] rounded-3xl border border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-white font-black text-lg">Select Products</h3>
            <p className="text-gray-400 text-xs mt-0.5">For: {sectionLabel} · {localSelected.length} selected</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-[#1F2937] border border-gray-700 text-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-purple-500 text-sm font-medium"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-medium">No products found</div>
          ) : (
            filtered.map(p => {
              const isSelected = localSelected.includes(String(p.id));
              const config = localConfigs[String(p.id)];

              return (
                <div key={p.id} className={`w-full p-3 rounded-2xl border-2 transition-all ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-gray-800 bg-[#1F2937]'
                }`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleProduct(p)} className="flex-1 flex items-center gap-3 text-left">
                      {/* Checkbox */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-purple-500 text-white' : 'bg-gray-700 text-transparent'
                      }`}>
                        <Check size={16} />
                      </div>
                      
                      {/* Product Image */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-700 shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg">📦</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">{p.name}</p>
                        <p className="text-gray-400 text-xs">{p.unit || p.weight} · Regular: ₹{p.price}</p>
                      </div>
                    </button>
                  </div>

                  {/* Flash Sale Custom Inputs */}
                  {isSelected && isFlashSale && config && (
                    <div className="mt-3 pt-3 border-t border-purple-500/20 flex gap-3 animate-in fade-in slide-in-from-top-1">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Flash Sale Price (₹)</label>
                        <input 
                          type="number"
                          value={config.flashPrice}
                          onChange={(e) => updateConfig(String(p.id), 'flashPrice', e.target.value)}
                          className="w-full bg-[#111827] border border-gray-700 text-amber-400 font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Initial Stock Left</label>
                        <input 
                          type="number"
                          value={config.initialStock}
                          onChange={(e) => updateConfig(String(p.id), 'initialStock', e.target.value)}
                          className="w-full bg-[#111827] border border-gray-700 text-red-400 font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 flex items-center gap-3 shrink-0">
          <button 
            onClick={() => {
              setLocalSelected([]);
              setLocalConfigs({});
            }}
            className="px-5 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Clear All
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-600/20"
          >
            <Check size={18} /> SAVE {localSelected.length} PRODUCTS
          </button>
        </div>
      </div>
    </div>
  );
}


export default function LayoutManager() {
  const homepageSections = useAdminStore((s) => s.homepageSections) || {};
  const homepageLayoutOrder = useAdminStore((s) => s.homepageLayoutOrder) || ['flashSale', 'trending', 'bestseller', 'fresh'];
  const updateHomepageSection = useAdminStore((s) => s.updateHomepageSection);
  const updateHomepageOrder = useAdminStore((s) => s.updateHomepageOrder);
  const allProducts = useAdminStore((s) => s.adminProducts) || [];

  // Local state for each section's settings
  const [sections, setSections] = useState({});
  const [order, setOrder] = useState([...homepageLayoutOrder]);
  const [pickerOpen, setPickerOpen] = useState(null); // section id that's open
  const [expandedSection, setExpandedSection] = useState(null);

  // Sync from firebase homepageSections into local state
  useEffect(() => {
    const initial = {};
    SECTION_CONFIG.forEach(cfg => {
      const saved = homepageSections[cfg.id] || {};
      initial[cfg.id] = {
        isActive: saved.isActive ?? (cfg.id === 'flashSale' ? false : true),
        productIds: saved.productIds || [],
        customConfigs: saved.customConfigs || {},
        title: saved.title || cfg.label,
        bgColor: saved.bgColor || '',
        textColor: saved.textColor || '',
        variant: saved.variant || cfg.id,
      };
    });
    setSections(initial);
  }, [homepageSections]);

  useEffect(() => {
    if (homepageLayoutOrder && homepageLayoutOrder.length > 0) {
      setOrder([...homepageLayoutOrder]);
    }
  }, [homepageLayoutOrder]);

  const toggleActive = (id) => {
    setSections(prev => ({
      ...prev,
      [id]: { ...prev[id], isActive: !prev[id]?.isActive }
    }));
  };

  const handleProductsSave = (sectionId, selectedIds, customConfigs) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: { 
        ...prev[sectionId], 
        productIds: selectedIds,
        ...(customConfigs ? { customConfigs } : {})
      }
    }));
  };

  const moveSection = (index, direction) => {
    const newOrder = [...order];
    if (direction === 'up' && index > 0) {
      const temp = newOrder[index - 1];
      newOrder[index - 1] = newOrder[index];
      newOrder[index] = temp;
    } else if (direction === 'down' && index < newOrder.length - 1) {
      const temp = newOrder[index + 1];
      newOrder[index + 1] = newOrder[index];
      newOrder[index] = temp;
    }
    setOrder(newOrder);
  };

  const handleSaveAll = async () => {
    try {
      // Save individual settings
      for (const cfg of SECTION_CONFIG) {
        const sectionData = sections[cfg.id];
        if (sectionData) {
          await updateHomepageSection(cfg.id, sectionData);
        }
      }
      // Save order
      if (updateHomepageOrder) {
        await updateHomepageOrder(order);
      }
      toast.success('Home Page layout saved!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save layout');
    }
  };

  const getProductNames = (ids) => {
    return ids.map(id => {
      const p = allProducts.find(prod => String(prod.id) === String(id));
      return p ? p.name : id;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <LayoutGrid size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Home Page Layout</h1>
            <p className="text-gray-500 text-sm font-medium">Control what appears on your storefront</p>
          </div>
        </div>
      </div>

      {/* Section Cards */}
      {order.map((sectionId, index) => {
        const cfg = SECTION_CONFIG.find(c => c.id === sectionId);
        if (!cfg) return null;

        const section = sections[cfg.id] || {};
        const Icon = cfg.icon;
        const isExpanded = expandedSection === cfg.id;
        const productNames = getProductNames(section.productIds || []);

        return (
          <div 
            key={cfg.id}
            className={`bg-[#111827] rounded-3xl border shadow-2xl overflow-hidden transition-all ${
              section.isActive ? cfg.borderColor : 'border-gray-800'
            }`}
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1 mr-2 shrink-0">
                  <button 
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button 
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === order.length - 1}
                    className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  section.isActive ? cfg.bgTint + ' ' + cfg.textColor : 'bg-gray-800 text-gray-500'
                }`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className={`text-lg font-black tracking-tight ${section.isActive ? 'text-white' : 'text-gray-500'}`}>
                    {cfg.label}
                  </h2>
                  <p className="text-gray-500 text-xs font-medium mt-0.5">{cfg.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Product Count Badge */}
                {(section.productIds || []).length > 0 && (
                  <span className="text-[11px] font-black text-purple-400 bg-purple-400/10 px-3 py-1 rounded-lg">
                    {(section.productIds || []).length} PRODUCTS
                  </span>
                )}

                {/* ON/OFF Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={section.isActive || false}
                    onChange={() => toggleActive(cfg.id)}
                  />
                  <div className={`w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r ${section.isActive ? cfg.bgGradient : ''}`}></div>
                </label>

                {/* Expand */}
                <button 
                  onClick={() => setExpandedSection(isExpanded ? null : cfg.id)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-800 pt-4 animate-in fade-in slide-in-from-top-2">
                
                {/* Select Products Button */}
                <button
                  onClick={() => setPickerOpen(cfg.id)}
                  className="w-full bg-[#1F2937] border-2 border-dashed border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <Search size={18} />
                  {(section.productIds || []).length > 0 
                    ? `Change Products (${section.productIds.length} selected)` 
                    : 'Select Products'}
                </button>

                {/* Selected Products Preview */}
                {productNames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {productNames.map((name, i) => (
                      <span 
                        key={i}
                        className="text-xs font-bold bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Info Note */}
                {(section.productIds || []).length === 0 && (
                  <p className="text-gray-500 text-xs font-medium text-center py-2">
                    {cfg.id === 'flashSale' 
                      ? '⚡ No products selected. The system will auto-pick discounted items.' 
                      : `📌 No products selected. The system will use products tagged "${cfg.id === 'bestseller' ? 'bestseller' : cfg.id === 'fresh' ? 'fresh' : 'trending'}".`}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Save Button */}
      <button 
        onClick={handleSaveAll}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-purple-600/20 text-lg"
      >
        <Save size={22} /> SAVE HOME PAGE LAYOUT
      </button>

      {/* Product Picker Modal */}
      {pickerOpen && (
        <ProductPickerModal
          isOpen={!!pickerOpen}
          onClose={() => setPickerOpen(null)}
          allProducts={allProducts}
          selectedIds={(sections[pickerOpen]?.productIds || [])}
          initialConfigs={(sections[pickerOpen]?.customConfigs || {})}
          onSave={(ids, configs) => handleProductsSave(pickerOpen, ids, configs)}
          sectionLabel={SECTION_CONFIG.find(c => c.id === pickerOpen)?.label || ''}
          sectionColor={SECTION_CONFIG.find(c => c.id === pickerOpen)?.color || 'purple'}
          isFlashSale={pickerOpen === 'flashSale'}
        />
      )}
    </div>
  );
}
