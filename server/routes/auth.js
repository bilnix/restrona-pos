const express = require('express');
const { auth, db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Verify token and get user data
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'No token provided'
      });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User data not found in database'
      });
    }

    const userData = userDoc.data();

    res.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        phoneNumber: decodedToken.phone_number,
        ...userData
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
});

// Create user data (called after successful authentication)
router.post('/create-user', async (req, res) => {
  try {
    const { uid, userData } = req.body;

    if (!uid || !userData) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'UID and user data are required'
      });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').doc(uid).get();
    if (existingUser.exists) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'User data already exists in database'
      });
    }

    // Create user document
    const userDoc = {
      ...userData,
      uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(uid).set(userDoc);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userDoc
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      error: 'User creation failed',
      message: 'Failed to create user data'
    });
  }
});

// Update user data
router.put('/update-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const updateData = req.body;

    if (!uid) {
      return res.status(400).json({
        error: 'UID required',
        message: 'User UID is required'
      });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Update user document
    const updatedData = {
      ...updateData,
      updatedAt: new Date()
    };

    await db.collection('users').doc(uid).update(updatedData);

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({
      error: 'User update failed',
      message: 'Failed to update user data'
    });
  }
});

// Get user data
router.get('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        error: 'UID required',
        message: 'User UID is required'
      });
    }

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    const userData = userDoc.data();

    res.json({
      success: true,
      user: {
        uid,
        ...userData
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: 'Failed to retrieve user data'
    });
  }
});

// Delete user
router.delete('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        error: 'UID required',
        message: 'User UID is required'
      });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Delete user document
    await db.collection('users').doc(uid).delete();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({
      error: 'User deletion failed',
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;
