import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import CartModal from './components/CartModal';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import OrderHistory from './pages/OrderHistory';
import { fetchProfile, fetchAddresses, addAddress, deleteAddress } from './services/api';
import AddressModal from './components/AddressModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [activeAddress, setActiveAddress] = useState(null);
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('dumbake_user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setUser(userObj);
        
        fetchProfile()
          .then(profile => {
            setUser(profile);
            localStorage.setItem('dumbake_user', JSON.stringify(profile));
          })
          .catch(err => {
            console.warn('[Session] expired:', err.message);
            setUser(null);
            localStorage.removeItem('dumbake_user');
            localStorage.removeItem('dumbake_active_address');
          });
      } catch (e) {
        localStorage.removeItem('dumbake_user');
      }
    }

    const savedCart = localStorage.getItem('dumbake_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        localStorage.removeItem('dumbake_cart');
      }
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'anonymous') {
      fetchAddresses()
        .then(data => {
          setAddresses(data);
          const savedActive = localStorage.getItem('dumbake_active_address');
          if (savedActive) {
            try {
              const parsed = JSON.parse(savedActive);
              const exists = data.find(a => a.id === parsed.id);
              if (exists) {
                setActiveAddress(exists);
              } else if (data.length > 0) {
                setActiveAddress(data[0]);
                localStorage.setItem('dumbake_active_address', JSON.stringify(data[0]));
              } else {
                setActiveAddress(null);
              }
            } catch (e) {
              setActiveAddress(data[0] || null);
            }
          } else if (data.length > 0) {
            setActiveAddress(data[0]);
            localStorage.setItem('dumbake_active_address', JSON.stringify(data[0]));
          } else {
            setActiveAddress(null);
          }
        })
        .catch(err => console.error(err));
    } else {
      setAddresses([]);
      setActiveAddress(null);
    }
  }, [user]);

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
    localStorage.removeItem('dumbake_active_address');
    setAddresses([]);
    setActiveAddress(null);
    saveCart([]);
    window.scrollTo(0, 0);
  };

  const handleAddToCart = (item, customizations = {}) => {
    const cartKey = `${item.id}-${customizations.weight || 'Default'}-${customizations.eggless ? 'eggless' : 'egg'}-${customizations.message || ''}-${customizations.instructions || ''}`;

    const existing = cartItems.find((c) => c.cartKey === cartKey);
    if (existing) {
      const updated = cartItems.map((c) => 
        c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c
      );
      saveCart(updated);
    } else {
      let finalPrice = parseFloat(item.price);
      if (customizations.weight === '1 Kg') {
        finalPrice += 400.00;
      }
      saveCart([...cartItems, { ...item, cartKey, customizations, price: finalPrice, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (cartKey, quantity) => {
    if (quantity <= 0) {
      const filtered = cartItems.filter((c) => c.cartKey !== cartKey);
      saveCart(filtered);
    } else {
      const updated = cartItems.map((c) => 
        c.cartKey === cartKey ? { ...c, quantity } : c
      );
      saveCart(updated);
    }
  };

  const handleRemoveFromCart = (cartKey) => {
    const filtered = cartItems.filter((c) => c.cartKey !== cartKey);
    saveCart(filtered);
  };

  const handleClearCart = () => {
    saveCart([]);
    fetchProfile()
      .then(profile => {
        setUser(profile);
        localStorage.setItem('dumbake_user', JSON.stringify(profile));
      })
      .catch(err => console.error('[Balance Sync]', err));
  };

  const handleSelectAddress = (addr) => {
    setActiveAddress(addr);
    localStorage.setItem('dumbake_active_address', JSON.stringify(addr));
  };

  const handleAddAddress = async (addrData) => {
    const newAddr = await addAddress(addrData);
    setAddresses(prev => [newAddr, ...prev]);
    setActiveAddress(newAddr);
    localStorage.setItem('dumbake_active_address', JSON.stringify(newAddr));
  };

  const handleDeleteAddress = async (id) => {
    await deleteAddress(id);
    setAddresses(prev => {
      const updated = prev.filter(a => a.id !== id);
      if (activeAddress && activeAddress.id === id) {
        const nextActive = updated[0] || null;
        setActiveAddress(nextActive);
        if (nextActive) {
          localStorage.setItem('dumbake_active_address', JSON.stringify(nextActive));
        } else {
          localStorage.removeItem('dumbake_active_address');
        }
      }
      return updated;
    });
  };

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header 
          user={user} 
          onLogout={handleLogout} 
          cartCount={cartCount} 
          onCartClick={() => setIsCartOpen(true)} 
          activeAddress={activeAddress}
          onAddressClick={() => setIsAddressOpen(true)}
        />

        <main style={{ flex: '1 0 auto' }}>
          <Routes>
            <Route path="/" element={<Home user={user} onAddToCart={handleAddToCart} />} />
            
            <Route 
              path="/login" 
              element={
                user ? (
                  user.role === 'admin' ? <Navigate to="/admin-dashboard" /> :
                  (cartItems.length > 0 ? <Navigate to="/checkout" /> : <Navigate to="/" />)
                ) : (
                  <Auth onLoginSuccess={handleLoginSuccess} cartItems={cartItems} />
                )
              } 
            />
            
            <Route 
              path="/checkout" 
              element={
                user ? (
                  <Checkout 
                    user={user} 
                    cartItems={cartItems} 
                    onClearCart={handleClearCart} 
                    activeAddress={activeAddress}
                    onAddressClick={() => setIsAddressOpen(true)}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />

            <Route 
              path="/admin-dashboard" 
              element={
                user && user.role === 'admin' ? (
                  <AdminDashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/owner-dashboard" 
              element={
                user && user.role === 'admin' ? (
                  <OwnerDashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/order-history" 
              element={
                user ? (
                  <OrderHistory user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <Footer />

        <BottomNav 
          user={user} 
          cartCount={cartCount} 
          onCartClick={() => setIsCartOpen(true)} 
        />

        <AddressModal 
          isOpen={isAddressOpen}
          onClose={() => setIsAddressOpen(false)}
          user={user}
          addresses={addresses}
          activeAddress={activeAddress}
          onSelectAddress={handleSelectAddress}
          onAddAddress={handleAddAddress}
          onDeleteAddress={handleDeleteAddress}
        />

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
