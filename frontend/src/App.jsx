import React, { useState } from 'react'
import { BookOpen, Sparkles, TrendingUp, Plus, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'

function App() {
  const { user, isAuthenticated } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Editorial Navigation */}
      <Navbar 
        onOpenAuth={() => setAuthModalOpen(true)} 
        onOpenAddBook={() => {}}
      />

      {/* Main Content Area */}
      <main className="app-container">
        {/* Editorial Subtitle / Header */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-accent)' }}>
              {isAuthenticated ? `Private Sanctuary · ${user.username}` : 'Personal Reading Companion'}
            </span>
            {isAuthenticated && (
              <span className="status-pill completed" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                <ShieldCheck size={11} /> Authenticated Session
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            {isAuthenticated ? `Welcome back to your library, ${user.username}.` : 'Your Reading Sanctuary'}
          </h1>
          <p style={{ fontSize: '1.05rem', maxWidth: '620px' }}>
            {isAuthenticated
              ? 'Catalog your physical books, track daily pages, and let your AI companion generate personalized reviews and reading timelines.'
              : 'Sign in to access your private book lists, daily reading progress, and AI reading companion.'}
          </p>
        </section>

        {/* Unauthenticated Callout Banner */}
        {!isAuthenticated && (
          <div 
            className="card" 
            style={{ 
              padding: '2rem', 
              backgroundColor: 'var(--bg-subtle)', 
              borderColor: 'var(--border-strong)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Sparkles size={18} style={{ color: 'var(--brand-accent)' }} />
                <h3 style={{ fontSize: '1.15rem' }}>Private Library Storage Enabled</h3>
              </div>
              <p style={{ fontSize: '0.875rem', maxWidth: '520px' }}>
                Each user gets an isolated, secure library powered by JWT authentication and SQLite foreign keys.
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => setAuthModalOpen(true)}
            >
              <span>Sign In or Create Account</span>
            </button>
          </div>
        )}

        {/* Status Verification Card */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <span className="status-pill reading" style={{ marginBottom: '0.75rem' }}>
                <TrendingUp size={12} /> Step 9: Auth & State Active
              </span>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                Clean Code: A Handbook of Agile Software Craftsmanship
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                by Robert C. Martin · Software Engineering
              </p>
            </div>
            <span className="status-pill completed">
              <CheckCircle2 size={12} /> JWT Auth Ready
            </span>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              <span>Reading Momentum</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>pg. 142 of 431 (33%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '33%' }}></div>
            </div>
          </div>
        </div>
      </main>

      {/* Authentication Modal Dialog */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </div>
  )
}

export default App
