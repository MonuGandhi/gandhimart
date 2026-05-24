import { useEffect, useRef, useState } from 'react';
import Layout from '../components/layout/Layout';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function DeliveryTracker() {
  const [orderId, setOrderId] = useState('');
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef(null);

  const startTracking = async () => {
    if (!orderId.trim()) { toast.error('Enter order id'); return; }
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    try {
      const writePosition = async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await setDoc(doc(db, 'delivery_tracking', orderId.trim()), {
          order_id: orderId.trim(),
          delivery_lat: lat,
          delivery_lng: lng,
          updated_at: serverTimestamp()
        }, { merge: true });
      };

      // Get initial position and write
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await writePosition(pos);
        // then start watchPosition to update continuously
        watchIdRef.current = navigator.geolocation.watchPosition(async (p) => {
          await writePosition(p);
        }, (err) => {
          console.error('watchPosition error', err);
          toast.error('Location update error');
        }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
        setTracking(true);
        toast.success('Started delivery tracking');
      }, (err) => {
        console.error('getCurrentPosition error', err);
        toast.error('Permission denied or unable to get location');
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
    } catch (err) {
      console.error('Start tracking error', err);
      toast.error('Failed to start tracking');
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setTracking(false);
    toast.success('Stopped tracking');
  };

  useEffect(() => {
    return () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  return (
    <Layout>
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">Delivery Tracker (Delivery Boy)</h1>
        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID (e.g., GM... )" className="w-full mb-3 p-2 border rounded" />
        {!tracking ? (
          <button onClick={startTracking} className="w-full bg-[#1CA672] text-white py-2 rounded">Start Delivery</button>
        ) : (
          <button onClick={stopTracking} className="w-full bg-red-500 text-white py-2 rounded">Stop Delivery</button>
        )}
        <p className="text-sm text-gray-500 mt-3">This will write your current GPS location to Firestore under `delivery_tracking/{orderId}` every few seconds.</p>
      </div>
    </Layout>
  );
}
