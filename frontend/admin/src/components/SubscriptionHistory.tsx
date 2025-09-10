import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SectionCard } from './SectionCard';
import { useFilters } from '../context/FiltersContext';
import { cn, toCSV, downloadCSV } from '../lib/utils';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

// Data shape returned by API method
interface HistoryRow { period: string; value: number }
interface HistoryResponse { metric: string; interval: string; history: HistoryRow[] }

const METRICS: { key: Metric; label: string; chart: 'area' | 'bar'; color: string }[] = [
  { key: 'active_count', label: 'Active Count', chart: 'area', color: '#6366F1' },
  { key: 'new_subscriptions', label: 'New Subs', chart: 'bar', color: '#10B981' },
  { key: 'cancellations', label: 'Cancellations', chart: 'bar', color: '#EF4444' },
];

type Metric = 'active_count' | 'new_subscriptions' | 'cancellations';
type IntervalOpt = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export const SubscriptionHistory: React.FC<{ className?: string }> = ({ className }) => {
  const { filters } = useFilters();
  const [metric, setMetric] = useState<Metric>('active_count');
  // default to global filter interval and keep in sync so global FilterBar controls payload
  const [interval, setInterval] = useState<IntervalOpt>(filters.interval as IntervalOpt);

  // When global filter interval changes, update local interval so API payload reflects global selection
  useEffect(() => { setInterval(filters.interval as IntervalOpt); }, [filters.interval]);

  const startDate = filters.fromISO;
  const endDate = filters.toISO;

  const query = useQuery<HistoryResponse>({
    queryKey: ['subscription-history', startDate, endDate, metric, interval],
    queryFn: () => apiService.getSubscriptionHistory({ startDate, endDate, metric, interval }),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
  });

  // Listen for navigation-triggered refetch requests
  useEffect(() => {
    const handler = () => {
      query.refetch();
    };
    window.addEventListener('dashboard:subscriptions:refetch', handler);
    return () => window.removeEventListener('dashboard:subscriptions:refetch', handler);
  }, [query]);

  const rows: HistoryRow[] = useMemo(() => query.data?.history || [], [query.data]);

  // Header metrics calculations
  const lastValue = rows.length ? rows[rows.length - 1].value : 0;
  const last3Avg = rows.slice(-3).reduce((s, r) => s + r.value, 0) / (rows.slice(-3).length || 1);
  const prevValue = rows.length > 1 ? rows[rows.length - 2].value : 0;
  const pctChange = prevValue ? ((lastValue - prevValue) / prevValue) * 100 : 0;

  const handleExport = () => {
    if (!rows.length) return;
    const csv = toCSV(rows.map(r => ({ period: r.period, [metric]: r.value })));
    downloadCSV(`subscription-history-${metric}.csv`, csv);
  };

  const activeMeta = METRICS.find(m => m.key === metric)!;
  const chartColor = activeMeta.color;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/95 backdrop-blur border rounded-md p-2 shadow text-xs">
        <div className="font-medium mb-1">{label}</div>
        <div className="flex justify-between gap-4">
          <span>{activeMeta.label}</span>
          <span className="font-semibold tabular-nums">{(payload[0].value as number) ?? 0}</span>
        </div>
      </div>
    );
  };

  const headerNumber = (n: number) => <span className="tabular-nums font-semibold">{Math.round(n).toLocaleString()}</span>;
  const headerPercent = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  return (
    <SectionCard
      title="Subscription History"
      description="Active, new, and cancelled subscriptions over time"
      onExport={handleExport}
      isLoading={query.isLoading}
      error={query.error ? String(query.error) : null}
      className={className}
    >
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          <div className="p-3 rounded-md border bg-gradient-to-br from-indigo-50 to-white">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last Period</p>
            <p className="text-lg">{headerNumber(lastValue)}</p>
          </div>
          <div className="p-3 rounded-md border bg-gradient-to-br from-emerald-50 to-white">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">3-Period Avg</p>
            <p className="text-lg">{headerNumber(last3Avg)}</p>
          </div>
          <div className="p-3 rounded-md border bg-gradient-to-br from-amber-50 to-white">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">% Change vs Prior</p>
            <p className={cn('text-lg', pctChange > 0 ? 'text-green-600' : pctChange < 0 ? 'text-red-600' : 'text-gray-700')}>{headerPercent(pctChange)}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {METRICS.map(m => {
            const active = metric === m.key;
            return (
              <button
                key={m.key}
                type="button"
                aria-pressed={active}
                onClick={() => setMetric(m.key)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-md border transition focus:outline-none focus:ring-2 focus:ring-offset-1', active ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: m.color, opacity: active ? 1 : .45 }} />
                {m.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {(['daily','weekly','monthly','quarterly'] as IntervalOpt[]).map(opt => {
            const active = interval === opt;
            const label = opt === 'daily' ? 'Daily' : opt === 'weekly' ? 'Weekly' : opt === 'monthly' ? 'Monthly' : 'Quarterly';
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setInterval(opt)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-md border transition', active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}
              >{label}</button>
            );
          })}
          <Button size="sm" variant="outline" onClick={() => query.refetch()} disabled={query.isFetching} className="ml-1">
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1', query.isFetching && 'animate-spin')} />
            {query.isFetching ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeMeta.chart === 'area' ? (
            <AreaChart data={rows} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
              <Area type="monotone" dataKey="value" stroke={chartColor} fill={chartColor} fillOpacity={0.55} name={activeMeta.label} />
              <ReferenceLine y={0} stroke="#aaa" />
            </AreaChart>
          ) : (
            <BarChart data={rows} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
              <Bar dataKey="value" fill={chartColor} radius={[4,4,0,0]} name={activeMeta.label} />
              <ReferenceLine y={0} stroke="#aaa" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="mt-6 overflow-x-auto border rounded-md">
        <table className="min-w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Period</th>
              <th className="text-right px-3 py-2 font-medium">{activeMeta.label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.period} className="odd:bg-background even:bg-muted/20">
                <td className="px-3 py-1.5 whitespace-nowrap font-medium">{r.period}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium">{r.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

export default SubscriptionHistory;
