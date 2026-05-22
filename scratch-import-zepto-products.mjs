import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

const newProducts = [
  {
    id: "packaged_z1",
    categoryId: 5,
    name: "Maggi 2-Minute Masala Instant Noodles",
    brand: "Maggi",
    price: 14,
    originalPrice: 14,
    discount: 0,
    description: "India's favorite instant noodles, packed with the taste of 12 choice spices. Quick, delicious, and easy to make!",
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=400",
    weight: "70",
    unit: "g",
    stock: 100,
    inStock: true,
    tags: ["bestseller", "quick"],
    rating: 4.8,
    reviewCount: 2345
  },
  {
    id: "packaged_z2",
    categoryId: 5,
    name: "Kissan Fresh Tomato Ketchup",
    brand: "Kissan",
    price: 120,
    originalPrice: 150,
    discount: 20,
    description: "Made from 100% real juicy tomatoes. Adds a tangy twist to your favorite snacks.",
    image: "https://images.unsplash.com/photo-1607305387299-a3d9611cd46f?auto=format&fit=crop&q=80&w=400",
    weight: "950",
    unit: "g",
    stock: 50,
    inStock: true,
    tags: ["essential"],
    rating: 4.6,
    reviewCount: 843
  },
  {
    id: "packaged_z3",
    categoryId: 5,
    name: "Tata Salt Lite (Low Sodium)",
    brand: "Tata",
    price: 42,
    originalPrice: 45,
    discount: 6,
    description: "Low sodium iodized salt, specially formulated to help manage high blood pressure and promote general wellness.",
    image: "https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&q=80&w=400",
    weight: "1",
    unit: "kg",
    stock: 80,
    inStock: true,
    tags: ["essential"],
    rating: 4.7,
    reviewCount: 1542
  },
  {
    id: "packaged_z4",
    categoryId: 5,
    name: "Knorr Classic Mixed Vegetable Soup",
    brand: "Knorr",
    price: 35,
    originalPrice: 40,
    discount: 12,
    description: "A perfect blend of real vegetables and spices, offering a delicious restaurant-like taste at home in minutes.",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400",
    weight: "52",
    unit: "g",
    stock: 60,
    inStock: true,
    tags: ["quick"],
    rating: 4.4,
    reviewCount: 312
  },
  {
    id: "packaged_z5",
    categoryId: 5,
    name: "Ching's Secret Schezwan Chutney",
    brand: "Ching's Secret",
    price: 75,
    originalPrice: 85,
    discount: 11,
    description: "The ultimate dip, spread, or cooking ingredient to add a fiery, spicy Chinese kick to your food.",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400",
    weight: "250",
    unit: "g",
    stock: 40,
    inStock: true,
    tags: ["trending"],
    rating: 4.5,
    reviewCount: 678
  },
  {
    id: "packaged_z6",
    categoryId: 5,
    name: "MTR Ready-To-Eat Paneer Butter Masala",
    brand: "MTR",
    price: 95,
    originalPrice: 110,
    discount: 13,
    description: "Soft paneer cubes cooked in a rich, creamy, and mildly spicy tomato-butter gravy. Just heat and eat!",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400",
    weight: "300",
    unit: "g",
    stock: 30,
    inStock: true,
    tags: ["quick", "ready"],
    rating: 4.3,
    reviewCount: 418
  },
  {
    id: "packaged_z7",
    categoryId: 5,
    name: "Aashirvaad Superior MP Atta",
    brand: "Aashirvaad",
    price: 265,
    originalPrice: 290,
    discount: 8,
    description: "Made from the finest MP Sharbati grains. Gives you soft, fluffy, and nutritious rotis that stay soft for hours.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
    weight: "5",
    unit: "kg",
    stock: 45,
    inStock: true,
    tags: ["bestseller", "essential"],
    rating: 4.8,
    reviewCount: 1982
  },
  {
    id: "packaged_z8",
    categoryId: 5,
    name: "Saffola Gold Rice Bran & Sunflower Oil",
    brand: "Saffola",
    price: 155,
    originalPrice: 180,
    discount: 13,
    description: "Dual-seed technology edible oil designed to keep your cholesterol in check and support a healthy heart.",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
    weight: "1",
    unit: "L",
    stock: 35,
    inStock: true,
    tags: ["essential"],
    rating: 4.7,
    reviewCount: 765
  },
  {
    id: "packaged_z9",
    categoryId: 5,
    name: "Top Ramen Curry Instant Noodles (4-Pack)",
    brand: "Top Ramen",
    price: 72,
    originalPrice: 80,
    discount: 10,
    description: "Super saucy and spicy flat noodles with an authentic, rich curry taste. Non-sticky and delicious.",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400",
    weight: "280",
    unit: "g",
    stock: 55,
    inStock: true,
    tags: ["quick"],
    rating: 4.5,
    reviewCount: 928
  },
  {
    id: "packaged_z10",
    categoryId: 5,
    name: "Kellogg's Chocos Original",
    brand: "Kellogg's",
    price: 110,
    originalPrice: 130,
    discount: 15,
    description: "Crunchy, chocolatey, high-fibre wheat scoops that turn milk super chocolatey and yummy for kids.",
    image: "https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&q=80&w=400",
    weight: "250",
    unit: "g",
    stock: 65,
    inStock: true,
    tags: ["bestseller", "daily"],
    rating: 4.6,
    reviewCount: 1205
  }
];

async function importProducts() {
  try {
    console.log("Starting import of Zepto Packaged Food products into Firestore...");
    for (const prod of newProducts) {
      console.log(`Importing: ${prod.name} (Brand: ${prod.brand})`);
      const docRef = doc(db, 'products', prod.id);
      await setDoc(docRef, prod);
    }
    console.log("✅ All 10 Zepto Packaged Food items successfully imported to Firestore!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error importing products:", err.message);
    process.exit(1);
  }
}

importProducts();
