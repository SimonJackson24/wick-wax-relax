import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from 'axios';

const SearchFilters = ({
  filters = {},
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  compact = false,
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    priceRange: { min: 0, max: 100 },
    scentProfiles: {},
    attributes: {}
  });

  const [selectedFilters, setSelectedFilters] = useState({
    category: filters.category || '',
    priceRange: filters.priceRange || [0, 100],
    scentProfile: filters.scentProfile || [],
    inStock: filters.inStock || null,
    attributes: filters.attributes || {},
    ...filters
  });

  // Load available filters on mount
  useEffect(() => {
    loadAvailableFilters();
  }, []);

  // Update selected filters when props change
  useEffect(() => {
    setSelectedFilters({
      category: filters.category || '',
      priceRange: filters.priceRange || [availableFilters.priceRange.min, availableFilters.priceRange.max],
      scentProfile: filters.scentProfile || [],
      inStock: filters.inStock || null,
      attributes: filters.attributes || {},
      ...filters
    });
  }, [filters, availableFilters.priceRange]);

  const loadAvailableFilters = async () => {
    try {
      const response = await axios.get('/api/search/filters');
      const filters = response.data.filters;

      setAvailableFilters({
        categories: filters.categories || [],
        priceRange: {
          min: Math.floor(filters.priceRange?.min_price || 0),
          max: Math.ceil(filters.priceRange?.max_price || 100)
        },
        scentProfiles: filters.scentProfiles || {},
        attributes: filters.attributes || {}
      });

      // Update price range if not set
      if (!selectedFilters.priceRange || selectedFilters.priceRange[0] === selectedFilters.priceRange[1]) {
        setSelectedFilters(prev => ({
          ...prev,
          priceRange: [filters.priceRange?.min_price || 0, filters.priceRange?.max_price || 100]
        }));
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...selectedFilters, [filterType]: value };
    setSelectedFilters(newFilters);

    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handlePriceRangeChange = (event, newValue) => {
    handleFilterChange('priceRange', newValue);
  };

  const handleScentProfileChange = (scent) => {
    const currentScents = selectedFilters.scentProfile || [];
    const newScents = currentScents.includes(scent)
      ? currentScents.filter(s => s !== scent)
      : [...currentScents, scent];

    handleFilterChange('scentProfile', newScents);
  };

  const handleAttributeChange = (attributeType, attributeValue) => {
    const currentAttributes = selectedFilters.attributes || {};
    const currentValues = currentAttributes[attributeType] || [];

    const newValues = currentValues.includes(attributeValue)
      ? currentValues.filter(v => v !== attributeValue)
      : [...currentValues, attributeValue];

    const newAttributes = {
      ...currentAttributes,
      [attributeType]: newValues
    };

    // Remove empty attribute arrays
    Object.keys(newAttributes).forEach(key => {
      if (newAttributes[key].length === 0) {
        delete newAttributes[key];
      }
    });

    handleFilterChange('attributes', newAttributes);
  };

  const handleClearAll = () => {
    const clearedFilters = {
      category: '',
      priceRange: [availableFilters.priceRange.min, availableFilters.priceRange.max],
      scentProfile: [],
      inStock: null,
      attributes: {}
    };

    setSelectedFilters(clearedFilters);

    if (onClearFilters) {
      onClearFilters();
    } else if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  const handleApplyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(selectedFilters);
    }
  };

  const formatPrice = (value) => `£${value}`;

  const hasActiveFilters = () => {
    return (
      selectedFilters.category ||
      selectedFilters.scentProfile.length > 0 ||
      selectedFilters.inStock !== null ||
      Object.keys(selectedFilters.attributes).length > 0 ||
      selectedFilters.priceRange[0] !== availableFilters.priceRange.min ||
      selectedFilters.priceRange[1] !== availableFilters.priceRange.max
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedFilters.category) count++;
    if (selectedFilters.scentProfile.length > 0) count++;
    if (selectedFilters.inStock !== null) count++;
    if (Object.keys(selectedFilters.attributes).length > 0) count++;
    if (selectedFilters.priceRange[0] !== availableFilters.priceRange.min ||
        selectedFilters.priceRange[1] !== availableFilters.priceRange.max) count++;
    return count;
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', ...sx }}>
        {/* Category Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedFilters.category}
            label="Category"
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {availableFilters.categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name} ({category.product_count})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Price Range */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Typography variant="caption" color="text.secondary">
            Price: {formatPrice(selectedFilters.priceRange[0])} - {formatPrice(selectedFilters.priceRange[1])}
          </Typography>
          <Slider
            value={selectedFilters.priceRange}
            onChange={handlePriceRangeChange}
            valueLabelDisplay="auto"
            min={availableFilters.priceRange.min}
            max={availableFilters.priceRange.max}
            sx={{ mt: 1 }}
          />
        </FormControl>

        {/* Stock Filter */}
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedFilters.inStock === true}
              indeterminate={selectedFilters.inStock === null}
              onChange={(e) => handleFilterChange('inStock', e.target.checked ? true : null)}
            />
          }
          label="In Stock Only"
        />

        {/* Clear Filters */}
        {hasActiveFilters() && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
            color="secondary"
          >
            Clear ({getActiveFilterCount()})
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Filters</Typography>
        {hasActiveFilters() && (
          <Chip
            label={getActiveFilterCount()}
            size="small"
            color="primary"
            sx={{ ml: 1 }}
          />
        )}
        <Box sx={{ flexGrow: 1 }} />
        {hasActiveFilters() && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
            color="secondary"
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Category Filter */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Category</Typography>
          {selectedFilters.category && (
            <Chip
              label={availableFilters.categories.find(c => c.id === selectedFilters.category)?.name}
              size="small"
              onDelete={() => handleFilterChange('category', '')}
              sx={{ ml: 1 }}
            />
          )}
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedFilters.category}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {availableFilters.categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name} ({category.product_count})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      {/* Price Range Filter */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Price Range</Typography>
          {(selectedFilters.priceRange[0] !== availableFilters.priceRange.min ||
            selectedFilters.priceRange[1] !== availableFilters.priceRange.max) && (
            <Chip
              label={`${formatPrice(selectedFilters.priceRange[0])} - ${formatPrice(selectedFilters.priceRange[1])}`}
              size="small"
              onDelete={() => handleFilterChange('priceRange', [availableFilters.priceRange.min, availableFilters.priceRange.max])}
              sx={{ ml: 1 }}
            />
          )}
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formatPrice(selectedFilters.priceRange[0])} - {formatPrice(selectedFilters.priceRange[1])}
          </Typography>
          <Slider
            value={selectedFilters.priceRange}
            onChange={handlePriceRangeChange}
            valueLabelDisplay="auto"
            valueLabelFormat={formatPrice}
            min={availableFilters.priceRange.min}
            max={availableFilters.priceRange.max}
            sx={{ mt: 2 }}
          />
        </AccordionDetails>
      </Accordion>

      {/* Scent Profile Filter */}
      {Object.keys(availableFilters.scentProfiles).length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Scent Profile</Typography>
            {selectedFilters.scentProfile.length > 0 && (
              <Chip
                label={`${selectedFilters.scentProfile.length} selected`}
                size="small"
                onDelete={() => handleFilterChange('scentProfile', [])}
                sx={{ ml: 1 }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {Object.entries(availableFilters.scentProfiles).map(([type, scents]) => (
                <Box key={type} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                    {type}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {scents.map((scent) => (
                      <FormControlLabel
                        key={scent}
                        control={
                          <Checkbox
                            checked={selectedFilters.scentProfile.includes(scent)}
                            onChange={() => handleScentProfileChange(scent)}
                            size="small"
                          />
                        }
                        label={scent}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Stock Filter */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Availability</Typography>
          {selectedFilters.inStock !== null && (
            <Chip
              label={selectedFilters.inStock ? 'In Stock Only' : 'Out of Stock'}
              size="small"
              onDelete={() => handleFilterChange('inStock', null)}
              sx={{ ml: 1 }}
            />
          )}
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedFilters.inStock === true}
                onChange={(e) => handleFilterChange('inStock', e.target.checked ? true : null)}
              />
            }
            label="In Stock Only"
          />
        </AccordionDetails>
      </Accordion>

      {/* Attribute Filters */}
      {Object.keys(availableFilters.attributes).length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Attributes</Typography>
            {Object.keys(selectedFilters.attributes).length > 0 && (
              <Chip
                label={`${Object.values(selectedFilters.attributes).flat().length} selected`}
                size="small"
                onDelete={() => handleFilterChange('attributes', {})}
                sx={{ ml: 1 }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {Object.entries(availableFilters.attributes).map(([attributeType, values]) => (
                <Box key={attributeType} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                    {attributeType}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {values.map((value) => (
                      <FormControlLabel
                        key={value}
                        control={
                          <Checkbox
                            checked={(selectedFilters.attributes[attributeType] || []).includes(value)}
                            onChange={() => handleAttributeChange(attributeType, value)}
                            size="small"
                          />
                        }
                        label={value}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Apply Filters Button */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleApplyFilters}
          disabled={!hasActiveFilters()}
        >
          Apply Filters
        </Button>
      </Box>
    </Paper>
  );
};

export default SearchFilters;