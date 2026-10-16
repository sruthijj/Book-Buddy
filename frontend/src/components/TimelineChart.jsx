import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { statsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TimelineChart() {
  const { isAuthenticated } = useAuth();
  const [days, setDays] = useState(30);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setTimelineData([]);
      setLoading(false);
      return;
    }

    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const res = await statsAPI.getTimeline(days);
        // Format dates into readable labels (e.g., 'Oct 12')
        const formatted = res.data.map((item) => {
          const dateObj = new Date(item.date);
          const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return {
            ...item,
            label: shortDate,
          };
        });
        setTimelineData(formatted);
      } catch (err) {
        console.error('Failed to load reading timeline:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [days, isAuthenticated]);

  // High-Contrast Brass / Parchment Tooltip
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
          <div style={{ fontWeight: 700, color: '#fff3d1', marginBottom: '0.2rem', fontFamily: 'var(--font-heading)' }}>
            {data.date} ({data.label})
          </div>
          <div style={{ color: '#ffd700', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>📖</span>
            <span>{data.pages_read} pages read</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalPagesInWindow = timelineData.reduce((acc, curr) => acc + curr.pages_read, 0);

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
      {/* Header & Controls */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.3rem' }}>
            <TrendingUp size={20} style={{ color: '#ffd700' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#fff3d1', letterSpacing: '0.03em' }}>
              Reading Momentum Over Time
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--brass-mid)' }}>
            <strong style={{ color: '#ffd700' }}>{totalPagesInWindow} pages</strong> logged across the past {days} days
          </p>
        </div>

        {/* Time Window Switcher (Leather Tabs) */}
        <div style={{ display: 'flex', gap: '0.45rem' }}>
          {[
            { val: 14, label: 'Past 14 Days' },
            { val: 30, label: 'Past 30 Days' },
          ].map((tab) => (
            <button
              key={tab.val}
              type="button"
              onClick={() => setDays(tab.val)}
              className={`leather-tab ${days === tab.val ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div style={{ width: '100%', height: 290 }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brass-mid)', fontSize: '0.9rem' }}>
            Loading timeline telemetry...
          </div>
        ) : timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="goldReadingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffd700" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#d4a945" stopOpacity={0.15} />
                  <stop offset="98%" stopColor="#b8821e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 230, 160, 0.12)" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: '#e6d3b4', fontWeight: 600 }} 
                axisLine={{ stroke: 'rgba(212, 169, 69, 0.35)' }}
                tickLine={{ stroke: 'rgba(212, 169, 69, 0.35)' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#e6d3b4', fontWeight: 600 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="pages_read" 
                stroke="#ffd700" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#goldReadingGradient)" 
                activeDot={{ 
                  r: 6, 
                  fill: '#ffd700', 
                  stroke: '#241403', 
                  strokeWidth: 2,
                  boxShadow: '0 0 10px #ffd700'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={32} style={{ marginBottom: '0.6rem', color: 'var(--brass-mid)', opacity: 0.6 }} />
            <p style={{ fontSize: '0.9rem', color: '#fff3d1' }}>No reading logs recorded in this period yet.</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Click "Log Daily Pages" on any active book on your shelf to generate momentum!</p>
          </div>
        )}
      </div>
    </div>
  );
}
