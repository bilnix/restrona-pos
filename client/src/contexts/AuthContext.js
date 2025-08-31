import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          console.log('reCAPTCHA solved');
        }
      });
    }
  }, []);

  // Phone number sign in
  const signInWithPhone = async (phoneNumber) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        window.recaptchaVerifier
      );
      return confirmationResult;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  // Email/password sign in (for Super Admin)
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  // Create new user with email/password
  const createUserWithEmail = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('Error creating user with email:', error);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Get user data from Firestore
  const getUserData = async (uid) => {
    try {
      console.log('Getting user data from Firestore for UID:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      console.log('User document exists:', userDoc.exists());
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('User data:', data);
        return data;
      }
      console.log('User document does not exist');
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  // Create user data in Firestore
  const createUserData = async (uid, userData) => {
    try {
      console.log('Attempting to create user data in Firestore for UID:', uid);
      await setDoc(doc(db, 'users', uid), {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('User data created successfully in Firestore');
    } catch (error) {
      console.error('Error creating user data:', error);
      
      // If Firestore fails, create a local fallback user data
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        console.log('Firestore permission denied, using local fallback user data');
        const fallbackUserData = {
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
          isLocalFallback: true
        };
        setUserData(fallbackUserData);
        return fallbackUserData;
      }
      
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');
    console.log('Auth object:', auth);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed in context:', { user: !!user, uid: user?.uid });
      setCurrentUser(user);
      
      if (user) {
        console.log('Fetching user data for UID:', user.uid);
        let data = await getUserData(user.uid);
        console.log('User data fetched:', data);
        
                 // If no user data exists, create default user data
         if (!data) {
           console.log('No user data found, creating default user data');
           const defaultUserData = {
             uid: user.uid,
             email: user.email,
             name: user.displayName || user.email?.split('@')[0] || 'User',
             role: 'super_admin', // Default role for email/password users
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
             const createdData = await createUserData(user.uid, defaultUserData);
             console.log('Default user data created successfully');
             data = createdData || defaultUserData;
           } catch (error) {
             console.error('Error creating default user data:', error);
             // Use the default data as fallback
             data = defaultUserData;
           }
         }
        
        setUserData(data);
      } else {
        console.log('No user, clearing user data');
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Permission checking utility
  const hasPermission = (permission) => {
    if (!userData) return false;
    if (userData.isSuperAdmin || userData.canAccessEverything) return true;
    return userData.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions) => {
    if (!userData) return false;
    if (userData.isSuperAdmin || userData.canAccessEverything) return true;
    return permissions.some(permission => userData.permissions?.includes(permission));
  };

  const hasAllPermissions = (permissions) => {
    if (!userData) return false;
    if (userData.isSuperAdmin || userData.canAccessEverything) return true;
    return permissions.every(permission => userData.permissions?.includes(permission));
  };

  const value = {
    currentUser,
    userData,
    loading,
    signInWithPhone,
    signInWithEmail,
    createUserWithEmail,
    logout,
    getUserData,
    createUserData,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
