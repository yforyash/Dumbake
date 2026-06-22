import React, { useState } from 'react';
import { Send, Phone, Mail } from 'lucide-react';
import { subscribeNewsletter } from '../services/api';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (email.trim()) {
      setError('');
      try {
        await subscribeNewsletter(email.trim());
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 4000);
      } catch (err) {
        setError(err.message || 'Subscription failed. Please try again.');
      }
    }
  };

  return (
    <footer className="main-footer">
      <div className="footer-container">
        
        {/* Row 1: Newsletter Subscription */}
        <div className="footer-newsletter-row">
          <div className="newsletter-text">
            <h4>Subscribe to Our Newsletter</h4>
            <p>Get fresh recipes, special discounts, and Ranchi bakery updates direct to your inbox.</p>
          </div>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            {error && <div style={{ color: '#FFB3C1', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 'bold' }}>{error}</div>}
            {subscribed ? (
              <div className="newsletter-success">✨ Thank you for subscribing! Check your inbox soon.</div>
            ) : (
              <div className="newsletter-input-group">
                <input 
                  type="email" 
                  className="newsletter-input" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
                <button type="submit" className="btn btn-primary newsletter-submit-btn">
                  Submit <Send size={14} />
                </button>
              </div>
            )}
          </form>
        </div>

        <hr className="footer-divider" />

        {/* Row 2: Columns Grid */}
        <div className="footer-grid">
          
          {/* Column 1: Information */}
          <div className="footer-col info-col">
            <h5>Information</h5>
            <p className="info-text">
              Dumbake has come a long way since 2015 and has gained a lot over the years. Today, it is recognized as one of the best bakeries in Ranchi. The increase in their loyal customers is one of the reasons why the bakery shares a discount for people who constantly appreciate the products.
            </p>
            <div className="footer-contacts">
              <a href="tel:+919999988888" className="footer-contact-item">
                <Phone size={14} className="icon-accent" />
                <span>+91 99999 88888</span>
              </a>
              <a href="mailto:hello@dumbake.com" className="footer-contact-item">
                <Mail size={14} className="icon-accent" />
                <span>hello@dumbake.com</span>
              </a>
            </div>
            <div className="footer-socials">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/dumbake_/" target="_blank" rel="noopener noreferrer" className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a href="https://wa.me/919999988888" target="_blank" rel="noopener noreferrer" className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Menu */}
          <div className="footer-col">
            <h5>Menu</h5>
            <ul className="footer-links">
              <li><a href="#best-sellers">Best Sellers</a></li>
              <li><a href="#menu-catalog">Dumbake Cakes</a></li>
              <li><a href="#menu-catalog">Categories</a></li>
              <li><a href="#story-section">Contact Us</a></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="footer-col">
            <h5>Legal</h5>
            <ul className="footer-links">
              <li><a href="#story-section">About Us</a></li>
              <li><a href="#story-section">Privacy Policy</a></li>
              <li><a href="#story-section">Refund Policy</a></li>
              <li><a href="#story-section">Shipping Policy</a></li>
              <li><a href="#story-section">Terms and Conditions</a></li>
            </ul>
          </div>

          {/* Column 4: Links */}
          <div className="footer-col">
            <h5>Quick Links</h5>
            <ul className="footer-links">
              <li><a href="#story-section">About Us</a></li>
              <li><a href="#story-section">Blog</a></li>
              <li><a href="#bulk-orders">Bulk Order</a></li>
            </ul>
          </div>

        </div>

        <hr className="footer-divider" />

        {/* Row 3: Copyright */}
        <div className="footer-copyright-row">
          <p className="copyright-text">
            Copyright © 2026 dumbake. Powered by Shopify
          </p>
        </div>

      </div>
    </footer>
  );
}
