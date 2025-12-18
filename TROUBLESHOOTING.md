# Troubleshooting: Firebase Environment Variables

## Problem: Variables are in Vercel but still showing as missing

If you've added the Firebase environment variables to Vercel but still see errors, here's how to fix it:

## ⚠️ CRITICAL: You MUST Redeploy!

`NEXT_PUBLIC_*` environment variables are **baked into the JavaScript bundle at BUILD TIME**. 

**If you added variables AFTER your last deployment, they won't be in the current build!**

### Steps to Fix:

1. **Verify Variables in Vercel:**
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Check that ALL these variables exist:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
     - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)
   - Make sure each variable has ✅ checked for **Production**

2. **Check for Typos:**
   - Variable names MUST be EXACT (case-sensitive):
   - `NEXT_PUBLIC_FIREBASE_API_KEY` ✅
   - `NEXT_PUBLIC_FIREBASE_api_key` ❌ (wrong case)
   - `NEXT_PUBLIC_FIREBASE_API_KEY ` ❌ (trailing space)

3. **Redeploy:**
   - **Option A:** Go to Deployments → Click ⋯ on latest → **Redeploy**
   - **Option B:** Push a new commit (even a small change)
   - **Option C:** Use Vercel CLI: `vercel --prod`

4. **Verify After Redeploy:**
   - Open browser console (F12)
   - Look for: `✅ Firebase initialized successfully`
   - Should NOT see: `❌ Missing Firebase environment variables`

## Debug Mode

To see what Firebase config values are available, add `?debug=firebase` to your URL:
```
https://your-app.vercel.app/?debug=firebase
```

This will log the Firebase configuration to the console (without exposing sensitive values).

## Common Issues:

### Issue 1: Variables added after build
**Symptom:** Variables show in Vercel dashboard but errors persist  
**Fix:** Redeploy (see step 3 above)

### Issue 2: Variables not enabled for Production
**Symptom:** Variables exist but only enabled for Preview/Development  
**Fix:** Check ✅ Production checkbox for each variable

### Issue 3: Typo in variable name
**Symptom:** Variable shows as missing even though you added it  
**Fix:** Double-check exact spelling (case-sensitive)

### Issue 4: Variables in wrong project
**Symptom:** Variables exist but in a different Vercel project  
**Fix:** Make sure you're looking at the correct project

## Still Not Working?

1. Check Vercel build logs:
   - Go to Deployments → Click on latest deployment
   - Check "Build Logs" tab
   - Look for any errors during build

2. Verify variables are actually set:
   - In Vercel, click "Edit" on a variable
   - Make sure the value is not empty
   - Make sure there are no extra spaces

3. Try redeploying from a commit:
   - Make a small change (add a comment to a file)
   - Commit and push
   - This triggers a fresh build with current variables

4. Check if variables are being used:
   - Add `?debug=firebase` to URL
   - Check console for Firebase config debug output

