import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
import RiderConsole from './pages/RiderConsole';
import { fetchProfile, fetchAddresses } from './services/api';
import { setUser, clearUser } from './store/slices/authSlice';
import { setAddresses, setActiveAddress } from './store/slices/addressSlice';
import AddressModal from './components/AddressModal';

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const savedUser = localStorage.getItem('dumbake_user');
    if (savedUser) {
      fetchProfile()
        .then((profile) => {
          dispatch(setUser(profile));
        })
        .catch((err) => {
          dispatch(clearUser());
        });
    }
  }, [dispatch]);

  useEffect(() => {
    if (user && user.role !== 'anonymous') {
      fetchAddresses()
        .then((data) => {
          dispatch(setAddresses(data));
          const savedActive = localStorage.getItem('dumbake_active_address');
          if (savedActive) {
            try {
              const parsed = JSON.parse(savedActive);
              const exists = data.find((a) => a.id === parsed.id);
              if (exists) {
                dispatch(setActiveAddress(exists));
              } else if (data.length > 0) {
                dispatch(setActiveAddress(data[0]));
              }
            } catch (e) {
              dispatch(setActiveAddress(data[0] || null));
            }
          } else if (data.length > 0) {
            dispatch(setActiveAddress(data[0]));
          }
        })
        .catch((err) => console.error(err));
    } else {
      dispatch(setAddresses([]));
    }
  }, [user, dispatch]);

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />

        <main style={{ flex: '1 0 auto' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            
            <Route 
              path="/login" 
              element={
                user ? (
                  user.role === 'admin' ? <Navigate to="/admin-dashboard" /> : <Navigate to="/" />
                ) : (
                  <Auth />
                )
              } 
            />
            
            <Route 
              path="/checkout" 
              element={
                user ? <Checkout /> : <Navigate to="/login" />
              } 
            />

            <Route 
              path="/admin-dashboard" 
              element={
                user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />
              } 
            />
            
            <Route 
              path="/owner-dashboard" 
              element={
                user && user.role === 'admin' ? <OwnerDashboard /> : <Navigate to="/login" />
              } 
            />
            
            <Route 
              path="/order-history" 
              element={
                user ? <OrderHistory /> : <Navigate to="/login" />
              } 
            />
            
            <Route 
              path="/rider" 
              element={
                user ? <RiderConsole /> : <Navigate to="/login" />
              } 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <Footer />
        <BottomNav />
        <AddressModal />
        <CartModal />
      </div>
    </Router>
  );
}
