# Deployment Guide for OTP Functions

This guide will help you deploy the OTP functions and resolve CORS issues.

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Logged into Firebase**
   ```bash
   firebase login
   ```

3. **Project selected**
   ```bash
   firebase use restrona-pos-257a7
   ```

## Step 1: Install Dependencies

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install
```

## Step 2: Deploy Functions

Deploy the Cloud Functions:

```bash
firebase deploy --only functions
```

**Important**: Make sure to deploy to the correct region (us-central1).

## Step 3: Verify Function URLs

After deployment, check the function URLs in the Firebase console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `restrona-pos-257a7`
3. Go to Functions tab
4. Verify the functions are deployed and active

## Step 4: Test Functions

Test the functions using the Firebase console or a simple test:

```bash
# Test the cleanup function (optional)
curl -X GET "https://us-central1-restrona-pos-257a7.cloudfunctions.net/cleanupExpiredOTPs"
```

## Step 5: Deploy Security Rules

Deploy the updated Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

## Troubleshooting CORS Issues

### Issue: CORS Error
```
Access to fetch at 'https://us-central1-restrona-pos-257a7.cloudfunctions.net/sendUserCreationOTP' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

### Solutions:

1. **Redeploy Functions**: The CORS fixes are in the updated functions
   ```bash
   firebase deploy --only functions
   ```

2. **Check Function Region**: Ensure functions are deployed to `us-central1`

3. **Verify Function Status**: Check if functions are active in Firebase console

4. **Clear Browser Cache**: Clear browser cache and reload the page

5. **Check Network Tab**: Look for any additional error details in browser dev tools

### Common Issues:

1. **Function Not Deployed**: Functions need to be redeployed after code changes
2. **Wrong Region**: Functions must be deployed to the same region specified in client config
3. **Function Errors**: Check Firebase Functions logs for any runtime errors
4. **Cold Start**: First function call might take longer (cold start)

## Testing the Implementation

1. **Start your React app**:
   ```bash
   cd client
   npm start
   ```

2. **Navigate to User Management**:
   - Login as Super Admin
   - Go to User Management
   - Click "Add User"

3. **Test OTP Flow**:
   - Enter a valid phone number
   - Click "Send OTP"
   - Check console for OTP (development mode)
   - Enter OTP and verify

## Monitoring

Check Firebase Functions logs for any issues:

```bash
firebase functions:log
```

## Production Considerations

1. **Remove Development OTP Logging**: Remove console.log statements in production
2. **SMS Integration**: Integrate with real SMS service (Twilio, AWS SNS)
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Monitoring**: Set up proper monitoring and alerting

## Support

If you continue to have issues:

1. Check Firebase Functions logs
2. Verify function deployment status
3. Test with simple function calls
4. Check network requests in browser dev tools
5. Verify Firebase project configuration
