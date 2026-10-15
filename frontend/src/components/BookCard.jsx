import React from 'react';
import { BookOpen, Star, TrendingUp, CheckCircle, Clock, Edit3, Trash2, Bookmark } from 'lucide-react';

export default function BookCard({ book, onUpdateProgress, onEdit, onDelete, onStartReading }) {
  const isReading = book.status === 'reading';
  const isCompleted = book.status === 'completed';
  const isWishlist = book.status === 'wishlist';

  // Compute progress percentage safely
  const progressPct = book.total_pages > 0 
    ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) 
    : 0;

  return (
    <div 
      className="card book-card" 
      style={{
        padding: '1.25rem',
        display: 'flex',
        gap: '1.25rem',
        position: 'relative',
        transition: 'all 200ms ease'
      }}
    >
      {/* Book Cover (Paperback 2:3 Aspect Ratio) */}
      <div 
        style={{
          width: '105px',
          minWidth: '105px',
          height: '150px',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '2px 4px 10px rgba(28, 25, 23, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {book.cover_image_url ? (
          <img 
            src={book.cover_image_url} 
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Hide broken image link and show typographic spine fallback
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div 
            style={{
              padding: '0.75rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: '#F5F5F0'
            }}
          >
            <BookOpen size={20} style={{ color: 'var(--text-muted)', marginBottom: '0.4rem' }} />
            <span 
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {book.title}
            </span>
          </div>
        )}
      </div>

      {/* Book Information & Progress Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Header Row: Status & Genre */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`status-pill ${book.status}`}>
                {isReading && <TrendingUp size={11} />}
                {isCompleted && <CheckCircle size={11} />}
                {isWishlist && <Bookmark size={11} />}
                <span style={{ textTransform: 'capitalize' }}>
                  {isReading ? 'Reading' : (isCompleted ? 'Completed' : 'Wishlist')}
                </span>
              </span>

              <span 
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {book.genre}
              </span>
            </div>

            {/* Quick Action Buttons (Edit / Delete) */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onEdit(book)}
                title="Edit Book Details"
                style={{ padding: '0.3rem', color: 'var(--text-secondary)' }}
              >
                <Edit3 size={15} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onDelete(book.id, book.title)}
                title="Remove Book"
                style={{ padding: '0.3rem', color: '#DC2626' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Title & Author */}
          <h3 
            style={{ 
              fontSize: '1.2rem', 
              fontWeight: 600, 
              lineHeight: 1.3,
              marginBottom: '0.2rem',
              color: 'var(--text-primary)'
            }}
          >
            {book.title}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            by {book.author}
          </p>

          {/* Star Rating Display */}
          {book.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.65rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  fill={star <= book.rating ? '#F59E0B' : 'transparent'}
                  color={star <= book.rating ? '#F59E0B' : 'var(--border-strong)'}
                />
              ))}
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                {book.rating}.0
              </span>
            </div>
          )}

          {/* Personal Reflection Notes Snippet */}
          {book.notes && (
            <div 
              style={{
                fontSize: '0.8125rem',
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-subtle)',
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--border-strong)',
                marginBottom: '0.75rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              "{book.notes}"
            </div>
          )}
        </div>

        {/* Footer / Reading Progress Bar & Action */}
        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          {isWishlist ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {book.total_pages > 0 ? `${book.total_pages} pages` : 'Saved in wishlist'}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onStartReading(book)}
              >
                <span>Start Reading</span>
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {isCompleted ? 'Finished Book' : 'Reading Progress'}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  pg. {book.current_page} of {book.total_pages || '?'} ({progressPct}%)
                </span>
              </div>

              <div className="progress-track" style={{ marginBottom: '0.65rem' }}>
                <div 
                  className={`progress-fill ${isCompleted ? 'completed' : ''}`} 
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>

              {!isCompleted && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onUpdateProgress(book)}
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                  >
                    <TrendingUp size={13} />
                    <span>Log Daily Pages</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
