import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { TrendingUp, CalendarToday } from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
// TooltipProps type intentionally unused in this file
import { format, subDays } from 'date-fns';

// --- DUMMY DATA ---

const activityData = Array.from({ length: 7 }, (_, i) => ({
  date: format(subDays(new Date(), 6 - i), 'MMM d'),
  Users: 500 + Math.random() * 1000,
  Sessions: 800 + Math.random() * 1200,
}));

const modelUsageData = Array.from({ length: 7 }, (_, i) => ({
  date: format(subDays(new Date(), 6 - i), 'E'),
  tokens: Math.floor(Math.random() * 5000) + 10000,
  chats: Math.floor(Math.random() * 5000) + 8000,
  duration: Math.floor(Math.random() * 3000) + 5000,
}));

const retentionData = [
  [100, 55, 45, 30],
  [100, 60, 50, 35],
  [100, 65, 58, 42],
  [100, 70, 62, 55],
];

const peakUsageData = Array.from({ length: 7 * 24 }, () => Math.floor(Math.random() * 100));

// --- COMPONENT PROPS TYPES ---

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    isTime?: boolean;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
    }>;
    label?: string;
  }

// --- COMPONENTS ---

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change }) => (
  <Card>
    <CardContent>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight="bold" color="text.primary">
        {value}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
        <Typography variant="body2" color="success.main">
          {change} (vs. last period)
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1 }}>
          <Typography variant="body2">{`${label} : ${payload[0].value}`}</Typography>
        </Card>
      );
    }
    return null;
  };

export const Analytics: React.FC = () => {
  const [granularity, setGranularity] = useState('Daily');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Analytics
      </Typography>

      {/* Filters Bar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday sx={{ color: 'text.secondary' }} />
          <TextField
            type="date"
            size="small"
            defaultValue={format(subDays(new Date(), 7), 'yyyy-MM-dd')}
          />
          <Typography>to</Typography>
          <TextField
            type="date"
            size="small"
            defaultValue={format(new Date(), 'yyyy-MM-dd')}
          />
        </Box>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Granularity</InputLabel>
          <Select
            value={granularity}
            label="Granularity"
            onChange={(e) => setGranularity(e.target.value)}
          >
            <MenuItem value="Daily">Daily</MenuItem>
            <MenuItem value="Weekly">Weekly</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
          </Select>
        </FormControl>
        
        <Chip label="Models: GPT-4, Claude..." variant="outlined" />
      </Box>

      {/* Metrics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
        <MetricCard title="DAU" value="1,234" change="5%" />
        <MetricCard title="WAU" value="3,456" change="3%" />
        <MetricCard title="MAU" value="8,910" change="7%" />
        <MetricCard title="Avg Chat Duration" value="07:56" change="4%" isTime />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Activity Over Time */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Activity Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="Users" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="Sessions" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model Usage Breakdown */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Model Usage Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelUsageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="tokens" stackId="a" fill="#8884d8" name="Tokens" />
                <Bar dataKey="chats" stackId="a" fill="#82ca9d" name="Chats" />
                <Bar dataKey="duration" stackId="a" fill="#ffc658" name="Duration" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Retention Cohorts */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Retention Cohorts
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <Box sx={{ width: '25%' }}>
                {retentionData.map((_, i) => (
                  <Box key={i} sx={{ p: 1, textAlign: 'right', pr: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Week {i + 1}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ width: '75%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0.5 }}>
                {retentionData.map((row, rowIndex) =>
                  row.map((val, colIndex) => (
                    <Box 
                      key={`${rowIndex}-${colIndex}`} 
                      sx={{ 
                        p: 1, 
                        textAlign: 'center', 
                        borderRadius: 1,
                        bgcolor: `rgba(34, 197, 94, ${val / 100})`, 
                        color: val > 50 ? 'white' : 'black' 
                      }}
                    >
                      <Typography variant="body2">
                        {val}%
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Peak Usage Heatmap */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Peak Usage Heatmap
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 0.5 }}>
              {peakUsageData.slice(0, 7 * 24).map((value, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    width: '100%', 
                    paddingBottom: '100%', 
                    position: 'relative', 
                    borderRadius: 0.5,
                    bgcolor: `rgba(34, 197, 94, ${value / 100})`,
                    cursor: 'pointer'
                  }}
                  title={`Count: ${value}`}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
