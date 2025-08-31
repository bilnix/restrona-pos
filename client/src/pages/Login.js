import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Restaurant } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const { signInWithPhone, signInWithEmail, createUserWithEmail, currentUser, userData, loading: authLoading, createUserData } = useAuth();
  const navigate = useNavigate();

  // Redirect user based on their role after successful authentication
  useEffect(() => {
    console.log('Auth state changed:', { 
      currentUser: !!currentUser, 
      userData, 
      authLoading,
      currentUserUid: currentUser?.uid,
      userDataRole: userData?.role
    });
    
    if (currentUser && userData && !authLoading) {
      console.log('User authenticated, role:', userData.role);
      switch (userData.role) {
        case 'super_admin':
          console.log('Redirecting to super admin dashboard');
          navigate('/super-admin');
          break;
        case 'restaurant_admin':
          console.log('Redirecting to restaurant dashboard');
          navigate('/restaurant');
          break;
        case 'waiter':
          console.log('Redirecting to waiter dashboard');
          navigate('/waiter');
          break;
        default:
          console.log('No role assigned, staying on login page');
          // If no role is assigned, stay on login page
          break;
      }
    } else if (currentUser && !userData && !authLoading) {
      console.log('User authenticated but no user data found');
    }
  }, [currentUser, userData, authLoading, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setShowOtpField(false);
    setOtp('');
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const result = await signInWithPhone(formattedPhone);
      setConfirmationResult(result);
      setShowOtpField(true);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      toast.success('Login successful!');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting email login for:', email);
      
      // For demo credentials, create a real Firebase user if it doesn't exist
      if (email === 'admin@restrona.com' && password === 'admin123') {
        console.log('Using demo credentials, creating/authenticating Firebase user');
        
        try {
          // Try to sign in with existing user
          const result = await signInWithEmail(email, password);
          console.log('Demo user login successful');
          toast.success('Demo login successful!');
          
          // Create user data if it doesn't exist
          if (result?.user) {
            console.log('Creating user data for demo login');
            const defaultUserData = {
              uid: result.user.uid,
              email: result.user.email,
              name: 'Super Admin',
              role: 'super_admin',
              permissions: [
                'manage_restaurants',
                'manage_users',
                'manage_menus',
                'manage_tables',
                'manage_orders',
                'view_analytics',
                'system_settings',
                'global_management',
                'financial_reports',
                'staff_management',
                'inventory_management',
                'customer_management',
                'billing_management',
                'promotion_management',
                'notification_management',
                'backup_restore',
                'api_management',
                'security_settings',
                'audit_logs',
                'super_admin_access'
              ],
              isActive: true,
              isSuperAdmin: true,
              canAccessEverything: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            try {
              await createUserData(result.user.uid, defaultUserData);
              console.log('Demo user data created successfully');
            } catch (error) {
              console.error('Error creating demo user data:', error);
            }
          }
          
          return;
        } catch (signInError) {
          if (signInError.code === 'auth/user-not-found') {
            console.log('Demo user not found, creating new Firebase user');
            toast.info('Creating demo super admin account...');
            
            // Create a new Firebase user
            try {
              const result = await createUserWithEmail(email, password);
              console.log('Demo user created and logged in successfully');
              toast.success('Demo super admin account created and logged in!');
              
              // Create user data
              if (result?.user) {
                const defaultUserData = {
                  uid: result.user.uid,
                  email: result.user.email,
                  name: 'Super Admin',
                  role: 'super_admin',
                  permissions: [
                    'manage_restaurants',
                    'manage_users',
                    'manage_menus',
                    'manage_tables',
                    'manage_orders',
                    'view_analytics',
                    'system_settings',
                    'global_management',
                    'financial_reports',
                    'staff_management',
                    'inventory_management',
                    'customer_management',
                    'billing_management',
                    'promotion_management',
                    'notification_management',
                    'backup_restore',
                    'api_management',
                    'security_settings',
                    'audit_logs',
                    'super_admin_access'
                  ],
                  isActive: true,
                  isSuperAdmin: true,
                  canAccessEverything: true,
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                try {
                  await createUserData(result.user.uid, defaultUserData);
                  console.log('Demo user data created successfully');
                } catch (error) {
                  console.error('Error creating demo user data:', error);
                }
              }
              
              return;
            } catch (createError) {
              console.error('Error creating demo user:', createError);
              toast.error('Failed to create demo account: ' + createError.message);
            }
          } else {
            throw signInError;
          }
        }
      }
      
      // Regular Firebase authentication
      const result = await signInWithEmail(email, password);
      console.log('Email login successful');
      toast.success('Login successful!');
      
      // Create user data if it doesn't exist
      if (result?.user) {
        console.log('Creating user data for new login');
        const defaultUserData = {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          role: 'super_admin',
          permissions: [
            'manage_restaurants',
            'manage_users',
            'manage_menus',
            'manage_tables',
            'manage_orders',
            'view_analytics',
            'system_settings',
            'global_management',
            'financial_reports',
            'staff_management',
            'inventory_management',
            'customer_management',
            'billing_management',
            'promotion_management',
            'notification_management',
            'backup_restore',
            'api_management',
            'security_settings',
            'audit_logs',
            'super_admin_access'
          ],
          isActive: true,
          isSuperAdmin: true,
          canAccessEverything: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        try {
          await createUserData(result.user.uid, defaultUserData);
          console.log('User data created successfully');
        } catch (error) {
          console.error('Error creating user data:', error);
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      
      // Check if this might be a restaurant admin login attempt
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Invalid email or password. Restaurant admins should use the email/password provided by the super admin.');
      } else {
        toast.error('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  // If user is already authenticated, show loading while redirecting
  if (currentUser && userData) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={2}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            {/* Logo Icon */}
            <Box 
              sx={{ 
                width: 60, 
                height: 60, 
                mx: 'auto', 
                mb: 2,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Restaurant sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              Restrona
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Restaurant POS System
            </Typography>
          </Box>

          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
            <Tab label="Phone OTP" />
            <Tab label="Email/Password" />
          </Tabs>

          {tabValue === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Login with phone number (OTP verification)
              </Typography>
              <TextField
                fullWidth
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                sx={{ mb: 2 }}
                disabled={showOtpField}
              />

              {!showOtpField ? (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSendOtp}
                  disabled={!phoneNumber || phoneNumber.length < 10}
                >
                  Send OTP
                </Button>
              ) : (
                <Box>
                  <TextField
                    fullWidth
                    label="OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    sx={{ mb: 2 }}
                    inputProps={{ maxLength: 6 }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleVerifyOtp}
                    disabled={!otp || otp.length !== 6}
                    sx={{ mb: 2 }}
                  >
                    Verify OTP
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setShowOtpField(false);
                      setOtp('');
                    }}
                  >
                    Change Phone Number
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Login with email and password (Super Admin & Restaurant Admin)
              </Typography>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleEmailLogin}
                disabled={!email || !password}
              >
                Login
              </Button>
                         </Box>
           )}

                       {/* Powered by bilnix at the end */}
            <Box textAlign="center" mt={3}>
              <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', fontFamily: 'Arial, sans-serif', fontWeight: 500 }}>
                -powered by bilnix
              </Typography>
            </Box>

         </CardContent>
       </Card>
     </Box>
   );
 };

export default Login;
