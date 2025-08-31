# OTP Implementation for User Creation

This document describes the implementation of OTP (One-Time Password) verification for phone numbers when creating users in the Restrona POS system.

## Overview

The OTP system ensures that phone numbers are verified before users can be created, adding an extra layer of security and validation to the user registration process.

## Architecture

### 1. Firebase Cloud Functions

The OTP system is implemented using Firebase Cloud Functions to ensure security and prevent client-side manipulation.

#### Functions:

- **`sendUserCreationOTP`**: Generates and sends OTP to the specified phone number
- **`verifyUserCreationOTP`**: Verifies the OTP entered by the user
- **`cleanupExpiredOTPs`**: Cleans up expired OTP records

### 2. Client-Side Integration

The OTP verification is integrated into the UserManagement component with a step-by-step wizard interface.

## Implementation Details

### OTP Generation and Storage

- **OTP Format**: 6-digit numeric code
- **Expiration**: 5 minutes from generation
- **Storage**: Firestore collection `otp_verification`
- **Security**: Only accessible by Cloud Functions

### User Creation Flow

1. **Step 1**: User Details Entry
   - User fills in name, phone number, role, etc.
   - Phone number validation (minimum 10 digits)
   - Send OTP button

2. **Step 2**: OTP Verification
   - OTP input field (6 digits)
   - Verify OTP button
   - Back to details option

3. **Step 3**: Confirmation
   - Display verified user details
   - Create/Update User button

### Security Features

- **OTP Expiration**: Automatic cleanup after 5 minutes
- **Single Use**: OTP can only be used once
- **Rate Limiting**: Built into Firebase Functions
- **Secure Storage**: OTP data not accessible from client-side

## Usage

### For Super Admins

1. Navigate to User Management
2. Click "Add User"
3. Fill in user details
4. Click "Send OTP" for phone verification
5. Enter the 6-digit OTP received
6. Verify OTP
7. Create the user

### For Development/Testing

During development, OTPs are logged to the console for testing purposes. In production, this should be removed and replaced with actual SMS service integration.

## Configuration

### Environment Variables

Ensure your Firebase project has the following services enabled:
- Authentication (Phone provider)
- Firestore Database
- Cloud Functions
- Storage (if needed)

### SMS Service Integration

To integrate with a real SMS service (e.g., Twilio):

1. Install the SMS service SDK
2. Update the `sendUserCreationOTP` function
3. Remove the development OTP logging
4. Configure API keys and credentials

## Database Schema

### OTP Verification Collection

```javascript
{
  phoneNumber: "string",      // Phone number as document ID
  otp: "string",             // 6-digit OTP
  createdAt: "timestamp",    // When OTP was generated
  expiresAt: "timestamp",    // When OTP expires
  isUsed: "boolean"          // Whether OTP has been used
}
```

### User Collection Updates

Users now include:
```javascript
{
  // ... existing fields
  phoneVerified: "boolean",  // Whether phone was verified with OTP
  // ... other fields
}
```

## Security Rules

The `otp_verification` collection is completely locked down:
- No client-side read/write access
- Only Cloud Functions can access OTP data
- Automatic cleanup of expired OTPs

## Error Handling

### Common Error Scenarios

1. **Invalid Phone Number**: Must be at least 10 digits
2. **OTP Expired**: OTP expires after 5 minutes
3. **Invalid OTP**: Wrong OTP entered
4. **Already Used OTP**: OTP can only be used once
5. **Network Issues**: Handle Firebase function call failures

### User Experience

- Clear error messages for each scenario
- Loading states during OTP operations
- Step-by-step guidance
- Ability to resend OTP if needed

## Deployment

### Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

### Security Rules

```bash
firebase deploy --only firestore:rules
```

## Testing

### Manual Testing

1. Create a new user with valid phone number
2. Verify OTP is sent and logged
3. Enter correct OTP
4. Verify user creation
5. Test with invalid OTP
6. Test with expired OTP

### Automated Testing

Consider implementing:
- Unit tests for OTP functions
- Integration tests for user creation flow
- Security tests for OTP validation

## Future Enhancements

### Potential Improvements

1. **SMS Integration**: Real SMS service (Twilio, AWS SNS)
2. **Rate Limiting**: Prevent OTP spam
3. **Multiple OTP Methods**: Email, WhatsApp, etc.
4. **OTP Resend**: Allow users to request new OTP
5. **Audit Logging**: Track OTP usage and verification attempts

### Monitoring

- OTP success/failure rates
- Function execution times
- Error patterns and frequencies
- User experience metrics

## Troubleshooting

### Common Issues

1. **OTP Not Sent**: Check Firebase Functions logs
2. **OTP Verification Fails**: Verify phone number format
3. **Function Timeout**: Check function execution limits
4. **Permission Denied**: Verify Firestore security rules

### Debug Mode

Enable debug logging in Cloud Functions:
```javascript
logger.info('Debug info:', { data, context });
```

## Support

For issues or questions regarding the OTP implementation:
1. Check Firebase Functions logs
2. Verify Firestore security rules
3. Test with development OTP logging
4. Review this documentation

---

**Note**: This implementation is designed for development and testing. For production use, integrate with a real SMS service and remove development OTP logging.
