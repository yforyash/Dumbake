import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Leaf, Plus, Star, MessageSquarePlus, RefreshCw, Send, Check } from 'lucide-react';
import { fetchItems, fetchAIRecommendations, postReview, fetchReviews } from '../services/api';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

export default function Home({ user, onAddToCart }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [aiRecs, setAiRecs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [eggless, setEggless] = useState(false);
  const [bestsellersTab, setBestsellersTab] = useState('bestsellers'); // 'bestsellers' vs 'new'

  // Review states
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Customize Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [weight, setWeight] = useState('0.5 Kg');
  const [egglessChoice, setEgglessChoice] = useState(true);
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState('');

  // Bulk Order Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState(false);

  // Read search param changes
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
    
    const scrollTarget = searchParams.get('scroll') || '';
    if (scrollTarget) {
      setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        // Clean param
        searchParams.delete('scroll');
        setSearchParams(searchParams);
      }, 500);
    }
  }, [searchParams]);

  const handleOpenCustomizeModal = (item) => {
    setSelectedItem(item);
    setWeight('0.5 Kg');
    setEgglessChoice(item.is_eggless);
    setMessage('');
    setInstructions('');
  };

  const handleConfirmAdd = () => {
    onAddToCart(selectedItem, {
      weight: selectedItem.category === 'Cakes' ? weight : null,
      eggless: egglessChoice,
      message: selectedItem.category === 'Cakes' ? message : null,
      instructions
    });
    setSelectedItem(null);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const itemsData = await fetchItems(category, search, eggless);
      setItems(itemsData);
      
      const reviewsData = await fetchReviews();
      setReviews(reviewsData);

      const aiData = await fetchAIRecommendations();
      setAiRecs(aiData);
    } catch (err) {
      console.error('Error fetching Home page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category, eggless, search]); // re-run queries on filters change

  const categoriesList = ['Brookies', 'Brownies', 'Cakes', 'Cupcakes', 'Pastries & Cookies', 'Gift Boxes'];
  
  const categoryItems = [
    { name: 'Brookies', image: '/dumbake_brookies.png' },
    { name: 'Brownies', image: '/dumbake_brownies.png' },
    { name: 'Cakes', image: '/dumbake_bento_cake.png' },
    { name: 'Cupcakes', image: '/dumbake_cupcakes.png' },
    { name: 'Pastries & Cookies', image: '/dumbake_savories.png' },
    { name: 'Gift Boxes', image: '/dumbake_cupcakes.png' }
  ];

  // Yup validation schema for customer review log
  const reviewValidationSchema = Yup.object().shape({
    reviewerName: user ? Yup.string() : Yup.string().required('Please enter your name'),
    rating: Yup.number().required('Please select a rating'),
    comment: Yup.string().min(5, 'Feedback must be at least 5 characters').required('Feedback comment is required')
  });

  // Yup validation schema for bulk order enquiry
  const bulkValidationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string().min(10, 'Invalid phone number').required('Phone number is required'),
    eventDate: Yup.date().required('Event Date is required'),
    quantity: Yup.number().min(10, 'Minimum quantity is 10').required('Quantity is required'),
    notes: Yup.string().required('Please share some details about your event')
  });

  return (
    <div className="container">
      
      {/* 1. Split Hero Section (Screenshot 1 alignment) */}
      <section className="grid grid-2" style={{ marginBottom: '3.5rem' }}>
        {/* Left Side: Celebration Cakes */}
        <div className="card" style={{ position: 'relative', height: '400px', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
          <img src="/dumbake_mango_cake.png" alt="Celebration Cakes" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'linear-gradient(to top, rgba(60,34,39,0.9) 0%, rgba(60,34,39,0.3) 70%, transparent 100%)', padding: '2rem 1.5rem', color: '#ffffff' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Celebrate summer bliss with creamy handcrafted mango cakes.
            </h3>
            <button 
              onClick={() => {
                setCategory('Cakes');
                document.getElementById('menu-catalog')?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="btn btn-primary" 
              style={{ background: 'var(--primary-color)', color: 'var(--text-color)', border: 'none', padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
            >
              Explore Now
            </button>
          </div>
        </div>

        {/* Right Side: Croissants & Danishes */}
        <div className="card" style={{ position: 'relative', height: '400px', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
          <img src="/dumbake_savories.png" alt="Croissants & Danishes" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'linear-gradient(to top, rgba(60,34,39,0.9) 0%, rgba(60,34,39,0.3) 70%, transparent 100%)', padding: '2rem 1.5rem', color: '#ffffff' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Croissants and Danishes - Flaky. Savoury. Perfectly Twisted.
            </h3>
            <button 
              onClick={() => {
                setCategory('Breads & Croissants');
                document.getElementById('menu-catalog')?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="btn btn-primary" 
              style={{ background: 'var(--primary-color)', color: 'var(--text-color)', border: 'none', padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
            >
              Order Now
            </button>
          </div>
        </div>
      </section>

      {/* 2. Feature Icons Row (Screenshot 2 alignment) */}
      <section style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', margin: '4rem 0', textAlign: 'center' }}>
        {[
          { icon: '🌾', label: 'Finest ingredients. Globally sourced.' },
          { icon: '🥣', label: 'Small-Batch productions' },
          { icon: '🧪', label: 'No artificial flavours' },
          { icon: '🚫', label: 'No preservatives' },
          { icon: '⚡', label: '90 minutes Delivery' },
          { icon: '💖', label: '10 Years of Happy Customers' },
          { icon: '🇫🇷', label: 'Made with classic French techniques' }
        ].map((feat, idx) => (
          <div key={idx} className="feature-circle-item" style={{ width: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: 'var(--shadow-sm)' }}>
              {feat.icon}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-color)', lineHeight: '1.3' }}>{feat.label}</span>
          </div>
        ))}
      </section>

      {/* 3. Bestsellers slider grid (Screenshot 2 alignment) */}
      <section id="best-sellers" style={{ margin: '4rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: '800' }}>Our Best Sellers</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Born from French Craft, Infused with Ranchi Love</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => setBestsellersTab('bestsellers')} 
              className="btn" 
              style={{ 
                padding: '0.5rem 1.25rem', 
                fontSize: '0.8rem', 
                backgroundColor: bestsellersTab === 'bestsellers' ? 'var(--accent-color)' : 'transparent',
                color: bestsellersTab === 'bestsellers' ? 'var(--white)' : 'var(--accent-color)',
                border: '1px solid var(--accent-color)'
              }}
            >
              Bestsellers
            </button>
            <button 
              onClick={() => setBestsellersTab('new')} 
              className="btn" 
              style={{ 
                padding: '0.5rem 1.25rem', 
                fontSize: '0.8rem', 
                backgroundColor: bestsellersTab === 'new' ? 'var(--accent-color)' : 'transparent',
                color: bestsellersTab === 'new' ? 'var(--white)' : 'var(--accent-color)',
                border: '1px solid var(--accent-color)'
              }}
            >
              New Arrival
            </button>
          </div>
        </div>

        <div className="grid grid-4">
          {items
            .filter(item => bestsellersTab === 'bestsellers' ? item.is_bestseller : !item.is_bestseller)
            .slice(0, 4)
            .map(item => (
              <div key={`best-${item.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div className="badge-container">
                  {item.is_bestseller && <span className="badge badge-bestseller">Bestseller</span>}
                  {item.is_eggless ? <span className="badge badge-eggless">Eggless</span> : <span className="badge badge-egg">Egg</span>}
                </div>
                <div className="card-img-wrapper" style={{ height: '180px' }}>
                  <img src={item.image_url} alt={item.name} />
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '5px' }}>{item.name}</h4>
                  <p style={{ fontSize: '0.8rem', flex: 1, marginBottom: '10px' }}>{item.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span className="text-accent" style={{ fontWeight: '800', fontSize: '1.15rem' }}>₹{item.price}</span>
                    <button 
                      onClick={() => handleOpenCustomizeModal(item)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '12px' }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* 4. Recommendations section (hides AI text) */}
      {aiRecs.length > 0 && (
        <section className="ai-carousel-container" style={{ marginBottom: '4rem' }}>
          <h3 style={{ fontSize: '1.6rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} style={{ color: 'var(--accent-color)' }} />
            Chef's Recommended Treats
          </h3>
          <div className="grid grid-3">
            {aiRecs.slice(0, 3).map(item => (
              <div key={`rec-${item.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: 'var(--white)' }}>
                <div className="card-img-wrapper" style={{ height: '160px' }}>
                  <img src={item.image_url} alt={item.name} />
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{item.name}</h4>
                    <span className="text-accent" style={{ fontWeight: '800' }}>₹{item.price}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', flex: 1, marginTop: '5px' }}>{item.description}</p>
                  
                  {/* Heuristic reason */}
                  <div className="ai-reason-bubble">
                    <Sparkles size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-color)' }} />
                    <span>{item.ai_reason}</span>
                  </div>

                  <button 
                    onClick={() => handleOpenCustomizeModal(item)}
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.5rem', marginTop: '1rem', fontSize: '0.8rem', borderRadius: '12px' }}
                  >
                    Add to Basket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Gifting Specials Slider (Screenshot 3 alignment) */}
      <section id="gifting-specials" className="gifting-specials-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <h3 style={{ fontSize: '2.2rem', fontWeight: '800' }}>Gifting Specials</h3>
            <p style={{ fontSize: '0.9rem' }}>Artisan Hampers - Cookies, Cakes, and Brookies Boxes</p>
          </div>
        </div>

        <div className="grid grid-4">
          {items
            .filter(item => item.category === 'Gift Boxes')
            .slice(0, 4)
            .map((item, idx) => (
              <div key={`gift-${item.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', border: 'none', backgroundColor: 'var(--white)', color: 'var(--text-color)' }}>
                <div className="card-img-wrapper" style={{ height: '180px' }}>
                  <img src={item.image_url} alt={item.name} />
                  {idx % 2 === 1 && (
                    <span className="badge" style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#e1e1e1', color: '#666', fontWeight: '700' }}>
                      Sold Out
                    </span>
                  )}
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-color)', marginBottom: '4px' }}>Rs. {item.price}</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-color)', marginBottom: '10px' }}>{item.name}</h4>
                  
                  {idx % 2 === 0 ? (
                    <button 
                      onClick={() => handleOpenCustomizeModal(item)}
                      className="btn btn-outline" 
                      style={{ width: '100%', padding: '0.5rem', marginTop: 'auto', fontSize: '0.8rem', borderRadius: '16px' }}
                    >
                      Buy now
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="btn btn-secondary" 
                      style={{ width: '100%', padding: '0.5rem', marginTop: 'auto', fontSize: '0.8rem', borderRadius: '16px', opacity: 0.6 }}
                    >
                      Out of stock
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* 6. Bulk Orders Section (Screenshot 4 alignment) */}
      <section id="bulk-orders" style={{ 
        margin: '4rem 0', 
        height: '320px', 
        borderRadius: 'var(--border-radius-lg)', 
        backgroundImage: 'linear-gradient(rgba(60,34,39,0.5), rgba(60,34,39,0.5)), url("/dumbake_brookies.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#ffffff',
        padding: '2rem'
      }}>
        <h3 style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Bulk Orders</h3>
        <p style={{ color: '#ffffff', fontSize: '1.1rem', maxWidth: '600px', marginBottom: '1.5rem' }}>
          Planning for gifting or an office party in Ranchi? Fill out our form to get started
        </p>
        <button onClick={() => setIsBulkModalOpen(true)} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', background: 'var(--primary-color)', color: 'var(--text-color)', border: 'none' }}>
          Submit The Form
        </button>
      </section>

      {/* 7. Catalog list */}
      <section id="menu-catalog" style={{ marginTop: '4rem' }}>
        <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Artisan Catalog</h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Circular Categories */}
            <div className="category-circle-list">
              <div 
                onClick={() => setCategory('')} 
                className={`category-circle-item ${category === '' ? 'active' : ''}`}
              >
                <div className="category-circle-img-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', fontSize: '1.8rem' }}>
                  🧁
                </div>
                <span className="category-circle-label">All Bakes</span>
              </div>
              
              {categoryItems.map(cat => (
                <div 
                  key={cat.name}
                  onClick={() => setCategory(cat.name)} 
                  className={`category-circle-item ${category === cat.name ? 'active' : ''}`}
                >
                  <div className="category-circle-img-wrapper">
                    <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span className="category-circle-label">{cat.name}</span>
                </div>
              ))}
            </div>

            {/* Filter Toggle & Search */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                <input 
                  type="checkbox" 
                  checked={eggless} 
                  onChange={(e) => setEggless(e.target.checked)}
                  style={{ accentColor: 'var(--accent-color)', width: '18px', height: '18px' }}
                />
                <Leaf size={18} style={{ color: '#1A8245' }} /> Eggless Only
              </label>
              {search && (
                <button 
                  onClick={() => {
                    setSearch('');
                    setSearchParams({});
                  }} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '12px' }}
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Loading Ranchi's best sweet treats...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: '700' }}>No treats found matching your filters.</p>
            <p>Try clearing your search or categories filter!</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {items.map(item => (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div className="badge-container">
                  {item.is_bestseller && <span className="badge badge-bestseller">Bestseller</span>}
                  {item.is_eggless ? <span className="badge badge-eggless">Eggless</span> : <span className="badge badge-egg">Egg</span>}
                </div>

                <div className="card-img-wrapper">
                  <img src={item.image_url} alt={item.name} />
                </div>
                
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px' }}>{item.name}</h4>
                  <p style={{ fontSize: '0.85rem', flex: 1, marginBottom: '12px' }}>{item.description}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span className="text-accent" style={{ fontWeight: '800', fontSize: '1.3rem' }}>₹{item.price}</span>
                    <button 
                      onClick={() => handleOpenCustomizeModal(item)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '12px' }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 8. Story Section (Screenshot 5 alignment) */}
      <section id="story-section" className="grid grid-3" style={{ margin: '5rem 0' }}>
        {/* Col 1: About Us Text */}
        <div className="story-col-light" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--accent-color)' }}>
            The Dumbake Story
          </h4>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
            Dumbake was born from a deep love for chocolate, gooey crinkle-top brookies, and custom cakes in Ranchi. Our ingredients are globally sourced, and every recipe is baked in small batches with classic techniques.
          </p>
          <a href="#menu-catalog" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
            Read More
          </a>
        </div>

        {/* Col 2: Cupcake Image */}
        <div className="card" style={{ border: 'none', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', height: '100%', minHeight: '300px' }}>
          <img src="/dumbake_cupcakes.png" alt="Dumbake Team" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Col 3: Owner Quote */}
        <div className="story-col-dark" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#ffffff' }}>
          <h4 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.25rem' }}>
            Meet the Maker – Priya
          </h4>
          <p style={{ fontSize: '1rem', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '1.5rem', opacity: 0.95, color: '#ffffff !important' }}>
            "Baking brings me absolute peace and happiness. Whisking fresh batters, layering chocolates, and creating customized treats for Ranchi celebrations is where I feel most at home."
          </p>
          <button onClick={() => setIsBulkModalOpen(true)} className="btn btn-secondary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem', fontSize: '0.85rem', background: '#ffffff', color: 'var(--accent-color)' }}>
            Submit Enquiry
          </button>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="instagram-section">
        <div className="instagram-header">
          <div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Follow Our Sweet Journey</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Get a sneak peek behind the scenes at @dumbake_ on Instagram</p>
          </div>
          <a 
            href="https://www.instagram.com/dumbake_/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-outline"
            style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            Follow Us
          </a>
        </div>

        <div className="instagram-grid">
          {[
            { img: '/dumbake_brookies.png', caption: 'Fudgy, crinkly, chocolatey... our signature brookies are calling your name! 🍪🍫 #brookies #ranchi #dumbake', likes: '412', comments: '38' },
            { img: '/dumbake_brownies.png', caption: 'Double chocolate fudge brownie layers for that ultimate weekend indulgence. ✨ #brownies #fudgy #dumbakeranchi', likes: '385', comments: '24' },
            { img: '/dumbake_bento_cake.png', caption: 'Cute minimalist bento cakes in pastel pink! Personalized text for your sweet celebrations. 🎂🌸 #bentocake #customcakes', likes: '524', comments: '49' },
            { img: '/dumbake_mango_cake.png', caption: 'Mango bliss in every bite. Whipped fresh mango cream celebration cakes! 🥭💛 #mangocake #seasonal #ranchi', likes: '298', comments: '18' },
            { img: '/dumbake_cupcakes.png', caption: 'Fluffy cupcakes swirled with velvety chocolate and vanilla cream cheese frosting. 🧁🧁 #cupcakes #ranchifoodies', likes: '341', comments: '30' },
            { img: '/dumbake_savories.png', caption: 'Artisan pastries and cookies baked fresh in small batches every morning. 🥐🌾 #cookies #pastries #frenchcraft', likes: '276', comments: '12' }
          ].map((item, idx) => (
            <div key={idx} className="instagram-card" onClick={() => window.open('https://www.instagram.com/dumbake_/', '_blank')}>
              <img src={item.img} alt={`Dumbake Instagram post ${idx + 1}`} />
              <div className="instagram-card-overlay">
                <p className="instagram-card-caption">{item.caption}</p>
                <div className="instagram-card-stats">
                  <span>❤️ {item.likes}</span>
                  <span>💬 {item.comments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Reviews Section */}
      <section style={{ margin: '5rem 0', display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }} className="grid-2">
        <div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.5rem' }}>Ranchi Flavour Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No logs posted yet. Be the first to review!</p>
            ) : (
              reviews.slice(0, 3).map(rev => (
                <div key={rev.id} className="review-card">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < rev.rating ? '#FFB800' : 'none'} stroke={i < rev.rating ? '#FFB800' : '#DDD'} />
                    ))}
                  </div>
                  <h5 style={{ fontWeight: '800', color: 'var(--accent-color)', marginBottom: '4px' }}>{rev.reviewer_name}</h5>
                  <p style={{ fontSize: '0.9rem' }}>"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Post Review card */}
        <div className="card" style={{ padding: '2rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquarePlus size={20} style={{ color: 'var(--accent-color)' }} />
            Write a Flavour Log
          </h3>

          {reviewError && <div className="badge-egg" style={{ padding: '8px', fontSize: '0.85rem', marginBottom: '1rem', borderRadius: '4px' }}>{reviewError}</div>}
          {reviewSuccess && <div className="badge-eggless" style={{ padding: '8px', fontSize: '0.85rem', marginBottom: '1rem', borderRadius: '4px' }}>{reviewSuccess}</div>}

          <Formik
            initialValues={{ reviewerName: user ? user.name : '', rating: 5, comment: '' }}
            validationSchema={reviewValidationSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              setReviewError('');
              setReviewSuccess('');
              try {
                const reviewPayload = {
                  reviewerName: values.reviewerName || user.name,
                  rating: parseInt(values.rating),
                  comment: values.comment
                };
                await postReview(reviewPayload);
                setReviewSuccess('Review logged successfully!');
                resetForm();

                const updatedReviews = await fetchReviews();
                setReviews(updatedReviews);
              } catch (err) {
                setReviewError(err.message || 'Failed to submit review.');
              }
              setSubmitting(false);
            }}
          >
            {({ isSubmitting }) => (
              <Form>
                {!user && (
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <Field name="reviewerName" type="text" className="form-input" placeholder="E.g., Priya S." />
                    <ErrorMessage name="reviewerName" component="div" style={{ color: 'var(--accent-color)', fontSize: '0.75rem', marginTop: '4px' }} />
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Rating (Stars)</label>
                  <Field as="select" name="rating" className="form-input">
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                    <option value={2}>⭐⭐ (2/5)</option>
                    <option value={1}>⭐ (1/5)</option>
                  </Field>
                </div>

                <div className="form-group">
                  <label className="form-label">Feedback / Review</label>
                  <Field 
                    as="textarea" 
                    name="comment" 
                    className="form-input" 
                    rows={3} 
                    placeholder="How was the texture of the brookies? The moistness of the truffle?"
                  />
                  <ErrorMessage name="comment" component="div" style={{ color: 'var(--accent-color)', fontSize: '0.75rem', marginTop: '4px' }} />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%' }}>
                  Post Review
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </section>

      {/* Floating WhatsApp Widget */}
      <a 
        id="whatsapp-custom"
        href="https://wa.me/919999988888?text=Hello%20Dumbake!%20I%20would%20like%20to%20order%20a%20custom%20celebration%20cake." 
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-widget"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="#ffffff" style={{ width: '28px', height: '28px' }}>
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </a>

      {/* Product Customize Modal */}
      {selectedItem && (
        <div className="dialog-overlay" onClick={() => setSelectedItem(null)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              Customize {selectedItem.name}
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>{selectedItem.description}</p>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '1.25rem' }}>
              <img src={selectedItem.image_url} alt={selectedItem.name} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Base Price</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-color)' }}>₹{selectedItem.price}</div>
                <div style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                  {selectedItem.is_eggless ? '🟢 100% Eggless' : '🔴 Contains Egg Options'}
                </div>
              </div>
            </div>

            {/* Customization Options */}
            {selectedItem.category === 'Cakes' && (
              <>
                <div className="form-group">
                  <label className="form-label">Select Cake Weight</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['0.5 Kg', '1 Kg'].map(w => (
                      <button 
                        key={w}
                        type="button" 
                        onClick={() => setWeight(w)}
                        className={`btn ${weight === w ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '16px' }}
                      >
                        {w} {w === '1 Kg' ? '(+ ₹400)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Message on Cake (Max 30 chars)</label>
                  <input 
                    type="text" 
                    maxLength={30}
                    placeholder="E.g., Happy Birthday Priya!"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="form-input"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Recipe Preference</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setEgglessChoice(true)}
                  className={`btn ${egglessChoice ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '16px' }}
                >
                  🟢 Eggless
                </button>
                <button 
                  type="button" 
                  disabled={selectedItem.is_eggless}
                  onClick={() => setEgglessChoice(false)}
                  className={`btn ${!egglessChoice ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '16px' }}
                >
                  🔴 Regular
                </button>
              </div>
              {selectedItem.is_eggless && (
                <div style={{ fontSize: '0.75rem', color: '#1A8245', marginTop: '4px' }}>
                  * This item is strictly eggless.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Special Instructions / Notes</label>
              <input 
                type="text" 
                placeholder="E.g., Pack separately, make it less sweet"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setSelectedItem(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="button" onClick={handleConfirmAdd} className="btn btn-primary" style={{ flex: 1 }}>
                Add (₹{(parseFloat(selectedItem.price) + (selectedItem.category === 'Cakes' && weight === '1 Kg' ? 400.00 : 0.00)).toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Order Enquiry Modal */}
      {isBulkModalOpen && (
        <div className="dialog-overlay" onClick={() => { setIsBulkModalOpen(false); setBulkSuccess(false); }}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Bulk Order Enquiry</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Planning a celebration, festival gifting, or corporate party in Ranchi? Submit details to connect with us.</p>
            
            {bulkSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#E2F6E9', color: '#1A8245', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1rem' }}>
                  <Check size={32} />
                </div>
                <h4 style={{ color: '#1A8245', fontWeight: '800', marginBottom: '0.5rem' }}>Enquiry Submitted!</h4>
                <p>Thank you. We will get in touch with you on phone/email within 12 hours.</p>
                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
                  Close
                </button>
              </div>
            ) : (
              <Formik
                initialValues={{ name: '', email: '', phone: '', eventDate: '', quantity: 10, notes: '' }}
                validationSchema={bulkValidationSchema}
                onSubmit={(values, { setSubmitting, resetForm }) => {
                  setTimeout(() => {
                    setBulkSuccess(true);
                    resetForm();
                    setSubmitting(false);
                  }, 800);
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <Field name="name" type="text" className="form-input" placeholder="E.g., Yash A." />
                      <ErrorMessage name="name" component="div" style={{ color: 'var(--accent-color)', fontSize: '0.75rem', marginTop: '4px' }} />
                    </div>

                    <div className="grid grid-2" style={{ gap: '15px' }}>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <Field name="email" type="email" className="form-input" placeholder="yash@example.com" />
                        <ErrorMessage name="email" component="div" style={{ color: 'var(--accent-color)', fontSize: '0.75rem', marginTop: '4px' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <Field name="phone" type="text" className="form-input" placeholder="+91 99999 88888" />
                        <ErrorMessage name="phone" component="div" style={{ color: 'var(--accent-color)', fontSize: '0.75rem', marginTop: '4px' }} />
                      </div>
                    </div>

                    <div className="grid grid-2" style={{ gap: '15px' }}>
                      <div className="form-group">
                        <label className="form-label">Event Date</label>
                        <Field name="eventDate" type="date" className="form-input" />
                        <ErrorMessage name="eventDate" component="div" style={{ color: 'var(--accent-color)', fontSize: '0.75rem', marginTop: '4px' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Expected Quantity (Min 10)</label>
                        <Field name="quantity" type="number" className="form-input" min={10} />
                        <ErrorMessage name="quantity" component="div" style={{ color: 'var(--accent-color)', fontSize: '0.75rem', marginTop: '4px' }} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Event Details & Specific Requirements</label>
                      <Field 
                        as="textarea" 
                        name="notes" 
                        className="form-input" 
                        rows={3} 
                        placeholder="E.g., Diwali gifting boxes, wedding tier cakes, brookies boxes with custom ribbons..." 
                      />
                      <ErrorMessage name="notes" component="div" style={{ color: 'var(--accent-color)', fontSize: '0.75rem', marginTop: '4px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '1.5rem' }}>
                      <button type="button" onClick={() => setIsBulkModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                        {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
