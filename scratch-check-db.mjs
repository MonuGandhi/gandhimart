import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function checkDatabase() {
  try {
    console.log("Fetching categories...");
    const catsSnap = await getDocs(collection(db, 'categories'));
    const categories = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Categories in Firestore:", JSON.stringify(categories, null, 2));

    console.log("\nFetching some products to see their categoryId format...");
    const prodsSnap = await getDocs(collection(db, 'products'));
    const products = prodsSnap.docs.slice(0, 5).map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Sample products:", JSON.stringify(products, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkDatabase();
