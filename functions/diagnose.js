const admin = require('firebase-admin');

console.log('=== Firebase Functions Diagnostic ===\n');

// Check Node.js version
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('');

// Check environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'Not set');
console.log('FIREBASE_CONFIG:', process.env.FIREBASE_CONFIG ? 'Set' : 'Not set');
console.log('');

// Check Firebase Admin
try {
  console.log('Firebase Admin Status:');
  console.log('Admin apps count:', admin.apps.length);
  
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin initialized');
    const app = admin.apps[0];
    console.log('App name:', app.name);
    console.log('App options:', JSON.stringify(app.options, null, 2));
  } else {
    console.log('❌ Firebase Admin not initialized');
  }
} catch (error) {
  console.log('❌ Firebase Admin error:', error.message);
}

console.log('');

// Check Firestore
try {
  if (admin.apps.length > 0) {
    console.log('Firestore Status:');
    const db = admin.firestore();
    console.log('✅ Firestore instance created');
    console.log('Database ID:', db.app.name);
  } else {
    console.log('❌ Cannot create Firestore - Admin not initialized');
  }
} catch (error) {
  console.log('❌ Firestore error:', error.message);
}

console.log('\n=== Diagnostic Complete ===');
