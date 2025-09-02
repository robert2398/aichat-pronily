import React from 'react';
import { Box, Container, Typography, Card, CardContent, LinearProgress, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { 
  People as PeopleIcon, 
  TrendingUp as TrendingUpIcon, 
  PersonAdd as PersonAddIcon, 
  AttachMoney as MoneyIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

// Components
import { DateRangePicker } from '../components/DateRangePicker';
import { KpiCard } from '../components/charts/KpiCard';
import { LineChartCard } from '../components/charts/LineChartCard';
import { BarChartCard } from '../components/charts/BarChartCard';
import { DonutChartCard } from '../components/charts/DonutChartCard';

// Services and Types
import { dashboardApi, formatters } from '../services/dashboardApi';
import { useDateRange } from '../contexts/DateRangeContext';

const DashboardPage: React.FC = () => {
  const { from, to } = useDateRange();

  // KPIs Query
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis', { from, to }],
    queryFn: () => dashboardApi.getKpis(from, to),
  });

  // Users Over Time Query
  const { data: usersTimeseries, isLoading: usersLoading } = useQuery({
    queryKey: ['users-timeseries', { from, to }],
    queryFn: () => dashboardApi.getUsersTimeseries(from, to),
  });

  // Revenue Over Time Query
  const { data: revenueTimeseries, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-timeseries', { from, to }],
    queryFn: () => dashboardApi.getRevenueTimeseries(from, to),
  });

  // Subscriptions Overview Query
  const { data: subsOverview } = useQuery({
    queryKey: ['subscriptions-overview', { from, to }],
    queryFn: () => dashboardApi.getSubscriptionsOverview(from, to),
  });

  // Messages Volume Query
  const { data: messagesTimeseries } = useQuery({
    queryKey: ['messages-timeseries', { from, to }],
    queryFn: () => dashboardApi.getMessagesTimeseries(from, to),
  });

  // Session Length Query
  const { data: sessionLength } = useQuery({
    queryKey: ['session-length', { from, to }],
    queryFn: () => dashboardApi.getSessionLength(from, to),
  });

  // Role Ratio Query
  const { data: roleRatio } = useQuery({
    queryKey: ['role-ratio', { from, to }],
    queryFn: () => dashboardApi.getRoleRatio(from, to),
  });

  // Characters Summary Query
  const { data: charactersSummary } = useQuery({
    queryKey: ['characters-summary', { from, to }],
    queryFn: () => dashboardApi.getCharactersSummary(from, to),
  });

  // Media Usage Query
  const { data: mediaUsage } = useQuery({
    queryKey: ['media-usage', { from, to }],
    queryFn: () => dashboardApi.getMediaUsage(from, to),
  });

  // Free vs Paid Users Query
  const { data: freePaidUsers } = useQuery({
    queryKey: ['free-paid-users', { from, to }],
    queryFn: () => dashboardApi.getFreePaidUsers(from, to),
  });

  // ARPU & LTV Query
  const { data: arpuLtv } = useQuery({
    queryKey: ['arpu-ltv', { from, to }],
    queryFn: () => dashboardApi.getArpuLtv(from, to),
  });

  // Verification & Login Query
  const { data: verificationLogin } = useQuery({
    queryKey: ['verification-login', { from, to }],
    queryFn: () => dashboardApi.getVerificationLogin(from, to),
  });

  // Geography Query
  const { data: geography } = useQuery({
    queryKey: ['geography', { from, to }],
    queryFn: () => dashboardApi.getGeography(from, to),
  });

  // Render Loading
  const isAnyLoading = kpisLoading || usersLoading || revenueLoading;

  if (isAnyLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <DateRangePicker />
        <LinearProgress sx={{ mt: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          Loading dashboard data...
        </Typography>
      </Container>
    );
  }

  // Transform data for charts
  const roleRatioData = roleRatio ? [
    { name: 'User Messages', value: roleRatio.user },
    { name: 'AI Messages', value: roleRatio.assistant },
  ] : [];

  const freePaidData = freePaidUsers ? [
    { name: 'Free Users', value: freePaidUsers.free },
    { name: 'Paid Users', value: freePaidUsers.paid },
  ] : [];

  const planDistributionData = subsOverview?.planDistribution.map(plan => ({
    name: plan.plan_name,
    value: plan.count
  })) || [];

  const genderData = charactersSummary?.byGender.map(item => ({
    name: item.gender,
    value: item.count
  })) || [];

  const loginMethodsData = verificationLogin?.loginMethods.map(method => ({
    name: method.method.replace('oauth:', '').toUpperCase(),
    value: method.count
  })) || [];

  const geographyData = geography?.byCharacters.slice(0, 10).map(country => ({
    name: country.country,
    value: country.count
  })) || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <DateRangePicker />

      {/* Row 1: KPIs */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <KpiCard
            title="Active Users"
            value={formatters.number(kpis?.activeUsers || 0)}
            icon={PeopleIcon}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <KpiCard
            title="New Users"
            value={formatters.number(kpis?.newUsers || 0)}
            icon={PersonAddIcon}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <KpiCard
            title="MRR"
            value={formatters.currency(kpis?.mrr || 0)}
            icon={MoneyIcon}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <KpiCard
            title="Churn Rate"
            value={formatters.percentage(kpis?.churnRatePct || 0)}
            icon={TrendingDownIcon}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <KpiCard
            title="Avg Msgs/Session"
            value={(kpis?.avgMessagesPerSession || 0).toFixed(1)}
            icon={TrendingUpIcon}
          />
        </Box>
      </Stack>

      {/* Row 2: Growth Charts */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <LineChartCard
            title="Users Over Time"
            data={usersTimeseries?.series || []}
            lines={[
              { dataKey: 'newUsers', stroke: '#1976d2', name: 'New Users' },
              { dataKey: 'activeUsers', stroke: '#dc004e', name: 'Active Users' }
            ]}
            formatYAxis={formatters.number}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <LineChartCard
            title="Revenue Over Time"
            data={revenueTimeseries?.series || []}
            lines={[
              { dataKey: 'mrr', stroke: '#2e7d32', name: 'MRR' }
            ]}
            formatYAxis={formatters.currency}
            formatTooltip={(value) => [formatters.currency(Number(value)), 'MRR']}
          />
        </Box>
      </Stack>

      {/* Row 3: Engagement */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Session Length
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Average</Typography>
                <Typography variant="h4" fontWeight={700}>
                  {(sessionLength?.avg || 0).toFixed(1)}min
                </Typography>
              </Box>
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">P50</Typography>
                  <Typography variant="h6">{sessionLength?.p50 || 0}min</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">P90</Typography>
                  <Typography variant="h6">{sessionLength?.p90 || 0}min</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <DonutChartCard
            title="AI vs User Messages"
            data={roleRatioData}
            formatTooltip={(value) => [formatters.number(Number(value)), 'Messages']}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <DonutChartCard
            title="Free vs Paid Users"
            data={freePaidData}
            formatTooltip={(value) => [formatters.number(Number(value)), 'Users']}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <DonutChartCard
            title="Plan Distribution"
            data={planDistributionData}
            formatTooltip={(value) => [formatters.number(Number(value)), 'Subscriptions']}
          />
        </Box>
      </Stack>

      {/* Row 4: Characters & Media */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Character Creation Summary
              </Typography>
              <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">Total Characters</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatters.number(charactersSummary?.totalCharacters || 0)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">Avg per User</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {(charactersSummary?.avgPerUser || 0).toFixed(1)}
                  </Typography>
                </Box>
              </Stack>
              {genderData.length > 0 && (
                <Box sx={{ height: 200 }}>
                  <DonutChartCard
                    title="By Gender"
                    data={genderData}
                    height={200}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Media Usage
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">Character Images</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatters.number(mediaUsage?.characterImages || 0)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">Voice Input</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatters.number(mediaUsage?.voice.inputCount || 0)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">Voice Output</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatters.number(mediaUsage?.voice.outputCount || 0)}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Voice Usage: {formatters.percentage(mediaUsage?.voice.pctOfMessages || 0)} of messages
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Row 5: Monetization Details */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                ARPU & LTV
              </Typography>
              <Stack direction="row" spacing={3}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">ARPU</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatters.currency(arpuLtv?.arpu || 0)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">LTV</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatters.currency(arpuLtv?.ltv || 0)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Subscription Overview
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">Active</Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {formatters.number(subsOverview?.active || 0)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">New</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    +{formatters.number(subsOverview?.newInRange || 0)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">Churned</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">
                    -{formatters.number(subsOverview?.churnedInRange || 0)}
                  </Typography>
                </Box>
              </Stack>
              <Box>
                <Typography variant="body2" color="text.secondary">ARR</Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatters.currency(subsOverview?.arr || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Email Verification
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                {formatters.percentage(verificationLogin?.verificationRatePct || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                verification rate
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Row 6: Geography & Messages Volume */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <BarChartCard
            title="Top Countries"
            data={geographyData}
            bars={[
              { dataKey: 'value', fill: '#1976d2', name: 'Users' }
            ]}
            formatYAxis={formatters.number}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <BarChartCard
            title="Messages Volume"
            data={messagesTimeseries?.series.map(item => ({ 
              name: item.date, 
              messages: item.messages 
            })) || []}
            bars={[
              { dataKey: 'messages', fill: '#ed6c02', name: 'Messages' }
            ]}
            formatYAxis={formatters.number}
          />
        </Box>
      </Stack>
    </Container>
  );
};

export default DashboardPage;
