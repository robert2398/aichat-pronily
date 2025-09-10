import React, { useState, useEffect } from 'react';
import type { SelectChangeEvent } from '@mui/material';
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
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Card,
  CardContent,
  InputAdornment,
  Stack,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  Block,
  Delete,
  Timeline,
  Add,
  Close,
  Chat,
  EmojiEmotions,
  BarChart
} from '@mui/icons-material';
import { apiService, type Character } from '../services/api';
import type { EngagementStats } from '../services/api';
import ChatLogs from '../components/ChatLogs';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  chat_count: number;
  characters_created: number;
  avg_session_length: string;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [engagementStats, setEngagementStats] = useState<EngagementStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [lastFailedDeleteUser, setLastFailedDeleteUser] = useState<User | null>(null);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserForm, setAddUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user',
  });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const usersData = await apiService.getUsers();
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (err) {
        setError('Failed to fetch users. Please try again.');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (roleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (startDate) {
      filtered = filtered.filter(user => new Date(user.created_at) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(user => new Date(user.created_at) <= new Date(endDate));
    }

    setFilteredUsers(filtered);
    setPage(0); // Reset to first page
  }, [searchTerm, roleFilter, statusFilter, startDate, endDate, users]);

  // Get current page users for Material-UI pagination
  const currentUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Material-UI event handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleViewActivity = async (user: User) => {
    setSelectedUser(user);
    setActivityDrawerOpen(true);
    setActiveTab(0); // Reset to first tab
    setEngagementStats(null); // Reset previous stats

    const fetchActivityData = async () => {
      // Fetch characters
      setCharactersLoading(true);
      try {
        const chars = await apiService.getCharactersByUserId(user.id);
        setCharacters(chars);
      } catch (error) {
        console.error("Failed to fetch characters", error);
      } finally {
        setCharactersLoading(false);
      }

      // Fetch engagement stats
      setStatsLoading(true);
      try {
        const stats = await apiService.getEngagementStats(user.id);
        setEngagementStats(stats);
      } catch (error) {
        console.error("Failed to fetch engagement stats", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchActivityData();
  };

  const handleBanUser = async (user: User) => {
    const originalUsers = [...users];
    const isActivating = user.status === 'Banned';
    const newStatus = isActivating ? 'Active' : 'Banned';

    // Optimistically update the UI
    setUsers(users.map(u =>
      u.id === user.id ? { ...u, status: newStatus } : u
    ));

    try {
      if (isActivating) {
        await apiService.activateUser(user.id);
        setSuccessMessage(`User ${user.email} has been successfully activated.`);
      } else {
        await apiService.deactivateUser(user.id);
        setSuccessMessage(`User ${user.email} has been successfully banned.`);
      }
      // If the API call is successful, the optimistic update is kept.
    } catch (error) {
      // If the API call fails, revert the change and show an error.
      setError(`Failed to update status for ${user.email}. Please try again.`);
      setUsers(originalUsers);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      const originalUsers = [...users];
      setUsers(users.filter(u => u.id !== user.id));
      try {
        await apiService.deleteUser(user.id);
        setSuccessMessage(`User ${user.email} has been successfully deleted.`);
        setLastFailedDeleteUser(null);
      } catch (error) {
        setError(`Failed to delete ${user.email}. Please try again.`);
        setUsers(originalUsers);
        setLastFailedDeleteUser(user);
      }
    }
  };

  const handleSaveUser = async (updatedUser: User) => {
    const originalUsers = [...users];
    
    // Optimistically update the UI
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setEditModalOpen(false);

    try {
      await apiService.editUser(updatedUser.id, {
        full_name: updatedUser.full_name ?? undefined,
        role: updatedUser.role,
      });
      setSuccessMessage(`User ${updatedUser.email} has been successfully updated.`);
      // If the API call is successful, the optimistic update is kept.
    } catch (error) {
      // If the API call fails, revert the change and show an error.
      setError(`Failed to edit ${updatedUser.email}. Please try again.`);
      setUsers(originalUsers);
    } finally {
      setSelectedUser(null);
    }
  };

  const handleOpenAddUser = () => {
    setAddUserForm({
      full_name: '',
      email: '',
      password: '',
      role: 'user',
    });
    setAddUserError('');
    setAddUserModalOpen(true);
  };

  const handleAddUserChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setAddUserForm(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError('');
    // Basic validation
    if (!addUserForm.full_name.trim() || !addUserForm.email.trim() || !addUserForm.password.trim()) {
      setAddUserError('All fields are required.');
      setAddUserLoading(false);
      return;
    }
    if (addUserForm.password.length < 8) {
      setAddUserError('Password must be at least 8 characters.');
      setAddUserLoading(false);
      return;
    }
    try {
      await apiService.createUser({
        full_name: addUserForm.full_name,
        email: addUserForm.email,
        password: addUserForm.password,
        role: addUserForm.role,
      });
      setSuccessMessage(`User ${addUserForm.email} has been successfully created.`);
      setAddUserModalOpen(false);
      // Optionally, refresh user list
      const usersData = await apiService.getUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err: any) {
      setAddUserError(err?.message || 'Failed to create user. Please try again.');
    } finally {
      setAddUserLoading(false);
    }
  };

  const ActionMenu = ({ user }: { user: User }) => {
    const [localAnchorEl, setLocalAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(localAnchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setLocalAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setLocalAnchorEl(null);
    };

    return (
      <>
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? `action-menu-${user.id}` : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <MoreVert />
        </IconButton>
        <Menu
          id={`action-menu-${user.id}`}
          anchorEl={localAnchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 140,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                '& .MuiMenuItem-root': {
                  fontSize: '0.875rem',
                  py: 1
                }
              }
            }
          }}
        >
          <MenuItemComponent onClick={() => { handleEditUser(user); handleClose(); }}>
            <Edit sx={{ mr: 1, fontSize: 18 }} />
            Edit
          </MenuItemComponent>
          <MenuItemComponent onClick={() => { handleViewActivity(user); handleClose(); }}>
            <Timeline sx={{ mr: 1, fontSize: 18 }} />
            View Activity
          </MenuItemComponent>
          <MenuItemComponent onClick={() => { handleBanUser(user); handleClose(); }}>
            <Block sx={{ mr: 1, fontSize: 18 }} />
            {user.status === 'Active' ? 'Ban' : 'Activate'}
          </MenuItemComponent>
          <MenuItemComponent 
            onClick={() => { handleDeleteUser(user); handleClose(); }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1, fontSize: 18 }} />
            Delete
          </MenuItemComponent>
        </Menu>
      </>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
            Loading users...
          </Typography>
        </div>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>
          <Typography variant="body1" color="error" sx={{ mb: 2, textAlign: 'center' }}>
            {error}
          </Typography>
          {lastFailedDeleteUser ? (
            <Button variant="contained" onClick={() => handleDeleteUser(lastFailedDeleteUser)}>
              Retry Delete
            </Button>
          ) : (
            <Button variant="contained" onClick={() => window.location.reload()}>
              Retry
            </Button>
          )}
        </div>
      </Box>
    );
  }

  return (
    <Box data-admin-root className="admin-page-root user-page" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page Title */}
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
        Users
      </Typography>

      {/* Filters, Search, and New User Button */}
  <Paper className="admin-paper filters-bar" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          {/* Role Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="role-filter-label" shrink>Role</InputLabel>
            <Select
              labelId="role-filter-label"
              value={roleFilter}
              label="Role"
              onChange={(e: SelectChangeEvent<string>) => setRoleFilter(e.target.value)}
              sx={{
                '& .MuiSelect-select': {
                  fontSize: 14,
                  lineHeight: '20px',
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px'
                }
              }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label" shrink>Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
                onChange={(e: SelectChangeEvent<string>) => setStatusFilter(e.target.value)}
              sx={{
                '& .MuiSelect-select': {
                  fontSize: 14,
                  lineHeight: '20px',
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px'
                }
              }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Banned">Banned</MenuItem>
            </Select>
          </FormControl>

          {/* Date Range */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Date:</Typography>
            <TextField
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{
                width: 150,
                '& .MuiOutlinedInput-root': { height: 36 },
                '& .MuiOutlinedInput-input': { fontSize: 14, padding: '6px 12px' }
              }}
            />
            <Typography variant="body2">—</Typography>
            <TextField
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{
                width: 150,
                '& .MuiOutlinedInput-root': { height: 36 },
                '& .MuiOutlinedInput-input': { fontSize: 14, padding: '6px 12px' }
              }}
            />
          </Stack>
        </Stack>

  <Stack direction="row" spacing={2} alignItems="center" sx={{ ml: 'auto' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, opacity: 0.85 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 180,
              maxWidth: 180,
              flex: '0 0 180px',
              '& .MuiOutlinedInput-root': { height: 36 },
              '& .MuiOutlinedInput-input': { fontSize: 13, padding: '4px 6px' }
            }}
          />

          {/* New User Button */}
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: 18 }} />}
            onClick={handleOpenAddUser}
            aria-label="Create new user"
            disableElevation
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: 13.5,
              borderRadius: 9999,
              px: 3,
              py: 1,
              height: 36,
              minHeight: 36,
              minWidth: 150,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              backgroundImage: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 60%, #38bdf8 100%)',
              color: '#fff',
              '&:hover': {
                filter: 'brightness(0.95)',
                backgroundImage: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 60%, #38bdf8 100%)'
              }
            }}
          >
            New User
          </Button>
        </Stack>
      </Paper>
      {/* Users Table with Material-UI */}
      <TableContainer 
        component={Paper} 
        className="admin-table-container"
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'auto',
          minWidth: 800 // Ensure minimum width for proper menu positioning
        }}
      >
  <Table stickyHeader className="admin-table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: '60px' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '240px' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '140px' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '100px' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '100px' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '120px' }}>Email Verified</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '110px' }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '80px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell sx={{ width: '60px' }}>{user.id}</TableCell>
                <TableCell sx={{ 
                  width: '240px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user.email}
                </TableCell>
                <TableCell sx={{ 
                  width: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user.full_name || '—'}
                </TableCell>
                <TableCell sx={{ width: '100px' }}>
                  <Chip
                    label={user.role}
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ width: '100px' }}>
                  <Chip
                    label={user.status}
                    size="small"
                    sx={{
                      bgcolor: user.status === 'Active' ? '#e8f5e8' : '#ffebee',
                      color: user.status === 'Active' ? '#2e7d32' : '#c62828',
                      '& .MuiChip-label': {
                        fontWeight: 500
                      }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '120px' }}>
                  <Chip
                    label={user.email ? 'Yes' : 'No'}
                    size="small"
                    sx={{
                      bgcolor: user.email ? '#e8f5e8' : '#fff3e0',
                      color: user.email ? '#2e7d32' : '#ef6c00',
                      '& .MuiChip-label': {
                        fontWeight: 500
                      }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ 
                  width: '110px',
                  fontSize: '0.875rem'
                }}>
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit'
                  })}
                </TableCell>
                <TableCell sx={{ width: '80px' }}>
                  <ActionMenu user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>

      {/* Edit User Dialog */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box component="form" sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={selectedUser.email}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                disabled
                margin="normal"
              />
              <TextField
                fullWidth
                label="Full Name"
                type="text"
                value={selectedUser.full_name || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedUser.role}
                  label="Role"
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedUser.status}
                  label="Status"
                  onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
                  disabled
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Banned">Banned</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => selectedUser && handleSaveUser(selectedUser)}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
            onSubmit={handleAddUserSubmit}
          >
            <TextField
              label="Full Name"
              name="full_name"
              value={addUserForm.full_name}
              onChange={handleAddUserChange}
              required
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={addUserForm.email}
              onChange={handleAddUserChange}
              required
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={addUserForm.password}
              onChange={handleAddUserChange}
              required
              fullWidth
              inputProps={{ minLength: 8, maxLength: 128 }}
              helperText="Password must be at least 8 characters."
            />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={addUserForm.role}
                  label="Role"
                  onChange={(e) => handleAddUserChange({ target: { name: 'role', value: (e as any).target.value } } as React.ChangeEvent<HTMLInputElement>)}
                >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            {addUserError && (
              <Alert severity="error">{addUserError}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserModalOpen(false)} disabled={addUserLoading}>Cancel</Button>
          <Button
            variant="contained"
            type="submit"
            disabled={addUserLoading}
            onClick={handleAddUserSubmit}
          >
            {addUserLoading ? 'Adding...' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Professional Activity & Engagement Dialog */}
      <Dialog
        open={activityDrawerOpen}
        onClose={() => setActivityDrawerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '85vh',
            maxHeight: '85vh',
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        {/* Compact Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 2,
            position: 'relative'
          }}
        >
          <IconButton
            onClick={() => setActivityDrawerOpen(false)}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <Close />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 6 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 600,
                flexShrink: 0
              }}
            >
              {selectedUser?.full_name?.charAt(0)?.toUpperCase() || selectedUser?.email?.charAt(0)?.toUpperCase() || 'U'}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'white' }}>
                  {selectedUser?.full_name || 'Unknown User'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.875rem' }}>
                  {selectedUser?.email}
                </Typography>
                <Chip
                  label={selectedUser?.role || 'User'}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 500,
                    height: 24,
                    fontSize: '0.75rem'
                  }}
                />
                <Chip
                  label={selectedUser?.status === 'Active' ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    bgcolor: selectedUser?.status === 'Active' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)',
                    color: 'white',
                    fontWeight: 500,
                    height: 24,
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ height: 'calc(100% - 80px)', display: 'flex', flexDirection: 'column' }}>
          {selectedUser && (
            <>
              {/* Enhanced Tabs */}
              <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'grey.50'
              }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(_e, newValue) => setActiveTab(newValue)}
                  sx={{ 
                    px: 2,
                    '& .MuiTab-root': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      minHeight: 48,
                      py: 1.5
                    }
                  }}
                  TabIndicatorProps={{
                    sx: {
                      height: 3,
                      borderRadius: '3px 3px 0 0'
                    }
                  }}
                >
                  <Tab 
                    icon={<Chat sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Chat Logs" 
                    value={0} 
                  />
                  <Tab 
                    icon={<EmojiEmotions sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Characters Created" 
                    value={1} 
                  />
                  <Tab 
                    icon={<BarChart sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Engagement Stats" 
                    value={2} 
                  />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {activeTab === 0 && selectedUser && (
                  <Box sx={{ height: '100%' }}>
                    <ChatLogs userId={selectedUser.id} />
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'grey.700' }}>
                      Created Characters ({characters.length})
                    </Typography>
                    {charactersLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                        <Typography variant="body1" color="text.secondary">Loading characters...</Typography>
                      </Box>
                    ) : characters.length > 0 ? (
                      <Paper 
                        sx={{ 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          overflow: 'hidden'
                        }}
                      >
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '25%' }}>Character</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '60%' }}>Character Details</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '15%' }}>Updated Date</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {characters.map((character) => (
                                <TableRow 
                                  key={character.id}
                                  sx={{ 
                                    '&:hover': { bgcolor: 'grey.50' },
                                    borderBottom: 1,
                                    borderColor: 'grey.100',
                                    height: 240
                                  }}
                                >
                                  <TableCell sx={{ width: '25%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, py: 2 }}>
                                      <Box
                                        component="img"
                                        src={character.image_url_s3 || undefined}
                                        alt={character.name}
                                        sx={{
                                          width: 160,
                                          height: 160,
                                          bgcolor: character.image_url_s3 ? 'transparent' : 'grey.200',
                                          color: 'grey.600',
                                          border: character.image_url_s3 ? '3px solid #e0e0e0' : 'none',
                                          objectFit: 'cover',
                                          fontSize: '3rem',
                                          fontWeight: 600,
                                          flexShrink: 0,
                                          borderRadius: 3,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                                          const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                                          if (sibling) sibling.style.display = 'flex';
                                        }}
                                      />
                                      <Box sx={{
                                        width: 160,
                                        height: 160,
                                        bgcolor: 'grey.200',
                                        color: 'grey.600',
                                        borderRadius: 3,
                                        display: 'none',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        fontSize: '3rem',
                                        fontWeight: 600
                                      }}>
                                        {character.name.charAt(0).toUpperCase()}
                                      </Box>
                                      
                                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 1, pt: 1 }}>
                                        <Typography 
                                          variant="h6" 
                                          sx={{ 
                                            fontWeight: 700,
                                            color: 'grey.900',
                                            fontSize: '1.3rem',
                                            lineHeight: 1.2,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          {character.name}
                                        </Typography>
                                        
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                          <Typography 
                                            variant="body2" 
                                            sx={{ 
                                              color: 'primary.main',
                                              fontSize: '1rem',
                                              fontWeight: 600
                                            }}
                                          >
                                            ID: {character.id}
                                          </Typography>
                                          <Typography 
                                            variant="body2" 
                                            sx={{ 
                                              color: 'grey.600',
                                              fontSize: '0.9rem'
                                            }}
                                          >
                                            User ID: {character.user_id}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Box>
                                  </TableCell>

                                  <TableCell sx={{ width: '60%' }}>
                                    <Box sx={{ py: 2 }}>
                                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: 'grey.500', fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                                            GENDER
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: 'grey.800', fontWeight: 600 }}>
                                            {character.gender}
                                          </Typography>
                                        </Box>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: 'grey.500', fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                                            AGE
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: 'grey.800', fontWeight: 600 }}>
                                            {character.age}
                                          </Typography>
                                        </Box>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: 'grey.500', fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                                            STYLE
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: 'grey.800', fontWeight: 600 }}>
                                            {character.style}
                                          </Typography>
                                        </Box>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: 'grey.500', fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                                            ETHNICITY
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: 'grey.800', fontWeight: 600 }}>
                                            {character.ethnicity}
                                          </Typography>
                                        </Box>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: 'grey.500', fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                                            BODY TYPE
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: 'grey.800', fontWeight: 600 }}>
                                            {character.body_type}
                                          </Typography>
                                        </Box>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: 'grey.500', fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                                            PERSONALITY
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: 'grey.800', fontWeight: 600 }}>
                                            {character.personality}
                                          </Typography>
                                        </Box>
                                      </Box>
                                      
                                      {character.user_query_instructions && (
                                        <Box sx={{ 
                                          mt: 2, 
                                          p: 2, 
                                          bgcolor: 'grey.50', 
                                          borderRadius: 1,
                                          border: '1px solid',
                                          borderColor: 'grey.200'
                                        }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                                            Instructions:
                                          </Typography>
                                          <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                                            {character.user_query_instructions.length > 100
                                              ? `${character.user_query_instructions.substring(0, 100)}...`
                                              : character.user_query_instructions
                                            }
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </TableCell>
                                  
                                  <TableCell sx={{ width: '15%' }}>
                                    <Typography variant="body2" sx={{ color: 'grey.600' }}>
                                      {new Date(character.updated_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center'
                      }}>
                        <EmojiEmotions sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No Characters Created
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          This user hasn't created any characters yet.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'grey.700' }}>
                      Engagement Analytics
                    </Typography>
                    {statsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                        <Typography variant="body1" color="text.secondary">Loading engagement data...</Typography>
                      </Box>
                    ) : engagementStats ? (
                      <Box sx={{ display: 'grid', gap: 3 }}>
                        {/* Key Metrics Grid */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                          <Card sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                                {engagementStats?.total_messages || 0}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Total Messages
                              </Typography>
                            </CardContent>
                          </Card>
                          
                          <Card sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                              <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main', mb: 1 }}>
                                {engagementStats?.total_sessions || 0}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Total Sessions
                              </Typography>
                            </CardContent>
                          </Card>
                          
                          <Card sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                                {engagementStats?.avg_messages_per_session?.toFixed(1) || '0'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Avg. Messages/Session
                              </Typography>
                            </CardContent>
                          </Card>
                          
                          <Card sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                                {engagementStats?.total_characters || 0}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Characters Used
                              </Typography>
                            </CardContent>
                          </Card>
                        </Box>

                        {/* Detailed Analytics */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
                          {/* Content Type Breakdown */}
                          <Card sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'grey.700' }}>
                                Content Type Distribution
                              </Typography>
                              <Box sx={{ display: 'grid', gap: 2 }}>
                                {Object.entries(engagementStats?.content_type_breakdown || {}).map(([type, count]) => (
                                  <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {type.replace('ContentType.', '')}
                                    </Typography>
                                    <Chip 
                                      label={count} 
                                      size="small" 
                                      color="primary" 
                                      variant="outlined"
                                    />
                                  </Box>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                          
                          {/* Role Breakdown */}
                          <Card sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'grey.700' }}>
                                Role Distribution
                              </Typography>
                              <Box sx={{ display: 'grid', gap: 2 }}>
                                {Object.entries(engagementStats?.role_breakdown || {}).map(([role, count]) => (
                                  <Box key={role} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                                      {role}
                                    </Typography>
                                    <Chip 
                                      label={count} 
                                      size="small" 
                                      color="secondary" 
                                      variant="outlined"
                                    />
                                  </Box>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>

                        {/* Character Traits */}
                        {Object.keys(engagementStats?.common_traits || {}).length > 0 && (
                          <Card sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'grey.700' }}>
                                Most Common Character Traits
                              </Typography>
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
                                {Object.entries(engagementStats?.common_traits || {}).map(([trait, values]) => (
                                  <Box key={trait}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, textTransform: 'capitalize', color: 'primary.main' }}>
                                      {trait.replace('_', ' ')}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                      {Object.entries(values).map(([value, count]) => (
                                        <Chip
                                          key={value}
                                          label={`${value} (${count})`}
                                          size="small"
                                          variant="outlined"
                                          sx={{ fontSize: '0.75rem' }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center'
                      }}>
                        <BarChart sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No Analytics Data
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Engagement statistics are not available for this user.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </Dialog>

    {/* Success Snackbar */}
    <Snackbar
      open={!!successMessage}
      autoHideDuration={6000}
      onClose={() => setSuccessMessage('')}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
        {successMessage}
      </Alert>
    </Snackbar>
    </Box>
  );
};

export default Users;
