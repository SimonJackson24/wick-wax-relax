import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/router';

const OrderHistoryContext = createContext();

export const useOrderHistory = () => {
  const context = useContext(OrderHistoryContext);
  if (!context) {
    throw new Error('useOrderHistory must be used within an OrderHistoryProvider');
  }
  return context;
};

export const OrderHistoryProvider = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    search: '',
    sortBy: 'order_date',
    sortOrder: 'desc'
  });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchOrders = async (page = 1, newFilters = {}) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        ...newFilters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await axios.get('http://localhost:3001/api/orders', { params });
      setOrders(response.data.orders || []);
      setPagination(response.data.pagination || pagination);
      setFilters({ ...filters, ...newFilters });
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw new Error('Failed to load order details');
    }
  };

  const refreshOrders = () => {
    fetchOrders(pagination.page, filters);
  };

  const updateFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    updateURLFromFilters(updatedFilters);
    fetchOrders(1, updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      search: '',
      sortBy: 'order_date',
      sortOrder: 'desc'
    };
    setFilters(clearedFilters);
    fetchOrders(1, clearedFilters);
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    setSelectedOrders(orders.map(order => order.id));
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const bulkAction = async (action, orderIds) => {
    setBulkActionLoading(true);
    try {
      // Implement bulk actions here
      console.log(`Performing ${action} on orders:`, orderIds);
      // Add API calls for bulk actions
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // URL parameter synchronization
  const updateURLFromFilters = (newFilters) => {
    const params = new URLSearchParams();

    // Add filter parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });

    // Update URL without triggering a page reload
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  };

  const loadFiltersFromURL = () => {
    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);
    const urlFilters = {};

    // Extract filter parameters from URL
    ['status', 'dateFrom', 'dateTo', 'amountMin', 'amountMax', 'search', 'sortBy', 'sortOrder'].forEach(key => {
      const value = params.get(key);
      if (value) {
        urlFilters[key] = value;
      }
    });

    return urlFilters;
  };

  useEffect(() => {
    if (user) {
      // Load filters from URL on initial load
      const urlFilters = loadFiltersFromURL();
      if (Object.keys(urlFilters).length > 0) {
        setFilters(prevFilters => ({ ...prevFilters, ...urlFilters }));
        fetchOrders(1, { ...filters, ...urlFilters });
      } else {
        fetchOrders();
      }
    }
  }, [user]);

  const value = {
    orders,
    loading,
    error,
    pagination,
    filters,
    selectedOrders,
    bulkActionLoading,
    fetchOrders,
    fetchOrderDetails,
    refreshOrders,
    updateFilters,
    clearFilters,
    toggleOrderSelection,
    selectAllOrders,
    clearSelection,
    bulkAction,
    setFilters
  };

  return (
    <OrderHistoryContext.Provider value={value}>
      {children}
    </OrderHistoryContext.Provider>
  );
};

export default OrderHistoryContext;