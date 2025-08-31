# Restrona - Restaurant POS System

A comprehensive Restaurant Point of Sale system built with React, Node.js, and Firebase.

## Features

### 🔐 Authentication & Roles
- **Super Admin**: Email + Password login, manages all restaurants globally
- **Restaurant Admin**: Phone + OTP login, manages restaurant-specific features
- **Staff/Waiters**: Phone + OTP login, handles orders and billing
- **Permission-based access**: No predefined roles, custom permissions per user
- **Phone Verification**: OTP verification required for all phone-based user creation

### 🏪 Restaurant Management
- Multi-restaurant support
- Restaurant profile management (name, address, contact, logo)
- Menu management (add, edit, delete items with categories)
- Table management with QR code generation
- Geofencing configuration for QR access control

### 📱 Customer Ordering
- QR code scanning for table-specific ordering
- Real-time menu display
- Cart management and order placement
- Multiple payment options (Cash, UPI, Online)

### 👨‍💼 Staff Features
- Waiter dashboard for order management
- Kitchen Display System (KDS)
- Bill generation and printing
- Order status tracking

### 📊 Analytics & Reporting
- Sales analytics (daily, weekly, monthly)
- Table occupancy tracking
- Staff performance metrics
- Category-wise sales reports

### 🛒 Advanced Features
- Inventory management with low-stock alerts
- Customer loyalty system
- Feedback and rating system
- Real-time notifications

## Tech Stack

- **Frontend**: React.js, Material-UI, PWA
- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Hosting**: Firebase Hosting

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restrona-pos
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Configure Firebase**
   - Create a Firebase project
   - Enable Authentication, Firestore, Storage, and Functions
   - Copy your Firebase config to `client/src/firebase/config.js`
   - Deploy Cloud Functions for OTP functionality

4. **Set up environment variables**
   ```bash
   # In server/.env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

## Project Structure

```
restrona-pos/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── firebase/      # Firebase configuration
├── server/                # Node.js backend
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
└── functions/             # Firebase Cloud Functions
    ├── auth/              # Authentication functions
    ├── billing/           # Billing functions
    └── analytics/         # Analytics functions
```

## Deployment

1. **Deploy Firebase Functions**
   ```bash
   cd functions
   firebase deploy --only functions
   ```

2. **Deploy Firestore Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Frontend**
   ```bash
   cd client
   npm run build
   firebase deploy --only hosting
   ```

## OTP Implementation

The system now includes mandatory OTP verification for phone numbers when creating users. See [OTP_IMPLEMENTATION.md](OTP_IMPLEMENTATION.md) for detailed documentation.

### Key Features:
- **6-digit OTP** with 5-minute expiration
- **Step-by-step user creation** with phone verification
- **Secure Cloud Functions** for OTP generation and verification
- **Phone verification status** tracking in user management

## License

MIT License - see LICENSE file for details.
