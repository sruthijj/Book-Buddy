import React, { useState } from 'react';
import { BookOpen, Star, TrendingUp, CheckCircle, Edit3, Trash2, Bookmark } from 'lucide-react';

// Apple Modern curated book cover gradients
const BOOK_COVER_PALETTES = [
  { bg: 'linear-gradient(145deg, #007AFF 0%, #004085 100%)', accent: '#D0E2FF' }, // Pacific Blue
  { bg: 'linear-gradient(145deg, #1D1D1F 0%, #3A3A3C 100%)', accent: '#E5E5EA' }, // Space Gray
  { bg: 'linear-gradient(145deg, #28A745 0%, #155724 100%)', accent: '#D4EDDA' }, // Forest Green
  { bg: 'linear-gradient(145deg, #FF2D55 0%, #A30029 100%)', accent: '#FCE4EC' }, // Crimson Rose
  { bg: 'linear-gradient(145deg, #AF52DE 0%, #5856D6 100%)', accent: '#F3E5F5' }, // Royal Purple
];

export default function BookCard({ book, onUpdateProgress, onEdit, onDelete, onStartReading }) {
  const [imageError, setImageError] = useState(false);
  const isReading = book.status === 'reading';
  const isCompleted = book.status === 'completed';
  const isWishlist = book.status === 'wishlist';

  // Compute progress percentage safely
  const progressPct = book.total_pages > 0 
    ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) 
    : 0;

  // Deterministic palette for artistic spine
  const paletteIndex = Math.abs((book.id || book.title.length || 0)) % BOOK_COVER_PALETTES.length;
  const palette = BOOK_COVER_PALETTES[paletteIndex];

  return (
    <div 
      className="card book-card" 
      style={{
        padding: '1.35rem',
        display: 'flex',
        gap: '1.35rem',
        position: 'relative',
        transition: 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* 3D Physical Paperback Book Cover */}
      <div className="book-cover-frame">
        {book.cover_image_url && !imageError ? (
          <img 
            src={book.cover_image_url} 
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        ) : (
          /* Artistic Typographic Cover */
          <div 
            className="book-cover-artistic"
            style={{ background: palette.bg }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.9 }}>
              <BookOpen size={17} color={palette.accent} />
            </div>

            <div style={{ padding: '0 0.2rem' }}>
              <span 
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.25,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                }}
              >
                {book.title}
              </span>
            </div>

            <div style={{ borderTop: `1px solid ${palette.accent}44`, paddingTop: '0.35rem' }}>
              <span 
                style={{
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: palette.accent,
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {book.author}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Book Information & Progress Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Header Row: Status Pill & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`status-pill ${book.status}`}>
                {isReading && <span className="pulse-dot"></span>}
                {isCompleted && <CheckCircle size={12} />}
                {isWishlist && <Bookmark size={12} />}
                <span style={{ textTransform: 'capitalize' }}>
                  {isReading ? 'Reading' : (isCompleted ? 'Finished' : 'Wishlist')}
                </span>
              </span>

              <span 
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
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
                style={{ padding: '0.35rem', color: 'var(--text-secondary)' }}
              >
                <Edit3 size={15} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onDelete(book.id, book.title)}
                title="Remove Volume"
                style={{ padding: '0.35rem', color: '#FF3B30' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Title & Author */}
          <h3 
            style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              lineHeight: 1.3,
              marginBottom: '0.25rem',
              color: 'var(--text-primary)'
            }}
          >
            {book.title}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.7rem' }}>
            by <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{book.author}</span>
          </p>

          {/* Star Rating Display */}
          {book.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.7rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  fill={star <= book.rating ? '#FF9500' : 'transparent'}
                  color={star <= book.rating ? '#FF9500' : '#D1D1D6'}
                />
              ))}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '0.35rem' }}>
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
                backgroundColor: 'rgba(0, 122, 255, 0.04)',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--apple-blue)',
                marginBottom: '0.75rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5
              }}
            >
              "{book.notes}"
            </div>
          )}
        </div>

        {/* Footer / Reading Progress Bar & Action */}
        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          {isWishlist ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {book.total_pages > 0 ? `${book.total_pages} planned pages` : 'In your wishlist'}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {isCompleted ? 'Finished Volume' : 'Progress'}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  pg. {book.current_page} of {book.total_pages || '?'} ({progressPct}%)
                </span>
              </div>

              <div className="progress-track" style={{ marginBottom: '0.75rem' }}>
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
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
                  >
                    <TrendingUp size={13} style={{ color: 'var(--apple-blue)' }} />
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
