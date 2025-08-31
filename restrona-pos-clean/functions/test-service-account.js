console.log('=== Testing Service Account Key ===\n');

try {
  // Try to load the service account key
  const serviceAccount = require('./serviceAccountKey.json');
  console.log('✅ Service account key loaded successfully');
  console.log('Project ID:', serviceAccount.project_id);
  console.log('Client Email:', serviceAccount.client_email);
  console.log('Type:', serviceAccount.type);
  
  // Check if it's a valid service account
  if (serviceAccount.type === 'service_account' && serviceAccount.private_key) {
    console.log('✅ Valid service account format');
  } else {
    console.log('❌ Invalid service account format');
  }
  
} catch (error) {
  console.error('❌ Failed to load service account key:', error.message);
  console.error('Error details:', error);
}

console.log('\n=== Test Complete ===');
