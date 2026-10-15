import React from 'react';
import { BookOpen, LogOut, User as UserIcon, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth, onOpenAddBook, onOpenAIStudio }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="header-nav">
      <div className="header-inner">
        {/* Brand Logo & Name */}
        <a href="/" className="brand-logo">
          <div className="brand-icon-box">
            <BookOpen size={19} strokeWidth={2.4} />
          </div>
          <span className="brand-title">Book Buddy</span>
          <span className="brand-badge">SANCTUARY</span>
        </a>

        {/* Right Nav Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              {/* User Avatar & Name */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--apple-blue-gradient)',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                    boxShadow: 'var(--apple-blue-glow)'
                  }}
                >
                  {user?.username ? user.username.charAt(0) : 'U'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.username}
                </span>
              </div>

              {/* AI Companion Studio CTA */}
              {onOpenAIStudio && (
                <button
                  type="button"
                  className="btn btn-ai btn-sm"
                  onClick={onOpenAIStudio}
                  title="Open AI Reading Companion"
                >
                  <Sparkles size={14} />
                  <span>AI Companion</span>
                </button>
              )}

              {/* Add Book CTA */}
              {onOpenAddBook && (
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={onOpenAddBook}
                >
                  <Plus size={15} />
                  <span>Add Book</span>
                </button>
              )}

              {/* Sign Out Button */}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={logout}
                title="Sign Out"
                style={{ padding: '0.45rem' }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={onOpenAuth}
              >
                <UserIcon size={15} />
                <span>Sign In</span>
              </button>

              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={onOpenAuth}
              >
                <span>Get Started</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
