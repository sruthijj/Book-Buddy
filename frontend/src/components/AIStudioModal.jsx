import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Award, 
  Calendar, 
  Plus, 
  Check, 
  Copy, 
  AlertCircle,
  TrendingUp,
  Clock,
  Globe,
  Library
} from 'lucide-react';
import { aiAPI, booksAPI } from '../api/client';

export default function AIStudioModal({ isOpen, onClose, books = [], onBookAdded }) {
  const [activeTab, setActiveTab] = useState('recommend'); // 'recommend', 'summarize', 'review', 'predict'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tab 1: Recommendations State
  const [recommendations, setRecommendations] = useState([]);
  const [recSource, setRecSource] = useState('');
  const [addedBooks, setAddedBooks] = useState({});
  const [imgErrors, setImgErrors] = useState({});

  // Tab 2: Summarizer State
  const [selectedBookForSummary, setSelectedBookForSummary] = useState('');
  const [notesToSummarize, setNotesToSummarize] = useState('');
  const [summaryResult, setSummaryResult] = useState(null);

  // Tab 3: Review State
  const [selectedBookForReview, setSelectedBookForReview] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewResult, setReviewResult] = useState(null);
  const [copiedReview, setCopiedReview] = useState(false);

  // Tab 4: Predictor State
  const [selectedBookForPredict, setSelectedBookForPredict] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);

  // Filter books currently in reading status for prediction
  const activeReadingBooks = books.filter((b) => b.status === 'reading');
  const booksWithNotes = books.filter((b) => b.notes && b.notes.trim().length > 0);

  // Reset errors on tab change
  useEffect(() => {
    setError(null);
  }, [activeTab]);

  // Auto-select first book when tab opens
  useEffect(() => {
    if (activeReadingBooks.length > 0 && !selectedBookForPredict) {
      setSelectedBookForPredict(String(activeReadingBooks[0].id));
    }
    if (books.length > 0 && !selectedBookForReview) {
      setSelectedBookForReview(String(books[0].id));
      setReviewRating(books[0].rating || 5);
      setReviewNotes(books[0].notes || '');
    }
  }, [books]);

  // Auto-fetch recommendations when modal opens if empty
  useEffect(() => {
    if (isOpen && activeTab === 'recommend' && recommendations.length === 0 && !loading) {
      handleGetRecommendations();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiAPI.recommend({});
      if (res.data && res.data.recommendations) {
        setRecommendations(res.data.recommendations);
        setRecSource(res.data.source || 'cloud-ai-engine');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to generate recommendations. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecommendedToLibrary = async (rec) => {
    try {
      await booksAPI.create({
        title: rec.title,
        author: rec.author,
        genre: rec.genre,
        status: 'wishlist',
        cover_image_url: rec.cover_image_url || undefined,
        notes: `Recommendation: ${rec.reason}`,
      });
      setAddedBooks((prev) => ({ ...prev, [rec.title]: true }));
      if (onBookAdded) onBookAdded();
    } catch (err) {
      alert('Could not add book to library.');
    }
  };

  const handleSummarizeNotes = async (e) => {
    e.preventDefault();
    if (!notesToSummarize.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const currentBook = books.find((b) => String(b.id) === selectedBookForSummary);
      const res = await aiAPI.summarize({
        notes: notesToSummarize,
        book_title: currentBook ? currentBook.title : null,
        author: currentBook ? currentBook.author : null,
      });
      setSummaryResult(res.data);
    } catch (err) {
      setError('Failed to summarize notes.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReview = async (e) => {
    e.preventDefault();
    const currentBook = books.find((b) => String(b.id) === selectedBookForReview);
    if (!currentBook) return;

    setLoading(true);
    setError(null);
    try {
      const res = await aiAPI.review({
        book_title: currentBook.title,
        author: currentBook.author,
        rating: reviewRating,
        notes: reviewNotes || currentBook.notes,
      });
      setReviewResult(res.data);
    } catch (err) {
      setError('Failed to generate review.');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictCompletion = async () => {
    if (!selectedBookForPredict) return;
    setLoading(true);
    setError(null);
    try {
      const res = await aiAPI.predictCompletion(selectedBookForPredict);
      setPredictionResult(res.data);
    } catch (err) {
      setError('Failed to calculate reading prediction.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReview = () => {
    if (reviewResult) {
      navigator.clipboard.writeText(`${reviewResult.headline}\n\n${reviewResult.review}`);
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '680px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--brand-accent)' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.1rem' }}>AI Reading Companion</h3>
              <p style={{ fontSize: '0.8rem' }}>Powered by Advanced AI & Reading Pattern Intelligence</p>
            </div>
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

        {/* Tab Navigation */}
        <div className="ai-studio-tabs-bar">
          {[
            { id: 'recommend', label: 'Recommendations', icon: BookOpen },
            { id: 'summarize', label: 'Notes Summarizer', icon: FileText },
            { id: 'review', label: 'Review Generator', icon: Award },
            { id: 'predict', label: 'Finish Predictor', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`ai-tab-button ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="modal-body">
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
                marginBottom: '1rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: RECOMMENDATIONS */}
          {activeTab === 'recommend' && (
            <div>
              <div className="ai-studio-tab-header">
                <div>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Personalized Literary Suggestions</h4>
                  <p style={{ fontSize: '0.825rem' }}>
                    Intelligent recommendations tailored to your genres, reading velocity, and taste.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm ai-header-action-btn"
                  onClick={handleGetRecommendations}
                  disabled={loading}
                >
                  <Sparkles size={14} />
                  <span>{loading ? 'Finding Suggestions...' : 'Refresh Suggestions'}</span>
                </button>
              </div>

              {recommendations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {recSource && (() => {
                    const sourceInfo = (() => {
                      switch (recSource) {
                        case 'gemini-ai':
                          return {
                            label: 'Google Gemini AI',
                            desc: 'Custom suggestions crafted by Google Gemini based on your reading history.',
                            icon: Sparkles,
                            className: 'ai-source-gemini',
                          };
                        case 'open-library':
                          return {
                            label: 'Open Library Trending',
                            desc: 'Acclaimed, popular titles fetched live from Open Library matching your top genres.',
                            icon: Globe,
                            className: 'ai-source-openlibrary',
                          };
                        case 'curated-catalog':
                          return {
                            label: 'Curated Library Classics',
                            desc: 'Hand-picked literary masterpieces matching your reading profile (Offline mode).',
                            icon: Library,
                            className: 'ai-source-curated',
                          };
                        default:
                          return {
                            label: recSource,
                            desc: 'Recommendations tailored to your library taste.',
                            icon: BookOpen,
                            className: 'ai-source-default',
                          };
                      }
                    })();
                    const SourceIcon = sourceInfo.icon;
                    return (
                      <div className={`ai-source-banner ${sourceInfo.className}`}>
                        <div className="ai-source-badge-pill">
                          <SourceIcon size={13} />
                          <span>Source: {sourceInfo.label}</span>
                        </div>
                        <span className="ai-source-banner-desc">{sourceInfo.desc}</span>
                      </div>
                    );
                  })()}

                  {recommendations.map((rec, i) => (
                    <div 
                      key={i} 
                      className="card ai-rec-card"
                    >
                      {/* Book Cover Thumbnail with Graceful Fallback */}
                      <div className="ai-rec-cover-wrapper">
                        {rec.cover_image_url && !imgErrors[rec.title] ? (
                          <img 
                            src={rec.cover_image_url} 
                            alt={rec.title}
                            className="ai-rec-cover-img"
                            onError={() => setImgErrors((prev) => ({ ...prev, [rec.title]: true }))}
                          />
                        ) : (
                          <div className="ai-rec-cover-fallback">
                            <BookOpen size={18} color="#fce2b8" />
                            <span className="ai-rec-cover-fallback-title">{rec.title}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span className="status-pill wishlist" style={{ fontSize: '0.7rem' }}>
                            {rec.genre}
                          </span>
                        </div>
                        <h5 style={{ fontSize: '1.025rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                          {rec.title}
                        </h5>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                          by {rec.author}
                        </p>
                        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                          "{rec.reason}"
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm ai-rec-action-btn"
                        onClick={() => handleAddRecommendedToLibrary(rec)}
                        disabled={addedBooks[rec.title]}
                        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        {addedBooks[rec.title] ? (
                          <>
                            <Check size={13} style={{ color: 'var(--completed-text)' }} />
                            <span>In Wishlist</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} />
                            <span>Add to Wishlist</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <BookOpen size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9rem' }}>Click "Refresh Suggestions" to generate personalized recommendations.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NOTES SUMMARIZER */}
          {activeTab === 'summarize' && (
            <div>
              <form onSubmit={handleSummarizeNotes}>
                <div className="form-group">
                  <label className="form-label">Select Book with Notes (or enter manually)</label>
                  <select
                    className="form-select"
                    value={selectedBookForSummary}
                    onChange={(e) => {
                      const bookId = e.target.value;
                      setSelectedBookForSummary(bookId);
                      const b = books.find((x) => String(x.id) === bookId);
                      if (b && b.notes) setNotesToSummarize(b.notes);
                    }}
                  >
                    <option value="">Select from library...</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} {b.notes ? '· (has notes)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reading Notes to Summarize</label>
                  <textarea
                    rows={4}
                    required
                    className="form-textarea"
                    placeholder="Paste or type notes from your reading sessions..."
                    value={notesToSummarize}
                    onChange={(e) => setNotesToSummarize(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={loading || !notesToSummarize.trim()}
                >
                  <Sparkles size={14} />
                  <span>{loading ? 'Synthesizing Key Takeaways...' : 'Summarize Notes'}</span>
                </button>
              </form>

              {summaryResult && (
                <div className="card" style={{ marginTop: '1.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                    <FileText size={16} style={{ color: 'var(--brand-accent)' }} />
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Executive Reading Summary</h5>
                  </div>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
                    {summaryResult.summary}
                  </p>

                  <h6 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                    Key Takeaways & Core Lessons:
                  </h6>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {summaryResult.key_takeaways?.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEW GENERATOR */}
          {activeTab === 'review' && (
            <div>
              <form onSubmit={handleGenerateReview}>
                <div className="form-group">
                  <label className="form-label">Select Volume to Review</label>
                  <select
                    className="form-select"
                    value={selectedBookForReview}
                    onChange={(e) => {
                      const bookId = e.target.value;
                      setSelectedBookForReview(bookId);
                      const b = books.find((x) => String(x.id) === bookId);
                      if (b) {
                        setReviewRating(b.rating || 5);
                        setReviewNotes(b.notes || '');
                      }
                    }}
                  >
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} by {b.author}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ai-review-grid">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Rating</label>
                    <select
                      className="form-select"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value, 10))}
                    >
                      <option value={5}>5 ★ (Masterpiece)</option>
                      <option value={4}>4 ★ (Compelling)</option>
                      <option value={3}>3 ★ (Average)</option>
                      <option value={2}>2 ★ (Disappointing)</option>
                      <option value={1}>1 ★ (Poor)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Reflection Notes (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Loved the chapters on habit stacking..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={loading || !selectedBookForReview}
                >
                  <Award size={14} />
                  <span>{loading ? 'Drafting Literary Review...' : 'Generate Editorial Review'}</span>
                </button>
              </form>

              {reviewResult && (
                <div className="card" style={{ marginTop: '1.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <h5 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      {reviewResult.headline}
                    </h5>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleCopyReview}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      {copiedReview ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedReview ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                    {reviewResult.review}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLETION DATE PREDICTOR */}
          {activeTab === 'predict' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Predict Completion Date</h4>
                <p style={{ fontSize: '0.825rem' }}>
                  Analyzes your daily reading velocity from reading logs to estimate when you will turn the final page.
                </p>
              </div>

              {activeReadingBooks.length > 0 ? (
                <div>
                  <div className="form-group">
                    <label className="form-label">Select Active Volume</label>
                    <div className="ai-predict-select-row">
                      <select
                        className="form-select"
                        value={selectedBookForPredict}
                        onChange={(e) => setSelectedBookForPredict(e.target.value)}
                      >
                        {activeReadingBooks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} · pg. {b.current_page} of {b.total_pages}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm ai-predict-btn"
                        onClick={handlePredictCompletion}
                        disabled={loading || !selectedBookForPredict}
                      >
                        {loading ? 'Calculating...' : 'Predict Finish'}
                      </button>
                    </div>
                  </div>

                  {predictionResult && (
                    <div 
                      className="card" 
                      style={{ 
                        marginTop: '1.25rem', 
                        padding: '1.25rem', 
                        backgroundColor: 'var(--bg-subtle)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                        <Clock size={16} style={{ color: 'var(--reading-text)' }} />
                        <h5 style={{ fontSize: '1rem', fontWeight: 600 }}>Estimated Finish Telemetry</h5>
                      </div>

                      <div className="ai-predict-stats-grid">
                        <div style={{ padding: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reading Velocity</span>
                          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {predictionResult.average_daily_pace} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>pages/day</span>
                          </div>
                        </div>

                        <div style={{ padding: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Days Remaining</span>
                          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {predictionResult.days_remaining} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>days</span>
                          </div>
                        </div>
                      </div>

                      <div 
                        style={{
                          backgroundColor: '#FEF3C7',
                          border: '1px solid #FDE68A',
                          color: '#B45309',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}
                      >
                        {predictionResult.status_message}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <TrendingUp size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9rem' }}>You currently have no books in "Currently Reading" status.</p>
                  <p style={{ fontSize: '0.8rem' }}>Move a book to "Reading" to unlock completion date prediction!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
