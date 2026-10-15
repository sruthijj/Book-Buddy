import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, authError, setAuthError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Reset errors and inputs on open/tab change
  useEffect(() => {
    setAuthError(null);
  }, [isSignUp, isOpen, setAuthError]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (isSignUp) {
      result = await register(username, email, password);
    } else {
      result = await login(username, password);
    }

    setLoading(false);
    if (result.success) {
      onClose();
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    const result = await demoLogin();
    setLoading(false);
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '440px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.15rem' }}>
              {isSignUp ? 'Create Your Account' : 'Welcome to Book Buddy'}
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              {isSignUp ? 'Start cataloging your personal library' : 'Sign in to access your reading sanctuary'}
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            style={{ padding: '0.4rem', borderRadius: '50%' }}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 1.5rem', backgroundColor: 'var(--bg-subtle)' }}>
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            style={{
              flex: 1,
              padding: '0.75rem 0',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: !isSignUp ? '2px solid var(--brand-primary)' : '2px solid transparent',
              color: !isSignUp ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            style={{
              flex: 1,
              padding: '0.75rem 0',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: isSignUp ? '2px solid var(--brand-primary)' : '2px solid transparent',
              color: isSignUp ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            New Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Error Banner */}
          {authError && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.825rem',
                marginBottom: '1rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
                <User 
                  size={15} 
                  style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                />
              </div>
            </div>

            {isSignUp && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    className="form-input"
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail 
                    size={15} 
                    style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock 
                  size={15} 
                  style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.7rem' }}
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Free Account' : 'Sign In to Library')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
