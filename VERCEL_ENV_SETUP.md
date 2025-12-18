# Vercel Environment Variables Setup

## Issue
If you're seeing errors like:
- `❌ Missing Firebase environment variables`
- `Error: Firebase Auth is not initialized`

This means your Firebase environment variables are not configured in Vercel.

## Solution

### Step 1: Go to Vercel Project Settings

1. Open your Vercel dashboard: https://vercel.com/dashboard
2. Click on your project (`levelup` or your project name)
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Firebase Environment Variables

Add the following environment variables (all must start with `NEXT_PUBLIC_`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here (optional)
```

### Step 3: Get Your Firebase Values

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project (`levelup-d725d`)
3. Click the gear icon ⚙️ → **Project settings**
4. Scroll down to **Your apps** section
5. Click on your web app (or create one if you haven't)
6. Copy the values from the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // → NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "levelup-d725d.firebaseapp.com",  // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "levelup-d725d",    // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "levelup-d725d.firebasestorage.app",  // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "778292786530",  // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:778292786530:web:...",  // → NEXT_PUBLIC_FIREBASE_APP_ID
  measurementId: "G-..."  // → NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)
}
```

### Step 4: Add Other Required Variables

Also add these if you haven't:

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=LevelUp <noreply@yourdomain.com>
CRON_SECRET=your_random_secret_string
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

### Step 5: Set Environment for Each Variable

For each variable:
- **Production**: ✅ (checked)
- **Preview**: ✅ (checked) - optional but recommended
- **Development**: ✅ (checked) - optional

### Step 6: Redeploy

After adding all variables:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

### Step 7: Verify

After redeployment:
1. Open your app URL
2. Check the browser console (F12)
3. You should see: `✅ Firebase initialized successfully`
4. No more "Missing Firebase environment variables" errors

## Troubleshooting

### Variables not showing up?

1. Make sure variable names start with `NEXT_PUBLIC_` (required for client-side access)
2. Check for typos in variable names
3. Ensure you've selected the correct environment (Production/Preview/Development)
4. Redeploy after adding variables

### Still seeing errors?

1. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Check Vercel deployment logs for any build errors
3. Verify all variables are set correctly in Vercel dashboard
4. Make sure you're looking at the correct project in Vercel

## Quick Reference

Your Firebase values (from your `.env.local` or `env.example`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDEXX-OS0VyAmI-pFLqUMHcHwoO48nr2yU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=levelup-d725d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=levelup-d725d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=levelup-d725d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=778292786530
NEXT_PUBLIC_FIREBASE_APP_ID=1:778292786530:web:00d9d80b74f3225449a83b
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-VZ1EFQ3SE9
```

**⚠️ Note**: These are example values. Use your actual values from Firebase Console.

