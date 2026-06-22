import React, { useState, useEffect } from 'react';
import { Sparkles, Leaf, Plus, Star, MessageSquarePlus, RefreshCw } from 'lucide-react';
import { fetchItems, fetchAIRecommendations, postReview, fetchReviews } from '../services/api';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

export default function Home({ user, onAddToCart }) {
  const [items, setItems] = useState([]);
  const [aiRecs, setAiRecs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [eggless, setEggless] = useState(false);

  // Review states
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Customize Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [weight, setWeight] = useState('0.5 Kg');
  const [egglessChoice, setEgglessChoice] = useState(true);
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState('');

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

      // Recommendations (will fallback gracefully to heuristic if no login/no api key)
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
  }, [category, eggless]); // re-run queries on filters change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const categoriesList = ['Cakes', 'Pastries', 'Breads & Croissants', 'Chocolates', 'Savory Danishes', 'Gift Boxes'];

  // Yup validation schema for customer review log
  const reviewValidationSchema = Yup.object().shape({
    reviewerName: user ? Yup.string() : Yup.string().required('Please enter your name'),
    rating: Yup.number().required('Please select a rating'),
    comment: Yup.string().min(5, 'Feedback must be at least 5 characters').required('Feedback comment is required')
  });

  const categoryItems = [
    { name: 'Cakes', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&h=120&fit=crop&q=80' },
    { name: 'Pastries', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=120&h=120&fit=crop&q=80' },
    { name: 'Breads & Croissants', image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=120&h=120&fit=crop&q=80' },
    { name: 'Chocolates', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=120&h=120&fit=crop&q=80' },
    { name: 'Savory Danishes', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=120&h=120&fit=crop&q=80' },
    { name: 'Gift Boxes', image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=120&h=120&fit=crop&q=80' }
  ];

  return (
    <div className="container">
      {/* 1. Hero Section */}
      <section className="hero">
        <h2 className="hero-subtitle">CRAFTED WITH FLAKY FLOUR & PREMIUM COCOA</h2>
        <h1 className="title-large" style={{ fontSize: '3rem', maxWidth: '800px' }}>
          Best Bakery in Gurgaon | Order Cakes, Breads & Chocolates
        </h1>
        <p style={{ maxWidth: '600px', fontSize: '1.1rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
          Enjoy same-day cake delivery in Gurgaon & NCR with Dumbake. Freshly baked artisan cakes, classic sourdough, French pastries & fine chocolates.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="#menu-catalog" className="btn btn-primary">Browse Menu</a>
          <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.6rem 0.8rem' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      {/* 2. Recommendation Slider */}
      {aiRecs.length > 0 && (
        <section className="ai-carousel-container">
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-color)' }} />
            Chef's Recommendations
          </h3>
          <div className="grid grid-3">
            {aiRecs.map(item => (
              <div key={`ai-${item.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div className="card-img-wrapper" style={{ height: '160px' }}>
                  <img src={item.image_url} alt={item.name} />
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: '700' }}>{item.name}</h4>
                    <span className="text-accent" style={{ fontWeight: '700' }}>₹{item.price}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', flex: 1, marginTop: '5px' }}>{item.description}</p>
                  
                  {/* AI Reason Bubble */}
                  <div className="ai-reason-bubble">
                    <Sparkles size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{item.ai_reason}</span>
                  </div>

                  <button 
                    onClick={() => handleOpenCustomizeModal(item)}
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}
                  >
                    <Plus size={14} /> Add to Basket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Catalog Section */}
      <section id="menu-catalog" style={{ marginTop: '3rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Artisan Catalog</h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Circular Category items selector */}
            <div className="category-circle-list">
              <div 
                onClick={() => setCategory('')} 
                className={`category-circle-item ${category === '' ? 'active' : ''}`}
              >
                <div className="category-circle-img-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--secondary-color)', fontSize: '1.5rem' }}>
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

            {/* Filter Toggle and Search */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Eggless filter */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={eggless} 
                  onChange={(e) => setEggless(e.target.checked)}
                  style={{ accentColor: 'var(--accent-color)', width: '16px', height: '16px' }}
                />
                <Leaf size={16} style={{ color: '#1A8245' }} /> Eggless Only
              </label>

              {/* Search form */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Search sourdough, macarons..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  style={{ width: '220px', padding: '0.5rem 1rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Find</button>
              </form>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p>Loading Dumbake delicacies...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.2rem' }}>No bakery items found matching your filters.</p>
            <p>Try searching for other sweet things!</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {items.map(item => (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Badges */}
                <div className="badge-container">
                  {item.is_bestseller && <span className="badge badge-bestseller">Bestseller</span>}
                  {item.is_eggless ? (
                    <span className="badge badge-eggless">Eggless</span>
                  ) : (
                    <span className="badge badge-egg">Contains Egg</span>
                  )}
                </div>

                <div className="card-img-wrapper">
                  <img src={item.image_url} alt={item.name} />
                </div>
                
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>{item.name}</h4>
                  <p style={{ fontSize: '0.85rem', flex: 1, marginBottom: '10px' }}>{item.description}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span className="text-accent" style={{ fontWeight: '800', fontSize: '1.25rem' }}>₹{item.price}</span>
                    <button 
                      onClick={() => handleOpenCustomizeModal(item)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
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

      {/* WhatsApp Custom Order Banner */}
      <section style={{ 
        marginTop: '3.5rem', 
        padding: '2.5rem 1.5rem', 
        background: 'linear-gradient(135deg, #FFF0F2 0%, #FFFDFD 100%)', 
        borderRadius: 'var(--border-radius-lg)', 
        border: '1px dashed var(--accent-color)', 
        textAlign: 'center' 
      }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>🎂 Bespoke Celebration Cakes</h3>
        <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
          Have a specific design, tier height, or custom flavor profile in mind? Connect directly with our chief designer pastry chef via WhatsApp to detail your dream cake.
        </p>
        <a 
          href="https://wa.me/919999988888?text=Hello%20Dumbake!%20I%20would%20like%20to%20order%20a%20custom%20celebration%20cake." 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary"
          style={{ background: '#25D366', borderColor: '#25D366', color: 'white' }}
        >
          WhatsApp Chef (+91 99999 88888)
        </a>
      </section>

      {/* 4. Customer Reviews & Submission */}
      <section style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="grid-2">
        {/* Reviews List */}
        <div>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Customer Flavour Logs</h3>
          <div style={{ display: 'flex', flexText: 'column', gap: '1.25rem', flexDirection: 'column' }}>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to tell us how it tasted!</p>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="review-card">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < rev.rating ? '#FFB800' : 'none'} stroke={i < rev.rating ? '#FFB800' : '#DDD'} />
                    ))}
                  </div>
                  <h5 style={{ fontWeight: '700', color: 'var(--text-color)', marginBottom: '4px' }}>{rev.reviewer_name}</h5>
                  <p style={{ fontSize: '0.9rem' }}>"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review Form */}
        <div className="card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquarePlus size={20} style={{ color: 'var(--accent-color)' }} />
            Leave a Log
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
                setReviewSuccess('Thank you for your feedback! Review posted.');
                resetForm();

                // Reload reviews
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
                  <label className="form-label">Review Comment</label>
                  <Field 
                    as="textarea" 
                    name="comment" 
                    className="form-input" 
                    rows={3} 
                    placeholder="How was the crumb structure of the sourdough? The sweetness of the truffle?"
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

      {/* Product Customize Modal */}
      {selectedItem && (
        <div className="dialog-overlay" onClick={() => setSelectedItem(null)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
              Customize {selectedItem.name}
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>{selectedItem.description}</p>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '1.25rem' }}>
              <img src={selectedItem.image_url} alt={selectedItem.name} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Base Price</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-color)' }}>₹{selectedItem.price}</div>
                <div style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                  {selectedItem.is_eggless ? '🟢 100% Eggless Recipe' : '🔴 Contains Egg Options'}
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
                        style={{ flex: 1, padding: '0.5rem' }}
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
                    placeholder="Happy Birthday Priya!"
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
                  style={{ flex: 1, padding: '0.5rem' }}
                >
                  🟢 Eggless
                </button>
                <button 
                  type="button" 
                  disabled={selectedItem.is_eggless}
                  onClick={() => setEgglessChoice(false)}
                  className={`btn ${!egglessChoice ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem' }}
                >
                  🔴 Regular
                </button>
              </div>
              {selectedItem.is_eggless && (
                <div style={{ fontSize: '0.75rem', color: '#1A8245', marginTop: '4px' }}>
                  * This item is strictly eggless and cannot be baked with egg.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Special Baking Instructions / Notes</label>
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
                Add to Basket (₹{(parseFloat(selectedItem.price) + (selectedItem.category === 'Cakes' && weight === '1 Kg' ? 400.00 : 0.00)).toFixed(2)})
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
