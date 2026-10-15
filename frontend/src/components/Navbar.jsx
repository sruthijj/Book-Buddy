import React from 'react';
import { BookOpen, LogOut, User as UserIcon, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth, onOpenAddBook }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="header-nav">
      <div className="header-inner">
        {/* Brand Logo & Name */}
        <a href="/" className="brand-logo">
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--text-inverse)'
            }}
          >
            <BookOpen size={18} strokeWidth={2.2} />
          </div>
          <span className="brand-title">Book Buddy</span>
          <span className="brand-badge">Sanctuary</span>
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
                  gap: '0.5rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase'
                  }}
                >
                  {user?.username ? user.username.charAt(0) : 'U'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.username}
                </span>
              </div>

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
