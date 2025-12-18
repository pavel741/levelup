# Deployment Guide for LevelUp

This guide will help you deploy LevelUp to Vercel with Firebase backend.

## Prerequisites

1. A Firebase account (free tier is sufficient)
2. A Vercel account (free tier is sufficient)
3. Node.js installed locally

## Step 1: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "levelup")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get Started**
2. Enable **Email/Password** provider
3. Enable **Google** provider (optional but recommended)
4. Add authorized domains if needed

### Set Up Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Start in **test mode** (for private use)
3. Choose a location close to you
4. Click "Enable"

### Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register app with a nickname
5. Copy the Firebase configuration values

## Step 2: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Firebase config values:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## Step 3: Set Up Firestore Security Rules (Important!)

1. Go to **Firestore Database** > **Rules**
2. Copy the rules from `firestore.rules` file in this project, or replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read/write their own habits
    match /habits/{habitId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Users can read all challenges, but only update if they're participants
    match /challenges/{challengeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.resource.data.participants.hasAny([request.auth.uid]) ||
         !('participants' in request.resource.data.diff(resource.data).affectedKeys()));
    }
    
    // Users can only read/write their own blocked sites
    match /blockedSites/{blockId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Users can only read/write their own daily stats
    match /dailyStats/{statId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click "Publish"

**Note:** The rules file is also saved as `firestore.rules` in the project root for easy reference.

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. **IMPORTANT:** When prompted, add your environment variables:
   - Vercel will ask if you want to add environment variables
   - Say "Yes" and add each variable:
     - `NEXT_PUBLIC_FIREBASE_API_KEY` = `AIzaSyDEXX-OS0VyAmI-pFLqUMHcHwoO48nr2yU`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `levelup-d725d.firebaseapp.com`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `levelup-d725d`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `levelup-d725d.firebasestorage.app`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `778292786530`
     - `NEXT_PUBLIC_FIREBASE_APP_ID` = `1:778292786530:web:00d9d80b74f3225449a83b`
     - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` = `G-VZ1EFQ3SE9`

   **OR** add them later via Vercel dashboard: Settings > Environment Variables

### Option B: Deploy via GitHub

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. Go to [Vercel](https://vercel.com/)
3. Click "New Project"
4. Import your GitHub repository
5. **IMPORTANT: Add environment variables BEFORE deploying:**
   - Before clicking "Deploy", scroll down to "Environment Variables"
   - Click "Add" and add each variable:
     - `NEXT_PUBLIC_FIREBASE_API_KEY` = `AIzaSyDEXX-OS0VyAmI-pFLqUMHcHwoO48nr2yU`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `levelup-d725d.firebaseapp.com`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `levelup-d725d`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `levelup-d725d.firebasestorage.app`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `778292786530`
     - `NEXT_PUBLIC_FIREBASE_APP_ID` = `1:778292786530:web:00d9d80b74f3225449a83b`
     - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` = `G-VZ1EFQ3SE9`
   - Make sure to select all environments (Production, Preview, Development)
6. Click "Deploy"

**OR if already deployed:**
- Go to your project in Vercel
- Go to **Settings** > **Environment Variables**
- Add all the variables listed above
- Go to **Deployments** tab
- Click the three dots on the latest deployment → **Redeploy**

## Step 5: Configure Firebase Authorized Domains

1. Go to Firebase Console > **Authentication** > **Settings**
2. Scroll to "Authorized domains"
3. Add your Vercel domain (e.g., `your-app.vercel.app`)
4. Add your custom domain if you have one

## Step 6: Test Your Deployment

1. Visit your Vercel deployment URL
2. Create an account
3. Test creating habits, joining challenges, etc.

## Firestore Indexes

If you encounter errors about missing indexes, Firebase will provide links to create them automatically. Just click the links and create the indexes.

## Troubleshooting

### "Permission denied" errors
- Check Firestore security rules
- Ensure user is authenticated
- Verify user IDs match

### Authentication not working
- Check Firebase authorized domains
- Verify environment variables are set correctly
- Check browser console for errors

### Data not syncing
- Check Firestore rules allow read/write
- Verify user is authenticated
- Check browser console for errors

## Cost Estimation

**Firebase Free Tier (Spark Plan):**
- 50K reads/day
- 20K writes/day
- 20K deletes/day
- 1GB storage
- 10GB network egress/month

For private use, this should be more than sufficient!

## Next Steps

- Set up a custom domain (optional)
- Enable Firebase Analytics (optional)
- Set up Firebase Storage if you want to add profile pictures
- Configure email templates in Firebase Auth

