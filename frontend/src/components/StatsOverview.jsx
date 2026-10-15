import React from 'react';
import { BookOpen, TrendingUp, Star, Layers } from 'lucide-react';

export default function StatsOverview({ summary, loading }) {
  if (loading || !summary) {
    return (
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.25rem'
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ padding: '1.5rem', height: '120px', backgroundColor: 'var(--bg-card)' }} />
        ))}
      </div>
    );
  }

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}
    >
      {/* KPI Card 1: Total Volumes (Neon Indigo) */}
      <div className="kpi-card indigo">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
              Library Collection
            </span>
            <div className="icon-bubble indigo">
              <Layers size={19} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {summary.total_books}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>volumes</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span className="status-pill reading" style={{ padding: '0.15rem 0.6rem', fontSize: '0.7rem' }}>
            <span className="pulse-dot"></span>
            <span>{summary.reading_count} in progress</span>
          </span>
          <span className="status-pill completed" style={{ padding: '0.15rem 0.6rem', fontSize: '0.7rem' }}>
            <span>{summary.completed_count} read</span>
          </span>
        </div>
      </div>

      {/* KPI Card 2: Overall Completion Rate (Neon Amber) */}
      <div className="kpi-card amber">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
              Completion Pace
            </span>
            <div className="icon-bubble amber">
              <TrendingUp size={19} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {summary.overall_completion_rate}%
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>of planned pages</span>
          </div>
        </div>
        <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="progress-track" style={{ height: '7px' }}>
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(100, summary.overall_completion_rate)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* KPI Card 3: Total Pages Read (Neon Emerald) */}
      <div className="kpi-card emerald">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
              Pages Consumed
            </span>
            <div className="icon-bubble emerald">
              <BookOpen size={19} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {summary.total_pages_read.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>pages logged</span>
          </div>
        </div>
        <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Across all active & completed logs
        </div>
      </div>

      {/* KPI Card 4: Average Rating (Cyber Cyan / Amber) */}
      <div className="kpi-card sapphire">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
              Reader Satisfaction
            </span>
            <div className="icon-bubble sapphire">
              <Star size={19} fill="#F59E0B" color="#F59E0B" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {summary.average_rating ? `${summary.average_rating}` : '—'}
            </span>
            <span style={{ fontSize: '1.25rem', color: '#F59E0B' }}>★</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>editorial avg</span>
          </div>
        </div>
        <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          From finished volume reviews
        </div>
      </div>
    </div>
  );
}
