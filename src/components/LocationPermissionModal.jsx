import React from 'react';

export default function LocationPermissionModal({ open, onAllow, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="w-[92%] max-w-md bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-black text-gray-900 mb-2">Location Access Needed</h3>
        <p className="text-sm text-gray-600 mb-4">
          Hum aapki current location istemal karte hain taaki aapke liye delivery availability aur accurate tracking ensure kar saken. Kripya "Allow" dabayein.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 font-bold">Cancel</button>
          <button onClick={onAllow} className="px-4 py-2 rounded-lg bg-[#1CA672] text-white font-black">Allow Location</button>
        </div>
      </div>
    </div>
  );
}
