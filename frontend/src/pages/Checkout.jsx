import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, CreditCard, DollarSign, Smartphone, Loader, CheckCircle } from 'lucide-react';
import { postOrder } from '../services/api';
import confetti from 'canvas-confetti';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

export default function Checkout({ user, cartItems, onClearCart }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [deliveryType, setDeliveryType] = useState('Delivery');
  const [customerName, setCustomerName] = useState(user ? user.name : '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');

  // Map Picker Coordinate State (default to a mock bakery location)
  const [coords, setCoords] = useState({ lat: 28.6139, lng: 77.2090 });

  // Masked Payment States
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (cartItems.length === 0 && !success) {
      navigate('/');
    }
  }, [cartItems, success]);

  // Formats card number: inserts space every 4 digits
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // digit only
    if (value.length > 16) value = value.substring(0, 16);
    
    // Insert spaces
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  // Formats card expiry: inserts / after MM
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);

    if (value.length >= 3) {
      setCardExpiry(`${value.substring(0, 2)}/${value.substring(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  // Restricts CVV length to 3 digits
  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setCardCvv(value);
    }
  };

  // Handles UPI text formatting (strips spaces, letters/symbols check)
  const handleUpiChange = (e) => {
    const value = e.target.value.trim().toLowerCase();
    setUpiId(value);
  };

  // Map Click Handler component
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        setAddress(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)} (Custom Marker Position)`);
      },
    });

    return coords ? <Marker position={[coords.lat, coords.lng]} /> : null;
  }

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryCharge = deliveryType === 'Delivery' ? 40 : 0;
  const grandTotal = subtotal + deliveryCharge;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in or create an account to place orders.');
      return;
    }

    if (!customerPhone || customerPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (deliveryType === 'Delivery' && !address) {
      setError('Please specify a delivery address.');
      return;
    }

    // Payment validation
    if (paymentMethod === 'Card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      if (cardExpiry.length !== 5) {
        setError('Please enter expiry in MM/YY format.');
        return;
      }
      if (cardCvv.length !== 3) {
        setError('Please enter a valid 3-digit CVV.');
        return;
      }
    } else if (paymentMethod === 'UPI') {
      if (!upiId.includes('@') || upiId.split('@')[0].length < 3) {
        setError('Please enter a valid UPI ID (e.g. user@bank).');
        return;
      }
    }

    setLoading(true);

    try {
      const orderPayload = {
        items: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        totalPrice: grandTotal,
        deliveryType,
        address: deliveryType === 'Delivery' ? address : 'Pickup Counter',
        paymentMethod,
        customerName,
        customerPhone
      };

      const orderResult = await postOrder(orderPayload);
      setSuccess(true);
      onClearCart();
      
      // Fire confetti celebration!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '80vh', alignItems: 'center', padding: '1.5rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '3rem', textAlign: 'center', background: 'var(--white)' }}>
          <CheckCircle size={64} style={{ color: '#1A8245', margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.5rem' }}>Order Placed!</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Your bakes are going into the oven. Track your status on your dashboard.</p>
          
          <div style={{ background: 'var(--secondary-color)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: '600' }}>
            A simulation of ₹{grandTotal.toFixed(2)} payment was processed securely.
          </div>

          <button onClick={() => navigate('/order-history')} className="btn btn-primary" style={{ width: '100%' }}>
            Go to My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Finalize Basket & Checkout</h2>
      
      {error && (
        <div className="badge-egg" style={{ padding: '10px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>🚨 {error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '15px' }}>
          <Loader size={48} className="text-accent" style={{ animation: 'spin 1.5s linear infinite' }} />
          <p style={{ fontWeight: '600' }}>Securing your transaction with local gateway hooks...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmitOrder} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }} className="grid-2">
          
          {/* Left Column: Form Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Delivery vs Pickup Selector */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Fulfillment Option</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  type="button"
                  onClick={() => setDeliveryType('Delivery')} 
                  className={`btn ${deliveryType === 'Delivery' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  <MapPin size={16} /> Delivery to Address
                </button>
                <button 
                  type="button"
                  onClick={() => setDeliveryType('Pickup')} 
                  className={`btn ${deliveryType === 'Pickup' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  Pickup at Store
                </button>
              </div>
            </div>

            {/* Customer Information */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Delivery Information</h3>
              
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Required for confirmation)</label>
                <input 
                  type="tel" 
                  placeholder="9876543210"
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))} 
                  className="form-input" 
                  required 
                />
              </div>

              {deliveryType === 'Delivery' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Street Address</label>
                    <input 
                      type="text" 
                      placeholder="Apartment/Suite, Road, Area name"
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pin Location on Map (Click Map to Select Address coords)</label>
                    <div className="map-picker-container">
                      <MapContainer center={[coords.lat, coords.lng]} zoom={13} style={{ width: '100%', height: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker />
                      </MapContainer>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Payment Integration */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: '#1A8245' }} /> Secure Payment Gateways
              </h3>
              
              <div className="payment-methods">
                <div 
                  onClick={() => setPaymentMethod('Card')} 
                  className={`payment-method-card ${paymentMethod === 'Card' ? 'selected' : ''}`}
                >
                  <CreditCard size={20} style={{ margin: '0 auto 6px auto' }} />
                  <span>Card</span>
                </div>
                <div 
                  onClick={() => setPaymentMethod('UPI')} 
                  className={`payment-method-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}
                >
                  <Smartphone size={20} style={{ margin: '0 auto 6px auto' }} />
                  <span>UPI ID</span>
                </div>
                <div 
                  onClick={() => setPaymentMethod('COD')} 
                  className={`payment-method-card ${paymentMethod === 'COD' ? 'selected' : ''}`}
                >
                  <DollarSign size={20} style={{ margin: '0 auto 6px auto' }} />
                  <span>COD</span>
                </div>
              </div>

              {/* Card Inputs */}
              {paymentMethod === 'Card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Credit / Debit Card Number (Masked)</label>
                    <input 
                      type="text" 
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">Expiry (MM/YY)</label>
                      <input 
                        type="text" 
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">CVV (3 digits)</label>
                      <input 
                        type="password" 
                        placeholder="•••"
                        value={cardCvv}
                        onChange={handleCvvChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Inputs */}
              {paymentMethod === 'UPI' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Virtual Payment Address (VPA / UPI ID)</label>
                  <input 
                    type="text" 
                    placeholder="yash@ybl"
                    value={upiId}
                    onChange={handleUpipiId => handleUpiChange(upiId => handleUpiChange(upiId))} // wait, let's keep it simple
                    onChange={handleUpiChange}
                    className="form-input"
                  />
                </div>
              )}

              {paymentMethod === 'COD' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Pay with Cash or UPI directly at your doorstep during delivery, or at the bakery counter during pickup.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="card" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Basket Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: '600' }}>{item.name}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '10px' }}>x{item.quantity}</span>
                  </div>
                  <span style={{ fontWeight: '600' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Delivery Charge:</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '5px' }}>
                <span>Grand Total:</span>
                <span className="text-accent">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {user && (
              <div style={{ background: 'var(--bg-color)', border: '1px solid var(--primary-color)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Demo Wallet Balance:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-color)' }}>₹{parseFloat(user.wallet_balance).toFixed(2)}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              Place Secure Order
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
