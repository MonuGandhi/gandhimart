import React, { useState, useMemo } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useOrdersStore } from '../../store/ordersStore';
import { getNeverOrderedUsers, getInactiveUsers, getCartAbandonedUsers } from '../../utils/segmentation';
import { sendOfferNotification } from '../../utils/oneSignal';
import OfferSegmentCard from '../../components/admin/OfferSegmentCard';
import toast from 'react-hot-toast';
import { Gift, Send } from 'lucide-react';

export default function SpecialOffers() {
  const registeredUsers = useAdminStore((state) => state.registeredUsers) || [];
  const orders = useOrdersStore((state) => state.orders) || [];
  const adminOffers = useAdminStore((state) => state.adminOffers) || [];
  const addOffer = useAdminStore((state) => state.addOffer);
  const deleteOffer = useAdminStore((state) => state.deleteOffer);

  const [selectedUsers, setSelectedUsers] = useState({
    never_ordered: new Set(),
    inactive: new Set(),
    cart_abandoned: new Set()
  });

  const [offerText, setOfferText] = useState({
    never_ordered: '',
    inactive: '',
    cart_abandoned: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const segments = useMemo(() => ({
    never_ordered: getNeverOrderedUsers(registeredUsers, orders),
    inactive: getInactiveUsers(orders, registeredUsers),
    cart_abandoned: getCartAbandonedUsers()
  }), [registeredUsers, orders]);

  const handleSelectAll = (segment) => {
    const newSelected = new Set(selectedUsers[segment]);
    segments[segment].forEach(user => newSelected.add(user.phone));
    setSelectedUsers({
      ...selectedUsers,
      [segment]: newSelected
    });
  };

  const handleDeselectAll = (segment) => {
    setSelectedUsers({
      ...selectedUsers,
      [segment]: new Set()
    });
  };

  const handleUserToggle = (segment, phone) => {
    const newSelected = new Set(selectedUsers[segment]);
    if (newSelected.has(phone)) {
      newSelected.delete(phone);
    } else {
      newSelected.add(phone);
    }
    setSelectedUsers({
      ...selectedUsers,
      [segment]: newSelected
    });
  };

  const handleOfferChange = (segment, text) => {
    setOfferText({
      ...offerText,
      [segment]: text
    });
  };

  const handleSaveOffer = async (segment) => {
    if (!offerText[segment].trim()) {
      toast.error('Please enter an offer text');
      return;
    }

    if (selectedUsers[segment].size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setIsSaving(true);

    try {
      const targetedUsers = segments[segment]
        .filter(u => selectedUsers[segment].has(u.phone))
        .map(u => ({
          phone: u.phone,
          name: u.name,
          uid: u.uid || null
        }));

      const offerData = {
        segment,
        offerText: offerText[segment],
        targetedUsers,
        isActive: true,
        sentAt: null
      };

      await addOffer(offerData);

      toast.success(`Offer saved for ${targetedUsers.length} users! ✅`);

      setOfferText({
        ...offerText,
        [segment]: ''
      });

      setSelectedUsers({
        ...selectedUsers,
        [segment]: new Set()
      });
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendNotification = async (offer) => {
    setIsSaving(true);
    const loadingToast = toast.loading(`📱 Sending to ${offer.targetedUsers.length} users...`);

    try {
      const result = await sendOfferNotification(
        offer.offerText,
        offer.segment,
        offer.targetedUsers
      );

      if (result?.success) {
        toast.dismiss(loadingToast);
        toast.success(`✅ Sent to ${offer.targetedUsers.length} users!`, { duration: 4000 });
        await deleteOffer(offer.id);
      } else {
        toast.dismiss(loadingToast);
        toast.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to send notification. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Gift className="text-amber-500" size={24} />
            Special Offers
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create targeted offers for customer segments</p>
        </div>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['never_ordered', 'inactive', 'cart_abandoned'].map((segment) => (
          <OfferSegmentCard
            key={segment}
            segment={segment}
            users={segments[segment]}
            offerText={offerText[segment]}
            selectedUsers={selectedUsers[segment]}
            onOfferChange={(text) => handleOfferChange(segment, text)}
            onUserToggle={(phone) => handleUserToggle(segment, phone)}
            onSelectAll={() => handleSelectAll(segment)}
            onDeselectAll={() => handleDeselectAll(segment)}
            onSave={() => handleSaveOffer(segment)}
            isSaving={isSaving}
          />
        ))}
      </div>

      {/* Existing Offers Summary */}
      {adminOffers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Active Offers
          </h2>

          <div className="space-y-3">
            {adminOffers.map((offer) => {
              const segmentConfig = {
                never_ordered: { icon: '🎁', title: 'Never Ordered' },
                inactive: { icon: '😴', title: 'Inactive' },
                cart_abandoned: { icon: '🛒', title: 'Cart Abandoned' }
              };

              const config = segmentConfig[offer.segment];

              return (
                <div
                  key={offer.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{config.icon}</span>
                      <p className="font-semibold text-gray-900">{config.title}</p>
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
                        {offer.targetedUsers?.length || 0} users
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{offer.offerText}</p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(offer.createdAt?.toDate?.() || offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleSendNotification(offer)}
                      disabled={isSaving}
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold px-3 py-2 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                      title="Send push notification to all selected users"
                    >
                      <Send size={14} className="inline mr-1" /> Send
                    </button>
                    <button
                      onClick={() => {
                        deleteOffer(offer.id);
                        toast.success('Offer deleted');
                      }}
                      className="text-red-500 hover:text-red-700 text-xs font-bold px-3 py-2 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {adminOffers.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8 text-center">
          <Gift size={32} className="mx-auto text-blue-500 mb-3" />
          <p className="text-gray-600 font-semibold">No offers created yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Create your first offer above to start engaging customers!
          </p>
        </div>
      )}
    </div>
  );
}
