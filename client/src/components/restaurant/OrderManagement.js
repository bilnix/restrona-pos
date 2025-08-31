import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Visibility, Edit, Save, Cancel, LocalShipping } from '@mui/icons-material';
import { collection, updateDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const OrderManagement = ({ restaurantId }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
    }
  }, [restaurantId]);

  const fetchOrders = async () => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'preparing':
        return 'primary';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusActions = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleStatusUpdate(order.id, 'confirmed')}
            >
              Confirm
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
            >
              Cancel
            </Button>
          </>
        );
      case 'confirmed':
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleStatusUpdate(order.id, 'preparing')}
          >
            Start Preparing
          </Button>
        );
      case 'preparing':
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleStatusUpdate(order.id, 'ready')}
          >
            Mark Ready
          </Button>
        );
      case 'ready':
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleStatusUpdate(order.id, 'delivered')}
          >
            Mark Delivered
          </Button>
        );
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Order Management</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Filter by Status"
          >
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="preparing">Preparing</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id.slice(-8)}</TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{order.customerName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {order.customerPhone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.items?.length || 0} items
                  </Typography>
                </TableCell>
                <TableCell>₹{order.total}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleViewOrder(order)} color="primary">
                    <Visibility />
                  </IconButton>
                  {getStatusActions(order)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details #{selectedOrder?.id?.slice(-8)}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Customer Information</Typography>
                <Card>
                  <CardContent>
                    <Typography><strong>Name:</strong> {selectedOrder.customerName}</Typography>
                    <Typography><strong>Phone:</strong> {selectedOrder.customerPhone}</Typography>
                    <Typography><strong>Address:</strong> {selectedOrder.deliveryAddress}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Order Information</Typography>
                <Card>
                  <CardContent>
                    <Typography><strong>Order ID:</strong> #{selectedOrder.id?.slice(-8)}</Typography>
                    <Typography><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</Typography>
                    <Typography><strong>Status:</strong> 
                      <Chip
                        label={selectedOrder.status}
                        color={getStatusColor(selectedOrder.status)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography><strong>Total:</strong> ₹{selectedOrder.total}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Order Items</Typography>
                <Card>
                  <CardContent>
                    <List>
                      {selectedOrder.items?.map((item, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={item.name}
                              secondary={`Quantity: ${item.quantity} | Price: ₹${item.price}`}
                            />
                            <Typography variant="subtitle1">
                              ₹{item.quantity * item.price}
                            </Typography>
                          </ListItem>
                          {index < selectedOrder.items.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            <Cancel /> Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderManagement;
