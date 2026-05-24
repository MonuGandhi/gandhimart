import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

async function checkOrder() {
  try {
    const orderId = "GM1779620272691";
    console.log(`Fetching order ${orderId}...`);
    const docSnap = await getDoc(doc(db, 'orders', orderId));
    if (docSnap.exists()) {
      console.log("Order Data:", JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log("Order not found");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkOrder();
