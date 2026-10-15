import React from 'react';
import { 
  X, 
  BookOpen, 
  Star, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Bookmark, 
  CheckCircle2, 
  Feather, 
  Calendar,
  Layers
} from 'lucide-react';

export default function BookDetailModal({ 
  book, 
  isOpen, 
  onClose, 
  onEdit, 
  onLogProgress, 
  onDelete, 
  onStartReading,
  onOpenAIStudio 
}) {
  if (!isOpen || !book) return null;

  const isReading = book.status === 'reading';
  const isCompleted = book.status === 'completed';
  const isWishlist = book.status === 'wishlist';

  const progressPct = book.total_pages > 0 
    ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) 
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="parchment-modal" 
        style={{ maxWidth: '720px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="parchment-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(180deg, #996229 0%, #754417 100%)',
                color: '#fff3dc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #57310e'
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="parchment-modal-title" style={{ fontSize: '1.25rem', lineHeight: 1.2 }}>
                {book.title}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#57310e', fontWeight: 600 }}>
                by {book.author}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={onClose}
            style={{ padding: '0.4rem', color: '#4d280d' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="parchment-modal-body" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.75rem' }}>
            {/* Left Column: 3D Book Volume */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                className="physical-book-3d" 
                style={{ 
                  width: '180px', 
                  height: '260px', 
                  boxShadow: '0 15px 30px rgba(50, 25, 8, 0.45), inset 3px 0 5px rgba(255,255,255,0.3)' 
                }}
              >
                {/* Ribbon */}
                <div className={`corner-ribbon-badge ${book.status}`}>
                  {isReading ? 'Reading' : (isCompleted ? 'Finished' : 'Wishlist')}
                </div>

                {/* Spine crease */}
                <div className="book-spine-crease"></div>

                {/* Cover image or fallback */}
                {book.cover_image_url ? (
                  <img 
                    src={book.cover_image_url} 
                    alt={book.title}
                    className="book-cover-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #4d260c 0%, #2b1304 100%)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      textAlign: 'center'
                    }}
                  >
                    <BookOpen size={24} color="#fce2b8" style={{ margin: '0 auto' }} />
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.85rem', color: '#fff' }}>{book.title}</p>
                    <p style={{ fontSize: '0.7rem', color: '#e5be85' }}>{book.author}</p>
                  </div>
                )}
              </div>

              {/* Volume Contact Shadow */}
              <div 
                className="book-shelf-contact-shadow" 
                style={{ width: '160px', marginTop: '-4px', marginBottom: '1rem' }}
              ></div>

              {/* Genre & Rating Meta */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.65rem',
                    background: '#edd5b1',
                    border: '1px solid #b38048',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#522f12',
                    marginBottom: '0.5rem'
                  }}
                >
                  {book.genre || 'General Literature'}
                </span>

                {book.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={14} 
                        fill={s <= book.rating ? '#e59b10' : 'none'} 
                        color="#b87b07" 
                      />
                    ))}
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#663b14', marginLeft: '0.25rem' }}>
                      {book.rating}.0 / 5
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Progress & Personal Reflection Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Reading Velocity / Progress Card */}
              <div 
                style={{
                  background: 'linear-gradient(180deg, #f7efe1 0%, #edd8ba 100%)',
                  border: '1px solid #c99c68',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem 1.25rem',
                  boxShadow: '0 2px 6px rgba(60, 30, 10, 0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3d1f08', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Reading Velocity
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0056b3' }}>
                    {progressPct}% Completed
                  </span>
                </div>

                {/* Progress bar */}
                <div 
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(80, 40, 10, 0.15)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    marginBottom: '0.65rem'
                  }}
                >
                  <div 
                    style={{
                      width: `${progressPct}%`,
                      height: '100%',
                      background: isCompleted ? 'linear-gradient(90deg, #1fa348 0%, #127a33 100%)' : 'linear-gradient(90deg, #0080ff 0%, #0056cc 100%)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 300ms ease'
                    }}
                  ></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b3e15', fontWeight: 600 }}>
                    Page {book.current_page} of {book.total_pages || '?'} total pages
                  </span>

                  {isReading && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => { onClose(); onLogProgress(book); }}
                    >
                      <TrendingUp size={13} />
                      <span>Log Reading Session</span>
                    </button>
                  )}
                  {isWishlist && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => { onClose(); onStartReading(book); }}
                    >
                      <BookOpen size={13} />
                      <span>Begin Reading</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Personal Reflection Notes (Prominent Parchment Section) */}
              <div 
                style={{
                  background: '#ffffff',
                  border: '2px solid #b58048',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.4rem',
                  boxShadow: 'inset 0 1px 3px rgba(60, 30, 10, 0.08), 0 2px 6px rgba(60, 30, 10, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Feather size={16} color="#824f21" />
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 800, color: '#331a06' }}>
                      Personal Reflection Notes
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => { onClose(); onEdit(book); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0056b3',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Edit3 size={12} />
                    <span>Edit Notes</span>
                  </button>
                </div>

                {book.notes ? (
                  <div 
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '0.975rem',
                      lineHeight: 1.6,
                      color: '#2b1404',
                      background: 'rgba(255, 250, 240, 0.8)',
                      padding: '1rem 1.25rem',
                      borderLeft: '3px solid #996229',
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    "{book.notes}"
                  </div>
                ) : (
                  <div 
                    style={{
                      padding: '1.5rem',
                      textAlign: 'center',
                      background: 'rgba(255, 250, 240, 0.5)',
                      borderRadius: '4px',
                      border: '1px dashed #c49a68'
                    }}
                  >
                    <p style={{ fontSize: '0.85rem', color: '#8c5e31', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                      No personal reflections recorded for this volume yet.
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => { onClose(); onEdit(book); }}
                    >
                      <Feather size={12} />
                      <span>Record Insights</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Full-Width Actions Footer (Flawlessly Aligned) */}
        <div className="parchment-modal-footer">
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {onOpenAIStudio && (
              <button
                type="button"
                className="btn btn-ai btn-sm"
                onClick={() => { onClose(); onOpenAIStudio(); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Sparkles size={14} />
                <span>AI Studio Insights</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => { onClose(); onEdit(book); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Edit3 size={14} />
              <span>Edit Details</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => { onClose(); onDelete(book.id, book.title); }}
            style={{ color: '#d32020', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Trash2 size={14} />
            <span>Remove Volume</span>
          </button>
        </div>
      </div>
    </div>
  );
}
