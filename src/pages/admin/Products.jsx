import { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Upload, X } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatPrice } from '../../utils/helpers';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/uploadImage';

export default function Products() {
  const products = useAdminStore((state) => state.adminProducts);
  const categories = useAdminStore((state) => state.adminCategories);
  const updateProduct = useAdminStore((state) => state.updateProduct);
  const addProduct = useAdminStore((state) => state.addProduct);
  const deleteProduct = useAdminStore((state) => state.deleteProduct);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', categoryId: 1, price: '', originalPrice: '', discount: 0,
    image: 'https://picsum.photos/seed/new/400/400', weight: '1', unit: 'kg',
    description: '', brand: '', tags: '', inStock: true, stock: 100
  });

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.categoryId === Number(categoryFilter);
    const isOutOfStockAdmin = !p.inStock || (p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) < 10);
    const matchesStock = stockFilter === 'all' || 
                         (stockFilter === 'in' && !isOutOfStockAdmin) || 
                         (stockFilter === 'out' && isOutOfStockAdmin);
    return matchesSearch && matchesCategory && matchesStock;
  }), [products, searchTerm, categoryFilter, stockFilter]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 5) { // 5MB limit
        toast.error('Image is too large. Please use a file smaller than 5MB.');
        return;
      }
      setIsUploading(true);
      const toastId = toast.loading('Uploading image securely...');
      try {
        const url = await uploadImage(file, 'products');
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
      categoryId: Number(formData.categoryId),
      price: Number(formData.price),
      originalPrice: Number(formData.originalPrice) || Number(formData.price),
      discount: Number(formData.discount),
      stock: formData.stock === '' || formData.stock === null || formData.stock === undefined ? null : Number(formData.stock),
      inStock: formData.inStock
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      toast.success('Product updated!');
    } else {
      // ID is handled by addProduct in store (prod_${Date.now()})
      addProduct({
        ...payload,
        rating: 0,
        reviewCount: 0,
      });
      toast.success('Product added!');
    }
    
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ...product
    });
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      toast.success('Product deleted');
    }
  };

  const toggleStock = (product) => {
    updateProduct(product.id, { inStock: !product.inStock });
    toast.success(product.inStock ? 'Marked as Out of Stock' : 'Marked as In Stock');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Products</h1>
          <p className="text-gray-500">Manage your store catalog</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '', categoryId: 1, price: '', originalPrice: '', discount: 0,
              image: 'https://picsum.photos/seed/new/400/400', weight: '1', unit: 'kg',
              description: '', brand: '', tags: '', inStock: true, stock: 100
            });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1CA672] text-white rounded-lg font-semibold hover:bg-[#158F5F] transition-colors"
        >
          <Plus size={20} /> Add New Product
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1CA672]"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select 
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none"
          >
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded" /></th>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-center"><input type="checkbox" className="rounded" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getOptimizedImageUrl(p.image, 100)} 
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100" 
                        alt={p.name} 
                        loading="lazy"
                        onError={(e) => { e.target.src = `https://picsum.photos/seed/${p.id}/400/400`; }} 
                      />
                      <div>
                        <p className="font-bold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.weight} {p.unit} • {p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {categories.find(c => c.id === p.categoryId)?.name || 'Unknown'}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{formatPrice(p.price)}</p>
                    {p.discount > 0 && <p className="text-xs text-red-500 line-through">{formatPrice(p.originalPrice)}</p>}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => toggleStock(p)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-full border w-fit transition-colors ${
                          (p.inStock && (p.stock === null || p.stock === undefined || p.stock === "" || Number(p.stock) >= 10)) 
                            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                        }`}
                      >
                        {(p.inStock && (p.stock === null || p.stock === undefined || p.stock === "" || Number(p.stock) >= 10)) ? 'In Stock' : 'Out of Stock'}
                      </button>
                      <span className={`text-xs font-semibold ${p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) < 10 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                        Qty: {p.stock !== null && p.stock !== undefined && p.stock !== "" ? p.stock : '∞'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/product/${p.id}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={18} />
                      </a>
                      <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No products found matching your filters.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-black text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Product Name *</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                  <select required value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹) *</label>
                  <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">MRP (₹)</label>
                  <input type="number" value={formData.originalPrice} onChange={(e) => setFormData({...formData, originalPrice: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Stock</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Discount %</label>
                  <input type="number" value={formData.discount} onChange={(e) => setFormData({...formData, discount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Weight</label>
                  <input required type="text" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                  <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none">
                    <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option><option value="pcs">pcs</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Product Image</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Image URL" 
                    value={formData.image} 
                    onChange={(e) => setFormData({...formData, image: e.target.value})} 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" 
                  />
                  <label className={`bg-gray-100 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-200 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'}`}>
                    <Upload size={18} />
                    <span className="text-xs font-bold">{isUploading ? 'Uploading...' : 'Upload'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
                {formData.image && (
                  <div className="mt-2 relative w-20 h-20">
                    <img src={formData.image} className="w-full h-full object-cover rounded-lg border border-gray-100" />
                    <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10}/></button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Product Description</label>
                <textarea 
                  rows={3}
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Enter detailed product description..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none resize-none"
                />
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm font-bold text-gray-700">Display Options</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.tags?.includes('bestseller')} 
                      onChange={(e) => {
                        const newTags = e.target.checked 
                          ? [...(formData.tags || []), 'bestseller']
                          : (formData.tags || []).filter(t => t !== 'bestseller');
                        setFormData({...formData, tags: newTags});
                      }}
                      className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500" 
                    />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Best Seller</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.tags?.includes('trending')} 
                      onChange={(e) => {
                        const newTags = e.target.checked 
                          ? [...(formData.tags || []), 'trending']
                          : (formData.tags || []).filter(t => t !== 'trending');
                        setFormData({...formData, tags: newTags});
                      }}
                      className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500" 
                    />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Trending</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.tags?.includes('fresh')} 
                      onChange={(e) => {
                        const newTags = e.target.checked 
                          ? [...(formData.tags || []), 'fresh']
                          : (formData.tags || []).filter(t => t !== 'fresh');
                        setFormData({...formData, tags: newTags});
                      }}
                      className="w-5 h-5 rounded text-green-500 focus:ring-green-500" 
                    />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Fresh Pick</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Product Variants</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      const basePrice = Number(formData.price);
                      const baseUnit = formData.unit;
                      if (!basePrice || !baseUnit) {
                        toast.error('Set price and unit first!');
                        return;
                      }
                      let newVariants;
                      if (baseUnit === 'kg') {
                        newVariants = [
                          { id: 'v250g', weight: '250', unit: 'g', price: Math.round(basePrice * 0.25), originalPrice: Math.round((Number(formData.originalPrice) || basePrice) * 0.25), inStock: true },
                          { id: 'v500g', weight: '500', unit: 'g', price: Math.round(basePrice * 0.5), originalPrice: Math.round((Number(formData.originalPrice) || basePrice) * 0.5), inStock: true },
                          { id: 'v1kg', weight: '1', unit: 'kg', price: basePrice, originalPrice: Number(formData.originalPrice) || basePrice, inStock: true }
                        ];
                      } else if (baseUnit === 'L') {
                        newVariants = [
                          { id: 'v250ml', weight: '250', unit: 'ml', price: Math.round(basePrice * 0.25), originalPrice: Math.round((Number(formData.originalPrice) || basePrice) * 0.25), inStock: true },
                          { id: 'v500ml', weight: '500', unit: 'ml', price: Math.round(basePrice * 0.5), originalPrice: Math.round((Number(formData.originalPrice) || basePrice) * 0.5), inStock: true },
                          { id: 'v1L', weight: '1', unit: 'L', price: basePrice, originalPrice: Number(formData.originalPrice) || basePrice, inStock: true }
                        ];
                      } else {
                        toast.error('Auto-generate only works for kg or L units');
                        return;
                      }
                      setFormData({...formData, variants: newVariants});
                      toast.success('Variants generated! 🪄');
                    }}
                    className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    🪄 AUTO-GENERATE (kg/L)
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.variants || []).map((variant, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex-1 grid grid-cols-5 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 block mb-1">Weight</label>
                          <input 
                            type="text" 
                            value={variant.weight || ''} 
                            onChange={(e) => {
                              const v = [...formData.variants];
                              v[idx].weight = e.target.value;
                              setFormData({...formData, variants: v});
                            }}
                            className="w-full bg-white border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 block mb-1">Unit</label>
                          <select 
                            value={variant.unit || 'g'} 
                            onChange={(e) => {
                              const v = [...formData.variants];
                              v[idx].unit = e.target.value;
                              setFormData({...formData, variants: v});
                            }}
                            className="w-full bg-white border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="pcs">pcs</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 block mb-1">Price (₹)</label>
                          <input 
                            type="number" 
                            value={variant.price || ''} 
                            onChange={(e) => {
                              const v = [...formData.variants];
                              v[idx].price = Number(e.target.value);
                              setFormData({...formData, variants: v});
                            }}
                            className="w-full bg-white border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 block mb-1">Stock</label>
                          <input 
                            type="number" 
                            value={variant.stock !== undefined && variant.stock !== null ? variant.stock : ''} 
                            onChange={(e) => {
                              const v = [...formData.variants];
                              v[idx].stock = e.target.value === '' ? '' : Number(e.target.value);
                              setFormData({...formData, variants: v});
                            }}
                            placeholder="∞"
                            className="w-full bg-white border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 block mb-1">Status</label>
                          <button 
                            type="button"
                            onClick={() => {
                              const v = [...formData.variants];
                              v[idx].inStock = !v[idx].inStock;
                              setFormData({...formData, variants: v});
                            }}
                            className={`w-full py-1 text-[9px] font-black rounded-lg transition-colors ${variant.inStock ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                          >
                            {variant.inStock ? 'IN' : 'OUT'}
                          </button>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const v = formData.variants.filter((_, i) => i !== idx);
                          setFormData({...formData, variants: v});
                        }}
                        className="p-2 text-gray-300 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {(!formData.variants || formData.variants.length === 0) && (
                    <p className="text-xs text-gray-400 italic text-center py-2">No variants added yet. Use auto-generate or add manually.</p>
                  )}
                  
                  <button 
                    type="button"
                    onClick={() => {
                      const v = [...(formData.variants || []), { id: `v_${Date.now()}`, weight: '', unit: 'g', price: '', originalPrice: '', inStock: true, stock: '' }];
                      setFormData({...formData, variants: v});
                    }}
                    className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-xs font-bold hover:border-[#1CA672] hover:text-[#1CA672] transition-all"
                  >
                    + ADD MANUAL VARIANT
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="inStock" checked={formData.inStock} onChange={(e) => setFormData({...formData, inStock: e.target.checked})} className="w-5 h-5 rounded text-[#1CA672] focus:ring-[#1CA672]" />
                <label htmlFor="inStock" className="text-sm font-bold text-gray-700">Is Active / In Stock (Main)</label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#1CA672] hover:bg-[#158F5F] shadow-lg shadow-[#1CA672]/30">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
