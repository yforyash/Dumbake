import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import CryptoJS from 'crypto-js';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { loginUser, registerUser, forgotPassword, resetPassword, verifyEmail } from '../services/api';
import { setUser } from '../store/slices/authSlice';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.cartItems);

  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const email = queryParams.get('email');

  useEffect(() => {
    if (token && email) setMode('reset');
  }, [token, email]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  const hash = (p) => CryptoJS.SHA256(p).toString(CryptoJS.enc.Hex);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '80vh', alignItems: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem', background: 'var(--white)' }}>
        
        {error && (
          <div className="badge-egg" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="badge-eggless" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {mode === 'login' && (
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>Welcome Back</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Indulge in fresh artisan bakery delights.</p>
            
            <Formik
              initialValues={{ email: '', password: '' }}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                try {
                  const loggedInUser = await loginUser(values.email, hash(values.password));
                  localStorage.setItem('dumbake_user', JSON.stringify(loggedInUser));
                  dispatch(setUser(loggedInUser));
                  
                  if (loggedInUser.role === 'admin') {
                    navigate('/admin-dashboard');
                  } else if (cartItems.length > 0) {
                    navigate('/checkout');
                  } else {
                    navigate('/');
                  }
                } catch (e) {
                  setError(e.message);
                  if (e.unverified) {
                    setRegisteredEmail(values.email);
                    setSuccess('Please enter the 6-digit verification code to activate your account.');
                    setMode('verify');
                  }
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Field name="email" type="email" className="form-input" required placeholder="name@example.com" />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Password</label>
                      <span 
                        style={{ color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                        onClick={() => setMode('forgot')}
                      >
                        Forgot Password?
                      </span>
                    </div>
                    <Field name="password" type="password" className="form-input" required placeholder="••••••••" />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Sign In
                  </button>
                </Form>
              )}
            </Formik>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
              New to Dumbake?{' '}
              <span style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setMode('register')}>
                Create Account
              </span>
            </p>
          </div>
        )}

        {mode === 'register' && (
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>Register</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Join for sweet personalized bakes.</p>
            
            <Formik
              initialValues={{ name: '', email: '', password: '', phone: '' }}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                setSuccess('');
                
                if (!values.phone) {
                  setError('Phone number is required.');
                  setSubmitting(false);
                  return;
                }
                const phoneRegex = /^[6-9]\d{9}$/;
                if (!phoneRegex.test(values.phone)) {
                  setError('Please enter a valid 10-digit Indian mobile number.');
                  setSubmitting(false);
                  return;
                }

                try {
                  await registerUser(values.name, values.email, hash(values.password), 'user', values.phone);
                  setRegisteredEmail(values.email);
                  setSuccess('Registration successful! Please enter the 6-digit verification code.');
                  setMode('verify');
                } catch (e) {
                  setError(e.message);
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <Field name="name" className="form-input" required placeholder="John Doe" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <Field name="email" type="email" className="form-input" required placeholder="john@example.com" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <Field name="phone" type="tel" className="form-input" required placeholder="9876543210" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <Field name="password" type="password" className="form-input" required placeholder="••••••••" />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Sign Up
                  </button>
                </Form>
              )}
            </Formik>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
              Already registered?{' '}
              <span style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setMode('login')}>
                Sign In
              </span>
            </p>
          </div>
        )}

        {mode === 'forgot' && (
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>Recover Password</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter email to receive your recovery link.</p>
            
            <Formik
              initialValues={{ email: '' }}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                setSuccess('');
                try {
                  const response = await forgotPassword(values.email);
                  setSuccess(`Reset link generated successfully! Link: ${response.link}`);
                } catch (e) {
                  setError(e.message);
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <Field name="email" type="email" className="form-input" required placeholder="john@example.com" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Request Recovery Link
                  </button>
                </Form>
              )}
            </Formik>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setMode('login')}>
                Back to Sign In
              </span>
            </p>
          </div>
        )}

        {mode === 'reset' && (
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>Set New Password</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter a strong password for security.</p>
            
            <Formik
              initialValues={{ password: '' }}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                try {
                  await resetPassword(email, token, hash(values.password));
                  setSuccess('Password updated successfully! Redirecting...');
                  setTimeout(() => {
                    navigate('/login');
                    setMode('login');
                    window.history.replaceState({}, document.title, "/login");
                  }, 2000);
                } catch (e) {
                  setError(e.message);
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <Field name="password" type="password" className="form-input" required placeholder="••••••••" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Save Password
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        )}

        {mode === 'verify' && (
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>Verify Account</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Please enter the 6-digit verification code sent to {registeredEmail}.</p>
            
            <Formik
              initialValues={{ code: '' }}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                setSuccess('');
                try {
                  const response = await verifyEmail(registeredEmail, values.code);
                  setSuccess('Email verified successfully!');
                  if (response.user) {
                    localStorage.setItem('dumbake_user', JSON.stringify(response.user));
                    dispatch(setUser(response.user));
                    navigate('/');
                  } else {
                    setMode('login');
                  }
                } catch (e) {
                  setError(e.message);
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group">
                    <label className="form-label">6-Digit Verification Code</label>
                    <Field 
                      name="code" 
                      type="text" 
                      maxLength={6} 
                      className="form-input" 
                      required 
                      placeholder="123456" 
                      style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }} 
                    />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Verify Code
                  </button>
                </Form>
              )}
            </Formik>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setMode('login')}>
                Back to Sign In
              </span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
