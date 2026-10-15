import React from 'react';
import { BookOpen, LogOut, User as UserIcon, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth, onOpenAddBook, onOpenAIStudio }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="header-nav">
      <div className="header-inner">
        {/* Brand Logo & Name with Vintage Gold Crest */}
        <a href="/" className="brand-logo">
          <div className="brand-icon-box">
            <BookOpen size={20} strokeWidth={2.4} />
          </div>
          <span className="brand-title">Book Buddy</span>
          <span className="brand-badge">SANCTUARY</span>
        </a>

        {/* Right Nav Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              {/* User Wax Seal Medallion */}
              <div className="user-seal">
                <div className="user-seal-avatar">
                  {user?.username ? user.username.charAt(0) : 'U'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brass-light)' }}>
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
                style={{ padding: '0.45rem', color: 'var(--text-secondary)' }}
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
