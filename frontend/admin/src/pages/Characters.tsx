import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Stack,
  Card,
  CardContent
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
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
  const [expandedBios, setExpandedBios] = useState<Set<number>>(new Set());
  const fetchedPages = useRef<Set<string>>(new Set()); // Track which pages we've fetched

  const navigate = useNavigate();
  
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
    <Box data-admin-root className="admin-page-root user-page" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
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
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      alignItems="center"
      sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
    >
  {/* Search – narrower (200px on md+) */}
  <Box sx={{ width: { xs: '100%', md: 220 } }}>
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
              '&:hover': { backgroundColor: 'white' },
              '&.Mui-focused': { backgroundColor: 'white' },
            },
          }}
        />
      </Box>

      {/* Filters label */}
      {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterListIcon sx={{ color: 'grey.600', fontSize: 20 }} />
        <Typography variant="body2" sx={{ color: 'grey.600', fontWeight: 500 }}>
          Filters:
        </Typography>
      </Box> */}

      {/* Created By */}
      <Box sx={{ width: { xs: '100%', sm: 200, md: 170 } }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Created By</InputLabel>
          <Select value={createdByFilter} onChange={(e) => setCreatedByFilter(e.target.value)} label="Created By">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* User ID – narrower */}
      <Box sx={{ width: { xs: '50%', sm: 140, md: 110 } }}>
        <TextField
          size="small"
          label="User ID"
          value={userIdFilter}
          onChange={(e) => setUserIdFilter(e.target.value)}
          type="number"
          fullWidth
        />
      </Box>

      {/* From / To */}
      <Box sx={{ width: { xs: '50%', sm: 160, md: 150 } }}>
        <TextField
          size="small"
          label="From Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Box>
      <Box sx={{ width: { xs: '50%', sm: 160, md: 150 } }}>
        <TextField
          size="small"
          label="To Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Box>

      {(createdByFilter || userIdFilter || startDate || endDate) && (
        <Box sx={{ width: { xs: '50%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => { setCreatedByFilter(''); setUserIdFilter(''); setStartDate(''); setEndDate(''); }}
            sx={{ color: 'grey.600', borderColor: 'grey.300',
              '&:hover': { borderColor: 'error.main', backgroundColor: 'error.50', color: 'error.main' } }}
          >
            Clear
          </Button>
        </Box>
      )}

      {/* Create Character – WIDER and pinned right on md+ */}
      <Box sx={{ ml: { md: 'auto' } }}>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          onClick={() => navigate('/create-character')}
          aria-label="Create Character"
          data-testid="create-character-btn"
          disableElevation
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: 14, borderRadius: 9999,
            px: 3.5, height: 40, minWidth: 200, color: '#fff',
            backgroundImage: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 60%, #38bdf8 100%)',
            '&:hover': { filter: 'brightness(0.95)', backgroundImage: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 60%, #38bdf8 100%)' },
          }}
        >
          Create Character
        </Button>
      </Box>
    </Stack>
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
          <Table size="small" sx={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '23%' }}>Character</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '16%' }}>Character Details</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '32%' }}>Appearance & Personality</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '10%' }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '12%' }}>Updated Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700', width: '7%' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCharacters.map((character) => {
                // Normalize backend variations for appearance_personality and bio (trimmed)
                const ap = (character as any).appearance_personality ?? {};
                const clothing        = String((character as any).clothing ?? ap.clothing ?? '').trim();
                const features        = String((character as any).features ?? ap.features ?? '').trim();
                const specialRaw      = (character as any).special_features ?? ap.special_features;
                const specialFeatures = String(specialRaw == null ? '' : specialRaw).trim();
                const personality     = String((character as any).personality ?? ap.personality ?? '').trim();
                const voice           = String((character as any).voice_type ?? ap.voice ?? '').trim();
                const relationship    = String((character as any).relationship_type ?? ap.relationship ?? '').trim();
                const bio             = String((character as any).bio ?? (character as any).description ?? '').trim();

                return (
                <React.Fragment key={character.id}>
                <TableRow 
                  sx={{ 
                    '&:hover': { bgcolor: 'grey.50' },
                    borderBottom: 1,
                    borderColor: 'grey.100',
                  }}
                >
                  <TableCell sx={{ width: '23%', py: 1.25, pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      {/* Avatar */}
                      <Avatar
                        src={!failedImages.has(character.id) && presignedUrls[character.id] ? presignedUrls[character.id] : undefined}
                        sx={{ 
                          width: 120, 
                          height: 120,
                          bgcolor: (!failedImages.has(character.id) && presignedUrls[character.id]) ? 'transparent' : failedImages.has(character.id) ? '#ffebee' : 'grey.200',
                          color: failedImages.has(character.id) ? '#d32f2f' : 'grey.600',
                          border: (!failedImages.has(character.id) && presignedUrls[character.id]) ? '2px solid #e0e0e0' : failedImages.has(character.id) ? '2px solid #ffcdd2' : 'none',
                          objectFit: 'cover',
                          fontSize: failedImages.has(character.id) ? '0.7rem' : '2rem',
                          fontWeight: 600,
                          borderRadius: 3,
                          flexShrink: 0,
                        }}
                        onError={() => handleImageError(character.id, character.name, character.image_url_s3 || undefined)}
                        onLoad={() => handleImageLoad(character.name)}
                      >
                        {failedImages.has(character.id) ? (
                          <>
                            <Typography sx={{ fontSize: '1.6rem', mb: 0.5 }}>
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

                      {/* Character Info */}
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                        <Typography sx={{ fontWeight: 600, color: 'grey.900', fontSize: '0.8rem', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {character.name}
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                          <Typography variant="body2" sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 600 }}>
                            ID: {character.id}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'secondary.main', fontSize: '0.75rem', fontWeight: 600 }}>
                            User ID: {character.user_id}
                          </Typography>
                        </Box>

                        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                          <Typography variant="body2" sx={{ color: 'grey.700', fontSize: '0.75rem', fontWeight: 500 }}>
                            Age: {character.age}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'grey.700', fontSize: '0.75rem' }}>
                            {character.style}
                          </Typography>
                          {relationship && (
                            <Typography variant="body2" sx={{ color: 'grey.700', fontSize: '0.75rem' }}>
                              {relationship}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  {/* Character Details (core identity) - header label removed to save space */}
                  <TableCell sx={{ width: '16%', p: 1, textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15, pl: 1, pr: 0.5, py: 1.25, pb: 1, alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        <strong>Ethnicity:</strong> {character.ethnicity}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        <strong>Eyes:</strong> {character.eye_colour}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        <strong>Hair:</strong> {character.hair_colour} {character.hair_style}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        <strong>Body:</strong> {character.body_type}
                      </Typography>
                      {character.breast_size && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>Breast:</strong> {character.breast_size}
                        </Typography>
                      )}
                      {character.butt_size && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>Butt:</strong> {character.butt_size}
                        </Typography>
                      )}
                      {character.dick_size && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>Dick:</strong> {character.dick_size}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Appearance & Personality using normalized values (includes Bio) */}
                  <TableCell sx={{ width: '32%', p: 1, textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15, pl: 0.5, pr: 0.5, pt: 0, pb: 1, alignItems: 'flex-start' }}>
                      {clothing && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>Clothing:</strong> {clothing}
                        </Typography>
                      )}
                      {features && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>Features:</strong> {features}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        <strong>Special Features:</strong> {specialFeatures || '—'}
                      </Typography>
                      {personality && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>Personality:</strong> {personality}
                        </Typography>
                      )}
                      {voice && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>Voice:</strong> {voice}
                        </Typography>
                      )}
                      {/* Relationship moved to Character column */}

                      {/* Inline Bio inside A&P column (keeps existing truncation + toggle) */}
                      {bio && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'inherit',
                            fontSize: '0.75rem',
                            mt: 0.5,
                            width: '100%',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            whiteSpace: 'pre-wrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Box component="span" sx={{ fontWeight: 600 }}>
                            Bio :
                          </Box>
                          <Box component="span" sx={{ display: 'inline' }}>
                            {bio.length > 300 ? (
                              <>
                                {expandedBios.has(character.id) ? bio : `${bio.slice(0, 300)}...`}
                                <Button
                                  size="small"
                                  onClick={() => {
                                    const next = new Set(expandedBios);
                                    next.has(character.id) ? next.delete(character.id) : next.add(character.id);
                                    setExpandedBios(next);
                                  }}
                                  sx={{ ml: 1, textTransform: 'none', p: 0, minWidth: 0 }}
                                >
                                  {expandedBios.has(character.id) ? 'Show less' : 'Show more'}
                                </Button>
                              </>
                            ) : (
                              bio
                            )}
                          </Box>
                        </Typography>
                      )}
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

                {/* bio now inlined into the Appearance & Personality column */}
                </React.Fragment>
              );
              })}
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
  </Box>
  );
};
