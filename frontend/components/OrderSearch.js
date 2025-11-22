import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useOrderHistory } from './OrderHistoryContext';

const OrderSearch = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { filters, updateFilters } = useOrderHistory();
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      updateFilters({ search: value });
    }, 500),
    [updateFilters]
  );

  useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue, debouncedSearch]);

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    updateFilters({ search: '' });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      updateFilters({ search: searchValue });
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search by order ID or product name..."
        value={searchValue}
        onChange={handleSearchChange}
        onKeyPress={handleKeyPress}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchValue && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClearSearch}
                edge="end"
                aria-label="clear search"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: theme.shape.borderRadius,
          },
        }}
      />
    </Box>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default OrderSearch;