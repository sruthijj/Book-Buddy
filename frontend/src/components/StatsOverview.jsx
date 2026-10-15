import React from 'react';
import { BookOpen, TrendingUp, Star, Layers } from 'lucide-react';

export default function StatsOverview({ summary, loading }) {
  if (loading || !summary) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-plaque" style={{ height: '110px' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {/* Plaque 1: Library Collection */}
      <div className="metric-plaque">
        <div>
          <div className="metric-label">Library Collection</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="metric-number">{summary.total_books}</span>
            <span style={{ fontSize: '0.85rem', color: '#663914', fontWeight: 700 }}>volumes</span>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.4rem' }}>
            <span style={{ fontSize: '0.725rem', color: '#0056b3', fontWeight: 700 }}>● {summary.reading_count} in hand</span>
            <span style={{ fontSize: '0.725rem', color: '#166e33', fontWeight: 700 }}>● {summary.completed_count} finished</span>
          </div>
        </div>
        <div style={{ color: '#8f5621', opacity: 0.85 }}>
          <Layers size={28} />
        </div>
      </div>

      {/* Plaque 2: Completion Pace */}
      <div className="metric-plaque">
        <div>
          <div className="metric-label">Completion Pace</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="metric-number">{summary.overall_completion_rate}%</span>
            <span style={{ fontSize: '0.85rem', color: '#663914', fontWeight: 700 }}>read</span>
          </div>
          <div style={{ marginTop: '0.45rem', width: '130px' }}>
            <div className="plaque-progress-track">
              <div 
                className="plaque-progress-fill" 
                style={{ width: `${Math.min(100, summary.overall_completion_rate)}%` }} 
              />
            </div>
          </div>
        </div>
        <div style={{ color: '#8f5621', opacity: 0.85 }}>
          <TrendingUp size={28} />
        </div>
      </div>

      {/* Plaque 3: Pages Consumed */}
      <div className="metric-plaque">
        <div>
          <div className="metric-label">Pages Consumed</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="metric-number">{summary.total_pages_read.toLocaleString()}</span>
            <span style={{ fontSize: '0.85rem', color: '#663914', fontWeight: 700 }}>pages</span>
          </div>
          <div style={{ fontSize: '0.725rem', color: '#734824', fontWeight: 600, marginTop: '0.4rem' }}>
            Across all reading logs
          </div>
        </div>
        <div style={{ color: '#8f5621', opacity: 0.85 }}>
          <BookOpen size={28} />
        </div>
      </div>

      {/* Plaque 4: Reader Satisfaction */}
      <div className="metric-plaque">
        <div>
          <div className="metric-label">Reader Satisfaction</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="metric-number">{summary.average_rating ? `${summary.average_rating}` : '—'}</span>
            <span style={{ fontSize: '1.25rem', color: '#d97706' }}>★</span>
            <span style={{ fontSize: '0.85rem', color: '#663914', fontWeight: 700 }}>avg</span>
          </div>
          <div style={{ fontSize: '0.725rem', color: '#734824', fontWeight: 600, marginTop: '0.4rem' }}>
            From finished volume reviews
          </div>
        </div>
        <div style={{ color: '#d97706', opacity: 0.9 }}>
          <Star size={28} fill="#d97706" />
        </div>
      </div>
    </div>
  );
}
