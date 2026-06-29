import React from 'react';

export default function LocationPermissionModal({ open, onAllow, onCancel, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="w-[92%] max-w-md bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-2">
          {loading ? "Location Fetch Ho Rahi Hai..." : "Location Access Needed"}
        </h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 border-4 border-[#1CA672]/30 border-t-[#1CA672] rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-gray-700">Aapki location pata ki ja rahi hai...</p>
            <p className="text-xs text-gray-400 mt-1.5">Kripya thoda wait karein aur back na dabayein 😊</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Hum aapki current location istemal karte hain taaki aapke liye delivery availability aur accurate tracking ensure kar saken. Kripya "Allow" dabayein.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 font-bold text-gray-700 active:scale-95 transition-transform">Cancel</button>
              <button onClick={onAllow} className="px-4 py-2 rounded-lg bg-[#1CA672] text-white font-black active:scale-95 transition-transform">Allow Location</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
