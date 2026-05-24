import { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Settings() {
  const storeSettings = useAdminStore((state) => state.storeSettings);
  const updateSettings = useAdminStore((state) => state.updateSettings);
  const resetToDefaultData = useAdminStore((state) => state.resetToDefaultData);

  const [formData, setFormData] = useState(storeSettings);

  useEffect(() => {
    if (storeSettings) {
      setFormData(storeSettings);
    }
  }, [storeSettings]);

  // PIN Change Modal State
  const [pinChangeModal, setPinChangeModal] = useState({
    open: false,
    step: 'verify', // 'verify' or 'new'
    username: '',
    oldPin: '',
    newPin: '',
    confirmPin: '',
    loading: false,
  });

  const openPinChangeModal = (username) => {
    setPinChangeModal({
      open: true,
      step: 'verify',
      username,
      oldPin: '',
      newPin: '',
      confirmPin: '',
      loading: false,
    });
  };

  const handleVerifyOldPin = async () => {
    const { username, oldPin } = pinChangeModal;
    if (!oldPin || oldPin.length < 4) {
      toast.error('Please enter your current PIN');
      return;
    }
    setPinChangeModal(prev => ({ ...prev, loading: true }));
    try {
      const adminSnap = await getDoc(doc(db, 'settings', 'admins'));
      const admins = adminSnap.exists() ? adminSnap.data() : {};

      // For pro_admin fallback check
      const isProFallback = username === 'monugandhi5911' && oldPin === '9365524026';
      const isDbMatch = admins[username] && admins[username].pin === oldPin;

      if (isDbMatch || isProFallback) {
        setPinChangeModal(prev => ({ ...prev, step: 'new', loading: false }));
        toast.success('Old PIN verified! ✅');
      } else {
        toast.error('❌ Wrong current PIN!');
        setPinChangeModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('PIN verify error:', err);
      toast.error('Failed to verify PIN');
      setPinChangeModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSetNewPin = async () => {
    const { username, newPin, confirmPin } = pinChangeModal;
    if (!newPin || newPin.length < 4) {
      toast.error('New PIN must be at least 4 characters');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match!');
      return;
    }
    setPinChangeModal(prev => ({ ...prev, loading: true }));
    try {
      await useAdminStore.getState().updateAdminAccount(username, { pin: newPin, role: 'pro_admin' });
      toast.success('PIN updated successfully! 🔐');
      setPinChangeModal({ open: false, step: 'verify', username: '', oldPin: '', newPin: '', confirmPin: '', loading: false });
    } catch (err) {
      console.error('PIN update error:', err);
      toast.error('Failed to update PIN');
      setPinChangeModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Saving settings...');
    try {
      await updateSettings({
        ...formData,
        minOrderAmount: Number(formData.minOrderAmount || 0),
        freeDeliveryAbove: Number(formData.freeDeliveryAbove || 0),
        deliveryFee: Number(formData.deliveryFee || 0),
        gstPercentage: Number(formData.gstPercentage || 0),
        estimatedDeliveryTime: Number(formData.estimatedDeliveryTime || 0),
      });
      toast.success('Settings updated successfully!', { id: toastId });
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Failed to save settings: ' + error.message, { id: toastId });
    }
  };

  const handleResetData = async () => {
    if (window.confirm('WARNING: This will delete all custom products, categories, AND BANNERS, and revert to the original grocery-themed data. Are you sure?')) {
      const toastId = toast.loading('Resetting store data...');
      try {
        await resetToDefaultData();
        toast.success('Store has been reset to default grocery data!', { id: toastId });
      } catch (error) {
        console.error(error);
        toast.error('Failed to reset data.', { id: toastId });
      }
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your store preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Settings Block */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Store Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Store Name</label>
              <input type="text" value={formData.storeName || ''} onChange={(e) => setFormData({ ...formData, storeName: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Store Phone</label>
              <input type="text" value={formData.storePhone || ''} onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Store Address</label>
              <textarea value={formData.storeAddress || ''} onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" rows="2" />
            </div>
          </div>
        </div>

        {/* Contact, Support & Social Links Block */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Contact, Support & Social Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Support Email</label>
              <input type="text" value={formData.supportEmail || ''} onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" placeholder="monugandhi03@gmail.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Support Phone</label>
              <input type="text" value={formData.supportPhone || ''} onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" placeholder="8607424026" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Chat Link</label>
              <input type="text" value={formData.whatsappLink || ''} onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" placeholder="https://wa.me/918607424026" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Pre-filled Message</label>
              <input type="text" value={formData.whatsappMessage || ''} onChange={(e) => setFormData({ ...formData, whatsappMessage: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" placeholder="Hello G Mart! I need help with my order." />
              <p className="text-xs text-gray-400 mt-1">This message will be pre-filled inside the customer's chat screen when they tap WhatsApp Support.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Instagram Link</label>
              <input type="text" value={formData.instagramLink || ''} onChange={(e) => setFormData({ ...formData, instagramLink: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" placeholder="https://www.instagram.com/monugandhi_/" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Facebook Link</label>
              <input type="text" value={formData.facebookLink || ''} onChange={(e) => setFormData({ ...formData, facebookLink: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" placeholder="https://facebook.com" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Twitter (X) Link</label>
              <input type="text" value={formData.twitterLink || ''} onChange={(e) => setFormData({ ...formData, twitterLink: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" placeholder="https://twitter.com" />
            </div>
          </div>
        </div>

        {/* Operational Settings Block */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Operational Configurations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Min Order Amount (₹)</label>
              <input type="number" value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Free Delivery Above (₹)</label>
              <input type="number" value={formData.freeDeliveryAbove} onChange={(e) => setFormData({ ...formData, freeDeliveryAbove: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Fee (₹)</label>
              <input type="number" value={formData.deliveryFee} onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">GST Percentage (%)</label>
              <input type="number" value={formData.gstPercentage} onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Est. Delivery Time (mins)</label>
              <input type="number" value={formData.estimatedDeliveryTime} onChange={(e) => setFormData({ ...formData, estimatedDeliveryTime: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
            </div>
          </div>

          {/* Location Service Settings */}
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Location Service Settings</h2>
            <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div>
                <label className="text-sm font-black text-gray-900 block">
                  Require location before order
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  ON = customer must allow GPS and the order is checked using the saved Madhosinghana area.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLocationToggle(!(formData.locationService?.enabled || false))}
                className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors ${formData.locationService?.enabled ? 'bg-[#1CA672]' : 'bg-gray-300'}`}
                aria-pressed={!!formData.locationService?.enabled}
                aria-label="Toggle location requirement"
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${formData.locationService?.enabled ? 'translate-x-8' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-900">
              <p className="font-bold">Default area is already saved</p>
              <p className="mt-1 text-green-800">
                The app uses the existing Madhosinghana center and radius from store settings. You only need to turn this ON/OFF here.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Announcement Banner Text</label>
            <input type="text" value={formData.announcementText} onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })} placeholder="Show a message at the top of the homepage" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Banner Background Color</label>
              <div className="flex gap-2">
                <input type="color" value={formData.announcementBgColor || '#1CA672'} onChange={(e) => setFormData({ ...formData, announcementBgColor: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
                <input type="text" value={formData.announcementBgColor || '#1CA672'} onChange={(e) => setFormData({ ...formData, announcementBgColor: e.target.value })} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA672]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Banner Text Color</label>
              <div className="flex gap-2">
                <input type="color" value={formData.announcementTextColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, announcementTextColor: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
                <input type="text" value={formData.announcementTextColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, announcementTextColor: e.target.value })} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA672]" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Header Background Color (G Mart Section)</label>
              <div className="flex gap-2">
                <input type="color" value={formData.headerBgColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, headerBgColor: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
                <input type="text" value={formData.headerBgColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, headerBgColor: e.target.value })} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA672]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Header Text Color</label>
              <div className="flex gap-2">
                <input type="color" value={formData.headerTextColor || '#111827'} onChange={(e) => setFormData({ ...formData, headerTextColor: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
                <input type="text" value={formData.headerTextColor || '#111827'} onChange={(e) => setFormData({ ...formData, headerTextColor: e.target.value })} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA672]" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Settings Block (Only for Pro Admin) */}
        {useAdminStore.getState().adminRole === 'pro_admin' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Payment Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Store UPI ID (For Scan & Pay)</label>
                <input
                  type="text"
                  value={formData.upiId || ''}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  placeholder="e.g. 9876543210@paytm"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#1CA672] outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to disable Scan & Pay option</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Security Section (Only for Pro Admin) */}
        {useAdminStore.getState().adminRole === 'pro_admin' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">🛡️</span>
              Admin Security
            </h2>
            <p className="text-xs text-gray-500 mb-4">Manage login PINs for Admin accounts. These are verified from the database.</p>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-bold text-gray-900">monugandhi5911</p>
                    <p className="text-xs text-amber-700 font-medium">Master Pro Admin</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPinChangeModal('monugandhi5911')}
                    className="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    🔐 Change PIN
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">Standard Admin</p>
                    <p className="text-xs text-gray-500 font-medium">Username: admin</p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-gray-200 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed"
                  >
                    Hardcoded
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">* Standard admin PIN is currently fixed in code for safety.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          {useAdminStore.getState().adminRole === 'pro_admin' ? (
            <button type="button" onClick={handleResetData} className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl transition-colors">
              Reset to Default Data
            </button>
          ) : (
            <div />
          )}
          <button type="submit" className="px-8 py-3 bg-[#1CA672] hover:bg-[#158F5F] text-white font-bold rounded-xl shadow-lg shadow-[#1CA672]/30 transition-colors">
            Save Settings
          </button>
        </div>
      </form>

      {/* Secure PIN Change Modal */}
      {pinChangeModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">{pinChangeModal.step === 'verify' ? '🔒' : '🔑'}</span>
              </div>
              <h3 className="text-xl font-black text-gray-900">
                {pinChangeModal.step === 'verify' ? 'Verify Current PIN' : 'Set New PIN'}
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {pinChangeModal.step === 'verify'
                  ? `Enter the current PIN for ${pinChangeModal.username}`
                  : 'Enter and confirm your new PIN'
                }
              </p>
            </div>

            {pinChangeModal.step === 'verify' ? (
              /* Step 1: Verify Old PIN */
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current PIN</label>
                  <input
                    type="password"
                    placeholder="Enter current PIN"
                    value={pinChangeModal.oldPin}
                    onChange={(e) => setPinChangeModal(prev => ({ ...prev, oldPin: e.target.value }))}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-amber-400 transition-colors"
                    autoFocus
                    maxLength={12}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPinChangeModal(prev => ({ ...prev, open: false }))}
                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOldPin}
                    disabled={pinChangeModal.loading}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg ${pinChangeModal.loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}
                  >
                    {pinChangeModal.loading ? '⏳ Verifying...' : 'Verify PIN'}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Set New PIN */
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">New PIN</label>
                  <input
                    type="password"
                    placeholder="Enter new PIN"
                    value={pinChangeModal.newPin}
                    onChange={(e) => setPinChangeModal(prev => ({ ...prev, newPin: e.target.value }))}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-[#1CA672] transition-colors"
                    autoFocus
                    maxLength={12}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confirm New PIN</label>
                  <input
                    type="password"
                    placeholder="Re-enter new PIN"
                    value={pinChangeModal.confirmPin}
                    onChange={(e) => setPinChangeModal(prev => ({ ...prev, confirmPin: e.target.value }))}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-[#1CA672] transition-colors"
                    maxLength={12}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPinChangeModal(prev => ({ ...prev, step: 'verify', oldPin: '' }))}
                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSetNewPin}
                    disabled={pinChangeModal.loading}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg ${pinChangeModal.loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1CA672] hover:bg-[#17905F] shadow-green-200'}`}
                  >
                    {pinChangeModal.loading ? '⏳ Saving...' : '🔐 Update PIN'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
