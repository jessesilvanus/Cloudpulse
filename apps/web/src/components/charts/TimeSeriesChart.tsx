import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { MetricDatapoint } from '@cloudpulse/shared';

interface TimeSeriesChartProps {
  data: MetricDatapoint[];
  title?: string;
  unit?: string;
  color?: string;
  type?: 'area' | 'line';
  height?: number;
  showGrid?: boolean;
  valueFormatter?: (val: number) => string;
}

export function TimeSeriesChart({
  data,
  unit = '',
  color = 'var(--brand)',
  type = 'area',
  height = 180,
  showGrid = true,
  valueFormatter,
}: TimeSeriesChartProps) {
  const formattedData = data.map((d) => {
    const time = new Date(d.timestamp);
    return {
      ...d,
      timeLabel: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  });

  const defaultFormatter = (val: number) => {
    if (valueFormatter) return valueFormatter(val);
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k ${unit}`.trim();
    return `${val} ${unit}`.trim();
  };

  const chartColor = color.startsWith('var(') ? '#3b82f6' : color;
  const gradientId = `grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ width: '100%', height, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="2 2" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />}
            <XAxis
              dataKey="timeLabel"
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tickFormatter={defaultFormatter}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
              formatter={(value: number) => [defaultFormatter(value), 'Value']}
              labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={1.8}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart data={formattedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            {showGrid && <CartesianGrid strokeDasharray="2 2" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />}
            <XAxis
              dataKey="timeLabel"
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tickFormatter={defaultFormatter}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
              }}
              formatter={(value: number) => [defaultFormatter(value), 'Value']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
