# Dumbake - Ranchi's Premium Craft Bakery Ordering System

An elegant, fully-featured, full-stack web application built specifically for **Dumbake**, an artisan craft bakery located in Ranchi, Jharkhand, India. This application is designed to tempt customers with modern aesthetics, simplify ordering of fresh-baked cakes, brookies, and pastries, and streamline fulfillment tracking.

Live URL: [https://dumbake-ranchi.netlify.app](https://dumbake-ranchi.netlify.app)

---

## 📖 Project Abstract

Dumbake is a premium web ordering platform designed to feel warm, attractive, and highly professional, showcasing the bakery's fresh selections. The platform features classic French-technique recipes infused with local Ranchi ingredients. It features a robust order processing engine, customized product options (eggless, weights, birthday messages), address management using interactive maps, simulation-based split payment options (integrating a customer demo wallet and external gateways), live delivery boy tracking via an interactive map, and complete dashboards for the owners to manage inventory and orders.

---

## 🛠️ Tech Stack & Architecture

### Frontend (Client-Side)
- **Core Technology**: HTML5, Vanilla CSS3 (custom CSS variables, responsive design, elegant animations).
- **Javascript Framework**: [React.js](https://react.dev/) (bootstrapped with [Vite](https://vite.dev/)).
- **Routing**: `react-router-dom` for client-side SPA navigation.
- **Form Handling & Validation**: [Formik](https://formik.org/) and [Yup](https://github.com/jquense/yup) validation schemas.
- **Mapping & Geolocation**: [Leaflet](https://leafletjs.com/) and [React-Leaflet](https://react-leaflet.js.org/) using OpenStreetMap tiles.
- **Visual Enhancements**: [Lucide React](https://lucide.dev/) for crisp icons, [Canvas Confetti](https://github.com/catdad/canvas-confetti) for celebratory order completion.

### Backend (Serverless & APIs)
- **Core Framework**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/).
- **Deployment & Serverless Integration**: Wrapped with `serverless-http` to run as serverless functions on [Netlify Functions](https://www.netlify.com/products/functions/).
- **Email Delivery**: [Nodemailer](https://nodemailer.com/) using secure SMTP App Passwords to send authentication OTP verification codes and bulk enquiry alerts.

### Database & Storage
- **SQL Database**: [PostgreSQL](https://www.postgresql.org/) database.
  - **Local Development**: Connects to local PostgreSQL or automatically falls back to a persistent JSON mock database file (`backend/config/mock_db_state.json`) if connection credentials are not present.
  - **Production Environment**: Connects to cloud-hosted PostgreSQL (e.g., Supabase or Neon) via the `DATABASE_URL` environment variable configured in Netlify's settings. Falls back gracefully to serverless memory state if database environment variables are omitted.

---

## ✨ Features & Functionalities

1. **Artisan Catalog Filter**: Interactive category circles (Cakes, Brookies, Brownies, Pastries), real-time search query matching, and Leaf-green icon toggle for Eggless-only bakes.
2. **Product Customizer Modal**: Customers can select weight configurations (0.5 Kg vs 1.0 Kg with dynamic price calculation), toggles for eggless preferences, customized birthday message banners, and specific baking text instructions.
3. **Split Wallet Payment Gateway**:
   - Integrated user demo wallet system.
   - If the wallet balance is **greater than or equal to** the order total, the order is fully paid by the wallet.
   - If the wallet balance is **less than** the order total, it deducts the entire wallet balance to ₹0.00, and displays the remaining amount. The user can pay the rest using Credit/Debit Card, UPI ID, or Cash on Delivery (COD).
4. **Interactive OpenStreetMap Address Pinpointing**: A saved address manager letting customers save addresses (Home, Work, Other) by clicking on an interactive map.
5. **Live Delivery tracking & Calling**:
   - Interactive map showing the exact location of the bakery (Ranchi Craft Bakery) and the customer's delivery destination.
   - An animated delivery boy marker (🛵) moving along the route from the bakery to the destination once the order status transitions to "Ready".
   - Delivery partner contact information (e.g. Amit Kumar) and a direct `tel:` link call button to reach the rider.
   - Rich textual timeline status tracker.
6. **Owner/Admin Dashboard**:
   - Order pipeline control: Placed, Preparing, Ready, Delivered.
   - Catalog manager: Edit pricing, modify items, and toggles for active inventory stock.
   - Party/Bulk order enquiries logging system.
7. **Security & Authentication**:
   - Secure login and registration.
   - Node-mailer email-delivered verification OTP codes.
   - Role-Based Access Control (RBAC) separating administrative actions from customer flows.

---

## 🔗 Key API Endpoints

### Authentication & Profiles
- `POST /api/auth/register` - Create user accounts and send verification OTP email.
- `POST /api/auth/verify-otp` - Verify email address.
- `POST /api/auth/login` - Authenticate users and establish session context.
- `GET /api/auth/profile` - Fetch authenticated user details and wallet balances.

### Menu & Bakes
- `GET /api/items` - Retrieve menu catalog with category and eggless filter queries.
- `POST /api/items` - Create new items (Admin only).

### Orders & Tracking
- `POST /api/orders` - Process wallet/split payments, deduct item stock, and place order.
- `GET /api/orders` - Fetch order history for customer or active pipelines for admins.
- `PUT /api/orders/:id/status` - Transition order states (Admin only).

### Geolocation Addresses
- `GET /api/addresses` - Retrieve customer saved addresses.
- `POST /api/addresses` - Pinpoint and save new address.
- `DELETE /api/addresses/:id` - Delete saved address.
