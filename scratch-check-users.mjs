import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query, orderBy } from "firebase/firestore";

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

async function checkUsersAndOrders() {
  try {
    console.log("\nFetching recent users...");
    const usersSnap = await getDocs(query(collection(db, 'users'), limit(20)));
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Users:");
    users.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.name}, Phone: ${u.phone}, Email: ${u.email}`));

    console.log("\nFetching recent orders...");
    const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('placedAt', 'desc'), limit(10)));
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Orders:");
    orders.forEach(o => {
      console.log(`- ID: ${o.id}, Status: ${o.status}, PlacedAt: ${o.placedAt}`);
      console.log(`  CustomerEmail: ${o.customerEmail}, Phone: ${o.phone}`);
      console.log(`  deliveryAddress phone: ${o.deliveryAddress?.phone}, address phone: ${o.address?.phone}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkUsersAndOrders();
