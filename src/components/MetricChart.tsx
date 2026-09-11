import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ContentMetricSnapshot, Market } from '../types/index.ts';
import { formatMetricNumber } from '../services/thresholds/suggestThresholds.ts';

interface MetricChartProps {
  market: Market;
  snapshots: ContentMetricSnapshot[];
}

export const MetricChart: React.FC<MetricChartProps> = ({ market, snapshots }) => {
  // Format data for recharts
  const chartData = snapshots.map((s) => {
    const d = new Date(s.timestamp);
    const label = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return {
      time: label,
      views: s.viewCount,
      likes: s.likeCount,
    };
  });

  // If only 1 snapshot, duplicate with a slight time offset for a clean line
  if (chartData.length === 1) {
    chartData.unshift({
      time: 'Start',
      views: market.initialMetric,
      likes: Math.round(market.initialMetric * 0.07),
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Verified Views Over Time
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Official YouTube Data API snapshots • Target: <strong className="text-white font-mono">{formatMetricNumber(market.targetMetric)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Current: {formatMetricNumber(market.currentMetric)}
          </span>
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="h-1.5 w-3 border-t border-dashed border-rose-400" />
            Target Line
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
            />
            <YAxis
              stroke="#52525b"
              fontSize={10}
              tickFormatter={(v) => formatMetricNumber(v)}
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              domain={[0, (dataMax: number) => Math.max(dataMax * 1.15, market.targetMetric * 1.05)]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={(val: any) => [`${Number(val).toLocaleString()} views`, 'Verified Views']}
            />
            {/* Target Milestone Horizontal Reference Line */}
            <ReferenceLine
              y={market.targetMetric}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Target: ${formatMetricNumber(market.targetMetric)}`,
                position: 'top',
                fill: '#f43f5e',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#viewGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
