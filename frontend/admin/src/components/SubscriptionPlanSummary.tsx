import React, { useMemo, useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import type { SubscriptionPlanRow, SubscriptionPlanSummaryResponse } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from './ui/table';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '../lib/utils';

interface Props {
  asOfDate?: string; // optional date string (YYYY-MM-DD)
  className?: string;
}

// Normalize numeric ratio or percentage values to percentage (0-100)
function normalizePercent(value: number | null): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (value <= 1) return value * 100; // treat as ratio
  return value; // already percent
}

export const SubscriptionPlanSummary: React.FC<Props> = ({ asOfDate, className }) => {
  const { data, isLoading, isError, refetch } = useQuery<SubscriptionPlanSummaryResponse>({
    queryKey: ['subscription-plan-summary', asOfDate],
    queryFn: () => apiService.getSubscriptionPlanSummary({ asOfDate }),
    staleTime: 60_000,
  });

  // Refetch on Subscriptions navigation click
  useEffect(() => {
    const handler = () => { refetch(); };
    window.addEventListener('dashboard:subscriptions:refetch', handler);
    return () => window.removeEventListener('dashboard:subscriptions:refetch', handler);
  }, [refetch]);

  // Sorting state
  type SortKey = keyof Pick<SubscriptionPlanRow, 'plan_name' | 'monthly_price' | 'active_subscribers' | 'retention_rate' | 'churn_rate' | 'avg_subscription_duration'>;
  const [sortKey, setSortKey] = useState<SortKey>('active_subscribers');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'plan_name' ? 'asc' : 'desc');
    }
  };

  const sortedPlans = useMemo<SubscriptionPlanRow[]>(() => {
    if (!data?.plans) return [];
    const copy = [...data.plans];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // Normalize percents for retention/churn
      const norm = (v: any) => (v === null || v === undefined ? null : typeof v === 'number' ? v : Number(v));
      const aVal = norm(av);
      const bVal = norm(bv);
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1; // nulls last
      if (bVal === null) return -1;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sortKey, sortDir]);

  // Pagination state
  const [page, setPage] = useState(0); // zero-based
  const pageSize = 8;
  const pageCount = Math.ceil(sortedPlans.length / pageSize) || 1;
  const currentPage = Math.min(page, pageCount - 1);
  const pagePlans = useMemo(() => sortedPlans.slice(currentPage * pageSize, currentPage * pageSize + pageSize), [sortedPlans, currentPage]);

  const bestRetentionPlan = data?.highest_retention_plan;
  const highestChurnPlan = data?.highest_churn_plan;

  const chartData = useMemo(() => {
    return sortedPlans.map(p => ({ name: p.plan_name, active: p.active_subscribers }));
  }, [sortedPlans]);

  // Detect zero-width container (a common reason Recharts renders nothing) and offer a fallback.
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapperWidth, setWrapperWidth] = useState<number>(0);
  useEffect(() => {
    const el = chartWrapperRef.current;
    if (!el) return;
    const measure = () => setWrapperWidth(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="text-sm text-muted-foreground">Loading subscription plan summary…</div>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="text-sm text-destructive mb-2">Failed to load plan summary.</div>
        <button onClick={() => refetch()} className="text-xs underline">Retry</button>
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div className={cn('grid gap-4 md:grid-cols-3', className)}>
      {/* Table */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <h3 className="text-base font-semibold">Subscription Plans</h3>
          <p className="text-xs text-muted-foreground">As of {data.as_of_date || '—'} · Total Active: {data.total_active_subscribers}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button type="button" onClick={() => handleSort('plan_name')} className="flex items-center gap-1">
                      Plan {sortKey === 'plan_name' && (sortDir === 'asc' ? '▲' : '▼')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => handleSort('monthly_price')} className="inline-flex items-center gap-1 ml-auto">
                      Price {sortKey === 'monthly_price' && (sortDir === 'asc' ? '▲' : '▼')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => handleSort('active_subscribers')} className="inline-flex items-center gap-1 ml-auto">
                      Active {sortKey === 'active_subscribers' && (sortDir === 'asc' ? '▲' : '▼')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => handleSort('retention_rate')} className="inline-flex items-center gap-1 ml-auto">
                      Retention % {sortKey === 'retention_rate' && (sortDir === 'asc' ? '▲' : '▼')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => handleSort('churn_rate')} className="inline-flex items-center gap-1 ml-auto">
                      Churn % {sortKey === 'churn_rate' && (sortDir === 'asc' ? '▲' : '▼')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => handleSort('avg_subscription_duration')} className="inline-flex items-center gap-1 ml-auto">
                      Avg Duration (mo) {sortKey === 'avg_subscription_duration' && (sortDir === 'asc' ? '▲' : '▼')}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagePlans.map(plan => {
                  const retention = normalizePercent(plan.retention_rate);
                  const churn = normalizePercent(plan.churn_rate);
                  const isBestRetention = plan.plan_name === bestRetentionPlan;
                  const isHighestChurn = plan.plan_name === highestChurnPlan;
                  return (
                    <TableRow key={plan.plan_name} className="text-sm">
                      <TableCell className="font-medium">
                        {plan.plan_name}
                        <span className="ml-2 space-x-1 inline-flex">
                          {isBestRetention && (
                            <Badge variant="secondary">Best Retention</Badge>
                          )}
                          {isHighestChurn && (
                            <Badge variant="destructive">High Churn</Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{plan.monthly_price != null ? `$${plan.monthly_price.toFixed(2)}` : '—'}</TableCell>
                      <TableCell className="text-right font-medium">{plan.active_subscribers}</TableCell>
                      <TableCell className={cn('text-right', isBestRetention && 'text-green-600 font-semibold')}>
                        {retention != null ? retention.toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className={cn('text-right', isHighestChurn && 'text-red-600 font-semibold')}>
                        {churn != null ? churn.toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-right">{plan.avg_subscription_duration != null ? plan.avg_subscription_duration.toFixed(1) : '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {sortedPlans.length > pageSize && (
            <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
              <div>
                Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, sortedPlans.length)} of {sortedPlans.length}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className={cn('px-2 py-1 rounded border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed')}
                >Prev</button>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                  disabled={currentPage >= pageCount - 1}
                  className={cn('px-2 py-1 rounded border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed')}
                >Next</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mini Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-base font-semibold">Active by Plan</h3>
        </CardHeader>
        <CardContent className="pt-2">
          {chartData.length === 0 ? (
            <div className="text-sm text-muted-foreground">No data</div>
          ) : (
            <div ref={chartWrapperRef} className="h-64 w-full">
              {wrapperWidth > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="active" fill="#6366F1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                // Fallback simple bars while width is 0
                <div className="flex flex-col justify-center gap-2 h-full">
                  {chartData.map(d => (
                    <div key={d.name} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-16 truncate font-medium">{d.name}</span>
                        <div className="flex-1 bg-muted h-3 rounded overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${d.active === 0 ? 4 : (d.active / Math.max(...chartData.map(c=>c.active)))*100}%` }}
                          />
                        </div>
                        <span className="w-6 text-right tabular-nums">{d.active}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPlanSummary;
