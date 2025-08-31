const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migratePhoneVerification() {
  try {
    console.log('🔄 Starting phone verification migration...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    let updatedCount = 0;
    let skippedCount = 0;
    
    console.log(`📊 Found ${usersSnapshot.size} users to process`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Skip if already has phoneVerified field
      if (userData.phoneVerified !== undefined) {
        skippedCount++;
        continue;
      }
      
      // Update user with phoneVerified field
      // For existing users, we'll mark them as verified (assuming they were created before OTP requirement)
      await userDoc.ref.update({
        phoneVerified: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      updatedCount++;
      console.log(`✅ Updated user: ${userData.name || userData.email || userDoc.id}`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📈 Users updated: ${updatedCount}`);
    console.log(`⏭️  Users skipped: ${skippedCount}`);
    console.log(`📊 Total processed: ${usersSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migratePhoneVerification()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
