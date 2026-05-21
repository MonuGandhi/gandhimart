import { useState } from 'react';
import { useNotificationStore } from '../../store/notificationsStore';
import { useAdminStore } from '../../store/adminStore';
import { sendGeneralNotification } from '../../utils/oneSignal';
import { Send, Bell, Megaphone, User, Users, Search as SearchIcon, Trash2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

export default function AdminNotifications() {
  const { notifications, deletedIds, addNotification, clearAll, deleteNotificationPermanently } = useNotificationStore();
  const { registeredUsers } = useAdminStore();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('promo');
  const [targetType, setTargetType] = useState('all'); // 'all' or 'specific'
  const [selectedUserUid, setSelectedUserUid] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  const filteredUsers = registeredUsers.filter(u => 
    (u.fullName || u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.phone && u.phone.includes(userSearch))
  ).slice(0, 5);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Please fill all fields');
      return;
    }

    if (targetType === 'specific' && !selectedUserUid) {
      toast.error('Please select a user');
      return;
    }

    setIsSending(true);
    const loadingToast = toast.loading('🚀 OneSignal se link ho raha hai...');

    try {
      // 1. Prepare Target
      let uids = [];
      if (targetType === 'specific') {
        if (!selectedUserUid) {
          toast.dismiss(loadingToast);
          toast.error('❌ User select karein pehle.');
          setIsSending(false);
          return;
        }
        uids = [selectedUserUid];
      }

      // 2. Call Push Utility
      console.log("[Push Center] Sending notification...", { title, targetType, uids });
      
      const pushResult = await sendGeneralNotification(
        title, 
        message, 
        targetType, 
        null, 
        uids
      );

      toast.dismiss(loadingToast);
      
      if (pushResult.success) {
        // 3. Add to Firestore for history only if push was successful
        await addNotification({
          title,
          message,
          type,
          target: targetType === 'all' ? 'All Users' : selectedUserName,
          createdAt: new Date().toISOString()
        });

        toast.success(`✅ Push Bhej Diya Gaya!`);
        setTitle('');
        setMessage('');
        setSelectedUserUid('');
        setSelectedUserName('');
        setUserSearch('');
      } else {
        console.error("[Push Center] Push Result Error:", pushResult.error);
        toast.error(`❌ Push Failed: ${pushResult.error}`, { duration: 6000 });
      }
    } catch (pushError) {
      console.error("[Push Center] Fatal Error:", pushError);
      toast.dismiss(loadingToast);
      toast.error('Galtii: ' + pushError.message);
    } finally {
      setIsSending(false);
    }
  };

  const adminNotes = notifications.filter(n => n.type !== 'order' && !deletedIds?.includes(n.id));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Smartphone className="text-[#1CA672]" /> OneSignal Push Center
          </h1>
          <p className="text-gray-500 font-medium text-sm">Directly send mobile & desktop push notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Form */}
        <div className="bg-white p-6 rounded-3xl border-2 border-green-50 shadow-xl shadow-green-900/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Megaphone size={22} className="text-[#1CA672]" /> 
              OneSignal Campaign
            </h2>
            <span className="px-3 py-1 bg-green-100 text-[#1CA672] text-[10px] font-black rounded-full uppercase tracking-widest">Live Now</span>
          </div>

          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-3">Kise bhejna hai? (Target)</label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-4 text-center">
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${targetType === 'all' ? 'bg-[#1CA672] text-white shadow-lg' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <Users size={18} /> Sabhi Log (All)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('specific')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${targetType === 'specific' ? 'bg-[#1CA672] text-white shadow-lg' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <User size={18} /> Ek Khass User
                </button>
              </div>

              {targetType === 'specific' && (
                <div className="space-y-3 mb-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="text"
                      placeholder="Name ya Phone se search karein..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-[#1CA672] outline-none transition-all"
                    />
                  </div>
                  
                  {userSearch && (
                    <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-sm">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <button
                            key={user.id || user.phone}
                            type="button"
                            onClick={() => {
                              if (!user.uid) {
                                toast.error('Yeh user link nahi hai. Unhe login karne ko kahein.');
                                return;
                              }
                              setSelectedUserUid(user.uid);
                              setSelectedUserName(user.fullName || user.name || user.phone);
                              setUserSearch('');
                            }}
                            className={`w-full flex items-center justify-between p-3 hover:bg-green-50 transition-colors ${selectedUserUid === user.uid ? 'bg-green-50' : ''}`}
                          >
                            <div className="text-left">
                              <p className="text-sm font-bold text-gray-900">{user.fullName || user.name}</p>
                              <p className="text-xs text-gray-500">{user.phone}</p>
                            </div>
                            {user.uid ? (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Link OK</span>
                            ) : (
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">No UID</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="p-3 text-xs text-gray-500 italic">Koyi user nahi mila...</p>
                      )}
                    </div>
                  )}

                  {selectedUserUid && !userSearch && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl border-2 border-[#1CA672]/20">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected User</p>
                        <p className="text-sm font-black text-gray-900">{selectedUserName}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedUserUid('');
                          setSelectedUserName('');
                        }}
                        className="p-1 px-3 text-red-500 text-xs font-black uppercase hover:bg-red-50 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Push Heading (Title)</label>
                <input
                  type="text"
                  placeholder="G Mart: 10 Min Delivery!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-[#1CA672] outline-none transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Message Content</label>
                <textarea
                  rows="3"
                  placeholder="Aapke liye special offer! Jaldi check karein..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-[#1CA672] outline-none transition-all"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('promo')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${type === 'promo' ? 'border-[#1CA672] bg-green-50 text-[#1CA672]' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                >
                  🚀 Promotion
                </button>
                <button
                  type="button"
                  onClick={() => setType('alert')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${type === 'alert' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                >
                  ⚠️ Important Alert
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className={`w-full py-4 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${isSending ? 'bg-gray-300' : 'bg-[#1CA672] hover:scale-[1.02] active:scale-95 shadow-green-900/20'}`}
            >
              {isSending ? (
                <>Wait...</>
              ) : (
                <>
                  <Smartphone size={24} />
                  SEND PUSH NOW
                </>
              )}
            </button>
          </form>
        </div>

        {/* History / Recent List */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Bell size={20} /> Recent Campaigns
            </h2>
            <button
              onClick={() => {
                if(window.confirm('Saara history delete karein?')) clearAll();
              }}
              className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
            >
              Clear Log
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex-1 min-h-[400px] overflow-hidden">
            {adminNotes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Megaphone size={30} />
                </div>
                <p className="font-bold">Abhi tak koyi push nahi bheja gaya</p>
                <p className="text-xs">Upar wala form bharein aur link start karein</p>
              </div>
            ) : (
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                {adminNotes.map((notif) => (
                  <div key={notif.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${notif.type === 'alert' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-[#1CA672]'}`}>
                        {notif.type || 'Campaign'}
                      </span>
                      <button 
                        onClick={() => deleteNotificationPermanently(notif.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{notif.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        {notif.phone ? (
                          <><User size={12} /> <span className="text-[10px] font-bold">{notif.phone}</span></>
                        ) : (
                          <><Users size={12} /> <span className="text-[10px] font-bold">Everyone</span></>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 italic">{formatDate(notif.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

