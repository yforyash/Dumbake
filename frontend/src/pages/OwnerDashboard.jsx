import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, fetchItems, updateOrderStatus, updateBakeryItem } from '../services/api';
import { Clock, Save, Layers, Volume2, VolumeX, Search, Play, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

export default function OwnerDashboard({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockChanges, setStockChanges] = useState({});
  const [activeTab, setActiveTab] = useState('orders');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioPrompt, setAudioPrompt] = useState(false);

  const mutedRef = useRef(false);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const checkAudioContext = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
          setAudioPrompt(true);
        }
        audioContextRef.current = ctx;
      }
    };
    checkAudioContext();

    loadData();
    const interval = setInterval(pollData, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const playChime = () => {
    try {
      let ctx = audioContextRef.current;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!ctx && AudioContext) {
        ctx = new AudioContext();
        audioContextRef.current = ctx;
      }
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        setAudioPrompt(true);
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.error(e);
    }
  };

  const enableAudio = async () => {
    if (audioContextRef.current) {
      await audioContextRef.current.resume();
      setAudioPrompt(false);
      playChime();
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const ordersData = await fetchOrders();
      setOrders(ordersData);
      const itemsData = await fetchItems('', '', false);
      setItems(itemsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pollData = async () => {
    try {
      const ordersData = await fetchOrders();
      setOrders(prev => {
        const currentlyPlaced = ordersData.filter(o => o.status === 'Placed');
        const hasNew = currentlyPlaced.some(n => !prev.some(o => o.id === n.id));
        if (hasNew && !mutedRef.current) {
          playChime();
        }
        return ordersData;
      });
      const itemsData = await fetchItems('', '', false);
      setItems(itemsData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, paymentStatus = null) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus, payment_status: paymentStatus });
      await pollData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleStockInputChange = (itemId, val) => {
    const parsed = parseInt(val);
    setStockChanges(prev => ({
      ...prev,
      [itemId]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleSaveStock = async (itemId) => {
    const newStock = stockChanges[itemId];
    if (newStock === undefined) return;

    try {
      await updateBakeryItem(itemId, {
        stock_quantity: newStock,
        status: newStock === 0 ? 'out_of_stock' : 'available'
      });
      setStockChanges(prev => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
      await pollData();
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleMute = () => {
    mutedRef.current = !mutedRef.current;
    setIsMuted(mutedRef.current);
  };

  const getAggregatedItems = () => {
    const counts = {};
    orders
      .filter(o => o.status === 'Placed' || o.status === 'Preparing')
      .forEach(o => {
        const list = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
        list.forEach(i => {
          const w = i.customizations?.weight || 'Default';
          const e = i.customizations?.eggless ? 'Eggless' : 'Egg';
          const key = `${i.name} (${w}, ${e})`;
          if (!counts[key]) {
            counts[key] = { name: i.name, weight: w, eggless: e, count: 0, orders: [] };
          }
          counts[key].count += i.quantity;
          if (!counts[key].orders.includes(o.id)) {
            counts[key].orders.push(o.id);
          }
        });
      });
    return Object.values(counts);
  };

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  
  const filteredOrders = activeOrders
    .filter(o => {
      if (fulfillmentFilter === 'All') return true;
      return o.delivery_type === fulfillmentFilter;
    })
    .filter(o => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q) ||
        o.id.toString().includes(q)
      );
    });

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-color)' }}>Loading Kitchen Console...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {audioPrompt && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-color)', color: '#ffffff', padding: '12px 20px', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <VolumeX size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Kitchen notification sound is blocked by browser rules.</span>
          </div>
          <button onClick={enableAudio} className="btn" style={{ background: '#ffffff', color: 'var(--accent-color)', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '800', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Play size={12} fill="currentColor" /> Activate Sounds
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-color)', margin: 0 }}>Kitchen Console</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2e7d32', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2e7d32' }}>Live Polling</span>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>Chef Room Workspace | Active User: {user.name}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleMute} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: '1.5px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}>
            {isMuted ? <VolumeX size={18} style={{ color: 'var(--accent-color)' }} /> : <Volume2 size={18} style={{ color: 'var(--accent-color)' }} />}
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{isMuted ? 'Alerts Muted' : 'Alerts Active'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '2px' }}>
        <button onClick={() => setActiveTab('orders')} style={{ padding: '10px 20px', border: 'none', background: 'none', borderBottom: activeTab === 'orders' ? '3px solid var(--accent-color)' : 'none', color: activeTab === 'orders' ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} /> Orders Queue ({activeOrders.length})
        </button>
        <button onClick={() => setActiveTab('prep')} style={{ padding: '10px 20px', border: 'none', background: 'none', borderBottom: activeTab === 'prep' ? '3px solid var(--accent-color)' : 'none', color: activeTab === 'prep' ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} /> Itemized Batch List
        </button>
        <button onClick={() => setActiveTab('inventory')} style={{ padding: '10px 20px', border: 'none', background: 'none', borderBottom: activeTab === 'inventory' ? '3px solid var(--accent-color)' : 'none', color: activeTab === 'inventory' ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} /> Stock Levels
        </button>
      </div>

      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--primary-light)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              {['All', 'Delivery', 'Pickup'].map(type => (
                <button key={type} onClick={() => setFulfillmentFilter(type)} style={{ border: 'none', background: fulfillmentFilter === type ? 'var(--accent-color)' : 'none', color: fulfillmentFilter === type ? '#ffffff' : 'var(--text-color)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {type}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <input type="text" placeholder="Search customer, phone or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 35px', borderRadius: '20px', border: '1.5px solid var(--border-color)', fontSize: '0.85rem' }} />
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--accent-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                No active orders match the criteria. Oven status: idle.
              </div>
            ) : (
              filteredOrders.map(order => {
                const list = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                return (
                  <div key={order.id} style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-color)' }}>Order #{order.id}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Placed at: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`status-pill status-${order.status.toLowerCase()}`} style={{ textTransform: 'capitalize', fontSize: '0.75rem', fontWeight: '800' }}>
                        {order.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: 'var(--text-color)', fontSize: '1rem' }}>{order.customer_name}</div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Phone: {order.customer_phone}</div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Type: <strong style={{ color: 'var(--accent-color)' }}>{order.delivery_type}</strong></div>
                      </div>
                      <div style={{ maxWidth: '300px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-muted)' }}>Fulfillment Address</div>
                        <div style={{ color: 'var(--text-color)', marginTop: '2px' }}>{order.address}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-muted)' }}>Payment Details</div>
                        <div style={{ color: 'var(--text-color)', marginTop: '2px' }}>{order.payment_method} ({order.payment_status})</div>
                      </div>
                    </div>

                    <div style={{ background: 'var(--primary-light)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      {list.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < list.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <div>
                            <span style={{ fontWeight: '700', color: 'var(--text-color)' }}>{item.name}</span>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                              <span style={{ fontSize: '0.7rem', background: '#ffffff', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '6px', fontWeight: '600' }}>
                                Weight: {item.customizations?.weight || 'Default'}
                              </span>
                              <span style={{ fontSize: '0.7rem', background: item.customizations?.eggless ? '#e8f5e9' : '#ffebee', color: item.customizations?.eggless ? '#2e7d32' : '#c62828', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>
                                {item.customizations?.eggless ? 'Eggless' : 'Egg'}
                              </span>
                              {item.customizations?.message && (
                                <span style={{ fontSize: '0.7rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: '6px', fontWeight: '600' }}>
                                  Msg: "{item.customizations.message}"
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-color)' }}>x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: '700' }}>
                        Total Value: <span style={{ color: 'var(--accent-color)', fontWeight: '800' }}>₹{parseFloat(order.total_price).toFixed(2)}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {order.status === 'Placed' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'Preparing')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            Start Baking <ChevronRight size={14} />
                          </button>
                        )}
                        {order.status === 'Preparing' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'Ready')} className="btn" style={{ background: '#2e7d32', color: '#ffffff', border: 'none', padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={14} /> Mark Ready
                          </button>
                        )}
                        {order.status === 'Ready' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'Delivered', 'Paid')} className="btn" style={{ background: '#1565c0', color: '#ffffff', border: 'none', padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={14} /> Handover / Complete
                          </button>
                        )}
                        <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="btn btn-outline" style={{ borderColor: '#c62828', color: '#c62828', padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <XCircle size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'prep' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-color)', marginBottom: '1.5rem' }}>Aggregated Baking Quantities</h3>
          
          {getAggregatedItems().length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No pending items to bake in the queue.</p>
          ) : (
            <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--primary-light)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700' }}>Item Specifications</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>Aggregate Count</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>Source Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {getAggregatedItems().map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{item.name}</span>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{item.weight}</span>
                          <span style={{ fontSize: '0.75rem', background: item.eggless === 'Eggless' ? '#e8f5e9' : '#ffebee', color: item.eggless === 'Eggless' ? '#2e7d32' : '#c62828', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>{item.eggless}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ background: 'var(--accent-color)', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem' }}>
                          {item.count} units
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {item.orders.map(id => `#${id}`).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-color)', marginBottom: '1.5rem' }}>Stock Management</h3>
          
          <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--primary-light)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700' }}>Item Name</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>Current Levels</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>Save Changes</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const currentStockVal = stockChanges[item.id] !== undefined ? stockChanges[item.id] : item.stock_quantity;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: '700' }}>{item.name}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>₹{item.price} | {item.category}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span className={`status-pill ${item.status === 'available' ? 'status-ready' : 'status-cancelled'}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input type="number" value={currentStockVal} onChange={(e) => handleStockInputChange(item.id, e.target.value)} style={{ width: '70px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: '1.5px solid var(--border-color)' }} />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {stockChanges[item.id] !== undefined && (
                          <button onClick={() => handleSaveStock(item.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Save size={12} /> Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
