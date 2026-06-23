import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, CreditCard, DollarSign, Smartphone, Loader, CheckCircle } from 'lucide-react';
import { postOrder } from '../services/api';
import confetti from 'canvas-confetti';

export default function Checkout({ user, cartItems, onClearCart, activeAddress, onAddressClick }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [deliveryType, setDeliveryType] = useState('Delivery');
  const [customerName, setCustomerName] = useState(user ? user.name : '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [payWithWallet, setPayWithWallet] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [deliveryDate, setDeliveryDate] = useState(getTomorrowString());
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('Morning (9 AM - 12 PM)');

  useEffect(() => {
    if (cartItems.length === 0 && !success) {
      navigate('/');
    }
  }, [cartItems, success]);

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.substring(0, 16);
    
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);

    if (value.length >= 3) {
      setCardExpiry(`${value.substring(0, 2)}/${value.substring(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setCardCvv(value);
    }
  };

  const handleUpiChange = (e) => {
    const value = e.target.value.trim().toLowerCase();
    setUpiId(value);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryCharge = deliveryType === 'Delivery' ? 40 : 0;
  
  const discountPercentage = user && user.order_count === 0 ? 10 : (user && user.order_count === 4 ? 30 : 0);
  const discountAmount = subtotal * (discountPercentage / 100);
  const discountedGrandTotal = subtotal - discountAmount + deliveryCharge;

  const walletBalance = user ? parseFloat(user.wallet_balance) : 0;
  const walletUsed = payWithWallet ? Math.min(walletBalance, discountedGrandTotal) : 0;
  const remainingPayable = parseFloat((discountedGrandTotal - walletUsed).toFixed(2));

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

    if (deliveryType === 'Delivery' && !activeAddress) {
      setError('Please specify a delivery address.');
      return;
    }

    if (payWithWallet) {
      if (remainingPayable > 0) {
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
      }
    } else {
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
    }

    setLoading(true);

    try {
      const finalAddress = deliveryType === 'Delivery' && activeAddress
        ? `${activeAddress.address_line} | Scheduled: ${deliveryDate} (${deliveryTimeSlot})`
        : `Store Pickup | Scheduled: ${deliveryDate} (${deliveryTimeSlot})`;

      const finalPaymentMethod = payWithWallet
        ? (remainingPayable === 0 ? 'Wallet' : `Wallet + ${paymentMethod}`)
        : paymentMethod;

      const orderPayload = {
        items: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, customizations: i.customizations })),
        totalPrice: discountedGrandTotal,
        deliveryType,
        address: finalAddress,
        paymentMethod: finalPaymentMethod,
        customerName,
        customerPhone,
        latitude: deliveryType === 'Delivery' && activeAddress ? activeAddress.latitude : null,
        longitude: deliveryType === 'Delivery' && activeAddress ? activeAddress.longitude : null,
        payWithWallet
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
            A simulation of ₹{discountedGrandTotal.toFixed(2)} payment was processed securely.
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
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Delivery/Pickup Date</label>
                  <input 
                    type="date" 
                    min={getTomorrowString()}
                    value={deliveryDate} 
                    onChange={(e) => setDeliveryDate(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preferred Time Slot</label>
                  <select 
                    value={deliveryTimeSlot} 
                    onChange={(e) => setDeliveryTimeSlot(e.target.value)} 
                    className="form-input"
                  >
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                    <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                  </select>
                </div>
              </div>

              {deliveryType === 'Delivery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Delivery Destination</label>
                  {activeAddress ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: '16px',
                      border: '1.5px solid var(--border-color)',
                      backgroundColor: 'var(--primary-light)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', overflow: 'hidden' }}>
                        <div style={{
                          backgroundColor: 'var(--accent-color)',
                          color: '#ffffff',
                          padding: '8px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <MapPin size={16} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-color)', textTransform: 'capitalize' }}>
                            {activeAddress.label} Address
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {activeAddress.address_line}
                          </span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={onAddressClick}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-color)',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      border: '1.5px dashed var(--accent-color)',
                      backgroundColor: 'var(--primary-light)',
                      textAlign: 'center'
                    }}>
                      <MapPin size={32} style={{ color: 'var(--accent-color)', margin: '0 auto 8px auto' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', fontWeight: '700', marginBottom: '12px' }}>
                        No delivery address set.
                      </p>
                      <button 
                        type="button"
                        onClick={onAddressClick}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: 'var(--accent-color)',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Set Delivery Address
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

             {/* Payment Integration */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: '#1A8245' }} /> Secure Payment Gateways
              </h3>
                        {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem', background: 'var(--primary-light)', borderRadius: '12px', marginBottom: '1.5rem', border: '1.5px solid var(--border-color)' }}>
                  <input 
                    type="checkbox" 
                    id="pay-with-wallet"
                    checked={payWithWallet} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPayWithWallet(checked);
                      if (checked) {
                        if (walletBalance >= discountedGrandTotal) {
                          setPaymentMethod('Wallet');
                        } else {
                          setPaymentMethod('COD');
                        }
                      } else {
                        setPaymentMethod('COD');
                      }
                    }}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                  />
                  <label htmlFor="pay-with-wallet" style={{ fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>Pay using Dumbake Wallet</span>
                      <span style={{ color: 'var(--accent-color)' }}>Balance: ₹{walletBalance.toFixed(2)}</span>
                    </span>
                    {payWithWallet && (
                      <span style={{ fontSize: '0.8rem', color: '#1A8245', fontWeight: '600', marginTop: '4px' }}>
                        Deduction: -₹{walletUsed.toFixed(2)} | Remaining Balance: ₹{(walletBalance - walletUsed).toFixed(2)}
                      </span>
                    )}
                  </label>
                </div>
              )}
              
              {remainingPayable > 0 ? (
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '750', marginBottom: '10px', color: 'var(--text-color)' }}>
                    Choose payment method for the remaining ₹{remainingPayable.toFixed(2)}:
                  </p>
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
                </div>
              ) : (
                payWithWallet && (
                  <div style={{ padding: '1rem', background: '#E2F6E9', color: '#1A8245', borderRadius: '12px', border: '1.5px solid #1A8245', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
                    <span>✓ Fully paid using Dumbake Wallet. No further payment needed.</span>
                  </div>
                )
              )}

              {/* Card Inputs */}
              {remainingPayable > 0 && paymentMethod === 'Card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem' }}>
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
              {remainingPayable > 0 && paymentMethod === 'UPI' && (
                <div className="form-group" style={{ margin: 0, marginTop: '1.5rem' }}>
                  <label className="form-label">Virtual Payment Address (VPA / UPI ID)</label>
                  <input 
                    type="text" 
                    placeholder="yash@ybl"
                    value={upiId}
                    onChange={handleUpiChange}
                    className="form-input"
                  />
                </div>
              )}

              {remainingPayable > 0 && paymentMethod === 'COD' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
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
                <div key={item.cartKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: '600' }}>{item.name}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '10px' }}>x{item.quantity}</span>
                    {item.customizations && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '2px' }}>
                        {item.customizations.weight ? `${item.customizations.weight} | ` : ''}
                        {item.customizations.eggless ? '🟢 Eggless' : '🔴 With Egg'}
                        {item.customizations.message && ` | "${item.customizations.message}"`}
                        {item.customizations.instructions && ` | Note: ${item.customizations.instructions}`}
                      </div>
                    )}
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
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#1A8245', fontWeight: '600' }}>
                  <span>{discountPercentage}% {discountPercentage === 10 ? 'First Order Discount' : '5th Order Loyalty Reward'}:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Delivery Charge:</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '5px' }}>
                <span>Grand Total:</span>
                <span>₹{discountedGrandTotal.toFixed(2)}</span>
              </div>
              {payWithWallet && walletUsed > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                    <span>Wallet Deduction:</span>
                    <span>-₹{walletUsed.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '2px' }}>
                    <span>Net Payable:</span>
                    <span className="text-accent">₹{remainingPayable.toFixed(2)}</span>
                  </div>
                </>
              )}
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
