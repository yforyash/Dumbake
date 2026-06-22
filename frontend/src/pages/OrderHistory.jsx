import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders } from '../services/api';
import { ShoppingBag, ChevronRight, Calendar, Info } from 'lucide-react';

export default function OrderHistory({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStepActive = (status) => {
    switch (status) {
      case 'Placed': return 1;
      case 'Preparing': return 2;
      case 'Ready': return 3;
      case 'Delivered': return 4;
      default: return 0;
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading your orders...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Your Bakery Orders</h2>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ShoppingBag size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--primary-color)' }} />
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No orders recorded yet.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Start Ordering
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map(order => {
            const itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            const step = getStepActive(order.status);
            return (
              <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-color)' }}>Order #{order.id}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
                </div>

                {/* Items and total */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="grid-2">
                  <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '12px' }}>
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
                      Address: <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{order.address}</span>
                    </div>
                    <div style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
                      Payment: <span style={{ fontWeight: '600' }}>{order.payment_method} ({order.payment_status})</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '10px' }}>
                      Total Price: <span className="text-accent">₹{parseFloat(order.total_price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Tracking Progress Bar */}
                {order.status !== 'Cancelled' && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '10px', color: 'var(--text-muted)' }}>Preparation & Delivery Progress</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '20px' }}>
                      {/* Connection Line */}
                      <div style={{ position: 'absolute', top: '8px', left: '0', width: '100%', height: '3px', background: '#EEE', zIndex: '1' }}></div>
                      <div style={{ position: 'absolute', top: '8px', left: '0', width: `${((step - 1) / 3) * 100}%`, height: '3px', background: 'var(--accent-color)', zIndex: '2', transition: 'width 0.4s ease' }}></div>

                      {/* Stepper Steps */}
                      {['Placed', 'Preparing', 'Ready', 'Delivered'].map((label, idx) => {
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
