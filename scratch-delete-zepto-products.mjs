import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

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

async function deleteProducts() {
  try {
    console.log("Deleting imported products...");
    for (let i = 1; i <= 10; i++) {
      const docRef = doc(db, 'products', `packaged_z${i}`);
      await deleteDoc(docRef);
      console.log(`Deleted packaged_z${i}`);
    }
    console.log("✅ All imported products deleted!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error deleting products:", err.message);
    process.exit(1);
  }
}

deleteProducts();
