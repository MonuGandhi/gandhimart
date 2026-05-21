import React, { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function OfferSegmentCard({
  segment,
  users,
  offerText,
  selectedUsers,
  onOfferChange,
  onUserToggle,
  onSelectAll,
  onDeselectAll,
  onSave,
  isSaving
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.phone.includes(searchTerm)
    );
  }, [users, searchTerm]);

  const segmentConfig = {
    never_ordered: {
      icon: '🎁',
      title: 'Never Ordered',
      bgGradient: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      headerBg: 'bg-purple-100',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      badgeColor: 'bg-purple-100 text-purple-700'
    },
    inactive: {
      icon: '😴',
      title: 'Inactive (30+ days)',
      bgGradient: 'from-yellow-50 to-orange-50',
      borderColor: 'border-yellow-200',
      headerBg: 'bg-yellow-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      badgeColor: 'bg-yellow-100 text-yellow-700'
    },
    cart_abandoned: {
      icon: '🛒',
      title: 'Cart Abandoned',
      bgGradient: 'from-red-50 to-orange-50',
      borderColor: 'border-red-200',
      headerBg: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      badgeColor: 'bg-red-100 text-red-700'
    }
  };

  const config = segmentConfig[segment];

  return (
    <div className={`bg-gradient-to-br ${config.bgGradient} rounded-2xl border-2 ${config.borderColor} shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`${config.headerBg} p-4 cursor-pointer`} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="font-bold text-gray-900">{config.title}</h3>
              <p className="text-xs text-gray-600">{users.length} users</p>
            </div>
          </div>
          <ChevronDown
            size={20}
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Offer Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Your Offer
            </label>
            <textarea
              value={offerText}
              onChange={(e) => onOfferChange(e.target.value)}
              placeholder={`e.g., "Welcome! Get 20% off on first purchase"`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
            />
          </div>

          {/* User Selection Header */}
          {users.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">
                Select Users ({selectedUsers.size} / {users.length})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onSelectAll}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={onDeselectAll}
                  className="text-[10px] font-bold text-gray-600 hover:text-gray-700 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          {users.length > 5 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* User List */}
          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-white">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.phone}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    id={`${segment}_${user.phone}`}
                    checked={selectedUsers.has(user.phone)}
                    onChange={() => onUserToggle(user.phone)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                  <label
                    htmlFor={`${segment}_${user.phone}`}
                    className="flex-1 cursor-pointer text-xs"
                  >
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-gray-500">{user.phone}</p>
                  </label>
                </div>
              ))
            ) : users.length > 0 ? (
              <p className="text-center text-xs text-gray-500 py-4">No users match your search</p>
            ) : (
              <p className="text-center text-xs text-gray-500 py-4">No users in this segment</p>
            )}
          </div>

          {/* Save Button */}
          {users.length > 0 && (
            <button
              onClick={onSave}
              disabled={!offerText.trim() || selectedUsers.size === 0 || isSaving}
              className={`w-full py-2.5 rounded-lg font-bold text-white text-sm transition-all ${config.buttonColor} ${
                !offerText.trim() || selectedUsers.size === 0 || isSaving
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {isSaving ? 'Saving...' : `Save Offer (${selectedUsers.size} selected)`}
            </button>
          )}

          {users.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              <p>No users in this segment yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
