const express = require('express');
const { db } = require('../config/firebase');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all restaurants (Super Admin only)
router.get('/', requireRole(['super_admin']), async (req, res) => {
  try {
    const restaurantsSnapshot = await db.collection('restaurants').get();
    const restaurants = restaurantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      restaurants
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      error: 'Failed to get restaurants',
      message: 'Failed to retrieve restaurants'
    });
  }
});

// Get restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantDoc = await db.collection('restaurants').doc(id).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({
        error: 'Restaurant not found',
        message: 'Restaurant does not exist'
      });
    }

    const restaurant = {
      id: restaurantDoc.id,
      ...restaurantDoc.data()
    };

    res.json({
      success: true,
      restaurant
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      error: 'Failed to get restaurant',
      message: 'Failed to retrieve restaurant data'
    });
  }
});

// Create restaurant (Super Admin only)
router.post('/', requireRole(['super_admin']), async (req, res) => {
  try {
    const restaurantData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'type', 'phone', 'email', 'address'];
    for (const field of requiredFields) {
      if (!restaurantData[field]) {
        return res.status(400).json({
          error: 'Missing required field',
          message: `${field} is required`
        });
      }
    }

    // Create restaurant document
    const restaurantDoc = {
      ...restaurantData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const docRef = await db.collection('restaurants').add(restaurantDoc);

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      restaurantId: docRef.id
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({
      error: 'Failed to create restaurant',
      message: 'Failed to create restaurant'
    });
  }
});

// Update restaurant
router.put('/:id', requireRole(['super_admin', 'restaurant_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if restaurant exists
    const restaurantDoc = await db.collection('restaurants').doc(id).get();
    if (!restaurantDoc.exists) {
      return res.status(404).json({
        error: 'Restaurant not found',
        message: 'Restaurant does not exist'
      });
    }

    // Update restaurant document
    const updatedData = {
      ...updateData,
      updatedAt: new Date()
    };

    await db.collection('restaurants').doc(id).update(updatedData);

    res.json({
      success: true,
      message: 'Restaurant updated successfully'
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({
      error: 'Failed to update restaurant',
      message: 'Failed to update restaurant data'
    });
  }
});

// Delete restaurant (Super Admin only)
router.delete('/:id', requireRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if restaurant exists
    const restaurantDoc = await db.collection('restaurants').doc(id).get();
    if (!restaurantDoc.exists) {
      return res.status(404).json({
        error: 'Restaurant not found',
        message: 'Restaurant does not exist'
      });
    }

    // Delete restaurant document
    await db.collection('restaurants').doc(id).delete();

    res.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      error: 'Failed to delete restaurant',
      message: 'Failed to delete restaurant'
    });
  }
});

// Get restaurant statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Get restaurant orders
    const ordersSnapshot = await db.collection('orders')
      .where('restaurantId', '==', id)
      .get();

    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const totalRevenue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate();
      return orderDate && orderDate >= today;
    });

    const stats = {
      totalOrders,
      completedOrders,
      pendingOrders: totalOrders - completedOrders,
      totalRevenue,
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.total || 0), 0)
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get restaurant stats error:', error);
    res.status(500).json({
      error: 'Failed to get restaurant statistics',
      message: 'Failed to retrieve restaurant statistics'
    });
  }
});

module.exports = router;
