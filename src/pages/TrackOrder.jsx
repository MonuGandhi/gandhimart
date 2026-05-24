import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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

function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDlat = Math.sin(dLat/2);
  const sinDlon = Math.sin(dLon/2);
  const aa = sinDlat*sinDlat + Math.cos(lat1)*Math.cos(lat2)*sinDlon*sinDlon;
  const cc = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
  return R * cc;
}

export default function TrackOrder() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get('id');
  const mapRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const polyRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      toast.error('No order id provided for tracking');
      setLoading(false);
      return;
    }

    let unsubscribe = null;
    let L;

    (async () => {
      try {
        L = await loadLeaflet();
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        if (!orderSnap.exists()) {
          toast.error('Order not found');
          setLoading(false);
          return;
        }
        const order = orderSnap.data();
        const custLoc = order.deliveryLat && order.deliveryLng ? { lat: order.deliveryLat, lng: order.deliveryLng } : null;

        mapRef.current = L.map('track-map').setView(custLoc || [20,78], custLoc ? 13 : 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);

        if (custLoc) {
          customerMarkerRef.current = L.marker(custLoc).addTo(mapRef.current).bindPopup('Delivery Location').openPopup();
        }

        // Listen for delivery boy live location
        const trackRef = doc(db, 'delivery_tracking', orderId);
        unsubscribe = onSnapshot(trackRef, (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          const delLoc = { lat: data.delivery_lat, lng: data.delivery_lng };
          if (!deliveryMarkerRef.current) {
            deliveryMarkerRef.current = L.marker(delLoc, { icon: L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png', iconSize: [25,41], iconAnchor: [12,41] }) }).addTo(mapRef.current).bindPopup('Delivery');
          } else {
            deliveryMarkerRef.current.setLatLng(delLoc);
          }

          // Draw line
          if (custLoc) {
            const points = [custLoc, delLoc];
            if (polyRef.current) polyRef.current.setLatLngs(points);
            else polyRef.current = L.polyline(points, { color: '#1CA672' }).addTo(mapRef.current);
            const dist = haversine(custLoc, delLoc);
            deliveryMarkerRef.current.bindPopup(`Delivery — ${ (dist/1000).toFixed(2) } km away`).openPopup();
          }

          // auto-fit
          if (custLoc) {
            const group = L.featureGroup([customerMarkerRef.current, deliveryMarkerRef.current]);
            mapRef.current.fitBounds(group.getBounds(), { padding: [50,50] });
          } else {
            mapRef.current.setView(delLoc, 13);
          }
        });

        setLoading(false);
      } catch (err) {
        console.error('TrackOrder init error:', err);
        toast.error('Failed to initialize tracking');
        setLoading(false);
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
      try { mapRef.current && mapRef.current.remove(); } catch(e){}
    };
  }, [orderId]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-3">Track Order {orderId}</h1>
        {loading ? <p>Loading map…</p> : <div id="track-map" style={{ height: '60vh', width: '100%' }} />}
      </div>
    </Layout>
  );
}
