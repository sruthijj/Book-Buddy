import React, { useState } from 'react';
import { BookOpen, Star, TrendingUp, Edit3, Trash2, Feather, ExternalLink } from 'lucide-react';

export default function BookCard({ 
  book, 
  onSelect,
  onUpdateProgress, 
  onEdit, 
  onDelete, 
  onStartReading 
}) {
  const [imageError, setImageError] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);

  const isReading = book.status === 'reading';
  const isCompleted = book.status === 'completed';
  const isWishlist = book.status === 'wishlist';

  // Calculate percentage safely
  const progressPct = book.total_pages > 0 
    ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) 
    : 0;

  return (
    <div 
      className="shelf-book-item"
      onClick={() => onSelect && onSelect(book)}
      title={`Click to open "${book.title}" & read reflection notes`}
    >
      {/* 3D Physical Book Standing on the Oak Shelf */}
      <div className="physical-book-3d">
        {/* Diagonal Corner Ribbon (Exact Apple iBooks Style) */}
        <div className={`corner-ribbon-badge ${book.status}`}>
          {isReading ? 'Reading' : (isCompleted ? 'Finished' : 'Wishlist')}
        </div>

        {/* 3D Spine Crease Overlay */}
        <div className="book-spine-crease"></div>

        {/* Book Cover Image */}
        {book.cover_image_url && !imageError ? (
          <img 
            src={book.cover_image_url} 
            alt={book.title}
            className="book-cover-img"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Vintage Hardcover Fallback */
          <div 
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #4d260c 0%, #2b1304 100%)',
              padding: '1.25rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
              border: '2px solid #6e3914'
            }}
          >
            <div style={{ margin: '0 auto', opacity: 0.9 }}>
              <BookOpen size={24} color="#fce2b8" />
            </div>
            <p 
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#fff5e6',
                lineHeight: 1.25
              }}
            >
              {book.title}
            </p>
            <p 
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#e5be85'
              }}
            >
              {book.author}
            </p>
          </div>
        )}

        {/* Subtle Bottom Reading Progress Stripe directly on Book */}
        {isReading && (
          <div className="book-progress-strip">
            <div className="book-progress-strip-fill" style={{ width: `${progressPct}%` }}></div>
          </div>
        )}

        {/* Rich Hover Overlay / Inspection Panel */}
        <div className="book-hover-actions">
          {/* Header: Genre & Star Rating */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="book-hover-genre">{book.genre || 'General'}</span>
            {book.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                <Star size={12} fill="#ffd700" color="#ffd700" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffd700' }}>{book.rating}.0</span>
              </div>
            )}
          </div>

          {/* Title & Author */}
          <div>
            <h4 className="book-hover-title" title={book.title}>{book.title}</h4>
            <p className="book-hover-author">by {book.author}</p>
          </div>

          {/* Progress / Status */}
          {isReading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#ffd700', marginBottom: '0.2rem', fontWeight: 700 }}>
                <span>Reading</span>
                <span>pg. {book.current_page} of {book.total_pages} ({progressPct}%)</span>
              </div>
              <div className="book-hover-progress-track">
                <div className="book-hover-progress-fill" style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>
          )}

          {isCompleted && (
            <div style={{ fontSize: '0.72rem', color: '#68d391', fontWeight: 700 }}>
              ✓ Completed ({book.total_pages} pages)
            </div>
          )}

          {isWishlist && (
            <div style={{ fontSize: '0.72rem', color: '#fc8181', fontWeight: 700 }}>
              🔖 In Wishlist ({book.total_pages || '?'} pages)
            </div>
          )}

          {/* Reflection Notes Snippet */}
          {book.notes && (
            <div className="book-hover-notes">
              <div style={!showFullNotes ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}}>
                "{book.notes}"
              </div>
              {book.notes.length > 50 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowFullNotes(!showFullNotes); }}
                  style={{ background: 'none', border: 'none', color: '#ffd700', fontSize: '0.65rem', fontWeight: 700, padding: 0, marginTop: '0.15rem', cursor: 'pointer' }}
                >
                  {showFullNotes ? 'Less ↑' : 'More →'}
                </button>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="book-hover-buttons" onClick={(e) => e.stopPropagation()}>
            {isReading && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={(e) => { e.stopPropagation(); onUpdateProgress(book); }}
                style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}
              >
                <TrendingUp size={12} />
                <span>Log Pages</span>
              </button>
            )}
            {isWishlist && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={(e) => { e.stopPropagation(); onStartReading(book); }}
                style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}
              >
                <span>Start Reading</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => { e.stopPropagation(); onEdit(book); }}
              title="Edit Book Details"
              style={{ padding: '0.3rem 0.45rem' }}
            >
              <Edit3 size={12} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => { e.stopPropagation(); onDelete(book.id, book.title); }}
              title="Remove Volume"
              style={{ padding: '0.3rem 0.45rem', color: '#ff4d4d' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Realistic Oval Contact Shadow Cast Directly on the Oak Shelf Ledge */}
      <div className="book-shelf-contact-shadow"></div>
    </div>
  );
}
