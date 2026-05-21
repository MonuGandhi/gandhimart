import { useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Plus, Trash2, Power, Upload, X, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/uploadImage';

export default function Banners() {
  const banners = useAdminStore((state) => state.adminBanners) || [];
  const addBanner = useAdminStore((state) => state.addBanner);
  const updateBanner = useAdminStore((state) => state.updateBanner);
  const deleteBanner = useAdminStore((state) => state.deleteBanner);
  const toggleBanner = useAdminStore((state) => state.toggleBanner);

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    badge: '',
    isActive: true,
    scale: 100,
    yOffset: 0,
    categoryId: '',
    linkTo: '',
    objectFit: 'cover'
  });

  const categories = useAdminStore((state) => state.adminCategories) || [];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image is too large. Please use a file smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
        toast.success('Banner image uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (banner) => {
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image: banner.image || '',
      badge: banner.badge || '',
      isActive: banner.isActive ?? true,
      scale: banner.scale || 100,
      yOffset: banner.yOffset || 0,
      categoryId: banner.categoryId || '',
      linkTo: banner.linkTo || '',
      objectFit: banner.objectFit || 'cover'
    });
    setEditingId(banner.id);
    setEditMode(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      toast.error('Image is required');
      return;
    }
    
    const toastId = toast.loading(editMode ? 'Updating banner...' : 'Adding banner...');
    try {
      let imageUrl = formData.image;
      
      // Upload to Storage if it's a new base64 image
      if (imageUrl.startsWith('data:')) {
        toast.loading('Uploading image to cloud...', { id: toastId });
        imageUrl = await uploadImage(imageUrl, 'banners');
      }

      const finalData = { ...formData, image: imageUrl };

      if (editMode) {
        await updateBanner(editingId, finalData);
        toast.success('Banner updated successfully', { id: toastId });
      } else {
        await addBanner(finalData);
        toast.success('Banner added successfully', { id: toastId });
      }
      
      setShowForm(false);
      setEditMode(false);
      setEditingId(null);
      setFormData({
        title: '', subtitle: '', image: '', badge: '', isActive: true, scale: 100, yOffset: 0, categoryId: '', linkTo: '', objectFit: 'cover'
      });
    } catch (err) {
      console.error('Banner operation failed:', err);
      toast.error('Operation failed. Please try again.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 text-xs md:text-sm pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Banner Management</h1>
          <p className="text-gray-500">Manage homepage promotional banners</p>
        </div>
        <button
          onClick={() => {
            if (showForm && editMode) {
              setEditMode(false);
              setFormData({ title: '', subtitle: '', image: '', badge: '', isActive: true, scale: 100, yOffset: 0, categoryId: '', linkTo: '', objectFit: 'cover' });
            } else {
              setShowForm(!showForm);
            }
          }}
          className={`${showForm && editMode ? 'bg-gray-500' : 'bg-[#1CA672]'} text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors`}
        >
          {showForm && editMode ? <X size={20} /> : <Plus size={20} />}
          {showForm && editMode ? 'Cancel Edit' : 'Add New Banner'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs">
            {editMode ? 'Edit Promotional Banner' : 'Add New Promotional Banner'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Banner Type / Position</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1CA672] outline-none font-bold"
              >
                <option value="">Main Homepage Carousel (Top)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>Above {cat.name} Section</option>
                ))}
              </select>
            </div>

            <input
              type="text" placeholder="Banner Title (e.g. Fresh Fruits)"
              value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1CA672] outline-none font-bold"
            />
            <input
              type="text" placeholder="Subtitle (e.g. Up to 50% Off)"
              value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1CA672] outline-none font-bold"
            />
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Banner Image URL or Upload</label>
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Image URL"
                  value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none"
                />
                <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 border border-gray-200 transition-colors">
                  <Upload size={18} />
                  <span className="text-[10px] font-bold">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              {formData.image && (
                <div className="mt-4 relative h-32 md:h-48 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-100">
                  <img 
                    src={formData.image} 
                    className={`w-full h-full transition-transform duration-300 ${formData.objectFit === 'contain' ? 'object-contain' : 'object-cover'}`} 
                    style={{ 
                      transform: formData.objectFit === 'contain' ? 'none' : `scale(${formData.scale / 100})`, 
                      objectPosition: `center ${50 + (formData.yOffset || 0)}%` 
                    }}
                  />
                  <div className="absolute inset-0 border-2 border-[#1CA672]/20 pointer-events-none" />
                  <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><X size={14}/></button>
                </div>
              )}
            </div>

            <input
              type="text" placeholder="Badge (Optional - e.g. New)"
              value={formData.badge} onChange={(e) => setFormData({...formData, badge: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1CA672] outline-none font-bold"
            />

            <select
              value={formData.linkTo}
              onChange={(e) => setFormData({...formData, linkTo: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1CA672] outline-none font-bold"
            >
              <option value="">No Redirect (Just Image)</option>
              {categories.map(cat => (
                <option key={cat.id} value={`/category/${cat.slug}`}>Redirect to: {cat.name}</option>
              ))}
            </select>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Scale / Zoom ({formData.scale}%)</label>
                <input 
                  type="range" min="50" max="250" step="5"
                  value={formData.scale} 
                  onChange={(e) => setFormData({...formData, scale: parseInt(e.target.value)})} 
                  className="w-full accent-[#1CA672]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Vertical Offset ({formData.yOffset}%)</label>
                <input 
                  type="range" min="-50" max="50" value={formData.yOffset} 
                  onChange={(e) => setFormData({...formData, yOffset: parseInt(e.target.value)})} 
                  className="w-full accent-[#1CA672]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Image Fit Mode</label>
                <select 
                  value={formData.objectFit} 
                  onChange={(e) => setFormData({...formData, objectFit: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#1CA672] outline-none font-bold text-xs"
                >
                  <option value="cover">Cover (Fill Area)</option>
                  <option value="contain">Contain (Fit Image)</option>
                </select>
              </div>
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditMode(false);
                  setFormData({ title: '', subtitle: '', image: '', badge: '', isActive: true, scale: 100, yOffset: 0, categoryId: '', linkTo: '', objectFit: 'cover' });
                }} 
                className="px-6 py-2 text-gray-500 font-bold"
              >
                Cancel
              </button>
              <button type="submit" className="px-6 py-3 bg-[#1CA672] text-white font-bold rounded-xl shadow-lg shadow-green-200">
                {editMode ? 'Update Changes' : 'Save & Publish'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
            <div className="h-32 bg-gray-100 relative flex items-center">
              <img 
                src={banner.image} 
                className={`absolute inset-0 h-full w-full ${banner.objectFit === 'contain' ? 'object-contain p-2' : 'object-cover'}`} 
                style={{ 
                  transform: banner.objectFit === 'contain' ? 'none' : `scale(${banner.scale / 100 || 1})`,
                  objectPosition: `center ${50 + (banner.yOffset || 0)}%`
                }}
              />
              {(banner.title || banner.subtitle) && (
                <div className="z-10 bg-black/20 inset-0 absolute flex flex-col justify-center px-4">
                  {banner.badge && <span className="w-fit text-[8px] font-bold bg-white/30 text-white px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">{banner.badge}</span>}
                  <h3 className="text-white font-black text-sm leading-tight">{banner.title}</h3>
                  <p className="text-white/80 text-[10px]">{banner.subtitle}</p>
                </div>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBanner(banner.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  <Power size={14} /> {banner.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(banner)}
                  className="p-2 text-gray-400 hover:text-[#1CA672] hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Banner"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => deleteBanner(banner.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Banner"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
