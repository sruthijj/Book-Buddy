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
  Sparkles,
  Award,
  BookMarked
} from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { booksAPI, statsAPI } from './api/client'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import BookCard from './components/BookCard'
import BookModal from './components/BookModal'
import BookDetailModal from './components/BookDetailModal'
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
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedBookForDetail, setSelectedBookForDetail] = useState(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [isColdStarting, setIsColdStarting] = useState(false)

  // Listen for cold-start events (fires if cloud container wakeup takes > 2.5s)
  useEffect(() => {
    const handleColdStart = (e) => {
      setIsColdStarting(e.detail?.isColdStart || false)
    }
    window.addEventListener('book_buddy_cold_start', handleColdStart)
    return () => window.removeEventListener('book_buddy_cold_start', handleColdStart)
  }, [])

  // Primary Navigation View: 'catalog' (Bookshelf) | 'analytics' (Study Desk)
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

  // Dynamic column detection based on screen width
  const [columnsPerRow, setColumnsPerRow] = useState(5)

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (w < 480) setColumnsPerRow(2)
      else if (w < 768) setColumnsPerRow(2)
      else if (w < 1024) setColumnsPerRow(3)
      else if (w < 1280) setColumnsPerRow(4)
      else setColumnsPerRow(5)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Dynamic Shelving Algorithm:
  // 1. Chunks books into rows matching columnsPerRow
  // 2. Automatically expands and adds new wooden shelves as books are added
  // 3. Always maintains at least one empty shelf at the bottom ready for new books
  // 4. Guarantees at least 3 shelves for the authentic full bookcase aesthetic
  const shelfRows = useMemo(() => {
    const rows = []
    const chunkSize = columnsPerRow
    for (let i = 0; i < filteredBooks.length; i += chunkSize) {
      rows.push(filteredBooks.slice(i, i + chunkSize))
    }

    // Always append at least one empty shelf row at the bottom so there's always an open shelf to expand into
    if (rows.length === 0 || rows[rows.length - 1].length > 0) {
      rows.push([])
    }

    // Guarantee a minimum of 3 shelf rows for the classic full bookcase aesthetic
    while (rows.length < 3) {
      rows.push([])
    }

    return rows
  }, [filteredBooks, columnsPerRow])

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

  const handleOpenDetail = (book) => {
    setSelectedBookForDetail(book)
    setDetailModalOpen(true)
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
        if (selectedBookForDetail?.id === bookId) {
          setDetailModalOpen(false)
        }
      } catch (err) {
        alert('Failed to delete book.')
      }
    }
  }

  return (
    <div className="app-layout">
      {/* The Library Mantelpiece Navigation */}
      <Navbar 
        onOpenAuth={() => setAuthModalOpen(true)} 
        onOpenAddBook={handleOpenAdd}
        onOpenAIStudio={() => setAiModalOpen(true)}
      />

      {/* Cloud Cold Start Awareness Banner */}
      {isColdStarting && (
        <div className="cold-start-banner" role="status" aria-live="polite">
          <div className="cold-start-inner">
            <span className="cold-start-spinner"></span>
            <span className="cold-start-icon">☕</span>
            <div className="cold-start-text">
              <strong className="cold-start-headline">Waking up the cloud sanctuary server...</strong>
              <span className="cold-start-subtitle">
                Render free-tier instances sleep after inactivity. This first wake-up takes ~30–45 seconds. Thank you for your patience!
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="app-container">
        {/* VIEW: STUDY DESK & TELEMETRY */}
        {activeView === 'analytics' ? (
          <div>
            {/* Study Desk Header */}
            <div className="study-desk-header">
              <div>
                <span className="brand-badge" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
                  STUDY DESK & TELEMETRY
                </span>
                <h1 className="study-desk-title">
                  Reading Momentum & Velocity
                </h1>
                <p className="study-desk-subtitle">
                  Empirical telemetry of daily reading sessions, volume completion rates, and genre distribution.
                </p>
              </div>

              <div className="study-desk-actions">
                <button
                  type="button"
                  onClick={() => setActiveView('catalog')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Layers size={16} />
                  <span>Return to Bookshelf</span>
                </button>
              </div>
            </div>

            {/* 4 Antique Brass Metric Plaques */}
            {isAuthenticated && (
              <StatsOverview summary={statsSummary} loading={loadingStats} />
            )}

            {/* Charts */}
            <TimelineChart />
            <GenreChart />
          </div>
        ) : (
          /* VIEW: THE CLASSIC iBOOKS HONEY OAK BOOKSHELF */
          <div>
            {/* The Bookshelf Mantelpiece Toolbar */}
            <div className="mantel-controls-bar">
              {/* Top Row: Title, Quick View Switcher & Action CTAs */}
              <div className="mantel-top-row">
                <div className="mantel-title-group">
                  <div className="mantel-title-icon">
                    <BookMarked size={18} />
                  </div>
                  <div>
                    <h1 className="mantel-heading">
                      {isAuthenticated ? `${user.username}'s Bookshelf` : 'Personal Bookshelf'}
                    </h1>
                  </div>
                </div>

                {/* View Switcher: Bookshelf vs Study Desk */}
                <div className="mantel-top-actions">
                  <div className="view-switcher-pill">
                    <button
                      type="button"
                      onClick={() => setActiveView('catalog')}
                      className={`leather-tab ${activeView === 'catalog' ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                    >
                      <Layers size={13} />
                      <span>Bookshelf</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('analytics')}
                      className={`leather-tab ${activeView === 'analytics' ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                    >
                      <BarChart3 size={13} />
                      <span>Study Desk</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Row: Collections Filter Tabs & Search Controls */}
              <div className="mantel-middle-row">
                {/* Collections Tabs */}
                <div className="mantel-collection-tabs">
                  {[
                    { id: 'all', label: 'All Volumes', shortLabel: 'All', count: counts.all, icon: BookOpen },
                    { id: 'reading', label: 'Reading Now', shortLabel: 'Reading', count: counts.reading, icon: TrendingUp },
                    { id: 'completed', label: 'Finished', shortLabel: 'Finished', count: counts.completed, icon: CheckCircle },
                    { id: 'wishlist', label: 'Wishlist', shortLabel: 'Wishlist', count: counts.wishlist, icon: Bookmark },
                  ].map((tab) => {
                    const Icon = tab.icon
                    const isActive = statusFilter === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={`leather-tab ${isActive ? 'active' : ''}`}
                        onClick={() => setStatusFilter(tab.id)}
                      >
                        <Icon size={12} />
                        <span className="tab-label-full">{tab.label}</span>
                        <span className="tab-label-short">{tab.shortLabel}</span>
                        <span className="tab-count-badge">
                          {tab.count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Search & Filters */}
                <div className="mantel-search-filters">
                  <div className="mantel-search-box">
                    <input
                      type="text"
                      className="parchment-input"
                      placeholder="Search title or author..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search 
                      size={14} 
                      className="mantel-search-icon"
                    />
                  </div>

                  <div className="mantel-selects-group">
                    <select
                      className="parchment-select mantel-select"
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                    >
                      <option value="all">All Genres</option>
                      {uniqueGenres.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    <select
                      className="parchment-select mantel-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="updated_at">Recently Read</option>
                      <option value="title">Title (A-Z)</option>
                      <option value="rating">Rating (Highest)</option>
                      <option value="current_page">Progress (Pages)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Brass Ribbon Summary Ticker */}
              <div className="mantel-ticker-row">
                <div className="mantel-ticker-stats">
                  <span>🏛️ <strong>{counts.all}</strong> Volumes</span>
                  <span>📖 <strong>{counts.reading}</strong> Reading</span>
                  <span>🏆 <strong>{counts.completed}</strong> Completed</span>
                  <span>⚡ <strong>{statsSummary?.total_pages_read || 0}</strong> Pages Read</span>
                </div>
                <div className="mantel-ticker-rating">
                  <span>★ Satisfaction: <strong>{statsSummary?.average_rating ? `${statsSummary.average_rating.toFixed(1)} / 5.0` : '—'}</strong></span>
                </div>
              </div>
            </div>

            {/* THE TRUE 3D WOODEN BOOKSHELF CABINET */}
            <div className="bookshelf-cabinet">
              {/* Crown Molding at the top of the cabinet */}
              <div className="bookcase-crown"></div>

              {/* Cabinet Interior with Solid Oak Side Pillars */}
              <div className="bookcase-inner">
                {/* Left Oak Upright Pillar */}
                <div className="bookcase-pillar-left"></div>

                {/* Shelves Content */}
                <div className="bookcase-shelves-content">
                  {loadingBooks ? (
                    <div style={{ textAlign: 'center', padding: '6rem 0', color: '#57310e' }}>
                      <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
                        Arranging volumes upon the oak shelves...
                      </p>
                    </div>
                  ) : shelfRows.length > 0 ? (
                    shelfRows.map((rowBooks, rowIndex) => (
                      <div key={rowIndex} className="shelf-row">
                        {/* Shelf Row: Books Standing Flat on the Wooden Plank */}
                        <div 
                          className="shelf-books-container"
                          style={{ gridTemplateColumns: `repeat(${columnsPerRow}, 1fr)` }}
                        >
                          {rowBooks.length > 0 ? (
                            rowBooks.map((book) => (
                              <BookCard
                                key={book.id}
                                book={book}
                                onSelect={handleOpenDetail}
                                onUpdateProgress={handleOpenProgress}
                                onEdit={handleEditBook}
                                onDelete={handleDeleteBook}
                                onStartReading={handleStartReading}
                              />
                            ))
                          ) : (
                            /* Authentic Empty Wooden Shelf Ledge */
                            rowIndex === 0 && filteredBooks.length === 0 ? (
                              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '260px' }}>
                                <div 
                                  style={{
                                    maxWidth: '440px',
                                    margin: '1rem auto',
                                    background: 'linear-gradient(180deg, #edd5b1 0%, #dfc094 100%)',
                                    border: '2px solid #9e672e',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1.75rem',
                                    textAlign: 'center',
                                    boxShadow: '0 8px 24px rgba(60, 30, 10, 0.35)'
                                  }}
                                >
                                  <FolderOpen size={40} color="#754417" style={{ margin: '0 auto 0.75rem auto' }} />
                                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#2e1605', marginBottom: '0.4rem', fontWeight: 800 }}>
                                    {searchQuery || genreFilter !== 'all' || statusFilter !== 'all'
                                      ? 'No matching volumes on this shelf'
                                      : 'Your personal bookshelf is ready'}
                                  </h3>
                                  <p style={{ fontSize: '0.85rem', color: '#522f12', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                                    {searchQuery || genreFilter !== 'all' || statusFilter !== 'all'
                                      ? 'Try clearing your search query or selecting "All Volumes".'
                                      : 'Add your physical volumes or reading wishlists. You can also use 1-click ISBN auto-import!'}
                                  </p>
                                  <button type="button" className="btn btn-primary" onClick={handleOpenAdd} style={{ padding: '0.5rem 1.25rem' }}>
                                    <Plus size={15} />
                                    <span>Add First Volume to Shelf</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="empty-shelf-space"></div>
                            )
                          )}
                        </div>

                        {/* 3D Beveled Wooden Shelf Plank Ledge */}
                        <div className="shelf-wood-plank">
                          <div className="shelf-plank-surface"></div>
                          <div className="shelf-plank-front"></div>
                          <div className="shelf-plank-shadow"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Empty Bookshelf Fallback */
                    <div className="shelf-row">
                      <div className="shelf-books-container" style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div 
                          style={{
                            maxWidth: '440px',
                            margin: '2rem auto',
                            background: '#edd5b1',
                            border: '2px solid #9e672e',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.75rem',
                            textAlign: 'center',
                            boxShadow: '0 8px 20px rgba(60, 30, 10, 0.3)'
                          }}
                        >
                          <FolderOpen size={38} color="#754417" style={{ margin: '0 auto 0.75rem auto' }} />
                          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#2e1605', marginBottom: '0.4rem', fontWeight: 800 }}>
                            {searchQuery || genreFilter !== 'all' || statusFilter !== 'all'
                              ? 'No matching volumes on this shelf'
                              : 'Your shelf is waiting for its first volume'}
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: '#522f12', marginBottom: '1rem' }}>
                            {searchQuery || genreFilter !== 'all' || statusFilter !== 'all'
                              ? 'Try clearing your search query or selecting "All Volumes".'
                              : 'Add your physical copies or digital reading list to arrange them on this shelf.'}
                          </p>
                          <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                            <Plus size={14} />
                            <span>Add Book to Shelf</span>
                          </button>
                        </div>
                      </div>
                      <div className="shelf-wood-plank">
                        <div className="shelf-plank-surface"></div>
                        <div className="shelf-plank-front"></div>
                        <div className="shelf-plank-shadow"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Oak Upright Pillar */}
                <div className="bookcase-pillar-right"></div>
              </div>

              {/* Bottom Cabinet Baseboard */}
              <div className="bookcase-baseboard"></div>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      {/* Volume Detail & Reflection Notes Modal */}
      <BookDetailModal
        book={selectedBookForDetail}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onEdit={handleEditBook}
        onLogProgress={handleOpenProgress}
        onDelete={handleDeleteBook}
        onStartReading={handleStartReading}
        onOpenAIStudio={() => setAiModalOpen(true)}
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
