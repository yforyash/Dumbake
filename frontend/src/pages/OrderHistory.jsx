import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchOrders } from '../services/api';
import { ShoppingBag, Calendar } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

const bakeryIcon = L.divIcon({
  html: `<div style="background-color: #FAF6EE; width: 26px; height: 26px; border: 3px solid var(--accent-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(154,15,41,0.25); font-size: 13px;">🍰</div>`,
  className: 'custom-bakery-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const customerIcon = L.divIcon({
  html: `<div style="background-color: var(--primary-light); width: 26px; height: 26px; border: 3px solid var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(226,61,82,0.25); font-size: 13px;">🏠</div>`,
  className: 'custom-customer-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const deliveryIcon = L.divIcon({
  html: `<div style="background-color: var(--accent-color); width: 28px; height: 28px; border: 3px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); font-size: 14px; animation: bounce 1s infinite alternate;">🛵</div>`,
  className: 'custom-delivery-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function DeliveryTrackingMap({ order }) {
  const bakery = [23.3441, 85.3096];
  const customer = [parseFloat(order.latitude), parseFloat(order.longitude)];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (order.status !== 'Dispatched') {
      setProgress(0);
      return;
    }
    if (order.rider_latitude && order.rider_longitude) {
      return;
    }
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 1 ? 0 : prev + 0.015));
    }, 180);
    return () => clearInterval(interval);
  }, [order.status, order.rider_latitude, order.rider_longitude]);

  let deliveryBoyPos = bakery;
  if (order.rider_latitude && order.rider_longitude) {
    deliveryBoyPos = [parseFloat(order.rider_latitude), parseFloat(order.rider_longitude)];
  } else if (order.status === 'Dispatched') {
    const currentLat = bakery[0] + (customer[0] - bakery[0]) * progress;
    const currentLng = bakery[1] + (customer[1] - bakery[1]) * progress;
    deliveryBoyPos = [currentLat, currentLng];
  } else if (order.status === 'Delivered') {
    deliveryBoyPos = customer;
  }

  const riderName = "Amit Kumar";
  const riderPhone = "+91 9151463571"; 

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        🛵 Live Order Tracking Map
      </span>
      
      <div style={{
        height: '270px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1.5px solid var(--border-color)',
        position: 'relative'
      }}>
        <MapContainer center={[(bakery[0] + customer[0]) / 2, (bakery[1] + customer[1]) / 2]} zoom={13} style={{ width: '100%', height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={bakery} icon={bakeryIcon} />
          <Marker position={customer} icon={customerIcon} />
          {order.status === 'Dispatched' && (
            <Marker position={deliveryBoyPos} icon={deliveryIcon} />
          )}
          <Polyline positions={[bakery, customer]} color="var(--accent-color)" dashArray="5, 10" weight={3} />
        </MapContainer>
        
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: '#ffffff',
          padding: '6px 12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '0.75rem',
          zIndex: 400,
          fontWeight: '700',
          color: 'var(--accent-color)'
        }}>
          {order.status === 'Placed' ? '⏳ Order placed, awaiting baking acceptance...' :
           order.status === 'Preparing' ? '🥣 Chef Ishika is baking your fresh treats...' :
           order.status === 'Ready' ? '🍰 Bakes ready! Waiting for delivery rider pickup...' :
           order.status === 'Dispatched' ? '🛵 Rider Amit has loaded your bakes and is on the way!' :
           '🎉 Order Delivered! Enjoy your fresh bakes!'}
        </div>
      </div>

      <div style={{
        padding: '1.25rem',
        borderRadius: '16px',
        border: '1.5px solid var(--border-color)',
        backgroundColor: 'var(--primary-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-color)' }}>
              Delivery Partner: {riderName}
            </h5>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Contact Number: {riderPhone}
            </p>
          </div>
          {(order.status === 'Dispatched' || order.status === 'Delivered') && (
            <a 
              href={`tel:${riderPhone}`} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--accent-color)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.8rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s'
              }}
              className="btn"
            >
              📞 Call Amit
            </a>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.85rem' }}>
            📍 <strong>Delivery Address:</strong> {order.address}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '750', lineHeight: '1.4' }}>
            <strong>Current Status:</strong> {
              order.status === 'Placed' ? '⏳ Awaiting kitchen configuration acceptance.' :
              order.status === 'Preparing' ? '🥣 Chef Ishika is mixing fresh ingredients and baking your custom treats.' :
              order.status === 'Ready' ? '🍰 Bakes are hot and boxed! Waiting for rider arrival.' :
              order.status === 'Dispatched' ? '🛵 Rider Amit is en route with your packages. Watch them on the map!' :
              '🎉 Delivered! Enjoy your delicious bakes from Dumbake Ranchi.'
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Complaints states
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalFile, setModalFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();

    const interval = setInterval(async () => {
      try {
        const data = await fetchOrders();
        const hasActive = data.some(o => ['Placed', 'Preparing', 'Ready', 'Dispatched'].includes(o.status));
        if (hasActive) {
          setOrders(data);
        }
        // Poll complaints too
        loadComplaintsSilently();
      } catch (err) {
        console.error('[Polling Error]', err);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
      await loadComplaintsSilently();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadComplaintsSilently = async () => {
    try {
      const response = await fetch('/api/complaints/my', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComplaints(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('[Complaints Load Error]', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit by extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    let limitBytes = 0;
    let limitLabel = '';

    if (ext === '.pptx') {
      limitBytes = 20 * 1024 * 1024;
      limitLabel = '20 MB';
    } else if (ext === '.pdf') {
      limitBytes = 10 * 1024 * 1024;
      limitLabel = '10 MB';
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      limitBytes = 5 * 1024 * 1024;
      limitLabel = '5 MB';
    } else if (ext === '.txt') {
      limitBytes = 2 * 1024 * 1024;
      limitLabel = '2 MB';
    } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
      limitBytes = 50 * 1024 * 1024;
      limitLabel = '50 MB';
    } else {
      setError('Unsupported file type. Allowed: PPTX, PDF, JPG, PNG, TXT, MP4, MOV, AVI, MKV');
      return;
    }

    if (file.size > limitBytes) {
      setError(`File size exceeds limit of ${limitLabel} for ${ext.toUpperCase()} files.`);
      return;
    }

    setError('');
    setModalFile(file);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Subject and description are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let fileId = null;

      // 1. Upload file if attached
      if (modalFile) {
        const formData = new FormData();
        formData.append('file', modalFile);

        const uploadRes = await fetch('/api/userfiles/upload-raw', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'File upload failed');
        }

        const uploadData = await uploadRes.json();
        fileId = uploadData.fileId;
      }

      // 2. Submit complaint
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          subject: subject.trim(),
          description: description.trim(),
          fileId
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit complaint');
      }

      const newComplaint = await response.json();
      setComplaints(prev => [newComplaint, ...prev]);
      
      // Reset & close
      setShowModal(false);
      setSelectedOrderId(null);
      setSubject('');
      setDescription('');
      setModalFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStepActive = (status) => {
    switch (status) {
      case 'Placed': return 1;
      case 'Preparing': return 2;
      case 'Ready': return 3;
      case 'Dispatched': return 3;
      case 'Delivered': return 4;
      default: return 0;
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--accent-color)', fontWeight: '700' }}>Loading your orders...</div>;
  }

  const ongoingOrders = orders.filter(o => ['Placed', 'Preparing', 'Ready', 'Dispatched'].includes(o.status));
  const pastOrders = orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status));

  const renderOrderCard = (order) => {
    const itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const step = getStepActive(order.status);
    return (
      <div key={order.id} className="card" style={{ padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-color)' }}>Order #{order.id}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>
          <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="grid-2">
          <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-color)' }}>Items Summary</h4>
            {itemsList.map((i, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                <span>{i.name}</span>
                <span style={{ fontWeight: '700' }}>x{i.quantity}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
              Delivery Type: <span style={{ fontWeight: '600' }}>{order.delivery_type}</span>
            </div>
            <div style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
              Address: <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{order.address.split('|')[0]}</span>
            </div>
            <div style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
              Payment: <span style={{ fontWeight: '600' }}>{order.payment_method} ({order.payment_status})</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '10px' }}>
              Total Price: <span className="text-accent">₹{parseFloat(order.total_price).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.status !== 'Cancelled' && (
          <div>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '10px', color: 'var(--text-muted)' }}>Preparation & Delivery Progress</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '20px' }}>
              
              <div style={{ position: 'absolute', top: '8px', left: '0', width: '100%', height: '3px', background: '#EEE', zIndex: '1' }}></div>
              <div style={{ position: 'absolute', top: '8px', left: '0', width: `${((step - 1) / 3) * 100}%`, height: '3px', background: 'var(--accent-color)', zIndex: '2', transition: 'width 0.4s ease' }}></div>

              {['Placed', 'Preparing', 'Dispatched', 'Delivered'].map((label, idx) => {
                const active = step >= idx + 1;
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: '3', flex: 1 }}>
                    <div 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        background: active ? 'var(--accent-color)' : '#EEE', 
                        border: '3px solid #FFF',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.4s ease'
                      }}
                    ></div>
                    <span style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: active ? '700' : '500', color: active ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.status !== 'Cancelled' && order.delivery_type === 'Delivery' && order.latitude && order.longitude && (
          <DeliveryTrackingMap order={order} />
        )}

        {/* Support Complaint / Chat Section */}
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          {(() => {
            const existing = complaints.find(c => c.order_id === order.id);
            if (existing) {
              return (
                <button 
                  onClick={() => navigate(`/support-chat/${existing.id}`)}
                  style={{
                    backgroundColor: '#FAF6EE',
                    color: 'var(--accent-color)',
                    border: '1.5px solid var(--accent-color)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  💬 View Support Chat ({existing.status})
                </button>
              );
            }
            return (
              <button 
                onClick={() => {
                  setSelectedOrderId(order.id);
                  setError('');
                  setSubject('');
                  setDescription('');
                  setModalFile(null);
                  setShowModal(true);
                }}
                style={{
                  backgroundColor: 'var(--text-color)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '750',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ⚠️ Raise Complaint
              </button>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ maxWidth: '800px', paddingBottom: '3rem' }}>
      <h2 style={{ fontSize: '2.2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-color)' }}>
        Your Bakery Orders
      </h2>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ShoppingBag size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--primary-color)' }} />
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No orders recorded yet.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Start Ordering
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          <div>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '800', 
              marginBottom: '1rem', 
              borderBottom: '2.5px solid var(--accent-color)', 
              paddingBottom: '6px', 
              color: 'var(--text-color)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <span>🛵 Ongoing Orders</span>
              {ongoingOrders.length > 0 && (
                <span style={{ 
                  backgroundColor: 'var(--accent-color)', 
                  color: 'white', 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: '12px' 
                }}>
                  {ongoingOrders.length}
                </span>
              )}
            </h3>
            
            {ongoingOrders.length === 0 ? (
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '16px', 
                backgroundColor: 'var(--primary-light)', 
                border: '1.5px dashed var(--border-color)', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                ℹ️ No ongoing orders at the moment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {ongoingOrders.map(order => renderOrderCard(order))}
              </div>
            )}
          </div>

          {pastOrders.length > 0 && (
            <div>
              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: '800', 
                marginBottom: '1rem', 
                borderBottom: '1.5px solid var(--border-color)', 
                paddingBottom: '6px', 
                color: 'var(--text-muted)' 
              }}>
                📜 Past Orders ({pastOrders.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {pastOrders.map(order => renderOrderCard(order))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Raise Complaint Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--accent-color)', fontSize: '1.4rem' }}>
                Raise Support Ticket
              </h3>
              <button 
                onClick={() => { setShowModal(false); setSelectedOrderId(null); }}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Describe the issue with your Order #{selectedOrderId}. You can upload a photo of the food, the bill, or any document to help us understand.
            </p>

            {error && (
              <div style={{ backgroundColor: '#FFF2F3', color: '#D80027', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g., Damaged brookies, wrong item delivered"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Description</label>
                <textarea 
                  placeholder="Provide details about the issue..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Attach File (Optional)</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--border-color)',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    📎 Choose File
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {modalFile ? modalFile.name : 'No file chosen'}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Limits: Images (5MB) | Video (50MB) | PDF (10MB) | PPT (20MB) | TXT (2MB)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setSelectedOrderId(null); }}
                  style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
