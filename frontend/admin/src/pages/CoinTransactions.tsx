import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { apiService } from '../services/api';

interface CoinTransactionRow {
  id: number;
  user_id: number;
  transaction_type: string;
  coins: number;
  source_type: string;
  created_at: string;
}

const CoinTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<CoinTransactionRow[]>([]);
  const [filtered, setFiltered] = useState<CoinTransactionRow[]>([]);
  const [transactionType, setTransactionType] = useState('All');
  const [sourceType, setSourceType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Render-time debug
  console.debug('[CoinTransactions] render, transactions=', transactions.length, 'filtered=', filtered.length, 'loading=', loading, 'error=', error);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      console.debug('[CoinTransactions] fetch start');
      try {
        const data = await apiService.getAllCoinTransactions();
        console.debug('[CoinTransactions] api returned, count=', Array.isArray(data) ? data.length : 0);
        const mapped: CoinTransactionRow[] = Array.isArray(data)
          ? data.map((d: any) => ({
              id: d.id,
              user_id: d.user_id,
              transaction_type: d.transaction_type,
              coins: d.coins,
              source_type: d.source_type,
              created_at: d.created_at,
            }))
          : [];
        if (!mounted) return;
        setTransactions(mapped);
        setFiltered(mapped);
      } catch (e) {
        console.error('[CoinTransactions] failed to load', e);
        if (!mounted) return;
        setError(String(e));
      } finally {
        if (mounted) setLoading(false);
        console.debug('[CoinTransactions] fetch end');
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let out = transactions.slice();
    if (transactionType !== 'All') out = out.filter(o => o.transaction_type === transactionType);
    if (sourceType !== 'All') out = out.filter(o => o.source_type === sourceType);
    if (startDate) out = out.filter(o => new Date(o.created_at) >= new Date(startDate));
    if (endDate) out = out.filter(o => new Date(o.created_at) <= new Date(endDate));
    setFiltered(out);
    setPage(0);
  }, [transactionType, sourceType, startDate, endDate, transactions]);

  const current = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const transactionTypes = Array.from(new Set(transactions.map(t => t.transaction_type))).filter(Boolean);
  const sourceTypes = Array.from(new Set(transactions.map(t => t.source_type))).filter(Boolean);

  return (
    <Box data-admin-root className="admin-page-root" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Coin Transactions</Typography>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'nowrap' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Date:</Typography>
            <TextField type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} sx={{ width: 150 }} />
            <Typography>—</Typography>
            <TextField type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} sx={{ width: 150 }} />
          </Stack>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Transaction Type</InputLabel>
            <Select value={transactionType} label="Transaction Type" onChange={(e) => setTransactionType(String(e.target.value))}>
              <MenuItem value="All">All</MenuItem>
              {transactionTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Source Type</InputLabel>
            <Select value={sourceType} label="Source Type" onChange={(e) => setSourceType(String(e.target.value))}>
              <MenuItem value="All">All</MenuItem>
              {sourceTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {loading && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography>Loading coin transactions…</Typography>
        </Paper>
      )}
      {error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error">Error loading transactions: {error}</Typography>
        </Paper>
      )}

      <TableContainer component={Paper} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 800 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Id</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>User Id</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Transaction Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Coins</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Source Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {current.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.user_id}</TableCell>
                <TableCell>{t.transaction_type}</TableCell>
                <TableCell>{t.coins}</TableCell>
                <TableCell>{t.source_type}</TableCell>
                <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_e, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value as string, 10)); setPage(0); }} rowsPerPageOptions={[10,25,50]} />
      </TableContainer>
    </Box>
  );
};

export default CoinTransactions;
