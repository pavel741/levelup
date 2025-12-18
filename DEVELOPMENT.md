# Development Workflow Guide

This guide explains how to develop, test, and deploy changes to LevelUp.

## Quick Start

1. **Make changes** to your code
2. **Test locally** with `npm run dev`
3. **Commit and push** to GitHub
4. **Vercel auto-deploys** your changes

## Detailed Workflow

### 1. Local Development

Start the development server:

```bash
npm run dev
```

- Your app will be available at `http://localhost:3000`
- Changes are hot-reloaded automatically
- Test your changes before deploying

### 2. Making Changes

Edit files in your code editor:
- `app/` - Pages and routes
- `components/` - React components
- `lib/` - Firebase and utility functions
- `store/` - State management
- `types/` - TypeScript type definitions

### 3. Testing Locally

Before pushing to production:

1. **Check for errors:**
   ```bash
   npm run lint
   ```

2. **Test the build:**
   ```bash
   npm run build
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Test all features:**
   - Sign up / Sign in
   - Create habits
   - Complete habits
   - Join challenges
   - Block sites

### 4. Committing Changes

When your changes are ready:

```bash
# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "Add feature: description of what you changed"

# Push to GitHub
git push
```

**Commit Message Best Practices:**
- Be descriptive: "Fix Google Sign-In redirect issue"
- Use present tense: "Add habit completion animation"
- Keep it concise but clear

### 5. Deployment

#### Automatic Deployment (Recommended)

If Vercel is connected to your GitHub repository:

1. Push to `main` branch:
   ```bash
   git push origin main
   ```

2. Vercel automatically:
   - Detects the push
   - Builds your app
   - Deploys to production
   - Provides a deployment URL

3. Check deployment status:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - View your project → Deployments tab
   - See build logs and status

#### Manual Deployment

If you need to manually trigger a deployment:

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Click the three dots (⋯) on latest deployment
4. Select "Redeploy"

### 6. Preview Deployments

Test changes before merging to main:

1. Create a feature branch:
   ```bash
   git checkout -b feature/new-feature
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

3. Vercel automatically creates a preview URL
4. Test the preview deployment
5. Merge to main when ready:
   ```bash
   git checkout main
   git merge feature/new-feature
   git push origin main
   ```

## Environment Variables

### Local Development

Create `.env.local` file (copy from `env.example`):

```bash
cp env.example .env.local
```

Edit `.env.local` with your Firebase credentials.

### Production (Vercel)

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add all required variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

4. **Important:** After adding/changing variables, redeploy!

## Common Tasks

### Adding a New Page

1. Create file: `app/new-page/page.tsx`
2. Add `'use client'` directive
3. Add `export const dynamic = 'force-dynamic'`
4. Test locally
5. Commit and push

### Adding a New Component

1. Create file: `components/NewComponent.tsx`
2. Import and use in pages
3. Test locally
4. Commit and push

### Updating Firebase Rules

1. Edit `firestore.rules`
2. Copy rules to Firebase Console
3. Go to Firebase Console → Firestore → Rules
4. Paste and publish

### Fixing Build Errors

1. Check build logs in Vercel Dashboard
2. Fix errors locally
3. Test with `npm run build`
4. Commit and push

## Troubleshooting

### Changes Not Appearing After Deploy

1. **Check deployment status** in Vercel Dashboard
2. **Verify build succeeded** (check build logs)
3. **Hard refresh** browser (Ctrl+Shift+R or Cmd+Shift+R)
4. **Clear browser cache**

### Environment Variables Not Working

1. **Verify variables are set** in Vercel Dashboard
2. **Check variable names** (must start with `NEXT_PUBLIC_`)
3. **Redeploy** after adding/changing variables
4. **Check build logs** for errors

### Firebase Errors

1. **Check Firebase Console** for API key validity
2. **Verify authorized domains** in Firebase Auth settings
3. **Check Firestore security rules**
4. **Review browser console** for specific errors

### Git Push Issues

```bash
# Check status
git status

# See what branch you're on
git branch

# If on wrong branch, switch
git checkout main

# Pull latest changes first
git pull origin main

# Then push
git push origin main
```

## Best Practices

1. **Test locally first** - Catch errors before deploying
2. **Commit often** - Small, frequent commits are better
3. **Write descriptive commit messages** - Help yourself and others understand changes
4. **Use feature branches** - For larger changes
5. **Check deployment logs** - If something breaks, logs show why
6. **Keep environment variables secure** - Never commit `.env.local` to git

## Quick Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Git workflow
git add .
git commit -m "Your message"
git push

# Create feature branch
git checkout -b feature/name
git push origin feature/name

# Switch to main branch
git checkout main
```

## Need Help?

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment details
- Check [README.md](./README.md) for project overview
- Check Vercel Dashboard for deployment logs
- Check Firebase Console for backend issues

