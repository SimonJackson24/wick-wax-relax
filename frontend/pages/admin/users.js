import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from users data
      const totalUsers = users.length;
      const adminUsers = users.filter(user => user.is_admin).length;
      const recentUsers = users.filter(user => {
        const createdAt = new Date(user.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt > thirtyDaysAgo;
      }).length;

      setStats({
        totalUsers,
        adminUsers,
        recentUsers
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  useEffect(() => {
    if (users.length > 0) {
      fetchStats();
    }
  }, [users]);

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      await axios.patch(`/api/admin/users/${selectedUser.id}`, {
        name: editName,
        isAdmin: editIsAdmin
      });

      setEditDialog(false);
      setSelectedUser(null);
      setEditName('');
      setEditIsAdmin(false);
      await fetchUsers(); // Refresh users
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditName(user.name || '');
    setEditIsAdmin(user.is_admin || false);
    setEditDialog(true);
  };

  const columns = [
    {
      field: 'avatar',
      headerName: 'Avatar',
      width: 70,
      renderCell: (params) => (
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <PersonIcon />
        </Avatar>
      )
    },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'is_admin',
      headerName: 'Role',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Admin' : 'User'}
          color={params.value ? 'primary' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'order_count',
      headerName: 'Orders',
      width: 80,
      type: 'number'
    },
    {
      field: 'total_spent',
      headerName: 'Total Spent',
      width: 120,
      type: 'number',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '$0.00';
        const value = Number(params.value);
        return isNaN(value) ? '$0.00' : `$${value.toFixed(2)}`;
      }
    },
    {
      field: 'created_at',
      headerName: 'Joined',
      width: 120,
      valueFormatter: (params) => {
        if (!params || !params.value) return 'N/A';
        const date = new Date(params.value);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
      }
    },
    {
      field: 'last_login',
      headerName: 'Last Login',
      width: 120,
      valueFormatter: (params) => {
        if (!params || !params.value) return 'Never';
        const date = new Date(params.value);
        return isNaN(date.getTime()) ? 'Never' : date.toLocaleDateString();
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => openEditDialog(params.row)}
        >
          Edit
        </Button>
      )
    }
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <Box sx={{ width: '100%', mt: 4 }}>
            <LinearProgress />
          </Box>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            User Management
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalUsers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Admin Users
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {stats.adminUsers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    New Users (30d)
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.recentUsers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Users Table */}
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={users}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              components={{
                Toolbar: CustomToolbar,
              }}
              getRowId={(row) => row.id}
            />
          </Paper>

          {/* Edit User Dialog */}
          <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
            <DialogTitle>Edit User</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedUser?.email}
              </Typography>
              <TextField
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editIsAdmin}
                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                  />
                }
                label="Administrator"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button
                onClick={handleEditUser}
                variant="contained"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update User'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default UserManagement;