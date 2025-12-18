# Quick Setup Guide

## Firebase Environment Variables Missing

You're seeing errors because Firebase environment variables are not set in Vercel.

### Fix Steps:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your project

2. **Add Environment Variables**
   - Go to: **Settings** → **Environment Variables**
   - Add these 7 variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDEXX-OS0VyAmI-pFLqUMHcHwoO48nr2yU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=levelup-d725d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=levelup-d725d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=levelup-d725d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=778292786530
NEXT_PUBLIC_FIREBASE_APP_ID=1:778292786530:web:00d9d80b74f3225449a83b
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-VZ1EFQ3SE9
```

3. **Set Environment for Each Variable**
   - Check ✅ **Production**
   - Check ✅ **Preview** (optional)
   - Check ✅ **Development** (optional)

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment
   - Click **Redeploy**

5. **Verify**
   - After redeploy, check console
   - Should see: `✅ Firebase initialized successfully`

### Important Notes:

- Variables MUST start with `NEXT_PUBLIC_` to be accessible in the browser
- You MUST redeploy after adding variables (they're baked at build time)
- Check for typos in variable names

