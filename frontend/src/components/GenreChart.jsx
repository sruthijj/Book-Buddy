import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { statsAPI } from '../api/client';

// Curated Editorial Literary Palette (No neon/purple gradients)
const GENRE_COLORS = [
  '#1C1917', // Deep Charcoal Ink
  '#B45309', // Warm Amber
  '#15803D', // Forest Sage
  '#475569', // Archival Slate
  '#0369A1', // Ocean Navy
  '#854D0E', // Dark Ochre
  '#7C2D12', // Terracotta
];

export default function GenreChart() {
  const [genresData, setGenresData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true);
      try {
        const res = await statsAPI.getGenres();
        setGenresData(res.data);
      } catch (err) {
        console.error('Failed to load genre statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.85rem',
            boxShadow: 'var(--shadow-card)',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
            {data.genre}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {data.count} volume{data.count > 1 ? 's' : ''} ({data.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <PieIcon size={16} style={{ color: 'var(--brand-accent)' }} />
        <h3 style={{ fontSize: '1.15rem' }}>Genre Balance & Distribution</h3>
      </div>

      {loading ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Loading genre distribution...
        </div>
      ) : genresData.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          {/* Donut Chart */}
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={genresData}
                  dataKey="count"
                  nameKey="genre"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {genresData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={GENRE_COLORS[index % GENRE_COLORS.length]} 
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Editorial Legend List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {genresData.map((item, index) => {
              const color = GENRE_COLORS[index % GENRE_COLORS.length];
              return (
                <div 
                  key={item.genre} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.825rem',
                    paddingBottom: '0.35rem',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span 
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        backgroundColor: color,
                        display: 'inline-block'
                      }}
                    />
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {item.genre}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.count} {item.count > 1 ? 'vols' : 'vol'}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '38px', textAlign: 'right' }}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No genre data available yet.
        </div>
      )}
    </div>
  );
}
