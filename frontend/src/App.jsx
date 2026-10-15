import React, { useState, useEffect, useMemo } from 'react'
import { 
  BookOpen, 
  Search, 
  Plus, 
  TrendingUp, 
  CheckCircle, 
  Bookmark, 
  BarChart3,
  Layers,
  FolderOpen,
  Sparkles
} from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { booksAPI, statsAPI } from './api/client'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import BookCard from './components/BookCard'
import BookModal from './components/BookModal'
import ProgressModal from './components/ProgressModal'
import StatsOverview from './components/StatsOverview'
import TimelineChart from './components/TimelineChart'
import GenreChart from './components/GenreChart'
import AIStudioModal from './components/AIStudioModal'

function App() {
  const { user, isAuthenticated } = useAuth()

  // App Modals State
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [selectedBookForEdit, setSelectedBookForEdit] = useState(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)

  // Primary Navigation View: 'catalog' | 'analytics'
  const [activeView, setActiveView] = useState('catalog')

  // Books & Stats Data State
  const [books, setBooks] = useState([])
  const [loadingBooks, setLoadingBooks] = useState(false)
  const [statsSummary, setStatsSummary] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Filter & Search Controls
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'reading', 'completed', 'wishlist'
  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated_at')

  // Load books and stats summary
  const fetchLibraryData = async () => {
    if (!isAuthenticated) {
      setBooks([])
      setStatsSummary(null)
      return
    }
    setLoadingBooks(true)
    setLoadingStats(true)
    try {
      const [booksRes, statsRes] = await Promise.all([
        booksAPI.getAll(),
        statsAPI.getSummary(),
      ])
      setBooks(booksRes.data)
      setStatsSummary(statsRes.data)
    } catch (err) {
      console.error('Failed to load library telemetry:', err)
    } finally {
      setLoadingBooks(false)
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchLibraryData()
  }, [isAuthenticated])

  // Extract unique genres for dropdown
  const uniqueGenres = useMemo(() => {
    const genres = books.map((b) => b.genre).filter(Boolean)
    return Array.from(new Set(genres))
  }, [books])

  // Calculate Status Counts
  const counts = useMemo(() => {
    return {
      all: books.length,
      reading: books.filter((b) => b.status === 'reading').length,
      completed: books.filter((b) => b.status === 'completed').length,
      wishlist: books.filter((b) => b.status === 'wishlist').length,
    }
  }, [books])

  // Filtered & Sorted Books
  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false
        if (genreFilter !== 'all' && b.genre !== genreFilter) return false
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title)
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
        if (sortBy === 'current_page') return b.current_page - a.current_page
        return new Date(b.updated_at) - new Date(a.updated_at)
      })
  }, [books, statusFilter, genreFilter, searchQuery, sortBy])

  // Handlers
  const handleOpenAdd = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    setSelectedBookForEdit(null)
    setBookModalOpen(true)
  }

  const handleEditBook = (book) => {
    setSelectedBookForEdit(book)
    setBookModalOpen(true)
  }

  const handleOpenProgress = (book) => {
    setSelectedBookForProgress(book)
    setProgressModalOpen(true)
  }

  const handleStartReading = async (book) => {
    try {
      await booksAPI.update(book.id, { status: 'reading' })
      fetchLibraryData()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleDeleteBook = async (bookId, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from your library?`)) {
      try {
        await booksAPI.delete(bookId)
        fetchLibraryData()
      } catch (err) {
        alert('Failed to delete book.')
      }
    }
  }

  return (
    <div className="app-layout">
      {/* Editorial Navigation */}
      <Navbar 
        onOpenAuth={() => setAuthModalOpen(true)} 
        onOpenAddBook={handleOpenAdd}
        onOpenAIStudio={() => setAiModalOpen(true)}
      />

      <main className="app-container">
        {/* Editorial Subtitle / Header */}
        <section style={{ marginBottom: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="brand-badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                  {isAuthenticated ? `✨ ${user.username}'s Sanctuary` : '✨ Personal Reading Sanctuary'}
                </span>
                <span className="hero-pill">
                  <span className="pulse-dot"></span>
                  <span>{counts.reading} Active Volumes</span>
                </span>
                <span className="hero-pill" style={{ color: '#059669' }}>
                  <span>🏆 {counts.completed} Completed</span>
                </span>
              </div>
              <h1 style={{ fontSize: '2.4rem', letterSpacing: '-0.025em', marginBottom: '0.35rem', lineHeight: 1.15 }}>
                {activeView === 'catalog' ? 'Literary Catalog & Daily Progress' : 'Reading Telemetry & Analytics'}
              </h1>
              <p style={{ fontSize: '0.975rem', maxWidth: '680px', color: 'var(--text-secondary)' }}>
                {activeView === 'catalog'
                  ? 'Curate your physical volumes, track daily reading momentum, and enrich your library with AI insights.'
                  : 'Empirical telemetry of daily reading velocity, pages consumed over time, and genre distribution.'}
              </p>
            </div>

            {/* Actions: View Switcher & Action CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Apple Segmented Control */}
              <div 
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(118, 118, 128, 0.12)',
                  borderRadius: 'var(--radius-full)',
                  padding: '3px',
                  border: '1px solid rgba(0, 0, 0, 0.04)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveView('catalog')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: activeView === 'catalog' ? '#FFFFFF' : 'none',
                    color: activeView === 'catalog' ? '#1D1D1F' : 'var(--text-secondary)',
                    fontWeight: activeView === 'catalog' ? 700 : 500,
                    boxShadow: activeView === 'catalog' ? '0 2px 8px rgba(0, 0, 0, 0.12)' : 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.45rem 1rem',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 160ms ease'
                  }}
                >
                  <Layers size={14} />
                  <span>Library</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('analytics')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: activeView === 'analytics' ? '#FFFFFF' : 'none',
                    color: activeView === 'analytics' ? '#1D1D1F' : 'var(--text-secondary)',
                    fontWeight: activeView === 'analytics' ? 700 : 500,
                    boxShadow: activeView === 'analytics' ? '0 2px 8px rgba(0, 0, 0, 0.12)' : 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.45rem 1rem',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 160ms ease'
                  }}
                >
                  <BarChart3 size={14} />
                  <span>Analytics</span>
                </button>
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  className="btn btn-ai"
                  onClick={() => setAiModalOpen(true)}
                  style={{ padding: '0.55rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Sparkles size={15} />
                  <span>AI Companion</span>
                </button>
              )}

              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleOpenAdd}
                style={{ padding: '0.55rem 1.25rem' }}
              >
                <Plus size={16} />
                <span>Add Book</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4 High-Level Metric Cards (Always visible for quick glance) */}
        {isAuthenticated && (
          <StatsOverview summary={statsSummary} loading={loadingStats} />
        )}

        {/* ANALYTICS VIEW */}
        {activeView === 'analytics' ? (
          <div>
            {/* Graph View of Reading Over Time */}
            <TimelineChart />

            {/* Genre Distribution Chart */}
            <GenreChart />
          </div>
        ) : (
          /* LIBRARY CATALOG VIEW */
          <div>
            {/* Dashboard Filter Bar */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.15rem',
                marginBottom: '2.25rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              {/* Apple Pill Tabs */}
              <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {[
                  { 
                    id: 'all', 
                    label: 'All Books', 
                    count: counts.all, 
                    icon: BookOpen,
                    activeBg: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
                    activeGlow: '0 4px 14px rgba(0, 0, 0, 0.2)'
                  },
                  { 
                    id: 'reading', 
                    label: 'Currently Reading', 
                    count: counts.reading, 
                    icon: TrendingUp,
                    activeBg: 'var(--apple-blue-gradient)',
                    activeGlow: 'var(--apple-blue-glow)'
                  },
                  { 
                    id: 'completed', 
                    label: 'Finished', 
                    count: counts.completed, 
                    icon: CheckCircle,
                    activeBg: 'var(--apple-mint-gradient)',
                    activeGlow: 'var(--apple-mint-glow)'
                  },
                  { 
                    id: 'wishlist', 
                    label: 'Wishlist', 
                    count: counts.wishlist, 
                    icon: Bookmark,
                    activeBg: 'var(--apple-coral-gradient)',
                    activeGlow: 'var(--apple-coral-glow)'
                  },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = statusFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 1.1rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 180ms ease',
                        border: isActive ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                        background: isActive ? tab.activeBg : 'rgba(255, 255, 255, 0.85)',
                        color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                        boxShadow: isActive ? tab.activeGlow : 'var(--shadow-sm)',
                        backdropFilter: 'blur(10px)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                      <span 
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '0.08rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0, 0, 0, 0.06)',
                          color: isActive ? '#FFFFFF' : 'var(--text-secondary)'
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Search & Filters */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search 
                    size={15} 
                    style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                  />
                </div>

                <div style={{ minWidth: '150px' }}>
                  <select
                    className="form-select"
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                  >
                    <option value="all">All Genres</option>
                    {uniqueGenres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: '170px' }}>
                  <select
                    className="form-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="updated_at">Recently Updated</option>
                    <option value="title">Title (A to Z)</option>
                    <option value="rating">Rating (Highest)</option>
                    <option value="current_page">Progress (Pages)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Books Grid */}
            {loadingBooks ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <p>Loading your personal library...</p>
              </div>
            ) : filteredBooks.length > 0 ? (
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '1.25rem'
                }}
              >
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onUpdateProgress={handleOpenProgress}
                    onEdit={handleEditBook}
                    onDelete={handleDeleteBook}
                    onStartReading={handleStartReading}
                  />
                ))}
              </div>
            ) : (
              <div 
                className="card" 
                style={{ 
                  textAlign: 'center', 
                  padding: '3.5rem 1.5rem', 
                  backgroundColor: 'var(--bg-subtle)',
                  borderStyle: 'dashed'
                }}
              >
                <FolderOpen size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
                  {searchQuery || genreFilter !== 'all' || statusFilter !== 'all'
                    ? 'No matching volumes found'
                    : 'Your sanctuary is waiting for its first book'}
                </h3>
                <p style={{ fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
                  {searchQuery || genreFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try refining your search terms or clearing current filter tags.'
                    : 'Catalog your physical copies or digital reading list. Use ISBN auto-import to get started in 1 click!'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenAdd}
                >
                  <Plus size={16} />
                  <span>Add Your First Book</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      {/* Add / Edit Book Modal with ISBN Autofill */}
      <BookModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onSuccess={fetchLibraryData}
        initialBook={selectedBookForEdit}
      />

      {/* Quick Progress Modal */}
      <ProgressModal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        onSuccess={fetchLibraryData}
        book={selectedBookForProgress}
      />

      {/* AI Reading Companion Studio Modal */}
      <AIStudioModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        books={books}
        onBookAdded={fetchLibraryData}
      />
    </div>
  )
}

export default App
