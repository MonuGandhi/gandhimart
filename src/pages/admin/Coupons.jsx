import { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Globe, User, Tag, Search } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '',
  limit: '', expiryDate: '', isActive: true, description: '',
  targetType: 'global', targetPhone: '', targetName: ''
};

export default function Coupons() {
  const coupons        = useAdminStore((s) => s.adminCoupons);
  const addCoupon      = useAdminStore((s) => s.addCoupon);
  const updateCoupon   = useAdminStore((s) => s.updateCoupon);
  const deleteCoupon   = useAdminStore((s) => s.deleteCoupon);
  const customers      = useAdminStore((s) => s.registeredUsers);

  const [tab, setTab]               = useState('all');       // 'all' | 'specific'
  const [showModal, setShowModal]   = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);

  // ── filtered lists ────────────────────────────────────────────────────────
  const globalCoupons   = coupons.filter((c) => c.targetType !== 'specific');
  const specificCoupons = coupons.filter((c) => c.targetType === 'specific');

  // ── customer dropdown options ─────────────────────────────────────────────
  const filteredCustomers = customers.filter((u) =>
    u.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    u.phone.includes(customerSearch)
  );

  // ── helpers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingCode(null);
    setFormData({ ...EMPTY_FORM, targetType: tab === 'specific' ? 'specific' : 'global' });
    setCustomerSearch('');
    setShowModal(true);
  };

  const openEdit = (coupon) => {
    setEditingCode(coupon.code);
    setFormData({ ...EMPTY_FORM, ...coupon });
    setCustomerSearch(coupon.targetName || '');
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (formData.targetType === 'specific' && !formData.targetPhone) {
      toast.error('Please select a customer');
      return;
    }

    const payload = {
      ...formData,
      code:        formData.code.toUpperCase(),
      value:       Number(formData.value),
      minOrder:    Number(formData.minOrder) || 0,
      maxDiscount: Number(formData.maxDiscount) || null,
      limit:       Number(formData.limit) || null,
      usedCount:   editingCode
        ? (coupons.find((c) => c.code === editingCode)?.usedCount || 0)
        : 0,
    };

    if (editingCode) {
      updateCoupon(editingCode, payload);
      toast.success('Coupon updated!');
    } else {
      if (coupons.some((c) => c.code === payload.code)) {
        toast.error('Coupon code already exists');
        return;
      }
      addCoupon(payload);
      toast.success('Coupon created!');
    }

    setShowModal(false);
  };

  const handleDelete = (code) => {
    if (window.confirm('Delete this coupon?')) {
      deleteCoupon(code);
      toast.success('Coupon deleted');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const selectCustomer = (u) => {
    setFormData({ ...formData, targetPhone: u.phone, targetName: u.name });
    setCustomerSearch(u.name);
    setShowCustomerDrop(false);
  };

  // ── coupon table row ──────────────────────────────────────────────────────
  const CouponRow = ({ c }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-sm tracking-widest">
            {c.code}
          </span>
          <button onClick={() => copyCode(c.code)} className="text-gray-400 hover:text-[#1CA672]">
            <Copy size={14} />
          </button>
        </div>
      </td>
      <td className="p-4">
        <p className="font-bold text-gray-900">
          {c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)} OFF
        </p>
        {c.maxDiscount && <p className="text-xs text-gray-500">Up to {formatPrice(c.maxDiscount)}</p>}
      </td>
      <td className="p-4 text-sm text-gray-600">{formatPrice(c.minOrder || 0)}</td>
      {tab === 'specific' && (
        <td className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-black">
              {c.targetName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{c.targetName}</p>
              <p className="text-xs text-gray-500">+91 {c.targetPhone}</p>
            </div>
          </div>
        </td>
      )}
      <td className="p-4">
        <p className="text-sm font-semibold">{c.usedCount || 0}{c.limit ? ` / ${c.limit}` : ''}</p>
        <p className="text-xs text-gray-500">Uses</p>
      </td>
      <td className="p-4">
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
          c.isActive
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-red-100 text-red-800 border-red-200'
        }`}>
          {c.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(c.code)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );

  const displayList = tab === 'all' ? globalCoupons : specificCoupons;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
          <p className="text-gray-500">Manage discount codes for all customers or specific ones</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1CA672] text-white rounded-lg font-semibold hover:bg-[#158F5F] transition-colors"
        >
          <Plus size={20} /> Create Coupon
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setTab('all')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === 'all'
              ? 'bg-white text-[#1CA672] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe size={16} />
          Global
          <span className="ml-1 bg-green-100 text-green-700 text-xs font-black px-2 py-0.5 rounded-full">
            {globalCoupons.length}
          </span>
        </button>
        <button
          onClick={() => setTab('specific')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === 'specific'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User size={16} />
          Customer-Specific
          <span className="ml-1 bg-purple-100 text-purple-700 text-xs font-black px-2 py-0.5 rounded-full">
            {specificCoupons.length}
          </span>
        </button>
      </div>

      {/* Tab Description */}
      {tab === 'all' ? (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
          <Globe size={20} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-semibold">
            Global coupons can be used by <strong>any customer</strong>. Share these publicly.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl px-5 py-3">
          <User size={20} className="text-purple-600 shrink-0" />
          <p className="text-sm text-purple-800 font-semibold">
            Customer-specific coupons work <strong>only for the assigned customer's phone number</strong>.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4">Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min Order</th>
                {tab === 'specific' && <th className="p-4">Customer</th>}
                <th className="p-4">Usage</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayList.map((c) => <CouponRow key={c.code} c={c} />)}
            </tbody>
          </table>
        </div>
        {displayList.length === 0 && (
          <div className="p-12 text-center">
            <Tag size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-400">No {tab === 'all' ? 'global' : 'customer-specific'} coupons yet</p>
            <p className="text-sm text-gray-300 mt-1">Click "Create Coupon" to add one</p>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">

            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-black text-gray-900">
                {editingCode ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Target Type Toggle */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Coupon Type *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: 'global', targetPhone: '', targetName: '' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      formData.targetType === 'global'
                        ? 'border-[#1CA672] bg-green-50 text-[#1CA672]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Globe size={16} /> For Everyone
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: 'specific' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      formData.targetType === 'specific'
                        ? 'border-purple-500 bg-purple-50 text-purple-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <User size={16} /> Specific Customer
                  </button>
                </div>
              </div>

              {/* Customer Picker — shown only when specific */}
              {formData.targetType === 'specific' && (
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Customer *</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDrop(true); }}
                      onFocus={() => setShowCustomerDrop(true)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>

                  {showCustomerDrop && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400 text-center">No customers found</div>
                      ) : filteredCustomers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => selectCustomer(u)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">+91 {u.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {formData.targetPhone && (
                    <div className="mt-2 flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
                      <User size={14} className="text-purple-600" />
                      <span className="text-sm font-bold text-purple-800">{formData.targetName}</span>
                      <span className="text-xs text-purple-500">+91 {formData.targetPhone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Coupon Code */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Coupon Code *</label>
                <input
                  required type="text" value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. WELCOME50"
                  disabled={!!editingCode}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none uppercase disabled:opacity-50"
                />
              </div>

              {/* Discount Type + Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Discount Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Discount Value *</label>
                  <input
                    required type="number" value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none"
                  />
                </div>
              </div>

              {/* Min Order + Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Min Order (₹)</label>
                  <input
                    type="number" value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Max Discount (₹)</label>
                  <input
                    type="number" value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="Optional"
                    disabled={formData.type !== 'percentage'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Usage Limit + Expiry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number" value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date" value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description / Terms</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none"
                  rows="2"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox" id="isActive" checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded text-[#1CA672] focus:ring-[#1CA672]"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Is Active</label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#1CA672] hover:bg-[#158F5F]"
                >
                  {editingCode ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
