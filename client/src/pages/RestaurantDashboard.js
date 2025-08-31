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
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar
} from '@mui/material';
import {
  Dashboard,
  Restaurant,
  MenuBook,
  TableRestaurant,
  People,
  Assessment,
  Settings as SettingsIcon,
  Logout,
  Receipt,
  LocalShipping,
  QrCode
} from '@mui/icons-material';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Components
import MenuManagement from '../components/restaurant/MenuManagement';
import TableManagement from '../components/restaurant/TableManagement';
import StaffManagement from '../components/restaurant/StaffManagement';
import OrderManagement from '../components/restaurant/OrderManagement';
import Analytics from '../components/restaurant/Analytics';
import Settings from '../components/restaurant/Settings';

const drawerWidth = 240;

const RestaurantDashboard = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData?.restaurantId) {
      fetchRestaurantData();
    }
  }, [userData]);

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurant details
      const restaurantDoc = await getDoc(doc(db, 'restaurants', userData.restaurantId));
      if (restaurantDoc.exists()) {
        setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() });
      }

      // Fetch orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('restaurantId', '==', userData.restaurantId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);

      // Fetch menu items
      const menuQuery = query(
        collection(db, 'menuItems'),
        where('restaurantId', '==', userData.restaurantId)
      );
      const menuSnapshot = await getDocs(menuQuery);
      const menuData = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(menuData);

      // Fetch tables
      const tablesQuery = query(
        collection(db, 'tables'),
        where('restaurantId', '==', userData.restaurantId)
      );
      const tablesSnapshot = await getDocs(tablesQuery);
      const tablesData = tablesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTables(tablesData);

      // Fetch staff
      const staffQuery = query(
        collection(db, 'users'),
        where('restaurantId', '==', userData.restaurantId)
      );
      const staffSnapshot = await getDocs(staffQuery);
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaff(staffData);

    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast.error('Failed to fetch restaurant data');
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

  const navigationItems = [
    { text: 'Dashboard', icon: <Dashboard />, value: 'dashboard' },
    { text: 'Menu Management', icon: <MenuBook />, value: 'menu' },
    { text: 'Table Management', icon: <TableRestaurant />, value: 'tables' },
    { text: 'Orders', icon: <Receipt />, value: 'orders' },
    { text: 'Staff Management', icon: <People />, value: 'staff' },
    { text: 'Analytics', icon: <Assessment />, value: 'analytics' },
    { text: 'Settings', icon: <SettingsIcon />, value: 'settings' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent restaurant={restaurant} orders={orders} menuItems={menuItems} tables={tables} staff={staff} />;
      case 'menu':
        return <MenuManagement restaurantId={userData?.restaurantId} />;
      case 'tables':
        return <TableManagement restaurantId={userData?.restaurantId} />;
      case 'orders':
        return <OrderManagement restaurantId={userData?.restaurantId} />;
      case 'staff':
        return <StaffManagement restaurantId={userData?.restaurantId} />;
      case 'analytics':
        return <Analytics restaurantId={userData?.restaurantId} />;
      case 'settings':
        return <Settings restaurant={restaurant} />;
      default:
        return <DashboardContent restaurant={restaurant} orders={orders} menuItems={menuItems} tables={tables} staff={staff} />;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {restaurant?.name} - Restaurant Admin
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
                         {navigationItems.map((item) => (
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
    </Box>
  );
};

// Dashboard Content Component
const DashboardContent = ({ restaurant, orders, menuItems, tables, staff }) => {
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt?.toDate()).toDateString();
    const today = new Date().toDateString();
    return orderDate === today;
  });

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const completedOrders = orders.filter(order => order.status === 'completed');
  const totalRevenue = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + (order.total || 0), 0);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Orders
              </Typography>
              <Typography variant="h3" component="div">
                {todayOrders.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Orders
              </Typography>
              <Typography variant="h3" component="div" color="warning.main">
                {pendingOrders.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Menu Items
              </Typography>
              <Typography variant="h3" component="div" color="info.main">
                {menuItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Restaurant Info
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2 }}>
                  <Restaurant />
                </Avatar>
                <Box>
                  <Typography variant="h6">{restaurant?.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {restaurant?.type?.replace('_', ' ').toUpperCase()}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {restaurant?.address}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Phone: {restaurant?.phone}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Tables
                  </Typography>
                  <Typography variant="h4">
                    {tables.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Staff Members
                  </Typography>
                  <Typography variant="h4">
                    {staff.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Completed Orders
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {completedOrders.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Active Tables
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {tables.filter(table => table.status === 'occupied').length}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RestaurantDashboard;
