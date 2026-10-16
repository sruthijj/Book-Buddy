import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, Check, AlertCircle, BookOpen, Star, ArrowRight, Hash, Type } from 'lucide-react';
import { booksAPI, isbnAPI, catalogAPI } from '../api/client';

const COMMON_GENRES = [
  'Technology',
  'Software Engineering',
  'Self-Help',
  'Fiction',
  'Science Fiction',
  'Business',
  'Psychology',
  'Biography',
  'History'
];

export default function BookModal({ isOpen, onClose, onSuccess, initialBook = null }) {
  const isEdit = Boolean(initialBook);

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Technology');
  const [status, setStatus] = useState('reading');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('0');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isbn, setIsbn] = useState('');

  // Auto-Import State: 'title' (default for ease) or 'isbn'
  const [searchMode, setSearchMode] = useState('title');

  // Title / Author Catalog Search State
  const [titleSearchQuery, setTitleSearchQuery] = useState('');
  const [searchingCatalog, setSearchingCatalog] = useState(false);
  const [catalogResults, setCatalogResults] = useState([]);
  const [catalogError, setCatalogError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // ISBN Fetcher State
  const [isbnInput, setIsbnInput] = useState('');
  const [fetchingIsbn, setFetchingIsbn] = useState(false);
  const [isbnSuccess, setIsbnSuccess] = useState(false);
  const [isbnError, setIsbnError] = useState(null);

  // General Form Feedback
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Populate fields on edit or reset on create
  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title || '');
      setAuthor(initialBook.author || '');
      setGenre(initialBook.genre || 'Technology');
      setStatus(initialBook.status || 'reading');
      setTotalPages(initialBook.total_pages ? String(initialBook.total_pages) : '');
      setCurrentPage(initialBook.current_page !== undefined ? String(initialBook.current_page) : '0');
      setRating(initialBook.rating || 0);
      setNotes(initialBook.notes || '');
      setCoverImageUrl(initialBook.cover_image_url || '');
      setIsbn(initialBook.isbn || '');
      setIsbnInput(initialBook.isbn || '');
    } else {
      setTitle('');
      setAuthor('');
      setGenre('Technology');
      setStatus('reading');
      setTotalPages('');
      setCurrentPage('0');
      setRating(0);
      setNotes('');
      setCoverImageUrl('');
      setIsbn('');
      setIsbnInput('');
    }
    setSearchMode('title');
    setTitleSearchQuery('');
    setCatalogResults([]);
    setCatalogError(null);
    setSelectedCandidate(null);
    setIsbnSuccess(false);
    setIsbnError(null);
    setFormError(null);
  }, [initialBook, isOpen]);

  if (!isOpen) return null;

  // Search Open Library Catalog by Title or Author
  const handleSearchCatalog = async () => {
    if (!titleSearchQuery.trim()) return;
    setSearchingCatalog(true);
    setCatalogError(null);
    setSelectedCandidate(null);

    try {
      const res = await catalogAPI.search(titleSearchQuery.trim(), 8);
      const results = res.data?.results || [];
      setCatalogResults(results);
      if (results.length === 0) {
        setCatalogError('No books found matching this title or author. Try different keywords.');
      }
    } catch (err) {
      setCatalogError(err.response?.data?.detail || 'Failed to search Open Library catalog.');
    } finally {
      setSearchingCatalog(false);
    }
  };

  // 1-Click Select Candidate from Catalog Results
  const handleSelectCandidate = (item) => {
    setTitle(item.title || '');
    setAuthor(item.author || '');
    if (item.genre) setGenre(item.genre);
    if (item.total_pages) setTotalPages(String(item.total_pages));
    if (item.cover_image_url) setCoverImageUrl(item.cover_image_url);
    if (item.isbn) setIsbn(item.isbn);
    setSelectedCandidate(item);
    setCatalogResults([]);
    setCatalogError(null);
  };

  // 1-Click Open Library ISBN Auto-Import
  const handleFetchISBN = async () => {
    if (!isbnInput.trim()) return;
    setFetchingIsbn(true);
    setIsbnError(null);
    setIsbnSuccess(false);

    try {
      const res = await isbnAPI.lookup(isbnInput.trim());
      const bookData = res.data;

      // Auto-populate form fields with normalized genre
      setTitle(bookData.title || title);
      setAuthor(bookData.author || author);
      if (bookData.genre) setGenre(bookData.genre);
      if (bookData.total_pages) setTotalPages(String(bookData.total_pages));
      if (bookData.cover_image_url) setCoverImageUrl(bookData.cover_image_url);
      setIsbn(bookData.isbn);

      setIsbnSuccess(true);
    } catch (err) {
      setIsbnError(err.response?.data?.detail || 'Could not find book for this ISBN on Open Library.');
    } finally {
      setFetchingIsbn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const total = parseInt(totalPages, 10) || 0;
    const current = parseInt(currentPage, 10) || 0;

    if (total > 0 && current > total) {
      setFormError('Current page cannot exceed total pages.');
      return;
    }

    setSubmitting(true);
    const payload = {
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim(),
      status,
      total_pages: total,
      current_page: current,
      rating: rating > 0 ? rating : null,
      notes: notes.trim() || null,
      cover_image_url: coverImageUrl.trim() || null,
      isbn: isbn.trim() || null,
    };

    try {
      if (isEdit) {
        await booksAPI.update(initialBook.id, payload);
      } else {
        await booksAPI.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save book. Please verify your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '620px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.15rem' }}>
              {isEdit ? 'Edit Book Details' : 'Add Book to Library'}
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              {isEdit ? 'Update metadata, progress, or personal reflections' : 'Enter book information or use instant ISBN auto-import'}
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* 1-Click Auto-Import Section with Title/Author & ISBN Tabs */}
          {!isEdit && (
            <div className="book-auto-import-box">
              {/* Import Mode Toggle Tabs */}
              <div className="book-import-tabs">
                <button
                  type="button"
                  className={`book-import-tab-btn ${searchMode === 'title' ? 'active' : ''}`}
                  onClick={() => {
                    setSearchMode('title');
                    setIsbnError(null);
                  }}
                >
                  <Search size={14} />
                  <span>Search by Title or Author</span>
                </button>
                <button
                  type="button"
                  className={`book-import-tab-btn ${searchMode === 'isbn' ? 'active' : ''}`}
                  onClick={() => {
                    setSearchMode('isbn');
                    setCatalogError(null);
                  }}
                >
                  <Sparkles size={14} />
                  <span>Search by ISBN Barcode</span>
                </button>
              </div>

              {/* TAB 1: TITLE OR AUTHOR SEARCH */}
              {searchMode === 'title' && (
                <div className="book-import-content">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Search Open Library Catalog
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      e.g. Dune, Atomic Habits, Andy Weir...
                    </span>
                  </div>

                  <div className="isbn-import-input-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type book title or author..."
                      value={titleSearchQuery}
                      onChange={(e) => setTitleSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchCatalog();
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm isbn-fetch-btn"
                      onClick={handleSearchCatalog}
                      disabled={searchingCatalog || !titleSearchQuery.trim()}
                    >
                      <Search size={13} />
                      <span>{searchingCatalog ? 'Searching...' : 'Search'}</span>
                    </button>
                  </div>

                  {catalogError && (
                    <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontSize: '0.8rem' }}>
                      <AlertCircle size={14} />
                      <span>{catalogError}</span>
                    </div>
                  )}

                  {selectedCandidate && (
                    <div className="book-import-selected-banner">
                      <Check size={14} style={{ color: 'var(--completed-text)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          Auto-filled: "{selectedCandidate.title}"
                        </span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '0.35rem', fontSize: '0.775rem' }}>
                          by {selectedCandidate.author} · {selectedCandidate.genre}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedCandidate(null)}
                        style={{ fontSize: '0.725rem', padding: '0.2rem 0.45rem', height: 'auto' }}
                      >
                        Search Again
                      </button>
                    </div>
                  )}

                  {catalogResults.length > 0 && !selectedCandidate && (
                    <div className="catalog-search-results-list">
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Click any title to auto-fill form:</span>
                        <span>{catalogResults.length} matches found</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                        {catalogResults.map((item, idx) => (
                          <div
                            key={idx}
                            className="catalog-result-row"
                            onClick={() => handleSelectCandidate(item)}
                          >
                            <div className="catalog-result-cover">
                              {item.cover_image_url ? (
                                <img
                                  src={item.cover_image_url}
                                  alt={item.title}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <BookOpen size={16} color="#8b5a2b" />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                  {item.title}
                                </span>
                                <span className="status-pill wishlist" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                  {item.genre}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                                by {item.author} {item.publish_year ? `(${item.publish_year})` : ''} {item.total_pages ? `· ${item.total_pages} pages` : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', height: 'auto', flexShrink: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCandidate(item);
                              }}
                            >
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ISBN BARCODE SEARCH */}
              {searchMode === 'isbn' && (
                <div className="book-import-content">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Instant ISBN Barcode Auto-Import
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      e.g. 9780132350884
                    </span>
                  </div>

                  <div className="isbn-import-input-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter 10 or 13-digit ISBN..."
                      value={isbnInput}
                      onChange={(e) => setIsbnInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFetchISBN();
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm isbn-fetch-btn"
                      onClick={handleFetchISBN}
                      disabled={fetchingIsbn || !isbnInput.trim()}
                    >
                      {fetchingIsbn ? 'Fetching...' : 'Fetch Details'}
                    </button>
                  </div>

                  {isbnSuccess && (
                    <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--completed-text)', fontSize: '0.8rem' }}>
                      <Check size={14} />
                      <span>Book metadata, cover, and canonical genre successfully loaded!</span>
                    </div>
                  )}

                  {isbnError && (
                    <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontSize: '0.8rem' }}>
                      <AlertCircle size={14} />
                      <span>{isbnError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
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
                marginBottom: '1.25rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Title & Author */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Book Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Title of the book"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Author *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Author name"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
            </div>

            {/* Genre & Status */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Genre *</label>
                <div className="genre-input-wrap">
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Technology"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  />
                  <select
                    className="form-select genre-select"
                    onChange={(e) => {
                      if (e.target.value) setGenre(e.target.value);
                    }}
                    value=""
                  >
                    <option value="" disabled>Suggestions...</option>
                    {COMMON_GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reading Status</label>
                <select 
                  className="form-select"
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="reading">Currently Reading</option>
                  <option value="completed">Completed</option>
                  <option value="wishlist">Wishlist</option>
                </select>
              </div>
            </div>

            {/* Pages: Total & Current */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Total Pages</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 431"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Page</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 50"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                />
              </div>
            </div>

            {/* Star Rating (1 to 5) */}
            <div className="form-group">
              <label className="form-label">Rating (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? 0 : star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem'
                    }}
                  >
                    <Star
                      size={20}
                      fill={star <= rating ? '#F59E0B' : 'transparent'}
                      color={star <= rating ? '#F59E0B' : 'var(--border-strong)'}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                    {rating} out of 5 stars
                  </span>
                )}
              </div>
            </div>

            {/* Personal Notes */}
            <div className="form-group">
              <label className="form-label">Personal Reflection Notes</label>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="Key takeaways, thoughts, or reflections..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Cover Image URL */}
            <div className="form-group">
              <label className="form-label">Cover Image URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
              />
            </div>

            {/* Footer Buttons */}
            <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add to Sanctuary')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
