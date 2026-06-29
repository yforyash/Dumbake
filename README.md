# DumBake - Ranchi's Premium Craft Bakery Ordering & Support System

An elegant, fully-featured, full-stack web application built specifically for **DumBake**, an artisan craft bakery located in Ranchi, Jharkhand, India. This application is designed to showcase premium baked goods, facilitate split-payment orders, track deliveries in real-time, and provide an integrated customer support ticketing and chat system.

Live URL: **[https://dumbake.vercel.app](https://dumbake.vercel.app)**

---

## 📖 Project Abstract

**DumBake** is a premium digital ordering and support ecosystem designed to elevate the home bakery experience. Built with a rich, responsive interface, it showcases Ranchi's finest artisan pastries and custom bakes. 

The platform enables users to customize orders (eggless options, custom weights, birthday messages), pinpoint delivery addresses via an interactive OpenStreetMap address manager, and utilize a smart split-payment wallet engine. Once an order is placed, customers can track their delivery boy in real-time on a live GPS simulation map. 

To ensure complete customer satisfaction, the platform features a comprehensive **Customer Support Ticketing & Chatbox System**. Customers can raise complaints directly from their order logs, attach evidence of any type (images, videos, PDFs, PPTX, or text files) subject to strict type-specific size limitations, and engage in a real-time support chat with administrators. Admins manage all tickets from a central console, responding either via the chatbox or sending direct SMTP-enabled email replies.

---

## 🛠️ Tech Stack & Architecture

### Frontend (Client-Side SPA)
- **Core**: HTML5, Vanilla CSS3 (curated color palettes, dark mode elements, and premium animations).
- **Framework**: [React.js](https://react.dev/) (bootstrapped with [Vite](https://vite.dev/)).
- **State Management**: Redux Toolkit (managing session context and cart states).
- **Routing**: `react-router-dom` for fluid single-page transitions.
- **Mapping & GIS**: [Leaflet](https://leafletjs.com/) and [React-Leaflet](https://react-leaflet.js.org/) for geolocation coordinates mapping.
- **Icons & Visuals**: [Lucide React](https://lucide.dev/) and [Canvas Confetti](https://github.com/catdad/canvas-rotators) for congratulations effects.

### Backend (Serverless Web Services)
- **Runtime**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) REST API.
- **Deployment**: Deployed serverlessly as serverless functions on [Vercel](https://vercel.com/).
- **Email Dispatcher**: [Nodemailer](https://nodemailer.com/) utilizing secure SMTP protocols for registration OTPs and direct admin support responses.
- **File Upload Engine**: [Multer](https://github.com/expressjs/multer) memory storage with type-specific validation rules.

### Database & Storage
- **Database**: Cloud [PostgreSQL](https://www.postgresql.org/) hosted on [Supabase](https://supabase.com/).
- **Connection Pooler**: Connects via **Supavisor Transaction Pooler** (port `6543`) to scale serverless database client connections dynamically.
- **File Storage**: Uploaded files (up to 50MB for video) are stored directly inside the `uploaded_files` table as binary data (`BYTEA`) to avoid local disk requirements on serverless containers.

---

## ✨ Features & Functionalities

1.  **Premium Artisan Catalog**: Interactive filters for cakes, brookies, brownies, and pastries with search matching and eggless toggles.
2.  **Order Customizer Modal**: Custom weight selections, birthday messaging banners, and special baking instructions.
3.  **Split Wallet Payment Gateway**: Smart checkout utilizing user demo wallet balances, automatically splitting any remainder between Cash on Delivery, UPI, or Mock Card gateways.
4.  **OpenStreetMap Address Pinpointing**: Let's customers visually select and save coordinates for Home, Work, or Other delivery destinations.
5.  **Live Delivery Tracker**: Animated delivery boy marker (🛵) moving along the route to Ranchi destination, complete with textual status timelines and quick rider call button.
6.  **Customer complaints Ticketing**: Raise tickets for any order with file attachments (Photos, PDFs, PPTXs, Videos, Text bills).
7.  **Support Chatbox**: Real-time conversation box between customers and support staff to troubleshoot orders.
8.  **Complaints Management console**: Admins can view complaints, update statuses, participate in support chats, and write direct email updates to customers.

---

## 🔗 Key API Endpoints

### Authentication & Profiles
- `POST /api/auth/register` - Register a new account and send OTP.
- `POST /api/auth/verify-otp` - Verify email address.
- `POST /api/auth/login` - Authenticate credentials and establish token session.

### Support & Complaints
- `POST /api/complaints` - Raise a complaint for an order.
- `GET /api/complaints/my` - Fetch logged-in customer's tickets.
- `GET /api/complaints/all` - Fetch all tickets (Admin only).
- `POST /api/complaints/:id/messages` - Send a text/file message in support chat.
- `POST /api/complaints/:id/send-email` - Send direct email updates to customer (Admin only).

### Secure File Uploads
- `POST /api/userfiles/upload-raw` - Upload attachment binary and retrieve file ID.
- `GET /api/userfiles/download/:fileId` - Securely download file attachments (Admin/Owner access control).
