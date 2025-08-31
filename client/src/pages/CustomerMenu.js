import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Badge,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Fab,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add,
  Remove,
  ShoppingCart,
  Restaurant,
  Close,
  Payment,
  LocationOn,
  Phone
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { doc, getDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const CustomerMenu = () => {
  const { restaurantId, tableId } = useParams();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openCart, setOpenCart] = useState(false);
  const [openCheckout, setOpenCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurant details
      const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
      if (restaurantDoc.exists()) {
        setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() });
      }

      // Fetch menu items
      const menuQuery = query(
        collection(db, 'menuItems'),
        where('restaurantId', '==', restaurantId),
        where('isActive', '==', true)
      );
      const menuSnapshot = await getDocs(menuQuery);
      const menuData = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(menuData);

      // Extract unique categories
      const uniqueCategories = [...new Set(menuData.map(item => item.category))];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === itemId);
      if (existingItem.quantity === 1) {
        return prevCart.filter(item => item.id !== itemId);
      } else {
        return prevCart.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === itemId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Please provide your name and phone number');
      return;
    }

    try {
      const orderData = {
        restaurantId,
        tableId,
        customerInfo,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        total: getCartTotal(),
        status: 'pending',
        orderType: 'dine_in',
        createdAt: new Date(),
        orderNumber: `ORD${Date.now()}`
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      toast.success('Order placed successfully!');
      setCart([]);
      setOpenCheckout(false);
      setCustomerInfo({ name: '', phone: '', notes: '' });
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    }
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading menu...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Restaurant sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {restaurant?.name}
          </Typography>
          <IconButton color="inherit" onClick={() => setOpenCart(true)}>
            <Badge badgeContent={getCartItemCount()} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        {/* Restaurant Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {restaurant?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              {restaurant?.address}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <Phone sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              {restaurant?.phone}
            </Typography>
            <Chip 
              label={`Table ${tableId}`} 
              color="primary" 
              size="small" 
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>

        {/* Category Filter */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant={selectedCategory === 'all' ? 'contained' : 'outlined'}
            onClick={() => setSelectedCategory('all')}
            sx={{ mr: 1, mb: 1 }}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory(category)}
              sx={{ mr: 1, mb: 1 }}
            >
              {category}
            </Button>
          ))}
        </Box>

        {/* Menu Items */}
        <Grid container spacing={3}>
          {filteredMenuItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card>
                {item.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.imageUrl}
                    alt={item.name}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {item.description}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" color="primary">
                      ₹{item.price}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => addToCart(item)}
                    >
                      Add
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredMenuItems.length === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" textAlign="center" color="textSecondary">
                No items found in this category
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Cart Drawer */}
      <Drawer
        anchor="right"
        open={openCart}
        onClose={() => setOpenCart(false)}
      >
        <Box sx={{ width: 350, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Your Cart</Typography>
            <IconButton onClick={() => setOpenCart(false)}>
              <Close />
            </IconButton>
          </Box>

          {cart.length === 0 ? (
            <Typography variant="body2" color="textSecondary" textAlign="center">
              Your cart is empty
            </Typography>
          ) : (
            <>
              <List>
                {cart.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={item.name}
                      secondary={`₹${item.price} x ${item.quantity}`}
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center">
                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Remove />
                        </IconButton>
                        <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => addToCart(item)}
                        >
                          <Add />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Total: ₹{getCartTotal().toFixed(2)}
              </Typography>

              <Button
                fullWidth
                variant="contained"
                startIcon={<Payment />}
                onClick={() => {
                  setOpenCart(false);
                  setOpenCheckout(true);
                }}
              >
                Proceed to Checkout
              </Button>
            </>
          )}
        </Box>
      </Drawer>

      {/* Checkout Dialog */}
      <Dialog open={openCheckout} onClose={() => setOpenCheckout(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Checkout</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Special Instructions (Optional)"
            value={customerInfo.notes}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
            margin="normal"
            multiline
            rows={3}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Order Summary
          </Typography>
          {cart.map((item) => (
            <Box key={item.id} display="flex" justifyContent="space-between" mb={1}>
              <Typography>
                {item.name} x {item.quantity}
              </Typography>
              <Typography>₹{(item.price * item.quantity).toFixed(2)}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">₹{getCartTotal().toFixed(2)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckout(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePlaceOrder}>
            Place Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="cart"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenCart(true)}
      >
        <Badge badgeContent={getCartItemCount()} color="error">
          <ShoppingCart />
        </Badge>
      </Fab>
    </Box>
  );
};

export default CustomerMenu;
