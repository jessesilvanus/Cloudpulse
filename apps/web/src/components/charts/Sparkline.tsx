import React from 'react';
import type { MetricDatapoint } from '@cloudpulse/shared';

interface SparklineProps {
  data: MetricDatapoint[] | number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = 'var(--brand)', width = 64, height = 18 }: SparklineProps) {
  if (!data || data.length < 2) return null;

  const rawValues = typeof data[0] === 'number' ? (data as number[]) : (data as MetricDatapoint[]).map((d) => d.value);

  const min = Math.min(...rawValues);
  const max = Math.max(...rawValues);
  const range = max - min || 1;

  const points = rawValues
    .map((val, idx) => {
      const x = (idx / (rawValues.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = color.startsWith('var(') ? '#3b82f6' : color;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
