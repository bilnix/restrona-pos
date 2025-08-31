# Complete Setup Guide for Restrona POS System

This guide will help you set up the complete system including OTP functions and super admin.

## 🚀 **Step 1: Firebase Service Account Setup**

### 1.1 Get Service Account Key

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project**: `restrona-pos-257a7`
3. **Go to Project Settings** (gear icon)
4. **Click Service accounts tab**
5. **Click "Generate new private key"**
6. **Download the JSON file**
7. **Save it as `serviceAccountKey.json` in the `functions/` directory**

### 1.2 Verify Service Account

After adding the service account key:

```bash
cd functions
npm run diagnose
```

You should see:
- ✅ **Firebase Admin initialized**
- ✅ **Firestore instance created**

## 🔧 **Step 2: Deploy Firebase Functions**

```bash
cd functions
firebase deploy --only functions
```

## 👑 **Step 3: Super Admin Setup**

### 3.1 Create Environment File

1. **Copy `env-template.txt` to `.env`**
2. **Fill in your super admin credentials**:
   ```env
   SUPER_ADMIN_EMAIL=your-email@example.com
   SUPER_ADMIN_PASSWORD=your-secure-password
   SUPER_ADMIN_NAME=Your Name
   ```

### 3.2 Run Super Admin Setup

```bash
cd scripts
node setup-super-admin.js
```

This will:
- Create a super admin user in Firebase Auth
- Create user document in Firestore
- Set up initial system settings

## 🧪 **Step 4: Test the System**

### 4.1 Test Functions

1. **Start your React app**:
   ```bash
   cd client
   npm start
   ```

2. **Login as Super Admin** with the credentials you created

3. **Go to User Management** and test the OTP functions:
   - **Simple Test** - Basic function connectivity
   - **Test Basic** - Firebase Admin status
   - **Test OTP** - OTP generation (no database)
   - **Test Full OTP** - Complete OTP with database

### 4.2 Expected Results

- ✅ **Simple Test**: Should work immediately
- ✅ **Test Basic**: Should show Admin status
- ✅ **Test OTP**: Should work (OTP generation only)
- ✅ **Test Full OTP**: Should work (complete OTP with database)

## 🔒 **Step 5: Deploy Security Rules**

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 📱 **Step 6: Test OTP User Creation**

1. **Navigate to User Management**
2. **Click "Add User"**
3. **Fill in user details**
4. **Click "Send OTP"**
5. **Enter the OTP** (check console for development)
6. **Create the user**

## 🚨 **Troubleshooting**

### Issue 1: Functions Return 500 Error
- **Solution**: Check if service account key is properly set up
- **Verify**: Run `npm run diagnose` in functions directory

### Issue 2: CORS Errors
- **Solution**: Functions need to be redeployed after CORS fixes
- **Command**: `firebase deploy --only functions`

### Issue 3: Firestore Permission Denied
- **Solution**: Deploy updated security rules
- **Command**: `firebase deploy --only firestore:rules`

### Issue 4: Super Admin Setup Fails
- **Solution**: Check if service account key exists and has proper permissions
- **Verify**: Ensure the key file is in `functions/` directory

## 📋 **File Structure After Setup**

```
restrona v1/
├── functions/
│   ├── serviceAccountKey.json    ← Your service account key
│   ├── index.js                  ← OTP functions
│   └── package.json
├── client/
│   └── src/
│       └── components/
│           └── superadmin/
│               └── UserManagement.js  ← OTP user creation
├── .env                          ← Your environment variables
└── scripts/
    └── setup-super-admin.js      ← Fixed super admin setup
```

## 🎯 **What You'll Have After Setup**

1. **✅ Firebase Functions** with OTP capabilities
2. **✅ Super Admin user** with full permissions
3. **✅ OTP verification** for phone numbers
4. **✅ User management** with phone verification
5. **✅ Secure Firestore rules** for OTP data

## 🔄 **Next Steps**

After successful setup:
1. **Create your first restaurant**
2. **Add restaurant admin users**
3. **Set up menu and tables**
4. **Test the complete POS workflow**

## 📞 **Support**

If you encounter issues:
1. **Check function logs**: `firebase functions:log`
2. **Run diagnostics**: `npm run diagnose`
3. **Verify service account**: Check Firebase Console
4. **Check environment variables**: Ensure `.env` file is correct

---

**Note**: Keep your `serviceAccountKey.json` secure and never commit it to version control!
