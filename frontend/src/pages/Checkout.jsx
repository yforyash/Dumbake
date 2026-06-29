import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, ShieldCheck, CreditCard, DollarSign, Smartphone, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import { postOrder, createStripePaymentIntent, createRazorpayOrder, verifyRazorpayPayment, fetchProfile } from '../services/api';
import { loadStripeScript, loadRazorpayScript } from '../utils/payment_loader';
import { setUser } from '../store/slices/authSlice';
import { clearCart } from '../store/slices/cartSlice';
import { setAddressOpen } from '../store/slices/addressSlice';
import confetti from 'canvas-confetti';

const validateLuhn = (cardNumberStr) => {
  const cleanVal = cardNumberStr.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleanVal)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = cleanVal.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanVal.charAt(i));
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const validateExpiry = (expiryStr) => {
  if (!/^\d{2}\/\d{2}$/.test(expiryStr)) return false;
  const parts = expiryStr.split('/');
  const month = parseInt(parts[0], 10);
  const year = parseInt('20' + parts[1], 10);
  if (month < 1 || month > 12) return false;
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
};

const validateUpi = (upiStr) => {
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiStr.trim());
};

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const activeAddress = useSelector((state) => state.address.activeAddress);

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

  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    state: 'idle',
    gateway: '',
    message: '',
    otpInput: '',
    error: ''
  });

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
    const value = e.target.value.trim();
    setUpiId(value);
  };

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [outOfBounds, setOutOfBounds] = useState(false);

  useEffect(() => {
    if (deliveryType !== 'Delivery' || !activeAddress) {
      setDeliveryFee(0);
      setDeliveryDistance(0);
      setOutOfBounds(false);
      return;
    }

    const fetchRouteInfo = async () => {
      setDistanceLoading(true);
      setError('');
      try {
        const bakeryLng = 85.3096;
        const bakeryLat = 23.3441;
        const url = `https://router.project-osrm.org/route/v1/driving/${bakeryLng},${bakeryLat};${activeAddress.longitude},${activeAddress.latitude}?overview=false`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch driving road route details.');
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          const distanceMeters = data.routes[0].distance;
          const distanceKm = parseFloat((distanceMeters / 1000).toFixed(2));
          
          setDeliveryDistance(distanceKm);
          
          if (distanceKm > 15) {
            setOutOfBounds(true);
            setDeliveryFee(0);
            setError(`Destination is ${distanceKm} km away. We only deliver within 15 km of Ranchi Bakery!`);
          } else {
            setOutOfBounds(false);
            const calculatedFee = Math.max(30, Math.round(distanceKm * 10));
            setDeliveryFee(calculatedFee);
          }
        } else {
          throw new Error('No driving route found to this address.');
        }
      } catch (err) {
        console.error(err);
        setDeliveryDistance(5.0);
        setDeliveryFee(50);
        setOutOfBounds(false);
      } finally {
        setDistanceLoading(false);
      }
    };

    fetchRouteInfo();
  }, [activeAddress, deliveryType]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  const discountPercentage = user && user.order_count === 0 ? 10 : (user && user.order_count === 4 ? 30 : 0);
  const discountAmount = subtotal * (discountPercentage / 100);
  const discountedGrandTotal = subtotal - discountAmount + deliveryFee;

  const walletBalance = user ? parseFloat(user.wallet_balance) : 0;
  const walletUsed = payWithWallet ? Math.min(walletBalance, discountedGrandTotal) : 0;
  const remainingPayable = parseFloat((discountedGrandTotal - walletUsed).toFixed(2));

  const validateCardDetails = () => {
    const rawCardNum = cardNumber.replace(/\s/g, '');
    if (rawCardNum.length !== 16) {
      return 'Please enter a valid 16-digit card number.';
    }
    if (!validateLuhn(rawCardNum)) {
      return 'Card number failed security verification (Luhn Check invalid).';
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      return 'Please enter expiry in MM/YY format.';
    }
    if (!validateExpiry(cardExpiry)) {
      return 'Card expiry date must be a valid future date.';
    }
    if (cardCvv.length !== 3) {
      return 'Please enter a valid 3-digit CVV.';
    }
    return null;
  };

  const validateUpiDetails = () => {
    if (!upiId) return 'UPI ID is required.';
    if (!validateUpi(upiId)) {
      return 'Please enter a valid UPI ID (e.g. username@bank).';
    }
    return null;
  };

  const executeFinalizeOrder = async (transactionId, forcedPaymentStatus) => {
    const finalAddress = deliveryType === 'Delivery' && activeAddress
      ? `${activeAddress.address_line} | Scheduled: ${deliveryDate} (${deliveryTimeSlot})`
      : `Store Pickup | Scheduled: ${deliveryDate} (${deliveryTimeSlot})`;

    const finalPaymentMethod = payWithWallet
      ? (remainingPayable === 0 ? 'Wallet' : `Wallet + ${paymentMethod}`)
      : paymentMethod;

    let paymentStatus = forcedPaymentStatus || 'Pending';
    if (!forcedPaymentStatus) {
      if (remainingPayable === 0) {
        paymentStatus = 'Paid';
      } else if (paymentMethod === 'Card' || paymentMethod === 'UPI') {
        paymentStatus = 'Paid';
      } else {
        paymentStatus = 'Pending';
      }
    }

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

    await postOrder(orderPayload);
    setSuccess(true);
    dispatch(clearCart());
    
    try {
      const profile = await fetchProfile();
      dispatch(setUser(profile));
    } catch (e) {
      console.error(e);
    }
    
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    setPaymentModal(prev => ({ ...prev, isOpen: false }));
  };

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

    if (deliveryType === 'Delivery' && outOfBounds) {
      setError(`Checkout blocked: Destination is outside our delivery radius of 15 km.`);
      return;
    }

    const currentPayable = remainingPayable;

    if (currentPayable > 0) {
      if (paymentMethod === 'Card') {
        const cardErr = validateCardDetails();
        if (cardErr) {
          setError(cardErr);
          return;
        }
      } else if (paymentMethod === 'UPI') {
        const upiErr = validateUpiDetails();
        if (upiErr) {
          setError(upiErr);
          return;
        }
      }
    }

    if (currentPayable === 0 || paymentMethod === 'COD') {
      setLoading(true);
      try {
        await executeFinalizeOrder(null, null);
      } catch (err) {
        setError(err.message || 'Failed to place order.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (paymentMethod === 'Card') {
      setPaymentModal({
        isOpen: true,
        state: 'loading',
        gateway: 'Stripe',
        message: 'Initializing Stripe Secure payment session...',
        otpInput: '',
        error: ''
      });

      try {
        const intentRes = await createStripePaymentIntent(currentPayable);
        
        if (intentRes.isMock) {
          setTimeout(() => {
            setPaymentModal(prev => ({
              ...prev,
              state: 'otp_required',
              message: 'Stripe 3D-Secure authentication required. Please enter the verification OTP sent to your card issuer phone.'
            }));
          }, 2000);
        } else {
          const scriptLoaded = await loadStripeScript();
          if (!scriptLoaded) throw new Error('Stripe JS SDK failed to load.');

          setPaymentModal(prev => ({
            ...prev,
            message: 'Stripe API Session handshaked. Confirming test card token verification...'
          }));

          setTimeout(() => {
            setPaymentModal(prev => ({
              ...prev,
              state: 'otp_required',
              message: 'Live test environment verification code requested.'
            }));
          }, 2000);
        }
      } catch (err) {
        setPaymentModal(prev => ({
          ...prev,
          state: 'failed',
          error: err.message || 'Stripe payment intent failed.'
        }));
      }
    }

    if (paymentMethod === 'UPI') {
      setPaymentModal({
        isOpen: true,
        state: 'loading',
        gateway: 'Razorpay',
        message: 'Initializing Razorpay order session...',
        otpInput: '',
        error: ''
      });

      try {
        const rzpOrder = await createRazorpayOrder(currentPayable);
        
        if (rzpOrder.isMock) {
          setTimeout(() => {
            setPaymentModal(prev => ({
              ...prev,
              state: 'otp_required',
              message: `UPI Payment request pushed to: ${upiId}. Confirm notification approval in GPay/PhonePe to finalize order.`
            }));
          }, 2000);
        } else {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) throw new Error('Razorpay SDK failed to load.');

          setPaymentModal(prev => ({ ...prev, isOpen: false }));

          const options = {
            key: rzpOrder.keyId,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            name: 'Dumbake Bakery',
            description: 'Bakery Order Checkout',
            order_id: rzpOrder.orderId,
            prefill: {
              name: customerName,
              contact: customerPhone,
              email: user?.email || ''
            },
            handler: async function (response) {
              setLoading(true);
              setPaymentModal({
                isOpen: true,
                state: 'loading',
                gateway: 'Razorpay',
                message: 'Verifying payment signature with Razorpay backend server...',
                otpInput: '',
                error: ''
              });

              try {
                await verifyRazorpayPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });
                
                await executeFinalizeOrder(response.razorpay_payment_id, 'Paid');
              } catch (verifyErr) {
                setPaymentModal({
                  isOpen: true,
                  state: 'failed',
                  gateway: 'Razorpay',
                  message: '',
                  otpInput: '',
                  error: verifyErr.message || 'Razorpay signature validation failed.'
                });
                setLoading(false);
              }
            },
            modal: {
              ondismiss: function () {
                console.log('[Payments] Razorpay widget closed.');
              }
            },
            theme: {
              color: '#9A0F29'
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } catch (err) {
        setPaymentModal(prev => ({
          ...prev,
          state: 'failed',
          error: err.message || 'Razorpay order creation failed.'
        }));
      }
    }
  };

  const handleConfirmOtp = async (e) => {
    e.preventDefault();
    if (paymentModal.otpInput.length !== 6 || isNaN(paymentModal.otpInput)) {
      setPaymentModal(prev => ({ ...prev, error: 'Please enter a valid 6-digit verification code.' }));
      return;
    }

    setPaymentModal(prev => ({
      ...prev,
      state: 'loading',
      message: 'Processing secure authorization with credit provider...',
      error: ''
    }));

    setTimeout(async () => {
      try {
        await executeFinalizeOrder(`mock_tx_${Date.now()}`, 'Paid');
      } catch (err) {
        setPaymentModal(prev => ({
          ...prev,
          state: 'failed',
          error: err.message || 'Mock transaction approval failed.'
        }));
      }
    }, 1500);
  };

  const handleCancelPayment = () => {
    setPaymentModal({
      isOpen: false,
      state: 'idle',
      gateway: '',
      message: '',
      otpInput: '',
      error: ''
    });
  };

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '80vh', alignItems: 'center', padding: '1.5rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '3rem', textAlign: 'center', background: 'var(--white)' }}>
          <CheckCircle size={64} style={{ color: '#1A8245', margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.5rem' }}>Order Placed!</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Your bakes are going into the oven. Track your status on your dashboard.</p>
          
          <div style={{ background: 'var(--secondary-color)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: '600' }}>
            A payment of ₹{discountedGrandTotal.toFixed(2)} was processed successfully.
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
        <div className="badge-egg" style={{ padding: '10px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#FDF0ED', border: '1px solid var(--primary-color)' }}>
          <span style={{ color: 'var(--accent-color)', fontWeight: '650' }}>🚨 {error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '15px' }}>
          <Loader size={48} className="text-accent" style={{ animation: 'spin 1.5s linear infinite' }} />
          <p style={{ fontWeight: '600' }}>Securing your transaction with payment gateway hooks...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmitOrder} style={{ display: 'grid', gap: '2.5rem' }} className="grid-2">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                        onClick={() => dispatch(setAddressOpen(true))}
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
                        onClick={() => dispatch(setAddressOpen(true))}
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

              {remainingPayable > 0 && paymentMethod === 'Card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Credit / Debit Card Number</label>
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

              {remainingPayable > 0 && paymentMethod === 'UPI' && (
                <div className="form-group" style={{ margin: 0, marginTop: '1.5rem' }}>
                  <label className="form-label">Virtual Payment Address (VPA / UPI ID)</label>
                  <input 
                    type="text" 
                    placeholder="username@bank"
                    value={upiId}
                    onChange={handleUpiChange}
                    className="form-input"
                  />
                </div>
              )}

              {remainingPayable > 0 && paymentMethod === 'COD' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  Pay with Cash or UPI directly at your doorstep during delivery, or at the bakery counter during store pickup.
                </p>
              )}
            </div>
          </div>

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
                <span>Delivery Charge{deliveryDistance > 0 && ` (${deliveryDistance} km)`}:</span>
                <span>{distanceLoading ? 'Calculating...' : `₹${deliveryFee.toFixed(2)}`}</span>
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

      {paymentModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(47, 26, 28, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '2.5rem',
            background: 'var(--white)',
            textAlign: 'center',
            boxShadow: 'var(--shadow)',
            border: '1.5px solid var(--border-color)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              color: 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <ShieldCheck size={24} style={{ color: '#1A8245' }} />
              {paymentModal.gateway} Gateway
            </h3>

            {paymentModal.error && (
              <div style={{
                backgroundColor: '#FDF0ED',
                border: '1px solid var(--primary-color)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--accent-color)',
                textAlign: 'left'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{paymentModal.error}</span>
              </div>
            )}

            {paymentModal.state === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', margin: '2rem 0' }}>
                <Loader size={44} style={{ color: 'var(--primary-color)', animation: 'spin 1.5s linear infinite' }} />
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-color)' }}>
                  {paymentModal.message}
                </p>
              </div>
            )}

            {paymentModal.state === 'otp_required' && (
              <form onSubmit={handleConfirmOtp} style={{ margin: '1.5rem 0 0 0' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  {paymentModal.message}
                </p>

                {paymentModal.gateway === 'Razorpay' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', background: 'var(--primary-light)', padding: '8px 16px', borderRadius: '20px', color: 'var(--accent-color)', fontWeight: '700' }}>
                      Pushed Request to: {upiId}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      In real mode, you approve on PhonePe/GPay. For this demo, click approve below:
                    </p>
                    <button
                      type="button"
                      onClick={() => setPaymentModal(prev => ({ ...prev, otpInput: '123456' }))}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '700' }}
                    >
                      Authorize Sandbox UPI Callback
                    </button>
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Enter 3D-Secure 6-Digit OTP</label>
                    <input
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={paymentModal.otpInput}
                      onChange={(e) => setPaymentModal(prev => ({ ...prev, otpInput: e.target.value.replace(/\D/g, '') }))}
                      className="form-input"
                      style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: '800' }}
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    type="button"
                    onClick={handleCancelPayment}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {paymentModal.gateway === 'Razorpay' ? 'Approve Payment' : 'Verify & Pay'}
                  </button>
                </div>
              </form>
            )}

            {paymentModal.state === 'failed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                  We were unable to verify this transaction with your credit provider. Please check your credentials and try again.
                </p>
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
