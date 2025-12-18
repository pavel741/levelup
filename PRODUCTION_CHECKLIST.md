# Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Ready
- [x] All TypeScript errors fixed
- [x] Build succeeds (`npm run build`)
- [x] All features implemented and tested
- [x] No console errors in development

### Environment Variables to Set in Vercel

Add these in **Vercel Dashboard → Your Project → Settings → Environment Variables**:

#### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDEXX-OS0VyAmI-pFLqUMHcHwoO48nr2yU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=levelup-d725d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=levelup-d725d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=levelup-d725d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=778292786530
NEXT_PUBLIC_FIREBASE_APP_ID=1:778292786530:web:00d9d80b74f3225449a83b
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-VZ1EFQ3SE9
```

#### Email Configuration (Resend)
```
RESEND_API_KEY=re_XkRi85uR_3KKGkNrkvxdhVyk4d9Bh79oL
RESEND_FROM_EMAIL=LevelUp <onboarding@resend.dev>
CRON_SECRET=hSuTE9kurFCaJmRSvfHyNa1XXFDMzJ11oCerqUar4
```

#### App URL
```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```
*(Update this after first deployment with your actual Vercel URL)*

**Important:** Select **all environments** (Production, Preview, Development) when adding variables.

## Deployment Steps

### 1. Commit and Push Code
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Via GitHub (Recommended)
1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. **Before clicking Deploy:**
   - Add all environment variables (see above)
   - Select all environments
6. Click "Deploy"

#### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```
*(You'll be prompted to add environment variables)*

### 3. Configure Firebase Authorized Domains

After deployment, add your Vercel domain to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain (e.g., `your-app-name.vercel.app`)
5. Add your custom domain if you have one

### 4. Update App URL Environment Variable

After first deployment:
1. Copy your Vercel deployment URL
2. Go to Vercel Dashboard → Settings → Environment Variables
3. Update `NEXT_PUBLIC_APP_URL` with your actual URL
4. Redeploy

### 5. Verify Deployment

- [ ] Visit your Vercel URL
- [ ] Test user registration/login
- [ ] Test creating habits
- [ ] Test completing habits
- [ ] Test statistics page
- [ ] Test achievements page
- [ ] Test dark mode toggle
- [ ] Test email summary toggle in settings

### 6. Set Up Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` with custom domain
5. Add custom domain to Firebase Authorized Domains

## Post-Deployment

### Weekly Email Cron Job

The cron job is configured in `vercel.json` to run every Monday at 9 AM UTC.

**Note:** Vercel Cron Jobs require a paid plan. For free tier:
- Use an external cron service (e.g., cron-job.org)
- Set up a scheduled HTTP request to: `https://your-app.vercel.app/api/send-weekly-email`
- Include header: `Authorization: Bearer hSuTE9kurFCaJmRSvfHyNa1XXFDMzJ11oCerqUar4`

### Monitoring

- Check Vercel deployment logs for errors
- Monitor Firebase usage in Firebase Console
- Check Resend dashboard for email delivery status

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Authentication Not Working
- Verify Firebase Authorized Domains includes your Vercel domain
- Check environment variables match Firebase config
- Check browser console for errors

### Emails Not Sending
- Verify Resend API key is correct
- Check Resend dashboard for domain verification
- Verify `CRON_SECRET` matches in environment variables
- Check Vercel function logs for errors

### Data Not Syncing
- Verify Firestore security rules are deployed
- Check user is authenticated
- Check browser console for Firestore errors

## Security Notes

- ✅ `.env.local` is in `.gitignore` (won't be committed)
- ✅ Environment variables are set in Vercel (not in code)
- ✅ Firestore security rules restrict access
- ✅ API routes require authentication (CRON_SECRET)
- ⚠️ Never commit API keys or secrets to Git

## Next Steps After Deployment

1. Test all features thoroughly
2. Monitor error logs for first few days
3. Set up custom domain (if desired)
4. Configure Resend domain for production emails
5. Set up monitoring/alerts (optional)

