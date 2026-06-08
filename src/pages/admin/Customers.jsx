import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useOrdersStore } from '../../store/ordersStore';
import { formatPrice } from '../../utils/helpers';
import { Phone, Shield, Truck, User, Trash2, Plus, Gift, Ban, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Customers() {
  const registeredUsers = useAdminStore((state) => state.registeredUsers) || [];
  const orders = useOrdersStore((state) => state.orders) || [];
  const updateUserRole = useAdminStore((state) => state.updateUserRole);
  const deleteUser = useAdminStore((state) => state.deleteUser);
  const updateWalletBalance = useAdminStore((state) => state.updateWalletBalance);
  const toggleUserBlock = useAdminStore((state) => state.toggleUserBlock);
  const blacklist = useAdminStore((state) => state.blacklist) || { emails: [], phones: [] };
  const [searchParams] = useSearchParams();
  const [filterReferred, setFilterReferred] = useState(searchParams.get('filter') === 'referral');

  useEffect(() => {
    if (searchParams.get('filter') === 'referral') {
      setTimeout(() => setFilterReferred(true), 0);
    }
  }, [searchParams]);

  const comparePhones = (phone1, phone2) => {
    if (!phone1 || !phone2) return false;
    const p1 = String(phone1).replace(/\D/g, '');
    const p2 = String(phone2).replace(/\D/g, '');
    if (p1.length < 10 || p2.length < 10) return p1 === p2;
    return p1.slice(-10) === p2.slice(-10);
  };

  const customersWithStats = useMemo(() => {
    // Combine registered users and order customers
    const allCustomers = [...registeredUsers];

    // Add people who ordered but might not be in registeredUsers (guest checkouts if any)
    orders.forEach(order => {
      const phone = order.deliveryAddress?.phone || order.address?.phone;
      const email = order.customerEmail;
      
      let isExisting = false;
      if (email) {
        isExisting = allCustomers.some(c => c.email?.toLowerCase() === email.toLowerCase());
      } else if (phone) {
        isExisting = allCustomers.some(c => !c.email && comparePhones(c.phone, phone));
      }

      if (!isExisting && (email || phone)) {
        allCustomers.push({
          id: `guest_${order.id}`,
          name: order.deliveryAddress?.fullName || order.address?.name || 'Guest Customer',
          email: email || null,
          phone: phone || 'N/A',
          role: 'customer',
          joinedDate: order.placedAt
        });
      }
    });

    // Calculate stats for each customer
    return allCustomers.map(c => {
      const customerOrders = orders.filter(o => {
        // If the customer has an email and order has an email, match by email
        if (c.email && o.customerEmail) {
          return c.email.toLowerCase() === o.customerEmail.toLowerCase();
        }
        // If neither has an email, match by phone (guest users)
        if (!c.email && !o.customerEmail) {
          return comparePhones(o.deliveryAddress?.phone || o.address?.phone, c.phone);
        }
        return false;
      });

      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

      // Find who referred this customer (Lookup by their code)
      let referrerName = null;
      if (c.referredBy) {
        const referrer = registeredUsers.find(u => u.referralCode === c.referredBy);
        referrerName = referrer ? referrer.name : c.referredBy;
      }

      const isBlocked = c.isBlocked || 
                        (c.email && blacklist.emails?.includes(c.email.toLowerCase())) || 
                        (c.phone && blacklist.phones?.includes(c.phone));

      return {
        ...c,
        totalOrders: customerOrders.length,
        totalSpent,
        referrerName,
        isBlocked
      };
    });
  }, [registeredUsers, orders, blacklist]);

  const filteredCustomers = useMemo(() => filterReferred
    ? customersWithStats.filter(c => c.referredBy)
    : customersWithStats, [filterReferred, customersWithStats]);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'pro_admin': return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-amber-200 shadow-sm"><Shield size={10} fill="currentColor" /> Pro Admin ⭐</span>;
      case 'admin': return <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-purple-200"><Shield size={10} /> Admin</span>;
      case 'delivery_boy': return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-blue-200"><Truck size={10} /> Delivery Boy</span>;
      default: return <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-gray-200"><User size={10} /> Customer</span>;
    }
  };

  const adminRole = useAdminStore((state) => state.adminRole);
  const currentAdminUsername = useAdminStore((state) => state.currentAdminUsername);
  const isProAdmin = adminRole === 'pro_admin' || currentAdminUsername === 'monugandhi5911';

  const [pinModal, setPinModal] = useState({
    open: false, userId: null, newRole: null,
    step: 'new', // 'verify' or 'new'
    oldPin: '', pin: '', confirmPin: '',
    loading: false, hasExistingPin: false
  });
  const [walletModal, setWalletModal] = useState({ open: false, user: null, amount: '', loading: false });

  const handleRoleChange = async (id, currentRole, newRole) => {
    if (!isProAdmin) {
      toast.error('Access Denied: Only Pro Admin can change roles');
      return;
    }

    if (currentRole === 'pro_admin' && id.includes('monugandhi5911')) {
      toast.error('Cannot change role of Master Admin');
      return;
    }

    if (newRole === 'admin' || newRole === 'delivery_boy') {
      // Check if user already has a staffPin
      const user = registeredUsers.find(u => u.id === id || u.email === id);
      const hasExistingPin = !!(user && user.staffPin);

      setPinModal({
        open: true, userId: id, newRole: newRole,
        step: hasExistingPin ? 'verify' : 'new',
        oldPin: '', pin: '', confirmPin: '',
        loading: false, hasExistingPin
      });
      return;
    }

    await updateUserRole(id, newRole);
    toast.success(`Role updated to ${newRole}`);
  };

  const handleVerifyOldStaffPin = async () => {
    if (!pinModal.oldPin || pinModal.oldPin.length < 4) {
      toast.error('Enter the current PIN');
      return;
    }
    setPinModal(prev => ({ ...prev, loading: true }));
    try {
      // Get user from Firestore to verify PIN
      const userRef = doc(db, 'users', pinModal.userId.toLowerCase());
      const snap = await getDoc(userRef);

      if (snap.exists() && snap.data().staffPin === pinModal.oldPin) {
        setPinModal(prev => ({ ...prev, step: 'new', loading: false }));
        toast.success('Old PIN verified! ✅');
      } else {
        toast.error('❌ Wrong current PIN!');
        setPinModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('PIN verify error:', err);
      toast.error('Verification failed');
      setPinModal(prev => ({ ...prev, loading: false }));
    }
  };

  const submitPinChange = async () => {
    if (!pinModal.pin || pinModal.pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    if (pinModal.pin !== pinModal.confirmPin) {
      toast.error('PINs do not match!');
      return;
    }
    setPinModal(prev => ({ ...prev, loading: true }));
    try {
      await updateUserRole(pinModal.userId, pinModal.newRole, pinModal.pin);
      toast.success(`✅ Role updated to ${pinModal.newRole}!`);
      setPinModal({ open: false, userId: null, newRole: null, step: 'new', oldPin: '', pin: '', confirmPin: '', loading: false, hasExistingPin: false });
    } catch (err) {
      console.error('Role update failed:', err);
      toast.error('Failed to update role: ' + err.message);
      setPinModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleWalletUpdate = async () => {
    if (!walletModal.amount || isNaN(walletModal.amount)) {
      toast.error('Please enter a valid amount');
      return;
    }
    setWalletModal(prev => ({ ...prev, loading: true }));
    try {
      await updateWalletBalance(walletModal.user.email, parseFloat(walletModal.amount));
      toast.success(`₹${walletModal.amount} adjusted for ${walletModal.user.name}`);
      setWalletModal({ open: false, user: null, amount: '', loading: false });
    } catch (error) {
      console.error(error);
      toast.error('Failed to update wallet');
      setWalletModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDelete = async (id) => {
    if (id.startsWith('guest_')) {
      toast.error('Cannot delete guest customers. They are linked to orders.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      const deleteToast = toast.loading('Deleting user...');
      try {
        await deleteUser(id);
        toast.success('User deleted successfully', { id: deleteToast });
      } catch (err) {
        console.error('Delete error:', err);
        toast.error('Failed to delete user: ' + err.message, { id: deleteToast });
      }
    }
  };

  const handleToggleBlock = async (c) => {
    if (c.id.startsWith('guest_')) {
      toast.error('Cannot block guest users.');
      return;
    }
    const action = c.isBlocked ? 'unblock' : 'block';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      const toastId = toast.loading(`${action === 'block' ? 'Blocking' : 'Unblocking'} user...`);
      await toggleUserBlock(c.email, c.phone, !c.isBlocked);
      toast.success(`User ${action}ed!`, { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* PIN Modal */}
      {pinModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">{pinModal.step === 'verify' ? '🔒' : '🔑'}</span>
              </div>
              <h3 className="text-xl font-black text-gray-900">
                {pinModal.step === 'verify' ? 'Verify Current PIN' : 'Set Staff PIN'}
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {pinModal.step === 'verify'
                  ? 'Enter the current PIN to proceed'
                  : `Assign a login PIN for the new ${pinModal.newRole}.`
                }
              </p>
            </div>

            {pinModal.step === 'verify' ? (
              /* Step 1: Verify Old PIN */
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current PIN</label>
                  <input
                    type="password"
                    placeholder="Enter current PIN"
                    value={pinModal.oldPin}
                    onChange={(e) => setPinModal({ ...pinModal, oldPin: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-amber-400 transition-colors"
                    autoFocus
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPinModal({ open: false, userId: null, newRole: null, step: 'new', oldPin: '', pin: '', confirmPin: '', hasExistingPin: false })}
                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyOldStaffPin}
                    disabled={pinModal.loading}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg ${pinModal.loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}
                  >
                    {pinModal.loading ? '⏳ Verifying...' : 'Verify PIN'}
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
                    value={pinModal.pin}
                    onChange={(e) => setPinModal({ ...pinModal, pin: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-[#1CA672] transition-colors"
                    autoFocus
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confirm PIN</label>
                  <input
                    type="password"
                    placeholder="Re-enter PIN"
                    value={pinModal.confirmPin}
                    onChange={(e) => setPinModal({ ...pinModal, confirmPin: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-[#1CA672] transition-colors"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (pinModal.hasExistingPin) {
                        setPinModal(prev => ({ ...prev, step: 'verify', oldPin: '' }));
                      } else {
                        setPinModal({ open: false, userId: null, newRole: null, step: 'new', oldPin: '', pin: '', confirmPin: '', hasExistingPin: false });
                      }
                    }}
                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {pinModal.hasExistingPin ? '← Back' : 'Cancel'}
                  </button>
                  <button
                    onClick={submitPinChange}
                    disabled={pinModal.loading}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-green-200 ${pinModal.loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1CA672] hover:bg-[#17905F]'}`}
                  >
                    {pinModal.loading ? '⏳ Saving...' : '🔐 Set PIN'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {walletModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 mb-2">Adjust Wallet Balance</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">User: <span className="text-gray-900 font-bold">{walletModal.user.name}</span></p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Amount to Add/Subtract</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 text-lg">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 100 or -50"
                    value={walletModal.amount}
                    onChange={(e) => setWalletModal({ ...walletModal, amount: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-8 pr-4 py-4 text-xl font-black focus:outline-none focus:border-[#1CA672] transition-colors"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Use negative sign (e.g. -50) to subtract money.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setWalletModal({ open: false, user: null, amount: '' })}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWalletUpdate}
                disabled={walletModal.loading}
                className={`flex-1 py-3.5 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-green-200 ${walletModal.loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1CA672] hover:bg-[#17905F]'}`}
              >
                {walletModal.loading ? '⏳ Updating...' : 'Update Balance'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">User & Staff Management</h1>
          <p className="text-gray-500">Manage roles for Admins, Delivery Boys, and Customers</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterReferred(!filterReferred)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filterReferred ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            <Gift size={16} /> {filterReferred ? 'Showing Referred' : 'Filter by Referral'}
          </button>
          {isProAdmin && (
            <button
              onClick={() => {
                if (window.confirm('WARNING: This will delete ALL users except admins. This cannot be undone. Proceed?')) {
                  useAdminStore.getState().wipeAllNonAdminUsers();
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              🔥 WIPE ALL USERS
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4">User</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Referral</th>
                <th className="p-4">Role</th>
                <th className="p-4">Wallet</th>
                <th className="p-4">Orders / Spent</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.isBlocked ? 'bg-red-50/50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${c.role === 'pro_admin' ? 'bg-amber-500 shadow-lg shadow-amber-200' : c.role === 'admin' ? 'bg-purple-500' : c.role === 'delivery_boy' ? 'bg-blue-500' : 'bg-[#1CA672]'}`}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{c.name}</p>
                          {c.id.startsWith('guest_') ? (
                            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Guest</span>
                          ) : (
                            <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-green-200">Registered</span>
                          )}
                        </div>
                        {c.email && (
                          <p className="text-[11px] text-gray-400 font-medium lowercase leading-tight mt-0.5">{c.email}</p>
                        )}
                        <div className="mt-1.5 flex gap-1 flex-wrap">
                          {getRoleBadge(c.role)}
                          {c.isBlocked && <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-red-200"><Ban size={10} /> Blocked</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div className="flex flex-col space-y-1">
                      <span className="flex items-center gap-1 font-medium"><Phone size={14} /> {c.phone}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {c.referralCode && (
                        <div className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[9px] font-bold self-start uppercase tracking-wider">
                          Code: {c.referralCode}
                        </div>
                      )}
                      {c.referredBy ? (
                        <div className="flex flex-col border-l-2 border-amber-200 pl-2">
                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Invited By</span>
                          <div className="flex items-center gap-1.5">
                            <Gift size={12} className="text-amber-500" />
                            <p className="text-xs font-bold text-gray-900">{c.referrerName}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 italic font-medium">Direct Join</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {!c.id.startsWith('guest_') ? (
                      c.role === 'pro_admin' ? (
                        <span className="text-[10px] text-amber-600 font-black bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">🔒 Master Admin</span>
                      ) : (
                        <select
                          value={c.role || 'customer'}
                          onChange={(e) => handleRoleChange(c.id, c.role, e.target.value)}
                          disabled={!isProAdmin}
                          className={`bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1CA672] ${!isProAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="customer">Customer</option>
                          <option value="delivery_boy">Delivery Boy</option>
                          <option value="admin">Admin</option>
                        </select>
                      )
                    ) : (
                      <div className="text-[10px] text-gray-400 font-medium italic italic leading-tight">
                        No Account Found<br />
                        <span className="text-[9px] text-gray-300">(Guest Customer)</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-50 text-[#1CA672] px-3 py-1.5 rounded-xl border border-green-100">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Balance</p>
                        <p className="font-black text-sm leading-none">{formatPrice(c.walletBalance || 0)}</p>
                      </div>
                      {!c.id.startsWith('guest_') && isProAdmin && (
                        <button
                          onClick={() => setWalletModal({ open: true, user: c, amount: '', loading: false })}
                          className="p-2 bg-gray-900 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-gray-200"
                          title="Adjust Balance"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-900 text-sm">{c.totalOrders} Orders</p>
                    <p className="font-bold text-[#1CA672] text-xs">{formatPrice(c.totalSpent)}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {c.joinedDate ? new Date(c.joinedDate).toLocaleDateString() : (c.id.startsWith('guest_') ? 'N/A' : 'New User')}
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {!c.id.startsWith('guest_') && (
                      <button
                        onClick={() => handleToggleBlock(c)}
                        title={c.isBlocked ? 'Unblock User' : 'Block User'}
                        className={`p-2 rounded-lg transition-colors inline-flex ${c.isBlocked ? 'text-green-500 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                      >
                        {c.isBlocked ? <Unlock size={18} /> : <Ban size={18} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {customersWithStats.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
