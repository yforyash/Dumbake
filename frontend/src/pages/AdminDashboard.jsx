import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchOrders, fetchItems, fetchReviews, updateOrderStatus, addBakeryItem, 
  deleteBakeryItem, updateBakeryItem, fetchAIBestsellers 
} from '../services/api';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, Plus, Trash2, Edit2, 
  Star, PieChart, Check, X, ShieldAlert 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control: 'stats', 'orders', 'items', 'reviews'
  const [activeTab, setActiveTab] = useState('stats');

  // Add/Edit Item modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form fields for items
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCat, setItemCat] = useState('Cakes');
  const [itemImg, setItemImg] = useState('');
  const [itemEggless, setItemEggless] = useState(true);
  const [itemBestseller, setItemBestseller] = useState(false);
  const [itemStock, setItemStock] = useState(10);
  const [itemStatus, setItemStatus] = useState('available');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
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
      
      const reviewsData = await fetchReviews();
      setReviews(reviewsData);

      const bsData = await fetchAIBestsellers();
      setBestsellers(bsData);
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
      alert('Error updating order status: ' + e.message);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemDesc('');
    setItemPrice('');
    setItemCat('Cakes');
    setItemImg('');
    setItemEggless(true);
    setItemBestseller(false);
    setItemStock(10);
    setItemStatus('available');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price);
    setItemCat(item.category);
    setItemImg(item.image_url);
    setItemEggless(item.is_eggless);
    setItemBestseller(item.is_bestseller);
    setItemStock(item.stock_quantity);
    setItemStatus(item.status);
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!itemName || !itemPrice || !itemImg) {
      setError('Please fill in Name, Price and Image URL fields.');
      return;
    }

    const payload = {
      name: itemName,
      description: itemDesc,
      price: parseFloat(itemPrice),
      category: itemCat,
      image_url: itemImg,
      is_eggless: itemEggless,
      is_bestseller: itemBestseller,
      stock_quantity: parseInt(itemStock),
      status: itemStatus
    };

    try {
      if (editingItem) {
        await updateBakeryItem(editingItem.id, payload);
        setSuccess('Bakery item updated successfully!');
      } else {
        await addBakeryItem(payload);
        setSuccess('New bakery item created successfully!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save item.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteBakeryItem(itemId);
        loadData();
      } catch (e) {
        alert(e.message);
      }
    }
  };

  // Stats derivations
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((acc, curr) => acc + parseFloat(curr.total_price), 0);
  
  const totalUsers = new Set(orders.map(o => o.user_id)).size;

  // Chart data formatting: Revenue by category
  const categoryRevenue = {};
  orders.filter(o => o.status !== 'Cancelled').forEach(order => {
    const itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    itemsList.forEach(item => {
      // Find item in local cache to match category
      const matched = items.find(i => i.name === item.name);
      const cat = matched ? matched.category : 'Breads';
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.price * item.quantity;
    });
  });

  const chartData = Object.keys(categoryRevenue).map(cat => ({
    name: cat,
    Revenue: categoryRevenue[cat]
  }));

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading Admin panel...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)' }}>Platform Control</h2>
          <p style={{ fontSize: '0.9rem' }}>Welcome, {user.name} (Platform Administrator)</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary">
          <Plus size={16} /> Create Bakery Item
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Sidebar tabs */}
        <aside className="dashboard-sidebar">
          <div 
            onClick={() => setActiveTab('stats')} 
            className={`dashboard-sidebar-item ${activeTab === 'stats' ? 'active' : ''}`}
          >
            <TrendingUp size={18} /> Stats & AI Analytics
          </div>
          <div 
            onClick={() => setActiveTab('orders')} 
            className={`dashboard-sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <ShoppingBag size={18} /> Manage All Orders ({orders.length})
          </div>
          <div 
            onClick={() => setActiveTab('items')} 
            className={`dashboard-sidebar-item ${activeTab === 'items' ? 'active' : ''}`}
          >
            <Edit2 size={18} /> Manage Menu Items ({items.length})
          </div>
          <div 
            onClick={() => setActiveTab('reviews')} 
            className={`dashboard-sidebar-item ${activeTab === 'reviews' ? 'active' : ''}`}
          >
            <Star size={18} /> Customer Logs ({reviews.length})
          </div>
        </aside>

        {/* Right Side: Tab Panel Content */}
        <main style={{ minHeight: '60vh' }}>
          
          {/* STATS & AI ANALYTICS TAB */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Metric Row */}
              <div className="grid grid-4" style={{ gap: '1rem' }}>
                <div className="metric-card">
                  <div>
                    <p style={{ fontSize: '0.85rem' }}>Gross Platform Revenue</p>
                    <div className="metric-value">₹{totalRevenue.toFixed(2)}</div>
                  </div>
                  <DollarSign size={32} style={{ color: 'var(--accent-color)' }} />
                </div>
                
                <div className="metric-card">
                  <div>
                    <p style={{ fontSize: '0.85rem' }}>Orders Processed</p>
                    <div className="metric-value">{orders.length}</div>
                  </div>
                  <ShoppingBag size={32} style={{ color: 'var(--accent-color)' }} />
                </div>

                <div className="metric-card">
                  <div>
                    <p style={{ fontSize: '0.85rem' }}>Unique Active Customers</p>
                    <div className="metric-value">{totalUsers}</div>
                  </div>
                  <Users size={32} style={{ color: 'var(--accent-color)' }} />
                </div>

                <div className="metric-card">
                  <div>
                    <p style={{ fontSize: '0.85rem' }}>Menu Items Cataloged</p>
                    <div className="metric-value">{items.length}</div>
                  </div>
                  <PieChart size={32} style={{ color: 'var(--accent-color)' }} />
                </div>
              </div>

              {/* Chart & AI Bestsellers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="grid-2">
                {/* Recharts revenue graph */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Category Sales Dynamics</h3>
                  <div style={{ width: '100%', height: '240px' }}>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="name" stroke="var(--text-muted)" />
                          <YAxis stroke="var(--text-muted)" />
                          <Tooltip cursor={{ fill: 'rgba(255, 183, 197, 0.1)' }} />
                          <Bar dataKey="Revenue" fill="var(--accent-color)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No sales records available yet.</div>
                    )}
                  </div>
                </div>

                {/* AI Predictive Bestsellers */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>AI Bestseller Volume Predictions</h3>
                  <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Moving averages computed on order logs over the last 30 days:</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {bestsellers.map((item, index) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--secondary-color)', borderRadius: '8px' }}>
                        <div>
                          <span style={{ fontWeight: '700', marginRight: '8px' }}>#{index + 1}</span>
                          <span>{item.name}</span>
                        </div>
                        <span className="badge badge-bestseller" style={{ fontSize: '0.7rem' }}>
                          {item.sales_volume} sold
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MANAGE ALL ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Details</th>
                    <th>Items Purchased</th>
                    <th>Total Price</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    return (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{order.customer_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customer_phone}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>{order.delivery_type}: {order.address}</div>
                        </td>
                        <td>
                          {itemsList.map((i, idx) => (
                            <div key={idx} style={{ fontSize: '0.85rem' }}>
                              {i.name} <span style={{ color: 'var(--text-muted)' }}>x{i.quantity}</span>
                            </div>
                          ))}
                        </td>
                        <td style={{ fontWeight: '700' }}>₹{parseFloat(order.total_price).toFixed(2)}</td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{order.payment_method}</div>
                          <span className={`status-pill ${order.payment_status === 'Paid' ? 'status-ready' : 'status-placed'}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            {order.status === 'Placed' && (
                              <button onClick={() => handleUpdateStatus(order.id, 'Preparing')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                Prepare
                              </button>
                            )}
                            {order.status === 'Preparing' && (
                              <button onClick={() => handleUpdateStatus(order.id, 'Ready')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                Ready
                              </button>
                            )}
                            {order.status === 'Ready' && (
                              <button onClick={() => handleUpdateStatus(order.id, 'Delivered', 'Paid')} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                Complete
                              </button>
                            )}
                            {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                              <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--accent-color)' }}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* MANAGE MENU ITEMS TAB */}
          {activeTab === 'items' && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Bakery Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>State</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <img src={item.image_url} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description.substring(0, 40)}...</div>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                          {item.is_eggless && <span className="badge badge-eggless" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>Eggless</span>}
                          {item.is_bestseller && <span className="badge badge-bestseller" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>Bestseller</span>}
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td style={{ fontWeight: '700' }}>₹{item.price}</td>
                      <td>{item.stock_quantity} units</td>
                      <td>
                        <span className={`status-pill ${item.status === 'available' ? 'status-ready' : 'status-cancelled'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleOpenEditModal(item)} className="btn btn-secondary" style={{ padding: '4px 8px' }}><Edit2 size={12} /></button>
                          <button onClick={() => handleDeleteItem(item.id)} className="btn btn-outline" style={{ padding: '4px 8px', border: '1px solid var(--accent-color)' }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CUSTOMER LOGS TAB */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(rev => (
                <div key={rev.id} className="review-card" style={{ background: 'var(--white)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h5 style={{ fontWeight: '700', fontSize: '1rem' }}>{rev.reviewer_name}</h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="stars" style={{ margin: '4px 0' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill={i < rev.rating ? '#FFB800' : 'none'} stroke={i < rev.rating ? '#FFB800' : '#DDD'} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>"{rev.comment}"</p>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* CREATE / EDIT ITEM DIALOG MODAL */}
      {isModalOpen && (
        <div className="dialog-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
              {editingItem ? `Modify ${editingItem.name}` : 'Create New Bakery Item'}
            </h3>

            {error && (
              <div className="badge-egg" style={{ padding: '10px', fontSize: '0.85rem', marginBottom: '1.25rem', borderRadius: '4px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveItem}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input 
                  type="text" 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)} 
                  className="form-input" 
                  placeholder="E.g., Raspberry Cream Macaron"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Item Description</label>
                <textarea 
                  value={itemDesc} 
                  onChange={(e) => setItemDesc(e.target.value)} 
                  className="form-input" 
                  rows={2}
                  placeholder="Ingredients and baking descriptions..."
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price (₹)</label>
                  <input 
                    type="number" 
                    value={itemPrice} 
                    onChange={(e) => setItemPrice(e.target.value)} 
                    className="form-input" 
                    placeholder="150"
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Stock Quantity</label>
                  <input 
                    type="number" 
                    value={itemStock} 
                    onChange={(e) => setItemStock(e.target.value)} 
                    className="form-input" 
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select value={itemCat} onChange={(e) => setItemCat(e.target.value)} className="form-input">
                    <option value="Cakes">Cakes</option>
                    <option value="Pastries">Pastries</option>
                    <option value="Breads">Breads</option>
                    <option value="Cookies">Cookies</option>
                    <option value="Savories">Savories</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Status</label>
                  <select value={itemStatus} onChange={(e) => setItemStatus(e.target.value)} className="form-input">
                    <option value="available">Available</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input 
                  type="text" 
                  value={itemImg} 
                  onChange={(e) => setItemImg(e.target.value)} 
                  className="form-input" 
                  placeholder="https://images.unsplash.com/..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  <input 
                    type="checkbox" 
                    checked={itemEggless} 
                    onChange={(e) => setItemEggless(e.target.checked)}
                    style={{ accentColor: 'var(--accent-color)' }}
                  />
                  <span>Eggless Recipe</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  <input 
                    type="checkbox" 
                    checked={itemBestseller} 
                    onChange={(e) => setItemBestseller(e.target.checked)}
                    style={{ accentColor: 'var(--accent-color)' }}
                  />
                  <span>Set as Bestseller</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
