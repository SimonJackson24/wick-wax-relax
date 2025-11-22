import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  CircularProgress,
  ClickAwayListener,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ShoppingCart as ProductIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axios from 'axios';
import { debounce } from 'lodash';

const SearchBar = ({
  placeholder = "Search products...",
  onSearch,
  showSuggestions = true,
  showPopular = true,
  compact = false,
  fullWidth = true,
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=8`);
        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('Search suggestions error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Load popular searches on mount
  useEffect(() => {
    if (showPopular) {
      loadPopularSearches();
    }
  }, [showPopular]);

  // Handle search input changes
  useEffect(() => {
    if (query && showSuggestions) {
      debouncedSearch(query);
    } else {
      setSuggestions([]);
    }

    if (query) {
      setShowDropdown(true);
    }
  }, [query, debouncedSearch, showSuggestions]);

  const loadPopularSearches = async () => {
    try {
      const response = await axios.get('/api/search/popular?limit=5');
      setPopularSearches(response.data.popularSearches || []);
    } catch (error) {
      console.error('Popular searches error:', error);
      setPopularSearches([]);
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setShowDropdown(false);
    setQuery(searchQuery);

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Default behavior: navigate to products page with search query
      router.push({
        pathname: '/products',
        query: { q: searchQuery }
      });
    }
  };

  const handleKeyDown = (event) => {
    if (!showDropdown || suggestions.length === 0) {
      if (event.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.suggestion);
    setShowDropdown(false);
    handleSearch(suggestion.suggestion);
  };

  const handlePopularClick = (popularTerm) => {
    setQuery(popularTerm);
    handleSearch(popularTerm);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'product':
        return <ProductIcon color="primary" />;
      case 'category':
        return <CategoryIcon color="secondary" />;
      case 'sku':
        return <TagIcon color="action" />;
      default:
        return <SearchIcon color="action" />;
    }
  };

  const renderDropdown = () => {
    if (!showDropdown) return null;

    return (
      <ClickAwayListener onClickAway={() => setShowDropdown(false)}>
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 400,
            overflow: 'auto',
            borderRadius: '0 0 8px 8px',
            boxShadow: theme.shadows[8],
          }}
        >
          <List dense>
            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <>
                {suggestions.map((suggestion, index) => (
                  <ListItem
                    key={`${suggestion.type}-${index}`}
                    button
                    onClick={() => handleSuggestionClick(suggestion)}
                    selected={selectedIndex === index}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.action.selected,
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getSuggestionIcon(suggestion.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={suggestion.suggestion}
                      secondary={
                        suggestion.type === 'sku' && suggestion.product_name
                          ? `Product: ${suggestion.product_name}`
                          : suggestion.type
                      }
                    />
                    {suggestion.relevance && (
                      <Chip
                        label={suggestion.relevance}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </ListItem>
                ))}
                <ListItem divider />
              </>
            )}

            {/* Popular Searches */}
            {popularSearches.length > 0 && query.length < 2 && (
              <>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <TrendingIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="subtitle2" color="text.secondary">Popular Searches</Typography>}
                  />
                </ListItem>
                {popularSearches.map((popular, index) => (
                  <ListItem
                    key={`popular-${index}`}
                    button
                    onClick={() => handlePopularClick(popular.term)}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <ListItemText
                      primary={popular.term}
                      secondary={`${popular.search_count} searches`}
                    />
                  </ListItem>
                ))}
              </>
            )}

            {/* Loading State */}
            {loading && (
              <ListItem>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', p: 2 }}>
                  <CircularProgress size={20} sx={{ mr: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Searching...
                  </Typography>
                </Box>
              </ListItem>
            )}

            {/* No Results */}
            {!loading && query.length >= 2 && suggestions.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary">
                      No suggestions found for "{query}"
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </ClickAwayListener>
    );
  };

  return (
    <Box
      ref={searchRef}
      sx={{
        position: 'relative',
        width: fullWidth ? '100%' : 'auto',
        ...sx,
      }}
    >
      <TextField
        ref={inputRef}
        fullWidth={fullWidth}
        size={compact ? 'small' : 'medium'}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query || popularSearches.length > 0) {
            setShowDropdown(true);
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
              {query && (
                <IconButton
                  size="small"
                  onClick={handleClear}
                  sx={{ mr: 0.5 }}
                >
                  <ClearIcon />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={() => handleSearch()}
                disabled={!query.trim()}
                color="primary"
              >
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: showDropdown ? '8px 8px 0 0' : '8px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
          },
        }}
      />

      {renderDropdown()}
    </Box>
  );
};

export default SearchBar;