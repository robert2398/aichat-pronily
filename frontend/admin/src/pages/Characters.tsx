import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Button,
  TextField,
  InputAdornment,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { apiService, type Character } from '../services/api';
import { CreateCharacterModal } from '../components/CreateCharacterModal';

export const Characters: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [presignedUrls, setPresignedUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [_selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const fetchedPages = useRef<Set<string>>(new Set()); // Track which pages we've fetched
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCharacter, setEditCharacter] = useState<Character | null>(null);
  
  // Filter states
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleImageError = (characterId: number, characterName: string, s3Path?: string) => {
    console.log('Image failed to load for character:', characterName, 'URL:', s3Path);
    setFailedImages(prev => new Set([...prev, characterId]));
  };

  const handleImageLoad = (characterName: string) => {
    console.log('Image loaded successfully for character:', characterName);
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    // Filter characters based on search term and filters
    let filtered = characters.filter(character =>
      character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.creator_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.ethnicity.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply Created By filter
    if (createdByFilter) {
      filtered = filtered.filter(character => character.creator_role === createdByFilter);
    }

    // Apply User ID filter
    if (userIdFilter) {
      filtered = filtered.filter(character => character.user_id.toString().includes(userIdFilter));
    }

    // Apply date range filter
    if (startDate) {
      filtered = filtered.filter(character => new Date(character.updated_at) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(character => new Date(character.updated_at) <= new Date(endDate));
    }

    setFilteredCharacters(filtered);
    setPage(0); // Reset to first page when filtering
    
    // Clear fetched pages cache when search changes
    fetchedPages.current.clear();
  }, [characters, searchTerm, createdByFilter, userIdFilter, startDate, endDate]);

  // Fetch presigned URLs only when page changes (for navigation)
  useEffect(() => {
    if (filteredCharacters.length > 0 && page > 0) { // Only for page > 0 to avoid initial load
      const startIndex = page * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const pageCharacters = filteredCharacters.slice(startIndex, endIndex);
      const pageKey = `${searchTerm}-${page}-${rowsPerPage}`;
      console.log('Page navigation effect triggered - Page:', page, 'Characters on page:', pageCharacters.length, 'Page key:', pageKey);
      fetchPresignedUrlsForPage(pageCharacters, pageKey);
    }
  }, [page]); // Only depend on page changes

  // Initial load of presigned URLs for first page
  useEffect(() => {
    if (filteredCharacters.length > 0) {
      const pageCharacters = filteredCharacters.slice(0, rowsPerPage);
      const pageKey = `${searchTerm}-0-${rowsPerPage}`;
      console.log('Initial/search effect triggered - Characters on first page:', pageCharacters.length, 'Page key:', pageKey);
      fetchPresignedUrlsForPage(pageCharacters, pageKey);
    }
  }, [filteredCharacters, rowsPerPage]); // When filteredCharacters first loads or search changes

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCharacters();
      console.log('Fetched characters:', data);
      
      // The API now returns the new format directly, so we don't need transformation
      setCharacters(data);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch characters. Please try again.');
      console.error('Error fetching characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPresignedUrlsForPage = async (pageCharacters: Character[], pageKey: string) => {
    // Avoid fetching if we've already fetched this page
    if (fetchedPages.current.has(pageKey)) {
      console.log('Skipping fetch for already fetched page:', pageKey);
      return;
    }

    try {
      // Create payload for ALL characters that have S3 images (remove the presignedUrls check)
      const payload: Record<number, string> = {};
      pageCharacters.forEach(character => {
        if (character.image_url_s3) {
          payload[character.id] = character.image_url_s3;
        }
      });

      if (Object.keys(payload).length === 0) {
        fetchedPages.current.add(pageKey); // Mark as fetched even if no new URLs
        console.log('No S3 images found for page:', pageKey);
        return; // No images to fetch URLs for
      }

      console.log('Fetching presigned URLs for page:', pageKey, 'Total characters on page:', pageCharacters.length, 'Characters with S3 images:', Object.keys(payload).length, 'Character IDs:', Object.keys(payload));
      const newPresignedUrls = await apiService.getPresignedUrlsByIds(payload);
      
      // Update presigned URLs state without modifying characters
      setPresignedUrls(prev => ({
        ...prev,
        ...newPresignedUrls
      }));

      // Mark this page as fetched
      fetchedPages.current.add(pageKey);
      
    } catch (err) {
      console.error('Error fetching presigned URLs:', err);
      // Don't show error to user as this is not critical
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, character: Character) => {
    setAnchorEl(event.currentTarget);
    setSelectedCharacter(character);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCharacter(null);
  };

  const handleEditCharacter = (character: Character) => {
    setEditCharacter(character);
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleEditSuccess = () => {
    fetchCharacters(); // Refresh the list
    setEditModalOpen(false);
    setEditCharacter(null);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    console.log('Changing to page:', newPage);
    setPage(newPage);
    // Presigned URLs will be fetched automatically by useEffect
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log('Changing rows per page to:', newRowsPerPage, 'Current page:', page);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    
    // Clear the cache since page size changed
    fetchedPages.current.clear();
    
    // Immediately fetch for the first page with new page size
    if (filteredCharacters.length > 0) {
      const pageCharacters = filteredCharacters.slice(0, newRowsPerPage);
      const pageKey = `${searchTerm}-0-${newRowsPerPage}`;
      fetchPresignedUrlsForPage(pageCharacters, pageKey);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={fetchCharacters} variant="outlined">
          Retry
        </Button>
      </Container>
    );
  }

  // Calculate pagination
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCharacters = filteredCharacters.slice(startIndex, endIndex);

  // Debug logging (simplified)
  console.log('Character Management - Page:', page + 1, 'Showing:', paginatedCharacters.length, 'of', filteredCharacters.length, 'total characters');

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600,
            color: 'grey.900',
            mb: 1
          }}
        >
          Character Management
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'grey.600',
            maxWidth: 600
          }}
        >
          Manage AI characters created by users and admins across the platform.
        </Typography>
      </Box>

      {/* Header Actions with Filters */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ pb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Field */}
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Search characters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'grey.400' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'grey.50',
                    '&:hover': {
                      backgroundColor: 'white',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    }
                  }
                }}
              />
            </Grid>

            {/* Filters */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterListIcon sx={{ color: 'grey.600', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: 'grey.600', fontWeight: 500 }}>
                    Filters:
                  </Typography>
                </Box>

                {/* Created By Filter */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Created By</InputLabel>
                  <Select
                    value={createdByFilter}
                    onChange={(e) => setCreatedByFilter(e.target.value)}
                    label="Created By"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                  </Select>
                </FormControl>

                {/* User ID Filter */}
                <TextField
                  size="small"
                  label="User ID"
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  sx={{ minWidth: 100 }}
                  type="number"
                  placeholder="Enter ID"
                />

                {/* Date Range Filters */}
                <TextField
                  size="small"
                  label="From Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 140 }}
                />

                <TextField
                  size="small"
                  label="To Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 140 }}
                />

                {/* Clear Filters Button */}
                {(createdByFilter || userIdFilter || startDate || endDate) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setCreatedByFilter('');
                      setUserIdFilter('');
                      setStartDate('');
                      setEndDate('');
                    }}
                    sx={{ 
                      color: 'grey.600',
                      borderColor: 'grey.300',
                      '&:hover': {
                        borderColor: 'error.main',
                        backgroundColor: 'error.50',
                        color: 'error.main'
                      }
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Characters Table */}
      <Paper 
        elevation={0}
        sx={{ 
          border: 1,
          borderColor: 'grey.200',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '20%' }}>Character</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '45%' }}>Character Details</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '12%' }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '13%' }}>Updated Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '10%' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCharacters.map((character) => (
                <TableRow 
                  key={character.id}
                  sx={{ 
                    '&:hover': { bgcolor: 'grey.50' },
                    borderBottom: 1,
                    borderColor: 'grey.100',
                    height: 240 // Increased height to accommodate larger 160px avatar and better spacing
                  }}
                >
                  <TableCell sx={{ width: '20%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, py: 2 }}>
                      {/* Larger Avatar taking more prominent space */}
                      <Avatar
                        src={!failedImages.has(character.id) && presignedUrls[character.id] ? presignedUrls[character.id] : undefined}
                        sx={{ 
                          width: 160, 
                          height: 160,
                          bgcolor: (!failedImages.has(character.id) && presignedUrls[character.id]) ? 'transparent' : failedImages.has(character.id) ? '#ffebee' : 'grey.200',
                          color: failedImages.has(character.id) ? '#d32f2f' : 'grey.600',
                          border: (!failedImages.has(character.id) && presignedUrls[character.id]) ? '3px solid #e0e0e0' : failedImages.has(character.id) ? '3px solid #ffcdd2' : 'none',
                          objectFit: 'cover',
                          fontSize: failedImages.has(character.id) ? '0.75rem' : '3rem',
                          fontWeight: 600,
                          flexShrink: 0,
                          borderRadius: 3, // More rounded corners for better aesthetics
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onError={() => handleImageError(character.id, character.name, character.image_url_s3 || undefined)}
                        onLoad={() => handleImageLoad(character.name)}
                      >
                        {failedImages.has(character.id) ? (
                          <>
                            <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>
                              {character.name.charAt(0).toUpperCase()}
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', textAlign: 'center', fontWeight: 500 }}>
                              Image<br />Expired
                            </Typography>
                          </>
                        ) : !presignedUrls[character.id] ? (
                          character.name.charAt(0).toUpperCase()
                        ) : undefined}
                      </Avatar>
                      
                      {/* Character Info positioned to the right of avatar */}
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
                              color: 'secondary.main',
                              fontSize: '1rem',
                              fontWeight: 600
                            }}
                          >
                            User ID: {character.user_id}
                          </Typography>
                        </Box>
                        
                        {/* Character details with larger fonts and better spacing */}
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'grey.700',
                              fontSize: '1rem',
                              fontWeight: 500
                            }}
                          >
                            {character.gender} • {character.age} years
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'grey.700',
                              fontSize: '1rem'
                            }}
                          >
                            {character.style} style
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ width: '45%' }}>
                    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                      {/* Core Identity Column */}
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: 'primary.main', 
                            mb: 1,
                            fontSize: '0.875rem',
                            borderBottom: '2px solid',
                            borderColor: 'primary.main',
                            pb: 0.5
                          }}
                        >
                          Core Identity
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            <strong>Ethnicity:</strong> {character.ethnicity}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            <strong>Eyes:</strong> {character.eye_colour}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            <strong>Hair:</strong> {character.hair_colour} {character.hair_style}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            <strong>Body:</strong> {character.body_type}
                          </Typography>
                          {character.breast_size && (
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              <strong>Breast:</strong> {character.breast_size}
                            </Typography>
                          )}
                          {character.butt_size && (
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              <strong>Butt:</strong> {character.butt_size}
                            </Typography>
                          )}
                          {character.dick_size && (
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              <strong>Dick:</strong> {character.dick_size}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Appearance Column */}
                      <Box sx={{ 
                        flex: 1, 
                        pl: 1, 
                        borderLeft: '1px solid', 
                        borderColor: 'grey.200' 
                      }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: 'secondary.main', 
                            mb: 1,
                            fontSize: '0.875rem',
                            borderBottom: '2px solid',
                            borderColor: 'secondary.main',
                            pb: 0.5
                          }}
                        >
                          Appearance & Personality
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            <strong>Clothing:</strong> {character.clothing}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            <strong>Features:</strong> {character.special_features}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            <strong>Personality:</strong> {character.personality}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            <strong>Voice:</strong> {character.voice_type}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            <strong>Relationship:</strong> {character.relationship_type}
                          </Typography>
                          {character.user_query_instructions && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: '0.8rem',
                                mt: 0.5,
                                p: 1,
                                bgcolor: 'grey.50',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'grey.200'
                              }}
                            >
                              <strong>Instructions:</strong> 
                              <br />
                              {character.user_query_instructions.length > 100 
                                ? `${character.user_query_instructions.substring(0, 100)}...`
                                : character.user_query_instructions
                              }
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={character.creator_role}
                      size="small"
                      sx={{
                        bgcolor: character.creator_role === 'admin' ? '#e8f5e8' : '#fff3e0',
                        color: character.creator_role === 'admin' ? '#2e7d32' : '#f57c00',
                        fontWeight: 500,
                        border: 'none'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'grey.600' }}>
                      {formatDate(character.updated_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, character)}
                      size="small"
                      sx={{ color: 'grey.600' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCharacters.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: 1,
            borderColor: 'grey.200',
            '& .MuiTablePagination-toolbar': {
              px: 2,
            },
          }}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => _selectedCharacter && handleEditCharacter(_selectedCharacter)}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit Character
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete Character
        </MenuItem>
      </Menu>

      {/* Empty State */}
      {filteredCharacters.length === 0 && !loading && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            mt: 4
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, color: 'grey.500' }}>
            No characters found
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first character to get started'}
          </Typography>
        </Box>
      )}

      {/* Edit Character Modal */}
      <CreateCharacterModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditCharacter(null);
        }}
        onSuccess={handleEditSuccess}
        editCharacter={editCharacter}
      />
    </Container>
  );
};
