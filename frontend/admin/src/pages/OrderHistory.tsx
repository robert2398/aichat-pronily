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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import { apiService } from '../services/api';

interface OrderRow {
  id: number;
  promo_code: string;
  discount_type: string;
  status: string;
  discount_applied: number;
  subtotal_at_apply: number;
  user_id: number;
  stripe_customer_id: string;
  subscription_id: string;
  order_id: string;
  created_at: string;
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filtered, setFiltered] = useState<OrderRow[]>([]);
  const [searchPromo, setSearchPromo] = useState('');
  const [discountType, setDiscountType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await apiService.getAllOrders();
        const mapped: OrderRow[] = Array.isArray(data) ? data.map((d: any) => ({
          id: d.id,
          promo_code: d.promo_code,
          discount_type: d.discount_type,
          status: d.status,
          discount_applied: Number(d.discount_applied) || 0,
          subtotal_at_apply: Number(d.subtotal_at_apply) || 0,
          user_id: d.user_id,
          stripe_customer_id: d.stripe_customer_id,
          subscription_id: d.subscription_id,
          order_id: d.order_id,
          created_at: d.created_at,
        })) : [];
        setOrders(mapped);
        setFiltered(mapped);
  } catch (err) {
        console.error('Failed to load orders', err);
  }
    };
    fetch();
  }, []);

  useEffect(() => {
    let out = orders;
    if (searchPromo) {
      out = out.filter(o => o.promo_code?.toLowerCase().includes(searchPromo.toLowerCase()));
    }
    if (discountType !== 'All') out = out.filter(o => o.discount_type === discountType);
    if (statusFilter !== 'All') out = out.filter(o => o.status === statusFilter);
    if (startDate) out = out.filter(o => new Date(o.created_at) >= new Date(startDate));
    if (endDate) out = out.filter(o => new Date(o.created_at) <= new Date(endDate));
    setFiltered(out);
    setPage(0);
  }, [searchPromo, discountType, statusFilter, startDate, endDate, orders]);

  const current = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box data-admin-root className="admin-page-root" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Order History</Typography>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'nowrap' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Date:</Typography>
            <TextField type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} sx={{ width: 150 }} />
            <Typography>—</Typography>
            <TextField type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} sx={{ width: 150 }} />
          </Stack>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            {/* <InputLabel>Promo Code</InputLabel> */}
            <TextField size="small" placeholder="Promo code" value={searchPromo} onChange={(e) => setSearchPromo(e.target.value)} sx={{ width: 140 }} />
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Discount Type</InputLabel>
            <Select value={discountType} label="Discount Type" onChange={(e) => setDiscountType(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="promo">promo</MenuItem>
              <MenuItem value="subscription">subscription</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="success">success</MenuItem>
              <MenuItem value="pending">pending</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 800 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Promo Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Discount Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Discount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subtotal</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {current.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell>{o.id}</TableCell>
                <TableCell>{o.user_id}</TableCell>
                <TableCell>{o.order_id}</TableCell>
                <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.promo_code || '—'}</TableCell>
                <TableCell>{o.discount_type}</TableCell>
                <TableCell>{o.discount_applied}</TableCell>
                <TableCell>{o.subtotal_at_apply}</TableCell>
                <TableCell>{o.status}</TableCell>
                <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_e, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10,25,50]} />
      </TableContainer>
    </Box>
  );
};

export default OrderHistory;
