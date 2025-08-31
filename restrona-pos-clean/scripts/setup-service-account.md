# Firebase Service Account Setup Guide

## Why This is Needed

Firebase Admin SDK needs proper credentials to access your project's resources. Without it, functions will fail with 500 errors.

## Step 1: Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `restrona-pos-257a7`
3. Go to **Project Settings** (gear icon)
4. Click **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Save it as `serviceAccountKey.json` in your project root

## Step 2: Update Functions Configuration

1. Copy `serviceAccountKey.json` to the `functions/` directory
2. Update `functions/index.js` to use the service account

## Step 3: Alternative - Use Environment Variables

If you prefer not to store the key file:

1. Go to **Project Settings** → **Service accounts**
2. Copy the **Project ID**
3. Copy the **Private key ID**
4. Copy the **Private key**
5. Copy the **Client email**

Set these as environment variables in your deployment.

## Step 3: Test the Setup

After setting up the service account:

1. Run the diagnostic: `npm run diagnose`
2. Deploy functions: `firebase deploy --only functions`
3. Test the functions in your app

## Security Note

- Never commit `serviceAccountKey.json` to version control
- Add it to `.gitignore`
- Use environment variables in production
