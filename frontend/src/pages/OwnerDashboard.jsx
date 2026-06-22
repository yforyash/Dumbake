import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, fetchItems, updateOrderStatus, updateBakeryItem } from '../services/api';
import { ShoppingBag, CheckCircle, Clock, Save, Layers } from 'lucide-react';

export default function OwnerDashboard({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockChanges, setStockChanges] = useState({});

  useEffect(() => {
    if (!user || (user.role !== 'bakery_owner' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

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

  const handleUpdateStatus = async (orderId, newStatus, paymentStatus = null) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus, payment_status: paymentStatus });
      loadData();
    } catch (e) {
      alert('Failed to update status: ' + e.message);
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
      const payload = {
        stock_quantity: newStock,
        status: newStock === 0 ? 'out_of_stock' : 'available'
      };
      await updateBakeryItem(itemId, payload);
      alert('Stock levels updated successfully!');
      
      // Clear local state tracking for this item
      setStockChanges(prev => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });

      loadData();
    } catch (e) {
      alert('Failed to update stock: ' + e.message);
    }
  };

  // Filter orders into categories
  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const finishedOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading Owner Dashboard...</div>;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)' }}>Bakery Kitchen Console</h2>
        <p style={{ fontSize: '0.9rem' }}>Welcome, {user.name} (Store Manager)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="grid-2">
        {/* Left Column: Active orders */}
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-serif)' }}>
            <Clock size={20} style={{ color: 'var(--accent-color)' }} />
            Active Kitchen Orders ({activeOrders.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeOrders.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active orders at the moment. Bakery oven is idle.
              </div>
            ) : (
              activeOrders.map(order => {
                const itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                return (
                  <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontWeight: '800', color: 'var(--accent-color)' }}>Order #{order.id}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{order.customer_name} ({order.customer_phone})</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.delivery_type}: {order.address}</div>
                    </div>

                    <div style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '8px', marginBottom: '1.25rem' }}>
                      {itemsList.map((i, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                          <span>{i.name}</span>
                          <span style={{ fontWeight: '700' }}>x{i.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.9rem' }}>
                        Total: <span style={{ fontWeight: '800', color: 'var(--accent-color)' }}>₹{parseFloat(order.total_price).toFixed(2)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {order.status === 'Placed' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'Preparing')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Start Baking
                          </button>
                        )}
                        {order.status === 'Preparing' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'Ready')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Ready
                          </button>
                        )}
                        {order.status === 'Ready' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'Delivered', 'Paid')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Complete
                          </button>
                        )}
                        <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--accent-color)' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Inventory Stock Update */}
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-serif)' }}>
            <Layers size={20} style={{ color: 'var(--accent-color)' }} />
            Kitchen Inventory Stock
          </h3>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Bakery Item</th>
                  <th>Status</th>
                  <th>Current Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const localStock = stockChanges[item.id] !== undefined ? stockChanges[item.id] : item.stock_quantity;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{item.price} | {item.category}</div>
                      </td>
                      <td>
                        <span className={`status-pill ${item.status === 'available' ? 'status-ready' : 'status-cancelled'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={localStock}
                          onChange={(e) => handleStockInputChange(item.id, e.target.value)}
                          className="form-input"
                          style={{ width: '70px', padding: '4px 8px', textAlign: 'center' }}
                        />
                      </td>
                      <td>
                        {stockChanges[item.id] !== undefined && (
                          <button 
                            onClick={() => handleSaveStock(item.id)} 
                            className="btn btn-primary" 
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          >
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
      </div>
    </div>
  );
}
