import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  Chip,
  Collapse
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ClearIcon from '@mui/icons-material/Clear';
import { useOrderHistory } from './OrderHistoryContext';

const OrderFilters = ({ mobileDrawer = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { filters, updateFilters, clearFilters } = useOrderHistory();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState(!isMobile);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REFUNDED', label: 'Refunded' }
  ];

  const sortOptions = [
    { value: 'order_date', label: 'Order Date' },
    { value: 'total', label: 'Total Amount' },
    { value: 'status', label: 'Status' },
    { value: 'external_id', label: 'Order ID' }
  ];

  const handleFilterChange = (field, value) => {
    updateFilters({ [field]: value });
  };

  const handleSortChange = (field, value) => {
    updateFilters({ [field]: value });
  };

  const toggleSortOrder = () => {
    const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
    updateFilters({ sortOrder: newOrder });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.amountMin) count++;
    if (filters.amountMax) count++;
    return count;
  };

  const renderFilterContent = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filter Orders
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)}>
            <ClearIcon />
          </IconButton>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* Status Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Date From */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="From Date"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Date To */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="To Date"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Amount Min */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Min Amount (£)"
            type="number"
            value={filters.amountMin}
            onChange={(e) => handleFilterChange('amountMin', e.target.value)}
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />
        </Grid>

        {/* Amount Max */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Max Amount (£)"
            type="number"
            value={filters.amountMax}
            onChange={(e) => handleFilterChange('amountMax', e.target.value)}
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />
        </Grid>

        {/* Sort By */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => handleSortChange('sortBy', e.target.value)}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sort Order */}
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            onClick={toggleSortOrder}
            size="small"
            sx={{ height: '40px' }}
          >
            {filters.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </Button>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={clearFilters}
          startIcon={<ClearIcon />}
          size="small"
        >
          Clear All Filters
        </Button>
        {isMobile && (
          <Button
            variant="contained"
            onClick={() => setDrawerOpen(false)}
            size="small"
          >
            Apply Filters
          </Button>
        )}
      </Box>
    </Box>
  );

  if (mobileDrawer && isMobile) {
    return (
      <>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setDrawerOpen(true)}
            fullWidth
            size="small"
          >
            Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </Button>
        </Box>

        <Drawer
          anchor="bottom"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              borderTopLeftRadius: theme.shape.borderRadius,
              borderTopRightRadius: theme.shape.borderRadius,
            },
          }}
        >
          {renderFilterContent()}
        </Drawer>
      </>
    );
  }

  return (
    <Paper sx={{ mb: 3 }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filter Orders
          </Typography>
          {getActiveFiltersCount() > 0 && (
            <Chip
              label={getActiveFiltersCount()}
              size="small"
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        {renderFilterContent()}
      </Collapse>
    </Paper>
  );
};

export default OrderFilters;