# Restrona POS System - Setup Guide

This guide will help you set up the complete Restrona Restaurant POS system with Firebase backend.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Git

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "restrona-pos"
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Firebase Services
1. **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable "Phone" and "Email/Password"
   - Add your domain to authorized domains

2. **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (we'll add security rules later)
   - Select a location close to your users

3. **Storage**:
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode"
   - Select the same location as Firestore

4. **Functions**:
   - Go to Functions
   - Click "Get started"
   - Enable billing (required for Functions)

### 1.3 Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" > "Web"
4. Register app with name "Restrona Web"
5. Copy the Firebase config object

### 1.4 Generate Service Account Key
1. Go to Project Settings > Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Keep this file secure - it contains sensitive credentials

## Step 2: Environment Configuration

### 2.1 Client Environment
1. Copy `client/env.example` to `client/.env`
2. Fill in your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLIENT_URL=http://localhost:3000
```

### 2.2 Server Environment
1. Copy `server/env.example` to `server/.env`
2. Fill in your Firebase Admin configuration using the service account JSON:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## Step 3: Install Dependencies

### 3.1 Install All Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Install Firebase Functions dependencies
cd ../functions
npm install

# Return to root
cd ..
```

## Step 4: Firebase CLI Setup

### 4.1 Initialize Firebase
```bash
# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init

# Select the following:
# - Firestore
# - Functions
# - Hosting
# - Storage
# - Emulators (optional for development)
```

### 4.2 Deploy Firebase Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

## Step 5: Database Setup

### 5.1 Create Initial Data Structure
The system will automatically create the necessary collections when you start using it. However, you can create some initial data:

1. **Super Admin User**:
   - Create a user in Firebase Authentication with email/password
   - Add user document to Firestore with role: 'super_admin'

2. **Sample Restaurant**:
   - Use the Super Admin dashboard to create restaurants
   - Add restaurant admin users

### 5.2 Firestore Collections Structure
```
/users/{userId}
  - role: 'super_admin' | 'restaurant_admin' | 'waiter'
  - restaurantId: string (for restaurant staff)
  - permissions: array
  - name: string
  - phone: string
  - email: string

/restaurants/{restaurantId}
  - name: string
  - type: string
  - address: string
  - phone: string
  - email: string
  - status: 'active' | 'inactive'
  - monthlyRevenue: number
  - totalRevenue: number

/menuItems/{itemId}
  - restaurantId: string
  - name: string
  - description: string
  - price: number
  - category: string
  - imageUrl: string
  - isActive: boolean

/tables/{tableId}
  - restaurantId: string
  - tableNumber: string
  - capacity: number
  - status: 'available' | 'occupied'
  - qrCode: string
  - qrData: string

/orders/{orderId}
  - restaurantId: string
  - tableId: string
  - customerInfo: object
  - items: array
  - total: number
  - status: 'pending' | 'preparing' | 'ready' | 'completed'
  - orderType: 'dine_in' | 'takeaway' | 'delivery'
  - orderNumber: string

/analytics/{analyticsId}
  - restaurantId: string
  - date: timestamp
  - totalOrders: number
  - completedOrders: number
  - totalRevenue: number
```

## Step 6: Run the Application

### 6.1 Development Mode
```bash
# Start both client and server
npm run dev

# Or start them separately:
# Terminal 1 - Client
cd client && npm start

# Terminal 2 - Server
cd server && npm run dev


### 6.2 Production Build
```bash
# Build client
cd client && npm run build

# Start server
cd server && npm start
```

## Step 7: Deploy to Production

### 7.1 Deploy Firebase Functions
```bash
cd functions
firebase deploy --only functions
```

### 7.2 Deploy Frontend
```bash
# Build the client
cd client && npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 7.3 Deploy Backend (Optional)
You can deploy the Node.js backend to:
- Heroku
- Google Cloud Run
- AWS EC2
- DigitalOcean

## Step 8: Initial Setup

### 8.1 Create Super Admin
1. Access the application at `http://localhost:3000`
2. Click "Super Admin" tab
3. Login with email/password
4. Create your first restaurant

### 8.2 Create Restaurant Admin
1. In Super Admin dashboard, create a restaurant
2. Add a restaurant admin user with phone number
3. The user will receive OTP for verification

### 8.3 Configure Restaurant
1. Login as Restaurant Admin
2. Add menu items
3. Create tables
4. Generate QR codes for tables
5. Add staff members

## Step 9: Testing

### 9.1 Test Customer Flow
1. Scan a table QR code
2. Browse menu
3. Add items to cart
4. Place order
5. Check order appears in waiter dashboard

### 9.2 Test Staff Flow
1. Login as waiter
2. View pending orders
3. Update order status
4. Print bills

### 9.3 Test Admin Flow
1. Login as restaurant admin
2. Manage menu
3. View analytics
4. Manage staff

## Troubleshooting

### Common Issues

1. **Firebase Authentication Error**:
   - Check Firebase config in `.env` files
   - Verify domain is added to authorized domains
   - Check if phone authentication is enabled

2. **Firestore Permission Denied**:
   - Deploy Firestore rules: `firebase deploy --only firestore:rules`
   - Check if user has proper role/permissions

3. **Functions Not Working**:
   - Deploy functions: `firebase deploy --only functions`
   - Check Firebase billing is enabled
   - Verify service account permissions

4. **CORS Errors**:
   - Check CORS configuration in server
   - Verify client URL in server environment

### Support

For issues and questions:
1. Check Firebase Console logs
2. Review browser console for errors
3. Check server logs
4. Verify all environment variables are set correctly

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Service Account**: Keep Firebase service account key secure
3. **Firestore Rules**: Review and customize security rules for your needs
4. **Authentication**: Implement proper role-based access control
5. **API Security**: Use HTTPS in production
6. **Data Validation**: Validate all user inputs

## Performance Optimization

1. **Firestore Indexes**: Create composite indexes for complex queries
2. **Image Optimization**: Compress images before upload
3. **Caching**: Implement client-side caching for menu items
4. **Pagination**: Add pagination for large datasets
5. **CDN**: Use Firebase Hosting for static assets

## Monitoring and Analytics

1. **Firebase Analytics**: Enable for user behavior tracking
2. **Error Monitoring**: Set up error tracking
3. **Performance Monitoring**: Monitor app performance
4. **Logs**: Review Firebase Functions logs regularly

This setup guide covers the essential steps to get your Restrona POS system up and running. Follow each step carefully and refer to the troubleshooting section if you encounter any issues.
