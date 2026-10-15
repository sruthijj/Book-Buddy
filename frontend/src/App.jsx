import React, { useState, useEffect, useMemo } from 'react'
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  Bookmark, 
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { booksAPI } from './api/client'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import BookCard from './components/BookCard'
import BookModal from './components/BookModal'
import ProgressModal from './components/ProgressModal'

function App() {
  const { user, isAuthenticated } = useAuth()

  // App Modals State
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [selectedBookForEdit, setSelectedBookForEdit] = useState(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null)

  // Books Data State
  const [books, setBooks] = useState([])
  const [loadingBooks, setLoadingBooks] = useState(false)

  // Filter & Search Controls
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'reading', 'completed', 'wishlist'
  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated_at')

  // Load books when user is authenticated
  const fetchBooks = async () => {
    if (!isAuthenticated) {
      setBooks([])
      return
    }
    setLoadingBooks(true)
    try {
      const res = await booksAPI.getAll()
      setBooks(res.data)
    } catch (err) {
      console.error('Failed to load books:', err)
    } finally {
      setLoadingBooks(false)
    }
  }

  useEffect(() => {
    fetchBooks()
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
        // Status filter
        if (statusFilter !== 'all' && b.status !== statusFilter) return false
        // Genre filter
        if (genreFilter !== 'all' && b.genre !== genreFilter) return false
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const titleMatch = b.title.toLowerCase().includes(q)
          const authorMatch = b.author.toLowerCase().includes(q)
          return titleMatch || authorMatch
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
      fetchBooks()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleDeleteBook = async (bookId, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from your library?`)) {
      try {
        await booksAPI.delete(bookId)
        fetchBooks()
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
      />

      <main className="app-container">
        {/* Editorial Subtitle / Header */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-accent)' }}>
                  {isAuthenticated ? `${user.username}'s Library` : 'Personal Reading Sanctuary'}
                </span>
                <span className="status-pill reading" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                  {counts.reading} In Progress
                </span>
              </div>
              <h1 style={{ fontSize: '2.25rem', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
                Literary Catalog & Progress
              </h1>
              <p style={{ fontSize: '0.95rem' }}>
                Track your active volumes, record daily sessions, and explore reading momentum.
              </p>
            </div>

            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{ padding: '0.65rem 1.15rem' }}
            >
              <Plus size={16} />
              <span>Add New Book</span>
            </button>
          </div>
        </section>

        {/* Unauthenticated Notification */}
        {!isAuthenticated && (
          <div 
            className="card" 
            style={{ 
              padding: '1.5rem', 
              backgroundColor: 'var(--bg-subtle)', 
              borderColor: 'var(--border-strong)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2rem'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Private Library Storage</h3>
              <p style={{ fontSize: '0.85rem' }}>
                Please sign in to save and sync your private books, reading sessions, and personal notes.
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In to Your Account
            </button>
          </div>
        )}

        {/* Dashboard Filter Bar */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '1.75rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          {/* Top Row: Status Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {[
              { id: 'all', label: 'All Books', count: counts.all, icon: BookOpen },
              { id: 'reading', label: 'Currently Reading', count: counts.reading, icon: TrendingUp },
              { id: 'completed', label: 'Completed', count: counts.completed, icon: CheckCircle },
              { id: 'wishlist', label: 'Wishlist', count: counts.wishlist, icon: Bookmark },
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
                    gap: '0.45rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    border: '1px solid',
                    backgroundColor: isActive ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    borderColor: isActive ? 'var(--brand-primary)' : 'var(--border-subtle)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span 
                    style={{
                      fontSize: '0.725rem',
                      padding: '0.05rem 0.4rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-subtle)',
                      color: isActive ? '#FFFFFF' : 'var(--text-muted)'
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Bottom Row: Search & Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
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

            {/* Genre Dropdown */}
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

            {/* Sort Dropdown */}
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

        {/* Books Grid View */}
        {loadingBooks ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <BookOpen size={32} style={{ margin: '0 auto 1rem auto', animation: 'spin 1.5s linear infinite' }} />
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
          /* Empty State */
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
        onSuccess={fetchBooks}
        initialBook={selectedBookForEdit}
      />

      {/* Quick Progress Modal */}
      <ProgressModal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        onSuccess={fetchBooks}
        book={selectedBookForProgress}
      />
    </div>
  )
}

export default App
