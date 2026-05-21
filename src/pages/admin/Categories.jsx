import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/uploadImage';

export default function Categories() {
  const adminCategories = useAdminStore((state) => state.adminCategories);
  const addCategory = useAdminStore((state) => state.addCategory);
  const deleteCategory = useAdminStore((state) => state.deleteCategory);
  const updateCategory = useAdminStore((state) => state.updateCategory);
  const reorderCategory = useAdminStore((state) => state.reorderCategory);

  const allCategories = adminCategories;
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', emoji: '🛒', color: 'bg-green-100', slug: '', image: ''
  });

  const emojis = ['🛒', '🍎', '🥦', '🍞', '🥛', '🥩', '🍫', '🧼', '💊', '🪴', '🐟', '🍦'];
  const colors = ['bg-green-100', 'bg-blue-100', 'bg-yellow-100', 'bg-purple-100', 'bg-red-100', 'bg-orange-100', 'bg-pink-100'];

  const handleNameChange = (e) => {
    const newName = e.target.value;
    let baseSlug = newName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let finalSlug = baseSlug;
    let counter = 2;
    while (allCategories.some(c => c.slug === finalSlug && c.id !== editingCategory?.id)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    setFormData({ ...formData, name: newName, slug: finalSlug });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 5) { // 5MB limit for cloudinary
        toast.error('Image is too large. Please use a file smaller than 5MB.');
        return;
      }
      setIsUploading(true);
      const toastId = toast.loading('Uploading image securely...');
      try {
        const url = await uploadImage(file, 'categories');
        setFormData({ ...formData, image: url });
        toast.success('Image uploaded successfully!', { id: toastId });
      } catch (error) {
        console.error('Upload failed', error);
        toast.error('Failed to upload image. Try again.', { id: toastId });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      // Slug is now generated automatically via handleNameChange
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, payload);
      toast.success('Category updated!');
    } else {
      addCategory({ ...payload, id: Date.now() });
      toast.success('Category added!');
    }
    
    setShowAddModal(false);
    setEditingCategory(null);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setFormData(cat);
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategory(id);
      toast.success('Category deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-gray-500">Manage product categories</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', emoji: '🛒', color: 'bg-green-100', slug: '' });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1CA672] text-white rounded-lg font-semibold hover:bg-[#158F5F] transition-colors"
        >
          <Plus size={20} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allCategories.map((cat) => (
          <div key={cat.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center group">
            <div className="cursor-grab text-gray-300 hover:text-gray-500 mr-2 -ml-2">
              <GripVertical size={20} />
            </div>
            <div className={`w-12 h-12 ${cat.color || 'bg-gray-100'} rounded-2xl flex items-center justify-center text-2xl mr-4 overflow-hidden`}>
              {cat.image ? (
                <img src={cat.image} className="w-full h-full object-cover" alt={cat.name} />
              ) : (
                cat.emoji || '🛒'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{cat.name}</h3>
              <p className="text-xs text-gray-500 truncate">/{cat.slug}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => reorderCategory(cat.id, 'up')} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Move Left/Up">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button onClick={() => reorderCategory(cat.id, 'down')} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Move Right/Down">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
              <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg" title="Edit">
                <Edit size={16} />
              </button>
              {/* Only allow deleting admin added categories for safety, or modify logic if base should be deleted */}
              {adminCategories.some(c => c.id === cat.id) && (
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-black text-gray-900">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category Name *</label>
                <input required type="text" value={formData.name} onChange={handleNameChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
                {formData.slug && <p className="text-xs text-gray-500 mt-1">Slug: {formData.slug}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category Image (Optional)</label>
                <div className="flex gap-4 items-center">
                  <div className={`w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50`}>
                    {formData.image ? (
                      <img src={formData.image} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-30">{formData.emoji}</span>
                    )}
                  </div>
                  <label className={`bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                  {formData.image && (
                    <button type="button" onClick={() => setFormData({...formData, image: ''})} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Or Choose Emoji Icon</label>
                <div className="flex flex-wrap gap-2">
                  {emojis.map(e => (
                    <button type="button" key={e} onClick={() => setFormData({...formData, emoji: e, image: ''})} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${formData.emoji === e && !formData.image ? 'bg-[#1CA672] ring-2 ring-offset-2 ring-[#1CA672]' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Background Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <button type="button" key={c} onClick={() => setFormData({...formData, color: c})} className={`w-8 h-8 rounded-full transition-all ${c} ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-900' : 'opacity-70 hover:opacity-100 border border-gray-200'}`} />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#1CA672] hover:bg-[#158F5F]">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
