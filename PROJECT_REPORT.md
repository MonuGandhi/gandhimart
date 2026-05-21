# Project Report: G-Mart
## A Modern Quick-Commerce Progressive Web Application (PWA)

---

### 1. Project Overview
**G-Mart** is a state-of-the-art e-commerce platform designed for the "Quick-Commerce" segment. It provides a seamless, app-like experience using Progressive Web App (PWA) technology. The platform is built to handle high-frequency grocery and household item orders with features like real-time tracking, smart unit selection, and a robust referral system.

---

### 2. Objectives
- To provide a lightning-fast shopping experience on both mobile and desktop.
- To implement a "Smart Multi-Unit" system allowing users to choose product quantities (e.g., 250g, 500g, 1kg) dynamically.
- To build a secure and scalable infrastructure using serverless technologies (Firebase).
- To create a comprehensive Admin Dashboard for total control over inventory, orders, and users.

---

### 3. Technology Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js (v19), Tailwind CSS (v4), Vite |
| **State Management** | Zustand |
| **Backend/Database** | Google Firebase (Firestore) |
| **Authentication** | Firebase Auth |
| **App Type** | Progressive Web App (PWA) |
| **Routing** | React Router (v7) |
| **Deployment** | Firebase Hosting |

---

### 4. Key Features

#### A. Customer-Facing Features
1. **PWA Capabilities**: Installable on Android/iOS, offline caching, and faster load times.
2. **Smart Unit Selection**: Products automatically generate variants (250g, 1kg, etc.) with real-time price updates.
3. **Advanced Checkout**: Multi-address management with "Zepto-style" smooth transitions.
4. **Referral System**: Integrated reward system that validates "App Installed" status before granting rewards to prevent fraud.
5. **Real-time Order Tracking**: Visual progress bar for order status (Ordered -> Packed -> Out for Delivery -> Delivered).
6. **Search & Discovery**: High-performance search with category-based filtering.

#### B. Admin Panel Features
1. **Comprehensive Dashboard**: Real-time sales analytics, order counts, and customer growth.
2. **Dynamic Product Management**: Add/Edit products, manage stock levels, and toggle availability instantly.
3. **Order Management**: Process orders, update status, and track delivery logs.
4. **Coupon & Discount Engine**: Create percentage-based or flat-rate coupons with expiry dates.
5. **Banner & UI Control**: Update home screen banners and app appearance without redeploying code.
6. **Customer Insights**: View detailed customer profiles, order history, and referral activity.

---

### 5. System Architecture
The project follows a **Client-Serverless** architecture:
- **Client**: React SPA (Single Page Application) optimized for mobile.
- **State Store**: Zustand manages global states like Cart, User Profile, and UI themes.
- **Database**: Firestore (NoSQL) stores data in collections like `products`, `orders`, `users`, and `settings`.
- **Security**: Granular Firestore Security Rules ensure that users can only access their own data, while Admins have full access.

---

### 6. Database Schema (Key Collections)
- **Users**: Name, Phone, Saved Addresses, Referral Code, Reward Points.
- **Products**: Title, Description, Base Price, Category, Unit Variants, Stock Status.
- **Orders**: Items List, Total Amount, Delivery Address, Payment Status, Timestamp.
- **Banners**: Image URLs, Redirect Links, Active Status.

---

### 7. Implementation Highlights
- **Responsive Design**: Mobile-first approach using Tailwind CSS.
- **Performance**: Optimized images and lazy-loading for fast page transitions.
- **Reliability**: Error boundaries and fallback mechanisms for data fetching.

---

### 8. Conclusion
**G-Mart** successfully demonstrates the power of modern web technologies in solving real-world commerce problems. By combining the reach of the web with the performance of a native app, it provides a premium user experience suitable for a competitive market.

---

**Submitted By:** [Monu Gandhi]
**Project Guide:** [Faculty Name]
**College:** [cgc university ,Chandigarh]
