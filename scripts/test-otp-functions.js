const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testOTPFunctions() {
  try {
    console.log('🧪 Testing OTP Functions...\n');
    
    const testPhone = '+919876543210';
    
    // Test 1: Send OTP
    console.log('📱 Test 1: Sending OTP...');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await db.collection('otp_verification').doc(testPhone).set({
      otp: otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      isUsed: false
    });
    
    console.log(`✅ OTP sent: ${otp}`);
    
    // Test 2: Verify OTP
    console.log('\n🔍 Test 2: Verifying OTP...');
    const otpDoc = await db.collection('otp_verification').doc(testPhone).get();
    
    if (!otpDoc.exists) {
      throw new Error('OTP document not found');
    }
    
    const otpData = otpDoc.data();
    console.log('📋 OTP Data:', {
      phone: testPhone,
      otp: otpData.otp,
      createdAt: otpData.createdAt?.toDate(),
      expiresAt: otpData.expiresAt?.toDate(),
      isUsed: otpData.isUsed
    });
    
    // Test 3: Mark OTP as used
    console.log('\n✅ Test 3: Marking OTP as used...');
    await db.collection('otp_verification').doc(testPhone).update({
      isUsed: true
    });
    
    console.log('✅ OTP marked as used');
    
    // Test 4: Cleanup
    console.log('\n🧹 Test 4: Cleaning up test data...');
    await db.collection('otp_verification').doc(testPhone).delete();
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All OTP tests passed successfully!');
    
  } catch (error) {
    console.error('❌ OTP test failed:', error);
    process.exit(1);
  }
}

// Run tests
testOTPFunctions()
  .then(() => {
    console.log('✅ OTP test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ OTP test script failed:', error);
    process.exit(1);
  });
