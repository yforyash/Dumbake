import React, { useState, useEffect, useRef } from 'react';
import { fetchOrders, updateRiderLocation, updateRiderStatus } from '../services/api';
import { Loader, ShieldCheck, MapPin, CheckCircle, Navigation, Phone, User, Play, Square } from 'lucide-react';

export default function RiderConsole({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [trackingMode, setTrackingMode] = useState('none'); // 'none' | 'gps' | 'simulation'
  const [currentCoords, setCurrentCoords] = useState(null);
  const [simStep, setSimStep] = useState(0);

  const watchIdRef = useRef(null);
  const simIntervalRef = useRef(null);

  const fetchRiderOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      // Only display delivery orders (skip store pickups)
      const deliveryOrders = data.filter(o => o.delivery_type === 'Delivery');
      setOrders(deliveryOrders);
    } catch (err) {
      setError(err.message || 'Failed to fetch active rider deliveries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderOrders();
    return () => {
      stopTracking();
    };
  }, []);

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simIntervalRef.current !== null) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setActiveTrackingId(null);
    setTrackingMode('none');
    setCurrentCoords(null);
    setSimStep(0);
  };

  // 1. Live Geolocation Watcher
  const startGpsTracking = (order) => {
    stopTracking();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setActiveTrackingId(order.id);
    setTrackingMode('gps');

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentCoords({ lat, lng });
        
        try {
          await updateRiderLocation(order.id, lat, lng);
          console.log(`[Rider GPS] Updated location to: ${lat}, ${lng}`);
        } catch (err) {
          console.error('[Rider GPS Error]', err.message);
        }
      },
      (err) => {
        console.error('[Rider Geolocation Failed]', err);
        alert(`GPS Watcher Error: ${err.message}. Reverting to manual status tracking.`);
        stopTracking();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 2. Simulated coordinate movement loop
  const startSimulationTracking = (order) => {
    stopTracking();
    setActiveTrackingId(order.id);
    setTrackingMode('simulation');

    const startLat = 23.3441;
    const startLng = 85.3096;
    const destLat = parseFloat(order.latitude) || 23.3500;
    const destLng = parseFloat(order.longitude) || 85.3200;

    let step = 0;
    setSimStep(0);
    setCurrentCoords({ lat: startLat, lng: startLng });

    simIntervalRef.current = setInterval(async () => {
      step += 1;
      setSimStep(step);
      
      const ratio = step / 10;
      const currentLat = startLat + (destLat - startLat) * ratio;
      const currentLng = startLng + (destLng - startLng) * ratio;
      
      setCurrentCoords({ lat: currentLat, lng: currentLng });

      try {
        await updateRiderLocation(order.id, currentLat, currentLng);
        console.log(`[Rider Simulation] Posted coords step ${step}/10: ${currentLat}, ${currentLng}`);
      } catch (err) {
        console.error('[Rider Simulation Post Error]', err);
      }

      if (step >= 10) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
        alert("Simulation Complete! Rider has reached customer's address.");
      }
    }, 5000); // Update coordinates every 5 seconds
  };

  const handleStartDelivery = async (order, modeType) => {
    try {
      setLoading(true);
      await updateRiderStatus(order.id, 'Dispatched');
      await fetchRiderOrders();
      
      const updatedOrder = orders.find(o => o.id === order.id) || order;
      if (modeType === 'gps') {
        startGpsTracking(updatedOrder);
      } else {
        startSimulationTracking(updatedOrder);
      }
    } catch (err) {
      alert(err.message || 'Failed to initialize delivery dispatch.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDelivery = async (orderId) => {
    try {
      setLoading(true);
      stopTracking();
      await updateRiderStatus(orderId, 'Delivered');
      await fetchRiderOrders();
      alert('Order marked as Delivered! Wallet deductions or cash settlement finalized.');
    } catch (err) {
      alert(err.message || 'Failed to complete delivery.');
    } finally {
      setLoading(false);
    }
  };

  const readyOrders = orders.filter(o => o.status === 'Ready');
  const dispatchedOrders = orders.filter(o => o.status === 'Dispatched');
  const pastOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-color)' }}>🛵 Rider Console</h2>
          <p style={{ color: 'var(--text-muted)' }}>Deliver hot, fresh bakes to Ranchi customers with live GPS dispatch tracking</p>
        </div>
        <button onClick={fetchRiderOrders} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          🔄 Refresh Orders
        </button>
      </div>

      {activeTrackingId && (
        <div style={{
          background: 'var(--primary-light)',
          border: '1.5px solid var(--primary-color)',
          padding: '1.5rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--accent-color)', fontWeight: '800' }}>
              📡 Active Delivery GPS Broadcast: Order #{activeTrackingId}
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              Tracking Mode: <strong style={{ textTransform: 'uppercase', color: 'var(--primary-color)' }}>{trackingMode}</strong>
              {trackingMode === 'simulation' && ` | Simulation Progress: ${simStep * 10}%`}
            </p>
            {currentCoords && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-color)' }}>
                Coords: {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
              </p>
            )}
          </div>
          <button onClick={stopTracking} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: '#C0392B' }}>
            <Square size={14} /> Stop Coords Stream
          </button>
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader size={36} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--accent-color)' }} />
          <p style={{ marginTop: '10px' }}>Loading delivery assignments...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Section: Dispatched Deliveries */}
          <div>
            <h3 style={{ fontSize: '1.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏍️ Ongoing Deliveries ({dispatchedOrders.length})
            </h3>
            {dispatchedOrders.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders currently being delivered.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {dispatchedOrders.map(order => (
                  <div key={order.id} className="card" style={{ padding: '1.5rem', border: '1.5px solid var(--primary-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--accent-color)' }}>Order #{order.id}</span>
                      <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', padding: '3px 8px', borderRadius: '8px', fontWeight: '700', color: 'var(--primary-color)' }}>
                        In Transit
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <span><strong>Customer:</strong> {order.customer_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                        <span><strong>Phone:</strong> {order.customer_phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={14} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                        <span><strong>Address:</strong> {order.address}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&origin=23.3441,85.3096&destination=${order.latitude},${order.longitude}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', padding: '10px' }}
                      >
                        <Navigation size={14} /> Navigate
                      </a>
                      
                      {activeTrackingId !== order.id ? (
                        <button 
                          onClick={() => startSimulationTracking(order)}
                          className="btn btn-secondary"
                          style={{ flex: 1, fontSize: '0.8rem', padding: '10px' }}
                        >
                          🛰️ Stream Coordinates
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleCompleteDelivery(order.id)}
                          className="btn btn-primary"
                          style={{ flex: 1, fontSize: '0.8rem', padding: '10px', backgroundColor: '#1A8245' }}
                        >
                          🏁 Complete Delivery
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Ready for Pickup */}
          <div>
            <h3 style={{ fontSize: '1.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🥣 Ready at Bakery ({readyOrders.length})
            </h3>
            {readyOrders.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders waiting for pickup.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {readyOrders.map(order => (
                  <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--accent-color)' }}>Order #{order.id}</span>
                      <span style={{ fontSize: '0.8rem', background: '#FEF9E7', padding: '3px 8px', borderRadius: '8px', fontWeight: '700', color: '#B7950B' }}>
                        Ready for Pickup
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <span><strong>Customer:</strong> {order.customer_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={14} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                        <span><strong>Address:</strong> {order.address}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleStartDelivery(order, 'simulation')} 
                        className="btn btn-secondary"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}
                      >
                        <Play size={14} /> Simulate Dispatch
                      </button>
                      <button 
                        onClick={() => handleStartDelivery(order, 'gps')} 
                        className="btn btn-primary"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}
                      >
                        📡 Live GPS Dispatch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Past Deliveries */}
          <div>
            <h3 style={{ fontSize: '1.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✓ Completed Deliveries ({pastOrders.length})
            </h3>
            {pastOrders.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No completed orders in this session.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pastOrders.slice(0, 5).map(order => (
                  <div key={order.id} className="card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <span style={{ fontWeight: '750', color: 'var(--text-color)' }}>Order #{order.id}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '15px' }}>
                        To: {order.customer_name} | {order.address.split('|')[0]}
                      </span>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: order.status === 'Delivered' ? '#1A8245' : '#C0392B', fontWeight: '700' }}>
                      {order.status === 'Delivered' ? (
                        <>
                          <CheckCircle size={14} /> Completed
                        </>
                      ) : (
                        'Cancelled'
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
