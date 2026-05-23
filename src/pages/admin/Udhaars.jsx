import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2, RotateCcw, Phone, Hash } from 'lucide-react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../../firebase';
import { formatPrice } from '../../utils/helpers';

export default function Udhaars() {
  const [udhaars, setUdhaars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'udhaars'),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        records.sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
        setUdhaars(records);
      },
      (err) => {
        console.error('Udhaar sync error:', err);
        toast.error('Udhaar data load failed');
      }
    );

    return () => unsub();
  }, []);

  const filteredUdhaars = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return udhaars.filter((u) => {
      const name = (u.customer_name || '').toLowerCase();
      const phone = String(u.customer_phone || '').toLowerCase();
      const orderId = String(u.order_id || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || phone.includes(q) || orderId.includes(q);
      const matchesStatus = statusFilter === 'all' || (u.status || 'pending') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [udhaars, searchTerm, statusFilter]);

  const pendingTotal = useMemo(
    () => filteredUdhaars
      .filter((u) => (u.status || 'pending') === 'pending')
      .reduce((sum, u) => sum + Number(u.amount || 0), 0),
    [filteredUdhaars]
  );

  const markStatus = async (record, status) => {
    if (!record?.id) return;
    if ((record.status || 'pending') === status) return;

    const loading = toast.loading(status === 'paid' ? 'Marking paid...' : 'Marking pending...');

    try {
      const patch = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'paid') {
        patch.paid_date = new Date().toISOString().split('T')[0];
      }

      await updateDoc(doc(db, 'udhaars', record.id), patch);

      if (record.order_id) {
        await updateDoc(doc(db, 'orders', record.order_id), {
          udhaarStatus: status
        });
      }

      toast.success(`Udhaar marked as ${status}`, { id: loading });
    } catch (err) {
      console.error('Udhaar status update error:', err);
      toast.error(`Status update failed: ${err.message}`, { id: loading });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Udhaar Management</h1>
          <p className="text-gray-500">Track pending and paid customer udhaar entries</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <p className="text-xs uppercase tracking-wider text-amber-700 font-bold">Pending Total</p>
          <p className="text-xl font-black text-amber-800">{formatPrice(pendingTotal)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by customer, phone, or order id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1CA672]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA672]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4">Customer</th>
                <th className="p-4">Order</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUdhaars.map((u) => {
                const isPending = (u.status || 'pending') === 'pending';
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{u.customer_name || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Phone size={12} /> {u.customer_phone || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-1"><Hash size={13} /> {u.order_id || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-black text-gray-900">{formatPrice(Number(u.amount || 0))}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{u.date || '-'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${isPending ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                        {isPending ? 'Pending' : 'Paid'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isPending ? (
                        <button
                          onClick={() => markStatus(u, 'paid')}
                          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                          <CheckCircle2 size={15} /> Mark Paid
                        </button>
                      ) : (
                        <button
                          onClick={() => markStatus(u, 'pending')}
                          className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                          <RotateCcw size={15} /> Mark Pending
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUdhaars.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No udhaar records found.
          </div>
        )}
      </div>
    </div>
  );
}
