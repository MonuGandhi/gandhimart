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

async function checkUsersAndNotifications() {
  try {
    console.log("\nFetching recent notifications...");
    const notifsSnap = await getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10)));
    const notifications = notifsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Recent Notifications:", JSON.stringify(notifications, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkUsersAndNotifications();
