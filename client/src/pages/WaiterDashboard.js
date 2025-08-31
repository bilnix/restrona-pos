import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Badge,
  Tabs,
  Tab
} from '@mui/material';
import {
  Receipt,
  Print,
  CheckCircle,
  Cancel,
  Visibility,
  Logout,
  Notifications,
  LocalPrintshop
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

const WaiterDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [openBillDialog, setOpenBillDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData?.restaurantId) {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('restaurantId', '==', userData.restaurantId),
        where('status', 'in', ['pending', 'preparing', 'ready'])
      );

      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
      });

      return () => unsubscribe();
    }
  }, [userData]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOpenOrderDialog(true);
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: status,
        updatedAt: new Date()
      });
      toast.success(`Order ${status} successfully`);
      setOpenOrderDialog(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const handlePrintBill = (order) => {
    setSelectedOrder(order);
    setOpenBillDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'ready':
        return 'success';
      default:
        return 'default';
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');

  const tabs = [
    { label: 'Pending', count: pendingOrders.length, orders: pendingOrders },
    { label: 'Preparing', count: preparingOrders.length, orders: preparingOrders },
    { label: 'Ready', count: readyOrders.length, orders: readyOrders }
  ];

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Waiter Dashboard
          </Typography>
          <Badge badgeContent={orders.length} color="error">
            <Notifications />
          </Badge>
          <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 2 }}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Order Management
        </Typography>

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={
                <Box display="flex" alignItems="center">
                  {tab.label}
                  <Badge badgeContent={tab.count} color="error" sx={{ ml: 1 }}>
                    <Box />
                  </Badge>
                </Box>
              }
            />
          ))}
        </Tabs>

        <Grid container spacing={3}>
          {tabs[activeTab].orders.map((order) => (
            <Grid item xs={12} md={6} lg={4} key={order.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Order #{order.orderNumber}
                    </Typography>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Table: {order.tableNumber}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Items: {order.items?.length || 0}
                  </Typography>
                  
                  <Typography variant="h6" color="primary" gutterBottom>
                    ₹{order.total?.toFixed(2)}
                  </Typography>
                  
                  <Typography variant="caption" color="textSecondary">
                    {new Date(order.createdAt?.toDate()).toLocaleTimeString()}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewOrder(order)}
                    >
                      View Details
                    </Button>
                    
                    {order.status === 'ready' && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Print />}
                        onClick={() => handlePrintBill(order)}
                      >
                        Print Bill
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {tabs[activeTab].orders.length === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" textAlign="center" color="textSecondary">
                No {tabs[activeTab].label.toLowerCase()} orders
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Order Details Dialog */}
      <Dialog open={openOrderDialog} onClose={() => setOpenOrderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details - #{selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Table {selectedOrder.tableNumber}
              </Typography>
              
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.price}</TableCell>
                        <TableCell>₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" textAlign="right">
                Total: ₹{selectedOrder.total?.toFixed(2)}
              </Typography>

              {selectedOrder.notes && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  <strong>Notes:</strong> {selectedOrder.notes}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOrderDialog(false)}>Close</Button>
          {selectedOrder?.status === 'pending' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircle />}
              onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'preparing')}
            >
              Start Preparing
            </Button>
          )}
          {selectedOrder?.status === 'preparing' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'ready')}
            >
              Mark Ready
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Bill Print Dialog */}
      <Dialog open={openBillDialog} onClose={() => setOpenBillDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Bill - Order #{selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Table {selectedOrder.tableNumber}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Date: {new Date(selectedOrder.createdAt?.toDate()).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Time: {new Date(selectedOrder.createdAt?.toDate()).toLocaleTimeString()}
              </Typography>
              
              <TableContainer component={Paper} sx={{ my: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.price}</TableCell>
                        <TableCell>₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" textAlign="right">
                Total: ₹{selectedOrder.total?.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBillDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<LocalPrintshop />}
            onClick={() => {
              // Implement print functionality
              window.print();
              setOpenBillDialog(false);
            }}
          >
            Print Bill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WaiterDashboard;
