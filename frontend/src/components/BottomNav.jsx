import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, History, LayoutDashboard, User, ShoppingBag } from 'lucide-react';

export default function BottomNav({ user, cartCount, onCartClick }) {
  const navigate = useNavigate();
  const location = useLocation();

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
        onClick={onCartClick}
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
