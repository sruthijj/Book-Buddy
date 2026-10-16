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
import { useAuth } from '../context/AuthContext';

// Radiant jewel tone palette designed for dark mahogany wood surfaces
const GENRE_COLORS = [
  '#FFD700', // Imperial Gold
  '#38BDF8', // Sky Cyan
  '#34D399', // Emerald Mint
  '#FB7185', // Rose Coral
  '#C084FC', // Amethyst Violet
  '#FB923C', // Warm Amber Orange
  '#A3E635', // Lime Peridot
];

export default function GenreChart() {
  const { isAuthenticated } = useAuth();
  const [genresData, setGenresData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setGenresData([]);
      setLoading(false);
      return;
    }

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
  }, [isAuthenticated]);

  // Custom Brass Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          style={{
            background: 'linear-gradient(180deg, #381e10 0%, #1f0e05 100%)',
            border: '1px solid var(--brass-mid)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.95rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 230, 160, 0.3)',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ fontWeight: 700, color: '#fff3d1', marginBottom: '0.15rem', fontFamily: 'var(--font-heading)' }}>
            {data.genre}
          </div>
          <div style={{ color: '#ffd700', fontWeight: 600 }}>
            {data.count} volume{data.count > 1 ? 's' : ''} ({data.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="card" 
      style={{ 
        padding: '1.75rem', 
        marginBottom: '2rem',
        background: 'linear-gradient(180deg, #2b170c 0%, #1a0b04 100%)',
        border: '1px solid #542f18',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 220, 140, 0.2)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1.5rem' }}>
        <PieIcon size={20} style={{ color: '#ffd700' }} />
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#fff3d1', letterSpacing: '0.03em' }}>
          Genre Balance & Distribution
        </h3>
      </div>

      {loading ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brass-mid)', fontSize: '0.9rem' }}>
          Loading genre distribution...
        </div>
      ) : genresData.length > 0 ? (
        <div className="genre-chart-grid">
          {/* Donut Chart */}
          <div style={{ width: '100%', height: 250, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={genresData}
                  dataKey="count"
                  nameKey="genre"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={4}
                  stroke="#1c0e05"
                  strokeWidth={3}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {genresData.map((item, index) => {
              const color = GENRE_COLORS[index % GENRE_COLORS.length];
              return (
                <div 
                  key={item.genre} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    paddingBottom: '0.45rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span 
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        backgroundColor: color,
                        display: 'inline-block',
                        boxShadow: `0 0 6px ${color}88`
                      }}
                    />
                    <span style={{ fontWeight: 600, color: '#f5eedf' }}>
                      {item.genre}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'baseline' }}>
                    <span style={{ color: 'var(--brass-mid)', fontSize: '0.8rem' }}>
                      {item.count} {item.count > 1 ? 'vols' : 'vol'}
                    </span>
                    <span style={{ fontWeight: 700, color: '#ffd700', minWidth: '40px', textAlign: 'right' }}>
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
