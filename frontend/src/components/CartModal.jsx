import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { setCartOpen, updateCartQuantity } from '../store/slices/cartSlice';

export default function CartModal() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isOpen = useSelector((state) => state.cart.isCartOpen);
  const cartItems = useSelector((state) => state.cart.cartItems);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckoutClick = () => {
    dispatch(setCartOpen(false));
    navigate('/checkout');
  };

  const handleClose = () => {
    dispatch(setCartOpen(false));
  };

  return (
    <div className="cart-overlay" onClick={handleClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={20} style={{ color: 'var(--accent-color)' }} />
            Your Basket
          </h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🍰 Your basket is empty</p>
              <p style={{ fontSize: '0.9rem' }}>Add some fresh bakes from our home menu!</p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={item.cartKey || `${item.id}-${idx}`} className="cart-item">
                <img src={item.image_url} alt={item.name} className="cart-item-img" />
                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {item.category} {item.customizations?.weight ? `| ${item.customizations.weight}` : ''}
                  </p>
                  
                  {item.customizations && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginBottom: '4px' }}>
                      {item.customizations.eggless ? '🟢 Eggless' : '🔴 Contains Egg'}
                      {item.customizations.message && ` | "${item.customizations.message}"`}
                      {item.customizations.instructions && ` | Note: ${item.customizations.instructions}`}
                    </div>
                  )}
                  
                  <p style={{ fontWeight: '700', color: 'var(--text-color)' }}>₹{item.price}</p>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => dispatch(updateCartQuantity({ cartKey: item.cartKey, quantity: item.quantity - 1 }))} className="quantity-btn">
                    <Minus size={12} />
                  </button>
                  <span className="quantity-count">{item.quantity}</span>
                  <button onClick={() => dispatch(updateCartQuantity({ cartKey: item.cartKey, quantity: item.quantity + 1 }))} className="quantity-btn">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Subtotal:</span>
              <span className="text-accent">₹{subtotal.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckoutClick} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
