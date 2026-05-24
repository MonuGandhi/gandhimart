import { useEffect, useRef, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';

const loadLeaflet = () => new Promise((resolve, reject) => {
  if (window.L) return resolve(window.L);
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
  document.head.appendChild(css);
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
  script.async = true;
  script.onload = () => resolve(window.L);
  script.onerror = reject;
  document.body.appendChild(script);
});

export default function ActiveDeliveries() {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = null;
    let L;
    (async () => {
      try {
        L = await loadLeaflet();
        mapRef.current = L.map('admin-deliveries-map').setView([20,78], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(mapRef.current);

        const q = collection(db, 'delivery_tracking');
        unsub = onSnapshot(q, (snap) => {
          snap.docChanges().forEach((change) => {
            const id = change.doc.id;
            const data = change.doc.data();
            if (change.type === 'added' || change.type === 'modified') {
              const lat = data.delivery_lat;
              const lng = data.delivery_lng;
              if (markersRef.current[id]) {
                markersRef.current[id].setLatLng([lat, lng]);
              } else {
                markersRef.current[id] = L.marker([lat, lng]).addTo(mapRef.current).bindPopup(`Order ${id}`);
              }
            } else if (change.type === 'removed') {
              if (markersRef.current[id]) {
                mapRef.current.removeLayer(markersRef.current[id]);
                delete markersRef.current[id];
              }
            }
          });
        });
        setLoading(false);
      } catch (err) {
        console.error('ActiveDeliveries init error:', err);
        toast.error('Failed to initialize admin deliveries map');
        setLoading(false);
      }
    })();

    return () => { if (unsub) unsub(); try { mapRef.current && mapRef.current.remove(); } catch(e){} };
  }, []);

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-xl font-bold mb-3">Active Deliveries Map</h1>
        {loading ? <p>Loading map…</p> : <div id="admin-deliveries-map" style={{ height: '70vh', width: '100%' }} />}
      </div>
    </Layout>
  );
}
