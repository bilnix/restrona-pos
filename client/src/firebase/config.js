import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Your Firebase configuration - must have .env file with real credentials
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Validate that all required environment variables are present
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN', 
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
    `Please create a .env file in the client directory with your Firebase credentials.\n` +
    `Run 'firebase apps:sdkconfig web' to get your configuration.`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized successfully with live credentials');

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Firebase Cloud Functions
export const simpleTest = httpsCallable(functions, 'simpleTest');
export const testFunction = httpsCallable(functions, 'testFunction');
export const testOTPFunction = httpsCallable(functions, 'testOTPFunction');
export const sendUserCreationOTP = httpsCallable(functions, 'sendUserCreationOTP');
export const verifyUserCreationOTP = httpsCallable(functions, 'verifyUserCreationOTP');
export const createUserWithEmail = httpsCallable(functions, 'createUserWithEmail');
export const updateUserPassword = httpsCallable(functions, 'updateUserPassword');

// Phone Auth Helper Functions
export const setupRecaptcha = (containerId) => {
  try {
    console.log('🔐 Setting up reCAPTCHA for container:', containerId);
    console.log('🔍 Firebase Auth instance:', auth);
    console.log('🔍 Firebase config:', firebaseConfig);
    
    // Clear any existing reCAPTCHA in the container
    const container = document.getElementById(containerId);
    if (container) {
      console.log('✅ Container found:', container);
      // Remove any existing reCAPTCHA widgets
      const existingWidgets = container.querySelectorAll('.grecaptcha-badge, iframe[src*="recaptcha"]');
      existingWidgets.forEach(widget => widget.remove());
      
      // Clear the container content
      container.innerHTML = '';
      console.log('✅ Container cleared');
    } else {
      console.error('❌ Container not found:', containerId);
    }
    
    // Create new reCAPTCHA verifier
    console.log('🆕 Creating RecaptchaVerifier...');
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response) => {
        console.log('✅ reCAPTCHA solved:', response);
      },
      'expired-callback': () => {
        console.log('⚠️ reCAPTCHA expired');
      }
    });
    
    console.log('✅ RecaptchaVerifier created:', recaptchaVerifier);
    return recaptchaVerifier;
  } catch (error) {
    console.error('❌ Error setting up reCAPTCHA:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

export const clearRecaptcha = () => {
  try {
    // Clear any global reCAPTCHA instances
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Error clearing global reCAPTCHA:', e);
      }
      window.recaptchaVerifier = null;
    }
    
    // Clear all reCAPTCHA containers
    const containers = document.querySelectorAll('#recaptcha-container');
    containers.forEach(container => {
      if (container) {
        const existingWidgets = container.querySelectorAll('.grecaptcha-badge, iframe[src*="recaptcha"]');
        existingWidgets.forEach(widget => widget.remove());
        container.innerHTML = '';
      }
    });
  } catch (error) {
    console.warn('Error clearing reCAPTCHA:', error);
  }
};

export default app;
