import React, { useState, useEffect } from 'react';
import { X, TrendingUp, CheckCircle, Star, AlertCircle } from 'lucide-react';
import { booksAPI } from '../api/client';

export default function ProgressModal({ isOpen, onClose, onSuccess, book }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (book) {
      setCurrentPage(book.current_page || 0);
      setRating(book.rating || 0);
      setNotes(book.notes || '');
      setError(null);
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const totalPages = book.total_pages || 0;
  const isNowCompleted = totalPages > 0 && currentPage >= totalPages;
  const pagesReadSession = Math.max(0, currentPage - (book.current_page || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (totalPages > 0 && currentPage > totalPages) {
      setError(`Current page cannot exceed total pages (${totalPages}).`);
      return;
    }

    setSubmitting(true);
    try {
      await booksAPI.updateProgress(book.id, {
        current_page: parseInt(currentPage, 10),
        rating: rating > 0 ? rating : null,
        notes: notes.trim() || null,
        status: isNowCompleted ? 'completed' : 'reading'
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update reading progress.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '480px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--brand-accent)' }} />
            <h3 style={{ fontSize: '1.2rem' }}>Log Reading Progress</h3>
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

        <div className="modal-body">
          {/* Book Summary Card */}
          <div 
            style={{
              padding: '0.85rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem'
            }}
          >
            <h4 style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>{book.title}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              by {book.author} · {totalPages ? `${totalPages} pages total` : 'Page count unspecified'}
            </p>
          </div>

          {error && (
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
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Interactive Progress Slider & Input */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label">Current Page</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="number"
                    min="0"
                    max={totalPages || 9999}
                    className="form-input"
                    style={{ width: '90px', padding: '0.35rem 0.5rem', textAlign: 'center', fontWeight: 600 }}
                    value={currentPage}
                    onChange={(e) => setCurrentPage(parseInt(e.target.value, 10) || 0)}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    / {totalPages || '?'}
                  </span>
                </div>
              </div>

              {totalPages > 0 && (
                <input
                  type="range"
                  min="0"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    accentColor: isNowCompleted ? 'var(--completed-text)' : 'var(--reading-text)',
                    cursor: 'pointer'
                  }}
                />
              )}

              {pagesReadSession > 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--reading-text)', fontWeight: 500, marginTop: '0.35rem' }}>
                  + {pagesReadSession} pages logged in this session
                </p>
              )}
            </div>

            {/* Completion Banner & Rating */}
            {isNowCompleted && (
              <div 
                style={{
                  backgroundColor: 'var(--completed-bg)',
                  border: '1px solid var(--completed-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  animation: 'fadeIn 200ms ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--completed-text)', marginBottom: '0.5rem' }}>
                  <CheckCircle size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Congratulations! You finished this book! 🎉
                  </span>
                </div>

                <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                  Rate your reading experience:
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? 0 : star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <Star
                        size={22}
                        fill={star <= rating ? '#F59E0B' : 'transparent'}
                        color={star <= rating ? '#F59E0B' : 'var(--border-strong)'}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="Final reflections or summary notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ backgroundColor: '#FFFFFF' }}
                />
              </div>
            )}

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
                {submitting ? 'Saving...' : 'Update Reading Log'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
