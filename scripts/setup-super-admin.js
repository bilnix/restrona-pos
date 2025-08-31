const admin = require('firebase-admin');
require('dotenv').config();

// Check if service account key exists
let serviceAccount;
try {
  serviceAccount = require('../functions/serviceAccountKey.json');
  console.log('✅ Found service account key');
} catch (error) {
  console.log('⚠️  No service account key found. Please follow the setup guide:');
  console.log('1. Go to Firebase Console → Project Settings → Service accounts');
  console.log('2. Generate new private key');
  console.log('3. Save as serviceAccountKey.json in functions/ directory');
  console.log('');
  return;
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'restrona-pos-257a7'
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  return;
}

const auth = admin.auth();
const db = admin.firestore();

async function createSuperAdmin() {
  try {
    console.log('🚀 Starting Super Admin Setup...\n');

    // Check if environment variables are set
    if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD) {
      console.error('❌ Environment variables not set!');
      console.log('Please set the following environment variables:');
      console.log('SUPER_ADMIN_EMAIL=your-email@example.com');
      console.log('SUPER_ADMIN_PASSWORD=your-secure-password');
      console.log('\nYou can also modify this script to hardcode the values temporarily.');
      return;
    }

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const name = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

    console.log(`📧 Creating super admin with email: ${email}`);
    console.log(`👤 Name: ${name}\n`);

    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name
    });

    console.log(`✅ User created successfully! UID: ${userRecord.uid}`);

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      name: name,
      email: email,
      role: 'super_admin',
      permissions: [
        'manage_restaurants',
        'manage_users',
        'view_analytics',
        'system_settings',
        'global_management'
      ],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('✅ User document created in Firestore');

    // Create initial system settings
    const systemSettings = {
      systemName: 'Restrona POS System',
      version: '1.0.0',
      maintenanceMode: false,
      allowNewRegistrations: true,
      maxRestaurantsPerAdmin: 1,
      defaultUserPermissions: {
        restaurant_admin: ['manage_menu', 'manage_tables', 'view_orders', 'view_analytics'],
        waiter: ['view_orders', 'update_order_status', 'print_bills']
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('settings').doc('system').set(systemSettings);
    console.log('✅ System settings created');

    console.log('\n🎉 Super Admin Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy Firestore security rules: firebase deploy --only firestore:rules');
    console.log('2. Deploy Storage rules: firebase deploy --only storage');
    console.log('3. Start your application: npm run dev');
    console.log('4. Login with the super admin credentials');
    console.log('5. Create your first restaurant');
    console.log('6. Add restaurant admin users');

    console.log('\n🔐 Login Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ Error during setup:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 User already exists. You can:');
      console.log('1. Use existing credentials to login');
      console.log('2. Or delete the user and run this script again');
    }
  }
}

// Run the setup
createSuperAdmin();
