import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, LogIn, LogOut, User, LayoutDashboard, History } from 'lucide-react';

export default function Header({ user, onLogout, cartCount, onCartClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          🍰 <span>Dumbake</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          
          {user && user.role === 'admin' && (
            <Link to="/admin-dashboard" className={`nav-link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LayoutDashboard size={16} /> Admin Panel
              </span>
            </Link>
          )}

          {user && user.role === 'bakery_owner' && (
            <Link to="/owner-dashboard" className={`nav-link ${location.pathname === '/owner-dashboard' ? 'active' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LayoutDashboard size={16} /> Bakery Owner Panel
              </span>
            </Link>
          )}

          {user && user.role === 'user' && (
            <Link to="/order-history" className={`nav-link ${location.pathname === '/order-history' ? 'active' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <History size={16} /> My Orders
              </span>
            </Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-color)', fontWeight: '600' }}>
                <User size={16} style={{ color: 'var(--accent-color)' }} />
                {user.name}
              </span>
              <button onClick={handleLogoutClick} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              <LogIn size={14} /> Sign In
            </Link>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Cart Icon Trigger */}
          <button 
            onClick={onCartClick} 
            className="btn btn-secondary" 
            style={{ 
              position: 'relative', 
              padding: '0.6rem', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--primary-color)'
            }}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span 
                style={{ 
                  position: 'absolute', 
                  top: '-4px', 
                  right: '-4px', 
                  background: 'var(--accent-color)', 
                  color: 'white', 
                  borderRadius: '50%', 
                  padding: '2px 6px', 
                  fontSize: '0.7rem',
                  fontWeight: '700'
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
