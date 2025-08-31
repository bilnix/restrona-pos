import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar
} from '@mui/material';
import {
  Dashboard,
  Restaurant,
  People,
  Assessment,
  Settings,
  Add,
  Edit,
  Delete,
  Logout,
  Business,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Components
import RestaurantList from '../components/superadmin/RestaurantList';
import RestaurantForm from '../components/superadmin/RestaurantForm';
import Analytics from '../components/superadmin/Analytics';
import UserManagement from '../components/superadmin/UserManagement';

const drawerWidth = 240;

const SuperAdminDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const { logout, userData, hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'restaurants'));
      const restaurantsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleAddRestaurant = () => {
    setSelectedRestaurant(null);
    setOpenDialog(true);
  };

  const handleEditRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setOpenDialog(true);
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await deleteDoc(doc(db, 'restaurants', restaurantId));
        toast.success('Restaurant deleted successfully');
        fetchRestaurants();
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        toast.error('Failed to delete restaurant');
      }
    }
  };

  const handleSaveRestaurant = async (restaurantData) => {
    try {
      if (selectedRestaurant) {
        await updateDoc(doc(db, 'restaurants', selectedRestaurant.id), {
          ...restaurantData,
          updatedAt: new Date()
        });
        toast.success('Restaurant updated successfully');
      } else {
        await addDoc(collection(db, 'restaurants'), {
          ...restaurantData,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        });
        toast.success('Restaurant added successfully');
      }
      setOpenDialog(false);
      fetchRestaurants();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error('Failed to save restaurant');
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, value: 'dashboard' },
    { text: 'Restaurants', icon: <Restaurant />, value: 'restaurants', permission: 'manage_restaurants' },
    { text: 'Users', icon: <People />, value: 'users', permission: 'manage_users' },
    { text: 'Analytics', icon: <Assessment />, value: 'analytics', permission: 'view_analytics' },
    { text: 'Settings', icon: <Settings />, value: 'settings', permission: 'system_settings' }
  ].filter(item => !item.permission || hasPermission(item.permission));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent restaurants={restaurants} />;
      case 'restaurants':
        return (
          <RestaurantList
            restaurants={restaurants}
            onEdit={handleEditRestaurant}
            onDelete={handleDeleteRestaurant}
            onAdd={handleAddRestaurant}
          />
        );
      case 'users':
        return <UserManagement />;
      case 'analytics':
        return <Analytics restaurants={restaurants} />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent restaurants={restaurants} />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Restrona - Super Admin
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {userData?.name || 'Admin'}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.value}
                selected={activeTab === item.value}
                onClick={() => setActiveTab(item.value)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {renderContent()}
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
        </DialogTitle>
        <DialogContent>
          <RestaurantForm
            restaurant={selectedRestaurant}
            onSave={handleSaveRestaurant}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Dashboard Content Component
const DashboardContent = ({ restaurants }) => {
  const { userData, hasPermission } = useAuth();
  const totalRestaurants = restaurants.length;
  const activeRestaurants = restaurants.filter(r => r.status === 'active').length;
  const totalRevenue = restaurants.reduce((sum, r) => sum + (r.monthlyRevenue || 0), 0);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Super Admin Dashboard
      </Typography>
      
      {/* Super Admin Status */}
      {userData?.isSuperAdmin && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            🚀 Super Admin Status: FULL ACCESS GRANTED
          </Typography>
          <Typography variant="body2">
            You have complete control over the entire system with all permissions enabled.
          </Typography>
        </Box>
      )}
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Restaurants
              </Typography>
              <Typography variant="h3" component="div">
                {totalRestaurants}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Restaurants
              </Typography>
              <Typography variant="h3" component="div" color="primary">
                {activeRestaurants}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h3" component="div" color="success.main">
                ₹{totalRevenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Permissions Overview */}
      {userData?.permissions && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Your Permissions ({userData.permissions.length} total)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {userData.permissions.map((permission) => (
              <Chip
                key={permission}
                label={permission.replace(/_/g, ' ').toUpperCase()}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      <Typography variant="h5" gutterBottom>
        Recent Restaurants
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Restaurant</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {restaurants.slice(0, 5).map((restaurant) => (
              <TableRow key={restaurant.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2 }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">{restaurant.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {restaurant.type}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{restaurant.phone}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {restaurant.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{restaurant.address}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={restaurant.status}
                    color={restaurant.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

// Settings Content Component
const SettingsContent = () => {
  const { userData, hasPermission } = useAuth();
  
  const systemFeatures = [
    { name: 'Restaurant Management', permission: 'manage_restaurants', description: 'Create, edit, and manage all restaurants' },
    { name: 'User Management', permission: 'manage_users', description: 'Manage all users and their roles' },
    { name: 'Menu Management', permission: 'manage_menus', description: 'Manage menus across all restaurants' },
    { name: 'Table Management', permission: 'manage_tables', description: 'Configure table layouts and settings' },
    { name: 'Order Management', permission: 'manage_orders', description: 'Monitor and manage all orders' },
    { name: 'Analytics & Reports', permission: 'view_analytics', description: 'Access comprehensive analytics and reports' },
    { name: 'Financial Reports', permission: 'financial_reports', description: 'Generate financial reports and insights' },
    { name: 'Staff Management', permission: 'staff_management', description: 'Manage staff across all restaurants' },
    { name: 'Inventory Management', permission: 'inventory_management', description: 'Track and manage inventory' },
    { name: 'Customer Management', permission: 'customer_management', description: 'Manage customer data and relationships' },
    { name: 'Billing Management', permission: 'billing_management', description: 'Handle billing and payments' },
    { name: 'Promotion Management', permission: 'promotion_management', description: 'Create and manage promotions' },
    { name: 'Notification System', permission: 'notification_management', description: 'Manage system notifications' },
    { name: 'Backup & Restore', permission: 'backup_restore', description: 'System backup and restore operations' },
    { name: 'API Management', permission: 'api_management', description: 'Manage API access and integrations' },
    { name: 'Security Settings', permission: 'security_settings', description: 'Configure security settings' },
    { name: 'Audit Logs', permission: 'audit_logs', description: 'View system audit logs' },
    { name: 'System Settings', permission: 'system_settings', description: 'Configure system-wide settings' }
  ];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Super Admin Settings & Capabilities
      </Typography>
      
      {userData?.isSuperAdmin && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            🎯 SUPER ADMIN ACCESS CONFIRMED
          </Typography>
          <Typography variant="body2">
            You have unrestricted access to all system features and settings.
          </Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {systemFeatures.map((feature) => (
          <Grid item xs={12} sm={6} md={4} key={feature.name}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {feature.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {feature.description}
                </Typography>
                <Chip
                  label={hasPermission(feature.permission) ? "ACCESS GRANTED" : "ACCESS DENIED"}
                  color={hasPermission(feature.permission) ? "success" : "error"}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SuperAdminDashboard;
