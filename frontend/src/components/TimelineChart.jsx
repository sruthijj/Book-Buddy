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

export default function TimelineChart() {
  const [days, setDays] = useState(30);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [days]);

  // Senior UX Custom Tooltip
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
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {data.date} ({data.label})
          </div>
          <div style={{ color: 'var(--reading-text)', fontWeight: 600 }}>
            {data.pages_read} pages read
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>
            {data.sessions_count} session{data.sessions_count > 1 ? 's' : ''} logged
          </div>
        </div>
      );
    }
    return null;
  };

  const totalPagesInWindow = timelineData.reduce((acc, curr) => acc + curr.pages_read, 0);

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Header & Controls */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--reading-text)' }} />
            <h3 style={{ fontSize: '1.15rem' }}>Reading Momentum Over Time</h3>
          </div>
          <p style={{ fontSize: '0.825rem' }}>
            {totalPagesInWindow} pages consumed over the past {days} days
          </p>
        </div>

        {/* Time Window Switcher */}
        <div 
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.15rem',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {[
            { val: 14, label: 'Past 14 Days' },
            { val: 30, label: 'Past 30 Days' },
          ].map((tab) => (
            <button
              key={tab.val}
              type="button"
              onClick={() => setDays(tab.val)}
              style={{
                background: days === tab.val ? '#FFFFFF' : 'none',
                color: days === tab.val ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: days === tab.val ? 600 : 500,
                boxShadow: days === tab.val ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div style={{ width: '100%', height: 260 }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading timeline telemetry...
          </div>
        ) : timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="readingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B45309" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#B45309" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E2" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: '#78716C' }} 
                axisLine={{ stroke: '#E8E8E2' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#78716C' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="pages_read" 
                stroke="#1C1917" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#readingGradient)" 
                activeDot={{ r: 5, fill: '#1C1917', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={28} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem' }}>No reading logs recorded in this period yet.</p>
            <p style={{ fontSize: '0.75rem' }}>Click "Log Daily Pages" on any active book to generate graph history!</p>
          </div>
        )}
      </div>
    </div>
  );
}
