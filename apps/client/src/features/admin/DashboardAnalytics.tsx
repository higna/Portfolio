import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { createLogger } from '../../lib/logger';

const logger = createLogger('DashboardAnalytics');

interface AnalyticsData {
  userGrowth: { month: string; count: number }[];
  projectsByTech: { tech: string; count: number }[];
}

export default function DashboardAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/analytics')
      .then((res) => setData(res.data))
      .catch(() => logger.warn('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-base-200/60 rounded-xl animate-pulse" />
          <div className="h-72 bg-base-200/60 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <p className="text-lg">No analytics available yet.</p>
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: 'var(--b1)',
    border: '1px solid var(--b3)',
    borderRadius: '0.5rem',
    color: 'var(--bc)',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold tracking-tight">Analytics</h3>
        <span className="text-sm text-base-content/50">Growth & technology usage</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card bg-base-100 border border-base-content/10 shadow-sm p-4"
        >
          <h4 className="text-sm font-semibold mb-3">User Growth</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--b3)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--bc)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--bc)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#d4af37"
                strokeWidth={2}
                dot={{ r: 3, fill: '#d4af37' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="card bg-base-100 border border-base-content/10 shadow-sm p-4"
        >
          <h4 className="text-sm font-semibold mb-3">Projects by Technology</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.projectsByTech}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--b3)" />
              <XAxis dataKey="tech" tick={{ fontSize: 12, fill: 'var(--bc)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--bc)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#d4af37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}