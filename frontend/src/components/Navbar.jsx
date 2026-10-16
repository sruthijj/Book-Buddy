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
          <span className="brand-badge brand-badge-desktop">SANCTUARY</span>
        </a>

        {/* Right Nav Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              {/* User Wax Seal Medallion */}
              <div className="user-seal">
                <div className="user-seal-avatar">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-seal-name">
                  {user?.username}
                </span>
              </div>

              {/* AI Companion Studio CTA */}
              {onOpenAIStudio && (
                <button
                  type="button"
                  className="btn btn-ai btn-sm nav-btn"
                  onClick={onOpenAIStudio}
                  title="Open AI Reading Companion"
                >
                  <Sparkles size={14} />
                  <span className="nav-btn-text">AI Companion</span>
                  <span className="nav-btn-text-mobile">AI</span>
                </button>
              )}

              {/* Add Book CTA */}
              {onOpenAddBook && (
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm nav-btn"
                  onClick={onOpenAddBook}
                  title="Add Book to Library"
                >
                  <Plus size={15} />
                  <span className="nav-btn-text">Add Book</span>
                  <span className="nav-btn-text-mobile">Add</span>
                </button>
              )}

              {/* Sign Out Button */}
              <button
                type="button"
                className="btn btn-ghost btn-sm nav-logout-btn"
                onClick={logout}
                title="Sign Out"
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
