/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest, onCall} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin with better error handling
try {
  // Check if already initialized
  if (!admin.apps.length) {
    // Try to initialize with service account key
    try {
      const serviceAccount = require('./serviceAccountKey.json');
      logger.info('Found service account key, initializing with credentials');
      
      // Validate the service account key
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Invalid service account key format');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'restrona-pos-257a7'
      });
      
      logger.info('Firebase Admin initialized with service account');
    } catch (keyError) {
      logger.info('Service account key error:', keyError.message);
      logger.info('Trying default initialization...');
      
      // Try to initialize with explicit project ID
      const projectId = 'restrona-pos-257a7';
      logger.info('Attempting to initialize Firebase Admin with project:', projectId);
      
      admin.initializeApp({
        projectId: projectId
      });
      
      logger.info('Firebase Admin initialized with project ID only');
    }
  } else {
    logger.info('Firebase Admin already initialized');
  }
} catch (error) {
  logger.error('Error initializing Firebase Admin:', error);
  logger.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  
  // Try alternative initialization
  try {
    logger.info('Attempting alternative initialization...');
    admin.initializeApp();
    logger.info('Alternative initialization successful');
  } catch (altError) {
    logger.error('Alternative initialization also failed:', altError.message);
    // Continue without admin - functions will fail but won't crash
  }
}

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (request, response) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// Very simple test function - no Firebase dependencies
exports.simpleTest = onCall(async (data, context) => {
  try {
    logger.info('Simple test function called');
    
    // Return only simple, serializable data
    return {
      success: true,
      message: 'Simple test function is working!',
      timestamp: new Date().toISOString(),
      dataReceived: data.data ? 'Data received' : 'No data provided'
    };
  } catch (error) {
    logger.error('Simple test function error:', error);
    throw new Error('Simple test failed: ' + error.message);
  }
});

// Function to update user password (for super admins)
exports.updateUserPassword = onCall(async (data, context) => {
  try {
    logger.info('updateUserPassword function called');
    logger.info('Function data:', data);
    logger.info('Function context:', context);
    
    // Check if user is authenticated and is super admin
    if (!context.auth) {
      logger.error('No authentication context found');
      return {
        success: false,
        error: 'Authentication required. Please log in as super admin.',
        code: 'AUTH_REQUIRED'
      };
    }
    
    logger.info('User authenticated with UID:', context.auth.uid);
    
    // Get user data from Firestore to check role
    try {
      const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
      if (!userDoc.exists) {
        logger.error('User document not found for UID:', context.auth.uid);
        return {
          success: false,
          error: 'User not found in system',
          code: 'USER_NOT_FOUND'
        };
      }
      
      const userData = userDoc.data();
      logger.info('User data retrieved:', { uid: context.auth.uid, role: userData.role });
      
      if (userData.role !== 'super_admin') {
        logger.error('User is not super admin. Role:', userData.role);
        return {
          success: false,
          error: 'Only super admins can update user passwords',
          code: 'INSUFFICIENT_PERMISSIONS'
        };
      }
    } catch (firestoreError) {
      logger.error('Error checking user role:', firestoreError);
      return {
        success: false,
        error: 'Failed to verify user permissions: ' + firestoreError.message,
        code: 'PERMISSION_CHECK_FAILED'
      };
    }
    
    // Extract update data
    const { targetUserId, newPassword } = data.data || data;
    
    logger.info('Password update data:', { targetUserId, hasNewPassword: !!newPassword });
    
    // Validate required fields
    if (!targetUserId || !newPassword) {
      const missingFields = [];
      if (!targetUserId) missingFields.push('targetUserId');
      if (!newPassword) missingFields.push('newPassword');
      
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'MISSING_FIELDS'
      };
    }
    
    // Validate password strength
    if (newPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long',
        code: 'WEAK_PASSWORD'
      };
    }
    
    try {
      // Update password in Firebase Auth
      await admin.auth().updateUser(targetUserId, {
        password: newPassword
      });
      
      logger.info('Password updated in Firebase Auth for user:', targetUserId);
      
      // Update password in Firestore (optional - for audit purposes)
      try {
        await admin.firestore().collection('users').doc(targetUserId).update({
          passwordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          passwordUpdatedBy: context.auth.uid
        });
        
        logger.info('Password update timestamp recorded in Firestore');
      } catch (firestoreError) {
        logger.warn('Could not record password update timestamp in Firestore:', firestoreError.message);
        // Don't fail the operation if Firestore update fails
      }
      
      return {
        success: true,
        message: 'Password updated successfully',
        userId: targetUserId,
        updatedAt: new Date().toISOString()
      };
      
    } catch (authError) {
      logger.error('Error updating password in Firebase Auth:', authError);
      
      if (authError.code === 'auth/user-not-found') {
        return {
          success: false,
          error: 'User not found in Firebase Auth',
          code: 'USER_NOT_FOUND_IN_AUTH'
        };
      } else if (authError.code === 'auth/invalid-password') {
        return {
          success: false,
          error: 'Password is too weak. Use at least 6 characters',
          code: 'WEAK_PASSWORD'
        };
      } else {
        return {
          success: false,
          error: 'Failed to update password: ' + authError.message,
          code: 'PASSWORD_UPDATE_FAILED'
        };
      }
    }
    
  } catch (error) {
    logger.error('updateUserPassword function error:', error);
    return {
      success: false,
      error: 'Failed to update password: ' + error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
});

// Function to create user with email/password (for restaurant admins)
exports.createUserWithEmail = onCall(async (data, context) => {
  try {
    logger.info('createUserWithEmail function called');
    logger.info('Function data:', data);
    logger.info('Function context:', context);
    
    // Check if user is authenticated and is super admin
    if (!context.auth) {
      logger.error('No authentication context found');
      throw new Error('Authentication required. Please log in as super admin.');
    }
    
    logger.info('User authenticated with UID:', context.auth.uid);
    
    // Get user data from Firestore to check role
    try {
      const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
      if (!userDoc.exists) {
        logger.error('User document not found for UID:', context.auth.uid);
        throw new Error('User not found in system');
      }
      
      const userData = userDoc.data();
      logger.info('User data retrieved:', { uid: context.auth.uid, role: userData.role });
      
      if (userData.role !== 'super_admin') {
        logger.error('User is not super admin. Role:', userData.role);
        throw new Error('Only super admins can create users');
      }
    } catch (firestoreError) {
      logger.error('Error checking user role:', firestoreError);
      throw new Error('Failed to verify user permissions: ' + firestoreError.message);
    }
    
    // Extract user creation data
    const { email, password, name, role, restaurantId, phone, permissions } = data.data || data;
    
    logger.info('User creation data:', { email, name, role, restaurantId, phone: phone ? 'provided' : 'not provided' });
    
    // Validate required fields
    if (!email || !password || !name || !role) {
      const missingFields = [];
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!name) missingFields.push('name');
      if (!role) missingFields.push('role');
      
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate role
    if (!['restaurant_admin', 'waiter'].includes(role)) {
      throw new Error('Invalid role. Only restaurant_admin and waiter roles are allowed');
    }
    
    // Validate restaurant assignment for non-super admin users
    if (role !== 'super_admin' && !restaurantId) {
      throw new Error('Restaurant ID is required for non-super admin users');
    }
    
    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        disabled: false
      });
      
      logger.info('User created in Firebase Auth:', userRecord.uid);
    } catch (authError) {
      logger.error('Error creating user in Firebase Auth:', authError);
      if (authError.code === 'auth/email-already-exists') {
        throw new Error('User with this email already exists');
      } else if (authError.code === 'auth/invalid-password') {
        throw new Error('Password is too weak. Use at least 6 characters');
      } else {
        throw new Error('Failed to create user account: ' + authError.message);
      }
    }
    
    // Create user document in Firestore
    try {
      const userDocData = {
        uid: userRecord.uid,
        email: email,
        name: name,
        role: role,
        restaurantId: restaurantId || null,
        phone: phone || '',
        phoneVerified: phone ? false : false,
        permissions: permissions || [],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid
      };
      
      await admin.firestore().collection('users').doc(userRecord.uid).set(userDocData);
      
      logger.info('User document created in Firestore');
    } catch (firestoreError) {
      logger.error('Error creating user document in Firestore:', firestoreError);
      // Try to clean up the created auth user
      try {
        await admin.auth().deleteUser(userRecord.uid);
        logger.info('Cleaned up auth user after Firestore failure');
      } catch (cleanupError) {
        logger.error('Failed to clean up auth user:', cleanupError);
      }
      throw new Error('Failed to create user profile: ' + firestoreError.message);
    }
    
    return {
      success: true,
      message: 'User created successfully',
      userId: userRecord.uid,
      userData: {
        uid: userRecord.uid,
        email: email,
        name: name,
        role: role,
        restaurantId: restaurantId,
        phone: phone || '',
        phoneVerified: false
      }
    };
    
  } catch (error) {
    logger.error('createUserWithEmail function error:', error);
    // Return a proper error response instead of throwing
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
});

// Test function to verify functions are working
exports.testFunction = onCall(async (data, context) => {
  try {
    logger.info('Test function called successfully');
    logger.info('Test function data:', data);
    logger.info('Test function context:', context);
    
    // Check if Firebase Admin is working
    let adminStatus = 'Not initialized';
    let firestoreStatus = 'Not available';
    
    try {
      if (admin.apps.length > 0) {
        adminStatus = 'Initialized';
        const db = admin.firestore();
        firestoreStatus = 'Available';
      }
    } catch (adminError) {
      adminStatus = 'Error: ' + adminError.message;
    }
    
    return {
      success: true,
      message: 'Test function is working!',
      timestamp: new Date().toISOString(),
      dataReceived: data.data ? 'Data received' : 'No data provided',
      adminStatus: adminStatus,
      firestoreStatus: firestoreStatus,
      authStatus: context.auth ? 'Authenticated' : 'Not authenticated',
      uid: context.auth?.uid || 'No UID'
    };
  } catch (error) {
    logger.error('Test function error:', error);
    logger.error('Test function error stack:', error.stack);
    throw new Error('Test function failed: ' + error.message);
  }
});

// Simple OTP function without Firestore (for testing)
exports.testOTPFunction = onCall(async (data, context) => {
  try {
    logger.info('Test OTP function called with data:', data);
    
    // Firebase callable functions wrap data in a 'data' property
    const { phoneNumber } = data.data || data;
    
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Generate OTP but don't store it
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    logger.info(`Test OTP generated for ${phoneNumber}: ${otp}`);
    
    return {
      success: true,
      message: 'Test OTP generated successfully (not stored)',
      phoneNumber: phoneNumber,
      otp: otp,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Test OTP function error:', error);
    throw new Error('Test OTP function failed: ' + error.message);
  }
});

// Function to send OTP for user creation
exports.sendUserCreationOTP = onCall(async (data, context) => {
  try {
    logger.info('sendUserCreationOTP called with data:', data);
    logger.info('Function context:', context);
    
    // Firebase callable functions wrap data in a 'data' property
    const { phoneNumber } = data.data || data;
    
    if (!phoneNumber) {
      logger.error('Phone number is missing');
      throw new Error('Phone number is required');
    }

    logger.info('Processing phone number:', phoneNumber);

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    logger.info('Generated OTP:', otp);
    
    // Store OTP in Firestore with expiration (5 minutes)
    try {
      const otpRef = admin.firestore().collection('otp_verification');
      logger.info('Attempting to store OTP in Firestore...');
      
      await otpRef.doc(phoneNumber).set({
        otp: otp,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        isUsed: false
      });
      
      logger.info('OTP stored successfully in Firestore');
    } catch (firestoreError) {
      logger.error('Firestore error:', firestoreError);
      throw new Error('Failed to store OTP: ' + firestoreError.message);
    }

    // In a real implementation, you would integrate with an SMS service like Twilio
    // For now, we'll just return the OTP (in production, remove this)
    logger.info(`OTP sent to ${phoneNumber}: ${otp}`);
    
    return {
      success: true,
      message: 'OTP sent successfully',
      // Remove this in production - only for development/testing
      otp: otp
    };
  } catch (error) {
    logger.error('Error in sendUserCreationOTP:', error);
    logger.error('Error stack:', error.stack);
    throw new Error('Failed to send OTP: ' + error.message);
  }
});

// Function to verify OTP for user creation
exports.verifyUserCreationOTP = onCall(async (data, context) => {
  try {
    // Firebase callable functions wrap data in a 'data' property
    const { phoneNumber, otp } = data.data || data;
    
    if (!phoneNumber || !otp) {
      throw new Error('Phone number and OTP are required');
    }

    // Get OTP from Firestore
    const otpRef = admin.firestore().collection('otp_verification');
    const otpDoc = await otpRef.doc(phoneNumber).get();
    
    if (!otpDoc.exists) {
      throw new Error('OTP not found or expired');
    }
    
    const otpData = otpDoc.data();
    
    // Check if OTP is expired
    if (otpData.expiresAt.toDate() < new Date()) {
      // Clean up expired OTP
      await otpRef.doc(phoneNumber).delete();
      throw new Error('OTP has expired');
    }
    
    // Check if OTP is already used
    if (otpData.isUsed) {
      throw new Error('OTP has already been used');
    }
    
    // Verify OTP
    if (otpData.otp !== otp) {
      throw new Error('Invalid OTP');
    }
    
    // Mark OTP as used
    await otpRef.doc(phoneNumber).update({
      isUsed: true
    });
    
    // Clean up OTP document after successful verification
    setTimeout(async () => {
      try {
        await otpRef.doc(phoneNumber).delete();
      } catch (error) {
        logger.error('Error cleaning up OTP:', error);
      }
    }, 60000); // Delete after 1 minute
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    throw new Error(error.message || 'Failed to verify OTP');
  }
});

// Cleanup expired OTPs (runs every hour)
exports.cleanupExpiredOTPs = onRequest(async (request, response) => {
  try {
    const now = new Date();
    const otpRef = admin.firestore().collection('otp_verification');
    
    // Get all OTPs
    const snapshot = await otpRef.get();
    let deletedCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.expiresAt && data.expiresAt.toDate() < now) {
        doc.ref.delete();
        deletedCount++;
      }
    });
    
    response.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired OTPs`,
      deletedCount: deletedCount
    });
  } catch (error) {
    logger.error('Error cleaning up expired OTPs:', error);
    response.status(500).json({
      success: false,
      error: 'Failed to cleanup expired OTPs'
    });
  }
});
