import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Restaurant,
  Business,
  Send
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db, simpleTest, testFunction, createUserWithEmail, updateUserPassword } from '../../firebase/config';
import phoneAuthService from '../../services/phoneAuth';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const { currentUser, userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [phoneVerificationId, setPhoneVerificationId] = useState(null);
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'waiter',
    restaurantId: '',
    permissions: []
  });

  useEffect(() => {
    // Check if user is authenticated and is super admin
    if (currentUser && userData && userData.role === 'super_admin') {
      fetchUsers();
      fetchRestaurants();
    } else if (currentUser && userData) {
      toast.error('Access denied. Only super admins can manage users.');
    } else if (!currentUser) {
      toast.error('Please log in to access user management.');
    }
    
    // Cleanup function to clear reCAPTCHA when component unmounts
    return () => {
      phoneAuthService.clearVerification();
    };
  }, [currentUser, userData]);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
      const restaurantsData = restaurantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to fetch restaurants');
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'waiter',
      restaurantId: '',
      permissions: []
    });
    setActiveStep(0);
    setPhoneVerificationId(null);
    setPhoneVerificationCode('');
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Don't show existing password
      role: user.role || 'waiter',
      restaurantId: user.restaurantId || '',
      permissions: user.permissions || []
    });
    setActiveStep(0);
    setPhoneVerificationId(null);
    setPhoneVerificationCode('');
    // Clear service state when editing user
    phoneAuthService.clearVerification();
    setOpenDialog(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleSendPhoneVerification = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setPhoneVerificationLoading(true);
    try {
      const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
      const result = await phoneAuthService.sendOTP(formattedPhone, 'recaptcha-container');
      
      if (result.success) {
        // Update both component state and service state
        setPhoneVerificationId(result.verificationId);
        // Sync the service state to ensure consistency
        phoneAuthService.syncVerificationId(result.verificationId);
        setActiveStep(1);
        toast.success('Verification code sent successfully! Check your phone for SMS.');
      } else {
        toast.error('Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      // Clear verification state on error
      setPhoneVerificationId(null);
      phoneAuthService.clearVerification();
      toast.error(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setPhoneVerificationLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneVerificationCode || phoneVerificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }

    // Check if we have verification ID in both places
    const serviceVerificationId = phoneAuthService.getVerificationId();
    if (!phoneVerificationId || !serviceVerificationId) {
      toast.error('No verification ID found. Please send OTP first.');
      return;
    }

    setPhoneVerificationLoading(true);
    try {
      const result = await phoneAuthService.verifyOTP(phoneVerificationCode);
      
      if (result.success) {
        setActiveStep(2);
        toast.success('Phone number verified successfully!');
      } else {
        toast.error('Phone verification failed');
      }
    } catch (error) {
      console.error('Error verifying phone code:', error);
      // Clear verification state on error
      setPhoneVerificationId(null);
      phoneAuthService.clearVerification();
      toast.error(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setPhoneVerificationLoading(false);
    }
  };

  const handleSaveUser = async () => {
    // Check authentication and permissions
    if (!currentUser || !userData) {
      toast.error('Please log in to create users');
      return;
    }
    
    if (userData.role !== 'super_admin') {
      toast.error('Only super admins can create users');
      return;
    }

    if (!formData.name || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For restaurant_admin role, email and password are required
    if (formData.role === 'restaurant_admin' && (!formData.email || !formData.password)) {
      toast.error('Email and password are required for restaurant admin users');
      return;
    }

    if (formData.role !== 'super_admin' && !formData.restaurantId) {
      toast.error('Restaurant is required for non-super admin users');
      return;
    }

    // Phone verification is only required if phone number is provided
    if (formData.phone && !phoneVerificationId) {
      toast.error('Please verify phone number first');
      return;
    }

    try {
      let userData = {
        ...formData,
        phone: formData.phone ? (formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`) : '',
        phoneVerified: formData.phone ? !!phoneVerificationId : false, // Mark phone as verified only if provided
        updatedAt: new Date()
      };

      // Remove password from userData if it's empty (for editing existing users)
      if (!userData.password) {
        delete userData.password;
      }

      if (selectedUser) {
        // Update existing user
        await updateDoc(doc(db, 'users', selectedUser.id), userData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        if (formData.role === 'restaurant_admin' && formData.email && formData.password) {
          // Use Firebase function to create user with email/password
          try {
            const result = await createUserWithEmail({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              role: formData.role,
              restaurantId: formData.restaurantId,
              phone: formData.phone || '',
              permissions: formData.permissions || []
            });
            
            console.log('Firebase function result:', result);
            
            if (result.data && result.data.success) {
              toast.success('Restaurant admin user created successfully with email/password login');
            } else {
              // Handle error response from function
              const errorMessage = result.data?.error || result.data?.message || 'Unknown error occurred';
              toast.error('Failed to create user: ' + errorMessage);
              return;
            }
          } catch (firebaseError) {
            console.error('Firebase function error:', firebaseError);
            toast.error('Failed to create user with Firebase function: ' + firebaseError.message);
            return;
          }
        } else {
          // Create user without email/password (existing logic)
          userData.createdAt = new Date();
          await addDoc(collection(db, 'users'), userData);
          toast.success('User created successfully');
        }
      }

      setOpenDialog(false);
      setActiveStep(0);
      setPhoneVerificationId(null);
      setPhoneVerificationCode('');
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setActiveStep(0);
    setPhoneVerificationId(null);
    setPhoneVerificationCode('');
    // Clear reCAPTCHA when dialog is closed
    phoneAuthService.clearVerification();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'restaurant_admin':
        return 'primary';
      case 'waiter':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Business />;
      case 'restaurant_admin':
        return <Restaurant />;
      case 'waiter':
        return <Person />;
      default:
        return <Person />;
    }
  };

  // Function to check if we can proceed to save (for step 0)
  const canProceedToSave = () => {
    if (!formData.name || !formData.role) return false;
    if (formData.role === 'restaurant_admin' && (!formData.email || !formData.password)) return false;
    if (formData.role !== 'super_admin' && !formData.restaurantId) return false;
    
    // If phone number is provided, it must be verified
    if (formData.phone && !phoneVerificationId) return false;
    
    return true;
  };

  // Function to handle proceeding without phone verification
  const handleProceedWithoutPhone = () => {
    if (canProceedToSave()) {
      setActiveStep(2);
      toast.info('Proceeding without phone verification as per user request.');
    } else {
      toast.error('Please fill in all required fields first');
    }
  };

  // Function to update user password
  const handleUpdatePassword = async () => {
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!selectedUser) {
      toast.error('No user selected for password update');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      console.log('Updating password for user:', selectedUser.id);
      
      const result = await updateUserPassword({
        targetUserId: selectedUser.id,
        newPassword: formData.password
      });
      
      console.log('Password update result:', result);
      
      if (result.data && result.data.success) {
        toast.success('Password updated successfully! User can now login with the new password.');
        // Clear password field after successful update
        setFormData(prev => ({ ...prev, password: '' }));
      } else {
        const errorMessage = result.data?.error || 'Unknown error occurred';
        toast.error('Failed to update password: ' + errorMessage);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password: ' + error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number (Optional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91XXXXXXXXXX"
                helperText="Leave empty if not needed"
              />
            </Grid>
            {formData.phone && (
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={phoneVerificationLoading ? <CircularProgress size={20} /> : <Send />}
                  onClick={handleSendPhoneVerification}
                  disabled={phoneVerificationLoading || !formData.phone || formData.phone.length < 10}
                  sx={{ height: 56 }}
                >
                  {phoneVerificationLoading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </Grid>
            )}
            {formData.phone && (
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={async () => {
                    try {
                      await phoneAuthService.resetRecaptcha();
                      toast.success('Verification system completely reset. Try sending code again.');
                    } catch (error) {
                      console.error('Error resetting verification:', error);
                      toast.error('Error resetting verification system');
                    }
                  }}
                  disabled={phoneVerificationLoading}
                  sx={{ height: 56 }}
                >
                  Reset Verification System
                </Button>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required={formData.role === 'restaurant_admin'}
                helperText={formData.role === 'restaurant_admin' ? 'Required for restaurant admin' : 'Optional for other roles'}
              />
            </Grid>
            {formData.role === 'restaurant_admin' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required={!selectedUser} // Required for new users, optional for editing
                  helperText={selectedUser ? 'Leave empty to keep current password' : 'Required for restaurant admin login'}
                />
              </Grid>
            )}
            
            {/* Password Update Section for Existing Users */}
            {selectedUser && formData.role === 'restaurant_admin' && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    🔐 Update Password
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter new password (min 6 characters)"
                        helperText="Password will be updated immediately for login"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={handleUpdatePassword}
                        disabled={!formData.password || formData.password.length < 6 || isUpdatingPassword}
                        startIcon={isUpdatingPassword ? <CircularProgress size={20} /> : null}
                      >
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                  <MenuItem value="restaurant_admin">Restaurant Admin</MenuItem>
                  <MenuItem value="waiter">Waiter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Restaurant</InputLabel>
                <Select
                  value={formData.restaurantId}
                  onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
                  label="Restaurant"
                  disabled={formData.role === 'super_admin'}
                >
                  <MenuItem value="">
                    <em>Select Restaurant</em>
                  </MenuItem>
                  {restaurants.map((restaurant) => (
                    <MenuItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Action buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {!formData.phone && canProceedToSave() && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleProceedWithoutPhone}
                  >
                    Proceed to Review
                  </Button>
                )}
                {formData.phone && canProceedToSave() && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleProceedWithoutPhone}
                    disabled={!phoneVerificationId}
                  >
                    Skip Phone Verification
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Verification code has been sent to {formData.phone}. Please check your phone for SMS and enter the 6-digit code.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Enter Verification Code"
                value={phoneVerificationCode}
                onChange={(e) => setPhoneVerificationCode(e.target.value)}
                placeholder="123456"
                inputProps={{ maxLength: 6 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyPhoneCode}
                disabled={phoneVerificationLoading || !phoneVerificationCode || phoneVerificationCode.length !== 6}
                startIcon={phoneVerificationLoading ? <CircularProgress size={20} /> : null}
              >
                {phoneVerificationLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setActiveStep(0)}
                disabled={phoneVerificationLoading}
              >
                Back to Details
              </Button>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="success" sx={{ mb: 2 }}>
                {formData.phone ? 'Phone number verified successfully!' : 'User details completed!'} You can now create the user.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                <strong>Name:</strong> {formData.name}<br/>
                {formData.phone && <><strong>Phone:</strong> {formData.phone}<br/></>}
                <strong>Email:</strong> {formData.email || 'Not provided'}<br/>
                <strong>Role:</strong> {formData.role.replace('_', ' ').toUpperCase()}<br/>
                {formData.restaurantId && <><strong>Restaurant:</strong> {restaurants.find(r => r.id === formData.restaurantId)?.name}<br/></>}
                {formData.role === 'restaurant_admin' && <><strong>Password:</strong> {formData.password ? '✓ Set' : '✗ Not set'}<br/></>}
              </Typography>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          User Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Current auth state:', { currentUser, userData });
              toast.info(`Auth: ${currentUser ? 'Logged in' : 'Not logged in'}, Role: ${userData?.role || 'None'}`);
            }}
          >
            Debug Auth
          </Button>
          
          {/* Firebase Auth Test Button */}
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              console.log('=== FIREBASE AUTH DEBUG ===');
              console.log('currentUser:', currentUser);
              console.log('currentUser?.uid:', currentUser?.uid);
              console.log('currentUser?.email:', currentUser?.email);
              console.log('userData:', userData);
              console.log('userData?.role:', userData?.role);
              console.log('userData?.uid:', userData?.uid);
              console.log('=== END DEBUG ===');
              
              if (currentUser && currentUser.uid) {
                toast.success(`Firebase Auth: ✅ UID: ${currentUser.uid}`);
              } else {
                toast.error('Firebase Auth: ❌ No authenticated user');
              }
            }}
          >
            🔥 Test Firebase Auth
          </Button>
          
          {/* Demo User Creation Button */}
          <Button
            variant="contained"
            color="secondary"
            onClick={async () => {
              try {
                console.log('Creating demo restaurant admin user...');
                
                // Check if we have a restaurant to assign
                if (restaurants.length === 0) {
                  toast.error('No restaurants available. Please create a restaurant first.');
                  return;
                }
                
                // Use the first available restaurant (or you can specify which one)
                const targetRestaurant = restaurants.find(r => r.name.toLowerCase().includes('naymad')) || restaurants[0];
                
                const result = await createUserWithEmail({
                  email: 'naymad@restrona.com',
                  password: 'naymad123',
                  name: 'Naymad Manager',
                  role: 'restaurant_admin',
                  restaurantId: targetRestaurant.id,
                  phone: '+919876543210', // Demo phone number
                  permissions: [
                    'manage_menus',
                    'manage_tables',
                    'manage_orders',
                    'view_analytics',
                    'staff_management',
                    'inventory_management',
                    'customer_management',
                    'billing_management'
                  ]
                });
                
                if (result.data && result.data.success) {
                  toast.success(`Demo restaurant admin created successfully for ${targetRestaurant.name}!`);
                  toast.info('Login: naymad@restrona.com / naymad123');
                  fetchUsers(); // Refresh the users list
                } else {
                  const errorMessage = result.data?.error || 'Unknown error occurred';
                  toast.error('Failed to create demo user: ' + errorMessage);
                }
              } catch (error) {
                console.error('Error creating demo user:', error);
                toast.error('Failed to create demo user: ' + error.message);
              }
            }}
            disabled={!currentUser || userData?.role !== 'super_admin' || restaurants.length === 0}
          >
            🏪 Create Demo Restaurant Admin
          </Button>
          
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                console.log('Testing simple function (no Firebase dependencies)...');
                const testResult = await simpleTest({ message: 'Hello' });
                console.log('Simple test successful:', testResult);
                toast.success('Simple function working!');
              } catch (error) {
                console.error('Simple test failed:', error);
                toast.error('Simple test failed: ' + error.message);
              }
            }}
          >
            Simple Test
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                console.log('Testing basic Firebase Functions connection...');
                const testResult = await testFunction({ message: 'Hello from client' });
                console.log('Basic test successful:', testResult);
                toast.success('Basic Firebase Functions connection working!');
              } catch (error) {
                console.error('Basic test failed:', error);
                toast.error('Basic test failed: ' + error.message);
              }
            }}
          >
            Test Basic
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                console.log('Testing Firebase Phone Auth...');
                const result = await phoneAuthService.sendOTP('+919876543210', 'recaptcha-container');
                console.log('Phone Auth OTP sent:', result);
                toast.success('Firebase Phone Auth OTP sent successfully!');
              } catch (error) {
                console.error('Phone Auth failed:', error);
                toast.error('Phone Auth failed: ' + error.message);
              }
            }}
          >
            Test Firebase Phone Auth
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                console.log('Testing reCAPTCHA setup...');
                const recaptchaVerifier = phoneAuthService.setupRecaptcha('recaptcha-container');
                console.log('reCAPTCHA setup successful:', recaptchaVerifier);
                toast.success('reCAPTCHA setup successful!');
              } catch (error) {
                console.error('reCAPTCHA setup failed:', error);
                toast.error('reCAPTCHA setup failed: ' + error.message);
              }
            }}
          >
            Test reCAPTCHA Setup
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const serviceVerificationId = phoneAuthService.getVerificationId();
              console.log('Debug Verification State:', {
                componentState: phoneVerificationId,
                serviceState: serviceVerificationId,
                phoneVerificationCode,
                activeStep
              });
              toast.info(`Component: ${phoneVerificationId || 'null'}, Service: ${serviceVerificationId || 'null'}`);
            }}
          >
            Debug Verification State
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                console.log('Testing Firebase Phone Auth OTP verification...');
                const result = await phoneAuthService.verifyOTP('123456');
                console.log('Phone Auth OTP verified:', result);
                toast.success('Firebase Phone Auth OTP verified successfully!');
              } catch (error) {
                console.error('Phone Auth verification failed:', error);
                toast.error('Phone Auth verification failed: ' + error.message);
              }
            }}
          >
            Test OTP Verification
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddUser}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Restaurant</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>
                  {user.phone ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.phone}
                      {user.phoneVerified && (
                        <Chip label="✓ Verified" size="small" color="success" />
                      )}
                    </Box>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role.replace('_', ' ').toUpperCase()}
                    color={getRoleColor(user.role)}
                    icon={getRoleIcon(user.role)}
                  />
                </TableCell>
                <TableCell>
                  {user.restaurantId ? (
                    restaurants.find(r => r.id === user.restaurantId)?.name || 'Unknown'
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Active' : 'Inactive'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                    
                    {/* Quick Password Update Button for Restaurant Admins */}
                    {user.role === 'restaurant_admin' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                          setSelectedUser(user);
                          setFormData({
                            name: user.name || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            password: '',
                            role: user.role || 'restaurant_admin',
                            restaurantId: user.restaurantId || '',
                            permissions: user.permissions || []
                          });
                          setOpenDialog(true);
                          setActiveStep(0);
                        }}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        🔐
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 2 }}>
            <Step>
              <StepLabel>User Details</StepLabel>
            </Step>
            <Step>
              <StepLabel>Phone Verification</StepLabel>
            </Step>
            <Step>
              <StepLabel>Confirmation</StepLabel>
            </Step>
          </Stepper>
          
          {getStepContent(activeStep)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {activeStep === 2 && (
            <Button onClick={handleSaveUser} variant="contained">
              {selectedUser ? 'Update' : 'Create'} User
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* reCAPTCHA Container for Phone Auth */}
      <div id="recaptcha-container"></div>
    </Box>
  );
};

export default UserManagement;
