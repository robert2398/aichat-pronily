import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Stack,
  Alert,
  Snackbar
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Add,
  Search,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Config } from '../services/api';

export const Settings: React.FC = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<Config[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<Config | null>(null);
  
  // Form states
  const [editForm, setEditForm] = useState({
    parameter_value: '',
    parameter_description: ''
  });
  const [addForm, setAddForm] = useState({
    parameter_name: '',
    parameter_value: '',
    parameter_description: '',
    category: ''
  });
  
  // Notification states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Action Menu Component
  const ActionMenu = ({ config }: { config: Config }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleEdit = () => {
      setSelectedConfig(config);
      setEditForm({
        parameter_value: config.parameter_value,
        parameter_description: config.parameter_description
      });
      setEditDialogOpen(true);
      handleClose();
    };

    const handleDelete = () => {
      setSelectedConfig(config);
      setDeleteDialogOpen(true);
      handleClose();
    };

    return (
      <>
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? `action-menu-${config.id}` : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <MoreVert />
        </IconButton>
        <Menu
          id={`action-menu-${config.id}`}
          anchorEl={anchorEl}
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
          <MenuItemComponent onClick={handleEdit}>
            <Edit sx={{ mr: 1, fontSize: 18 }} />
            Edit
          </MenuItemComponent>
          <MenuItemComponent 
            onClick={handleDelete}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1, fontSize: 18 }} />
            Delete
          </MenuItemComponent>
        </Menu>
      </>
    );
  };
  // Fetch configurations
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getConfigs();
        setConfigs(data);
        const uniqueCategories = [...new Set(data.map(c => c.category))].sort();
        setCategories(uniqueCategories);
      } catch (error: any) {
        console.error("Failed to fetch configs", error);
        setError(`Failed to fetch configurations: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = configs;
    if (selectedCategory) {
      result = result.filter(c => c.category === selectedCategory);
    }
    if (searchTerm) {
      result = result.filter(c => 
        c.parameter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.parameter_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.parameter_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredConfigs(result);
    setPage(0); // Reset to first page
  }, [selectedCategory, searchTerm, configs]);

  // Pagination
  const currentConfigs = filteredConfigs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // CRUD operations
  const handleSaveEdit = async () => {
    if (!selectedConfig) return;
    
    try {
      await apiService.updateConfig(selectedConfig.id, {
        parameter_value: editForm.parameter_value,
        parameter_description: editForm.parameter_description
      });
      
      // Refresh data
      const data = await apiService.getConfigs();
      setConfigs(data);
      setEditDialogOpen(false);
      setSelectedConfig(null);
      setSuccessMessage('Configuration updated successfully!');
    } catch (error) {
      console.error("Failed to save config", error);
      setErrorMessage('Failed to update configuration.');
    }
  };

  const handleAddConfig = async () => {
    try {
      await apiService.createConfig(addForm);
      
      // Refresh data
      const data = await apiService.getConfigs();
      setConfigs(data);
      setAddDialogOpen(false);
      setAddForm({
        parameter_name: '',
        parameter_value: '',
        parameter_description: '',
        category: ''
      });
      setSuccessMessage('Configuration added successfully!');
    } catch (error) {
      console.error("Failed to add config", error);
      setErrorMessage('Failed to add configuration.');
    }
  };

  const handleDeleteConfig = async () => {
    if (!selectedConfig) return;
    
    try {
      await apiService.deleteConfig(selectedConfig.id);
      
      // Refresh data
      const data = await apiService.getConfigs();
      setConfigs(data);
      setDeleteDialogOpen(false);
      setSelectedConfig(null);
      setSuccessMessage('Configuration deleted successfully!');
    } catch (error) {
      console.error("Failed to delete config", error);
      setErrorMessage('Failed to delete configuration.');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'system': 'primary',
      'api': 'secondary',
      'security': 'error',
      'feature': 'success',
      'ui': 'warning'
    };
    return colors[category as keyof typeof colors] || 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading configurations...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Settings & Configuration
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ height: 40 }}
          >
            Add Configuration
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search configurations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
              {filteredConfigs.length} configuration{filteredConfigs.length !== 1 ? 's' : ''} total
            </Typography>
          </Stack>
        </Paper>

        {/* Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'auto'
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '60px' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '200px' }}>Parameter Name</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '250px' }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '300px' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '120px' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '120px' }}>Last Updated</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '80px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentConfigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm || selectedCategory ? 'No configurations match the current filters.' : 'No configurations found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                currentConfigs.map((config) => (
                  <TableRow key={config.id} hover>
                    <TableCell sx={{ width: '60px' }}>{config.id}</TableCell>
                    <TableCell sx={{ 
                      width: '200px',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {config.parameter_name}
                    </TableCell>
                    <TableCell sx={{ 
                      width: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {config.parameter_value}
                    </TableCell>
                    <TableCell sx={{ 
                      width: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {config.parameter_description}
                    </TableCell>
                    <TableCell sx={{ width: '120px' }}>
                      <Chip
                        label={config.category}
                        color={getCategoryColor(config.category) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      width: '120px',
                      fontSize: '0.875rem'
                    }}>
                      {config.updated_at ? new Date(config.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit'
                      }) : '—'}
                    </TableCell>
                    <TableCell sx={{ width: '80px' }}>
                      <ActionMenu config={config} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredConfigs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </TableContainer>
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Configuration</DialogTitle>
        <DialogContent>
          {selectedConfig && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Parameter: <strong>{selectedConfig.parameter_name}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Value"
                value={editForm.parameter_value}
                onChange={(e) => setEditForm(prev => ({ ...prev, parameter_value: e.target.value }))}
                margin="normal"
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Description"
                value={editForm.parameter_description}
                onChange={(e) => setEditForm(prev => ({ ...prev, parameter_description: e.target.value }))}
                margin="normal"
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Parameter Name"
              value={addForm.parameter_name}
              onChange={(e) => setAddForm(prev => ({ ...prev, parameter_name: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Value"
              value={addForm.parameter_value}
              onChange={(e) => setAddForm(prev => ({ ...prev, parameter_value: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={addForm.parameter_description}
              onChange={(e) => setAddForm(prev => ({ ...prev, parameter_description: e.target.value }))}
              margin="normal"
              multiline
              rows={2}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Category</InputLabel>
              <Select
                value={addForm.category}
                label="Category"
                onChange={(e) => setAddForm(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
                <MenuItem value="new">Add New Category...</MenuItem>
              </Select>
            </FormControl>
            {addForm.category === 'new' && (
              <TextField
                fullWidth
                label="New Category Name"
                onChange={(e) => setAddForm(prev => ({ ...prev, category: e.target.value }))}
                margin="normal"
                required
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddConfig} 
            variant="contained"
            disabled={!addForm.parameter_name || !addForm.parameter_value || !addForm.category}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Configuration</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the configuration "{selectedConfig?.parameter_name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfig} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={() => setErrorMessage('')}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};
