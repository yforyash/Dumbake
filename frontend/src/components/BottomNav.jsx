import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, History, LayoutDashboard, User, ShoppingBag } from 'lucide-react';
import { setCartOpen } from '../store/slices/cartSlice';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const cartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleDashboardClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (user.role === 'bakery_owner') {
      navigate('/owner-dashboard');
    } else {
      navigate('/order-history');
    }
  };

  return (
    <div className="bottom-nav">
      <div 
        className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <Home size={20} />
        <span>Home</span>
      </div>

      {user && user.role === 'user' && (
        <div 
          className={`bottom-nav-item ${location.pathname === '/order-history' ? 'active' : ''}`}
          onClick={() => navigate('/order-history')}
        >
          <History size={20} />
          <span>Orders</span>
        </div>
      )}

      {(user && (user.role === 'admin' || user.role === 'bakery_owner')) ? (
        <div 
          className={`bottom-nav-item ${location.pathname === '/admin-dashboard' || location.pathname === '/owner-dashboard' ? 'active' : ''}`}
          onClick={handleDashboardClick}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </div>
      ) : (
        <div 
          className={`bottom-nav-item ${location.pathname === '/login' ? 'active' : ''}`}
          onClick={() => user ? handleDashboardClick() : navigate('/login')}
        >
          <User size={20} />
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </div>
      )}

      <div 
        className="bottom-nav-item"
        onClick={() => dispatch(setCartOpen(true))}
        style={{ position: 'relative' }}
      >
        <ShoppingBag size={20} />
        <span>Cart</span>
        {cartCount > 0 && (
          <span 
            style={{ 
              position: 'absolute', 
              top: '-4px', 
              right: '10px', 
              background: 'var(--accent-color)', 
              color: 'white', 
              borderRadius: '50%', 
              padding: '1px 5px', 
              fontSize: '0.65rem',
              fontWeight: '700'
            }}
          >
            {cartCount}
          </span>
        )}
      </div>
    </div>
  );
}
