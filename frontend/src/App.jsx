import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import CartModal from './components/CartModal';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import OrderHistory from './pages/OrderHistory';
import { fetchProfile } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load user session from local storage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('dumbake_user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setUser(userObj);
        
        // Fetch fresh profile to sync wallet balance and details
        fetchProfile()
          .then(profile => {
            setUser(profile);
            localStorage.setItem('dumbake_user', JSON.stringify(profile));
          })
          .catch(err => {
            console.warn('[Session] Session expired or invalid session header:', err.message);
          });
      } catch (e) {
        localStorage.removeItem('dumbake_user');
      }
    }

    // Load saved cart items
    const savedCart = localStorage.getItem('dumbake_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        localStorage.removeItem('dumbake_cart');
      }
    }
  }, []);

  // Save cart changes to local storage
  const saveCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem('dumbake_cart', JSON.stringify(newCart));
  };

  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dumbake_user');
    saveCart([]); // clear cart on logout
  };

  const handleAddToCart = (item) => {
    const existing = cartItems.find((c) => c.id === item.id);
    if (existing) {
      const updated = cartItems.map((c) => 
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      );
      saveCart(updated);
    } else {
      saveCart([...cartItems, { ...item, quantity: 1 }]);
    }
    // Show toast or open cart
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id, quantity) => {
    if (quantity <= 0) {
      const filtered = cartItems.filter((c) => c.id !== id);
      saveCart(filtered);
    } else {
      const updated = cartItems.map((c) => 
        c.id === id ? { ...c, quantity } : c
      );
      saveCart(updated);
    }
  };

  const handleRemoveFromCart = (id) => {
    const filtered = cartItems.filter((c) => c.id !== id);
    saveCart(filtered);
  };

  const handleClearCart = () => {
    saveCart([]);
    // Update user wallet balance in UI since it was deducted in database checkout
    fetchProfile()
      .then(profile => {
        setUser(profile);
        localStorage.setItem('dumbake_user', JSON.stringify(profile));
      })
      .catch(err => console.error('[Balance Sync]', err));
  };

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Header */}
        <Header 
          user={user} 
          onLogout={handleLogout} 
          cartCount={cartCount} 
          onCartClick={() => setIsCartOpen(true)} 
        />

        {/* Main page content area */}
        <main style={{ flex: '1 0 auto' }}>
          <Routes>
            <Route path="/" element={<Home user={user} onAddToCart={handleAddToCart} />} />
            
            <Route 
              path="/login" 
              element={
                user ? (
                  user.role === 'admin' ? <Navigate to="/admin-dashboard" /> :
                  user.role === 'bakery_owner' ? <Navigate to="/owner-dashboard" /> :
                  <Navigate to="/" />
                ) : (
                  <Auth onLoginSuccess={handleLoginSuccess} />
                )
              } 
            />
            
            <Route 
              path="/checkout" 
              element={
                <Checkout 
                  user={user} 
                  cartItems={cartItems} 
                  onClearCart={handleClearCart} 
                />
              } 
            />

            <Route path="/admin-dashboard" element={<AdminDashboard user={user} />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard user={user} />} />
            <Route path="/order-history" element={<OrderHistory user={user} />} />
            
            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Mobile Bottom Bar navigation */}
        <BottomNav 
          user={user} 
          cartCount={cartCount} 
          onCartClick={() => setIsCartOpen(true)} 
        />

        {/* Side Basket Drawer */}
        <CartModal 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cartItems={cartItems} 
          onUpdateQuantity={handleUpdateCartQuantity} 
          onRemoveItem={handleRemoveFromCart} 
        />
      </div>
    </Router>
  );
}
