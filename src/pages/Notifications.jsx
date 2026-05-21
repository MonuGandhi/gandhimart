import { useNavigate } from 'react-router-dom';
import { Bell, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useNotificationStore } from '../store/notificationsStore';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/helpers';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, readIds, deletedIds, markAsRead, deleteNotification } = useNotificationStore();

  const visibleNotifications = notifications.filter(
    n => !deletedIds.includes(n.id) && 
         (!n.phone || n.phone === user?.phone) &&
         (!n.email || n.email === user?.email)
  );



  return (
    <Layout>
      <div className="p-4 pb-24 max-w-2xl mx-auto">
        {visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No notifications yet</h3>
            <p className="text-sm text-gray-500 mb-6">We'll notify you about orders and special offers.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#1CA672] text-white font-bold px-6 py-3 rounded-xl"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map((n) => {
              const isRead = readIds.includes(n.id);
              return (
              <div 
                key={n.id} 
                className={`p-4 rounded-2xl border transition-all ${isRead ? 'bg-white border-gray-100 opacity-75' : 'bg-green-50/30 border-green-100 shadow-sm'}`}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${n.type === 'order' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    <Bell size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold text-gray-900 ${isRead ? '' : 'text-green-900'}`}>{n.title}</h3>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">{formatDate(n.createdAt)}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </Layout>
  );
}
