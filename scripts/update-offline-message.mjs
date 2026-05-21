import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjskyfVvkB5WM3v-meK8Sz5Ej7PA1BBaM",
  authDomain: "g-mart-live-b07a0.firebaseapp.com",
  projectId: "g-mart-live-b07a0",
  storageBucket: "g-mart-live-b07a0.firebasestorage.app",
  messagingSenderId: "284468125350",
  appId: "1:284468125350:web:5416982508a6b00e91de67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newMessage = `🌙 Aaj ke liye shop band ho gayi hai!

Hum kal subah 7 baje se phir ready honge aapki service ke liye. 😊

Koi zaruri order hai? Hume WhatsApp karein, hum try karenge! 💚`;

const newWhatsapp = "https://wa.me/918607424026?text=Namaste%20G%20Mart%20%F0%9F%91%8B%0A%0AMujhe%20order%20karna%20tha%20lekin%20store%20band%20hai.%20Kya%20aap%20help%20kar%20sakte%20hain%3F";

async function updateStoreSettings() {
  try {
    const ref = doc(db, 'settings', 'store');
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};
    
    const updated = {
      ...existing,
      offlineMessage: newMessage,
      whatsappLink: newWhatsapp,
      showSocialButtons: existing.showSocialButtons ?? true,
    };
    
    await setDoc(ref, updated);
    console.log("✅ Firestore store settings updated successfully!");
    console.log("📝 New offline message:", newMessage);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

updateStoreSettings();
