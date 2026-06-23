import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, LogIn, LogOut, User, LayoutDashboard, History, Search, Phone, MapPin } from 'lucide-react';

export default function Header({ user, onLogout, cartCount, onCartClick, activeAddress, onAddressClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate(`/?scroll=${sectionId}`);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Ticker announcement bar */}
      <div className="announcement-bar">
        <span>✨ Same-Day Cake Delivery in Ranchi. Baked fresh daily with premium ingredients! ✨</span>
      </div>

      <header className="header" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-color)' }}>
        {/* Main top header row */}
        <div className="header-container" style={{ padding: '0.8rem 1.5rem', gap: '20px' }}>
          
          {/* Logo and Address link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/" className="logo" style={{ color: 'var(--accent-color)', fontSize: '2rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 'bold' }}>
              Dumbake🍰
            </Link>
            
            <div 
              onClick={onAddressClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '0.4rem 0.8rem',
                borderRadius: '16px',
                backgroundColor: 'var(--primary-light)',
                border: '1.2px solid var(--border-color)',
                maxWidth: '180px',
                transition: 'all 0.2s ease',
                overflow: 'hidden'
              }}
              className="location-header-widget"
            >
              <MapPin size={15} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {activeAddress ? activeAddress.label : 'Ranchi'}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {activeAddress ? activeAddress.address_line : 'Choose Location'}
                </span>
              </div>
            </div>
          </div>

          {/* Search bar form */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1', maxWidth: '500px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Search for brookies, custom cakes, cupcakes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ 
                width: '100%', 
                padding: '0.6rem 1rem 0.6rem 2.5rem', 
                borderRadius: '24px', 
                border: '1.5px solid var(--border-color)', 
                backgroundColor: 'var(--primary-light)', 
                fontSize: '0.85rem' 
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--accent-color)' }} />
          </form>

          {/* Contact and actions group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Phone link */}
            <a href="tel:+919151463571" style={{ display: 'none', lg: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)', fontWeight: '700', fontSize: '0.85rem' }} className="phone-nav-link">
              <Phone size={16} />
              <span>+91 91514 63571</span>
            </a>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-color)', fontWeight: '700', fontSize: '0.85rem' }}>
                  <User size={16} style={{ color: 'var(--accent-color)' }} />
                  {(user.name || 'User').split(' ')[0]}
                </span>
                {user.role === 'user' && (
                  <Link 
                    to="/order-history" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: 'var(--accent-color)', 
                      fontWeight: '700', 
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--primary-light)',
                      border: '1.2px solid var(--border-color)',
                      transition: 'all 0.2s ease',
                      marginRight: '5px'
                    }}
                    className="my-orders-nav-link"
                  >
                    <History size={16} />
                    <span>My Orders</span>
                  </Link>
                )}
                <button onClick={handleLogoutClick} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '12px' }}>
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '12px' }}>
                Sign In
              </Link>
            )}

            {/* Admin and Owner dashboard links */}
            {user && user.role === 'admin' && (
              <>
                <Link to="/admin-dashboard" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '12px' }}>
                  Admin Panel
                </Link>
                <Link to="/owner-dashboard" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '12px' }}>
                  Kitchen Console
                </Link>
              </>
            )}

            {/* Shopping Cart button trigger */}
            <button 
              onClick={onCartClick} 
              className="btn btn-primary" 
              style={{ 
                position: 'relative', 
                padding: '0.5rem 1rem', 
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
            >
              <ShoppingBag size={16} />
              <span>Basket ({cartCount})</span>
            </button>
          </div>
        </div>

        {/* Sub-header navigation row */}
        <div style={{ backgroundColor: 'var(--accent-color)', padding: '8px 1.5rem', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px', borderTop: '1px solid var(--border-color)' }}>
          <span onClick={() => scrollToSection('best-sellers')} className="nav-link-sub" style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
            Best Sellers
          </span>
          <span onClick={() => scrollToSection('menu-catalog')} className="nav-link-sub" style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
            Our Collection
          </span>
          <span onClick={() => scrollToSection('whatsapp-custom')} className="nav-link-sub" style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
            Custom Cakes
          </span>
          <span onClick={() => scrollToSection('gifting-specials')} className="nav-link-sub" style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
            Gifting Specials
          </span>
          <span onClick={() => scrollToSection('bulk-orders')} className="nav-link-sub" style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
            Bulk Orders
          </span>
          <span onClick={() => scrollToSection('story-section')} className="nav-link-sub" style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
            About Us
          </span>
        </div>
      </header>
    </>
  );
}
