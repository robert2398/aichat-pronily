import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  Collapse,
  Typography,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Card,
  CardContent,
  Stack,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface ChatLog {
  id: number;
  session_id: string;
  character_id: number;
  role: string;
  content_type: string;
  user_query: string;
  ai_message: string;
  audio_url_user: string | null;
  audio_url_output: string | null;
  duration_input: number | null;
  duration_output: number | null;
  created_at: string;
}

interface ChatLogsProps {
  userId?: number;
  characterId?: number;
  sessionId?: string;
  compact?: boolean;
}

const ChatLogs: React.FC<ChatLogsProps> = ({ userId, characterId, sessionId, compact = false }) => {
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCharacterId, setFilterCharacterId] = useState<string>('');
  const [filterSessionId, setFilterSessionId] = useState<string>('');
  const [filterContentType, setFilterContentType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(compact ? 5 : 10);

  useEffect(() => {
    fetchChatLogs();
  }, [userId, characterId, sessionId]);

  const fetchChatLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        user_id: userId,
        character_id: characterId,
        session_id: sessionId,
        per_page: 1000, // Get all logs for client-side filtering
      };

      const logs = await apiService.getChatLogs(filters);
      setChatLogs(logs);
      setFilteredLogs(logs);
    } catch (err) {
      setError('Failed to fetch chat logs');
      console.error('Error fetching chat logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = chatLogs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user_query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ai_message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCharacterId) {
      filtered = filtered.filter(log => log.character_id === parseInt(filterCharacterId));
    }

    if (filterSessionId) {
      filtered = filtered.filter(log => log.session_id.toLowerCase().includes(filterSessionId.toLowerCase()));
    }

    if (filterContentType) {
      filtered = filtered.filter(log => log.content_type === filterContentType);
    }

    if (startDate) {
      filtered = filtered.filter(log => new Date(log.created_at) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(log => new Date(log.created_at) <= new Date(endDate));
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterCharacterId, filterSessionId, filterContentType, startDate, endDate, chatLogs]);

  // Pagination
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              border: 3,
              borderColor: 'primary.light',
              borderTopColor: 'primary.main',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
          <Typography variant="body1" color="text.secondary">
            Loading chat logs...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button onClick={fetchChatLogs} variant="outlined" size="small">
            Retry
          </Button>
        }
        sx={{ my: 2 }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, width: '100%' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search in messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'grey.400', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  )
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
            </Box>
            <Box>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ 
                    minWidth: 120,
                    borderColor: 'grey.300',
                    color: 'grey.700',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'primary.50'
                    }
                  }}
                >
                  Filters
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* Advanced Filters */}
          <Collapse in={showFilters}>
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'grey.200' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ minWidth: 150, flex: '1 1 auto' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Character ID"
                    type="number"
                    value={filterCharacterId}
                    onChange={(e) => setFilterCharacterId(e.target.value)}
                    placeholder="Enter ID"
                  />
                </Box>
                
                <Box sx={{ minWidth: 150, flex: '1 1 auto' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Session ID"
                    value={filterSessionId}
                    onChange={(e) => setFilterSessionId(e.target.value)}
                    placeholder="Enter session"
                  />
                </Box>
                
                <Box sx={{ minWidth: 150, flex: '1 1 auto' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Content Type</InputLabel>
                    <Select
                      value={filterContentType}
                      onChange={(e) => setFilterContentType(e.target.value)}
                      label="Content Type"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="voice">Voice</MenuItem>
                      <MenuItem value="call">Call</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ minWidth: 150, flex: '1 1 auto' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                
                <Box sx={{ minWidth: 150, flex: '1 1 auto' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCharacterId('');
                    setFilterSessionId('');
                    setFilterContentType('');
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
                  Clear All
                </Button>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Professional Data Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          border: 1, 
          borderColor: 'grey.200', 
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <TableContainer sx={{ maxHeight: compact ? 400 : 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  bgcolor: 'grey.50', 
                  borderBottom: 2, 
                  borderColor: 'grey.200',
                  width: 150,
                  fontSize: '0.875rem'
                }}>
                  Session
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  bgcolor: 'grey.50', 
                  borderBottom: 2, 
                  borderColor: 'grey.200',
                  width: 100,
                  fontSize: '0.875rem'
                }}>
                  Character
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  bgcolor: 'grey.50', 
                  borderBottom: 2, 
                  borderColor: 'grey.200',
                  minWidth: 300,
                  fontSize: '0.875rem'
                }}>
                  User Query
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  bgcolor: 'grey.50', 
                  borderBottom: 2, 
                  borderColor: 'grey.200',
                  minWidth: 300,
                  fontSize: '0.875rem'
                }}>
                  AI Message
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  bgcolor: 'grey.50', 
                  borderBottom: 2, 
                  borderColor: 'grey.200',
                  width: 120,
                  fontSize: '0.875rem'
                }}>
                  User Audio
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  bgcolor: 'grey.50', 
                  borderBottom: 2, 
                  borderColor: 'grey.200',
                  width: 120,
                  fontSize: '0.875rem'
                }}>
                  User Duration
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  bgcolor: 'grey.50', 
                  borderBottom: 2, 
                  borderColor: 'grey.200',
                  width: 120,
                  fontSize: '0.875rem'
                }}>
                  AI Audio
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  bgcolor: 'grey.50', 
                  borderBottom: 2, 
                  borderColor: 'grey.200',
                  width: 180,
                  fontSize: '0.875rem'
                }}>
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentLogs.map((log) => (
                <TableRow 
                  key={log.id} 
                  sx={{ 
                    '&:hover': { bgcolor: 'grey.50' },
                    '&:nth-of-type(even)': { bgcolor: 'grey.25' }
                  }}
                >
                  <TableCell>
                    <Chip
                      label={`${log.session_id.substring(0, 8)}...`}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        bgcolor: 'grey.100',
                        borderColor: 'grey.300'
                      }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'grey.700'
                      }}
                    >
                      {log.character_id}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Tooltip title={log.user_query} placement="top">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.875rem',
                          color: 'grey.700'
                        }}
                      >
                        {truncateText(log.user_query, 100)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  
                  <TableCell>
                    <Tooltip title={log.ai_message} placement="top">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.875rem',
                          color: 'grey.700'
                        }}
                      >
                        {truncateText(log.ai_message, 100)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  
                  <TableCell>
                    {log.audio_url_user ? (
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(log.audio_url_user!, `user_audio_${log.id}.mp3`)}
                        sx={{ color: 'primary.main' }}
                      >
                        <DownloadIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'grey.400', fontSize: '0.875rem' }}>
                        —
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'grey.600' }}>
                      {log.duration_input ? `${log.duration_input}s` : '—'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {log.audio_url_output ? (
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(log.audio_url_output!, `ai_audio_${log.id}.mp3`)}
                        sx={{ color: 'secondary.main' }}
                      >
                        <DownloadIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'grey.400', fontSize: '0.875rem' }}>
                        —
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'grey.600' }}>
                      {formatDate(log.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Empty State */}
        {filteredLogs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <MessageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'grey.600', mb: 1 }}>
              No chat logs found
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              {searchTerm || filterCharacterId || filterSessionId || filterContentType || startDate || endDate
                ? 'Try adjusting your filters to see more results.'
                : 'Chat logs will appear here when available.'}
            </Typography>
          </Box>
        )}

        {/* Professional Pagination */}
        {filteredLogs.length > 0 && (
          <TablePagination
            component="div"
            count={filteredLogs.length}
            page={currentPage - 1}
            onPageChange={(_, newPage) => setCurrentPage(newPage + 1)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            showFirstButton
            showLastButton
            sx={{
              borderTop: 1,
              borderColor: 'grey.200',
              bgcolor: 'grey.50',
              '& .MuiTablePagination-toolbar': {
                minHeight: 56
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.875rem',
                color: 'grey.600'
              }
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default ChatLogs;