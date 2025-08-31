# 🚀 Super Admin Setup Guide

This guide will walk you through setting up the super admin system for your Restrona POS application.

## 📋 Prerequisites

- Firebase project created and configured
- Node.js and npm installed
- Git repository cloned

## 🔧 Step 1: Environment Configuration

Create a `.env` file in your project root with the following variables:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Super Admin Setup
SUPER_ADMIN_EMAIL=admin@yourcompany.com
SUPER_ADMIN_PASSWORD=your_secure_password_here
SUPER_ADMIN_NAME=Super Administrator
```

## 🚀 Step 2: Deploy Security Rules

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules
```bash
firebase deploy --only storage
```

## 👤 Step 3: Create Super Admin User

### Option A: Using the Setup Script (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the setup script:**
   ```bash
   node scripts/setup-super-admin.js
   ```

3. **Follow the prompts and verify the output**

### Option B: Manual Creation

1. **Go to Firebase Console > Authentication > Users**
2. **Click "Add User"**
3. **Enter email and password**
4. **Go to Firestore Database > users collection**
5. **Create a new document with the user's UID**
6. **Add the following data:**
   ```json
   {
     "uid": "user_uid_from_auth",
     "name": "Super Administrator",
     "email": "admin@yourcompany.com",
     "role": "super_admin",
     "permissions": [
       "manage_restaurants",
       "manage_users",
       "view_analytics",
       "system_settings",
       "global_management"
     ],
     "isActive": true,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

## 🏃‍♂️ Step 4: Start the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to:** `http://localhost:3000`

3. **Click on the "Super Admin" tab**

4. **Login with your super admin credentials:**
   - Email: `admin@yourcompany.com`
   - Password: `your_secure_password_here`

## 🏪 Step 5: Create Your First Restaurant

1. **In the Super Admin dashboard, click "Add Restaurant"**

2. **Fill in the restaurant details:**
   - Name: Your restaurant name
   - Type: Restaurant type (e.g., "Fine Dining", "Fast Food")
   - Phone: Contact number
   - Email: Contact email
   - Address: Full address

3. **Click "Save" to create the restaurant**

## 👥 Step 6: Add Restaurant Admin Users

1. **Go to the "Users" tab in Super Admin dashboard**

2. **Click "Add User"**

3. **Fill in user details:**
   - Name: Restaurant admin's full name
   - Phone: Phone number (for OTP login)
   - Role: "restaurant_admin"
   - Restaurant: Select the restaurant you created

4. **Click "Create"**

5. **The restaurant admin can now login using:**
   - Phone number + OTP verification
   - They will be redirected to the restaurant dashboard

## 🔐 Step 7: Configure Restaurant Settings

1. **Login as the restaurant admin**

2. **Go to Settings tab**

3. **Configure:**
   - Basic information (name, description, contact details)
   - Opening hours
   - Restaurant-specific settings
   - Order preferences

## 📱 Step 8: Add Staff Members

1. **In the restaurant admin dashboard, go to Staff Management**

2. **Add waiters and other staff members**

3. **They can login using phone + OTP**

## ✅ Verification Checklist

- [ ] Super admin can login with email/password
- [ ] Super admin can create restaurants
- [ ] Super admin can manage users
- [ ] Restaurant admin can login with phone/OTP
- [ ] Restaurant admin can manage their restaurant
- [ ] Staff can login with phone/OTP
- [ ] Security rules are deployed and working
- [ ] All components are accessible based on user roles

## 🚨 Troubleshooting

### Common Issues

1. **"Permission denied" errors:**
   - Ensure Firestore rules are deployed
   - Check if user has correct role
   - Verify user document exists in Firestore

2. **Authentication errors:**
   - Check Firebase configuration
   - Verify domain is added to authorized domains
   - Ensure phone authentication is enabled

3. **Component not found errors:**
   - Check if all components are imported
   - Verify file paths are correct
   - Ensure all dependencies are installed

### Getting Help

- Check Firebase Console for authentication logs
- Review browser console for JavaScript errors
- Verify Firestore rules syntax
- Check network tab for API call failures

## 🔒 Security Best Practices

1. **Use strong passwords for super admin**
2. **Enable 2FA for super admin accounts**
3. **Regularly review user permissions**
4. **Monitor authentication logs**
5. **Keep Firebase SDK versions updated**
6. **Regularly backup your data**

## 📚 Next Steps

After setting up the super admin:

1. **Customize the dashboard** to match your needs
2. **Add more features** like reporting and analytics
3. **Implement backup and recovery** procedures
4. **Set up monitoring** and alerting
5. **Train your team** on the system

## 🎯 Advanced Configuration

### Custom Permissions

You can extend the permission system by adding custom permissions:

```javascript
// In the user document
"permissions": [
  "manage_restaurants",
  "manage_users",
  "view_analytics",
  "system_settings",
  "global_management",
  "custom_permission_1",
  "custom_permission_2"
]
```

### Role-Based Routing

The system automatically routes users based on their role:
- `super_admin` → `/super-admin/*`
- `restaurant_admin` → `/restaurant/*`
- `waiter` → `/waiter/*`

### API Endpoints

Super admin has access to all API endpoints:
- `GET /api/restaurants` - List all restaurants
- `POST /api/restaurants` - Create restaurant
- `GET /api/users` - List all users
- `POST /api/users` - Create user

---

**🎉 Congratulations! You've successfully set up the super admin system for Restrona POS.**

For additional support, refer to the main README.md or create an issue in the repository.
