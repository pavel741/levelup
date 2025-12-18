# Weekly Email Summaries Setup Guide

This guide explains how to set up weekly email summaries using Resend.

## Prerequisites

1. A Resend account (sign up at [resend.com](https://resend.com))
2. A verified domain (or use Resend's test domain for development)

## Setup Steps

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address

### 2. Get Your API Key

1. Navigate to the API Keys section in your Resend dashboard
2. Create a new API key
3. Copy the API key (you'll need it for environment variables)

### 3. Domain Setup (Production)

For production, you'll need to verify your domain:

1. Go to Domains in your Resend dashboard
2. Add your domain (e.g., `yourdomain.com`)
3. Add the DNS records provided by Resend to your domain registrar
4. Wait for verification (usually takes a few minutes)

**Note**: For development/testing, you can use Resend's test domain without verification.

### 4. Environment Variables

Add these to your `.env.local` file (development) and Vercel project settings (production):

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email sender address
# For production: use your verified domain (e.g., LevelUp <noreply@yourdomain.com>)
# For development: use Resend's test domain (e.g., LevelUp <onboarding@resend.dev>)
RESEND_FROM_EMAIL=LevelUp <onboarding@resend.dev>

# Secret for cron job authentication
# Generate a random string (e.g., openssl rand -hex 32)
CRON_SECRET=your_random_secret_string_here

# Your app URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Production
```

### 5. Vercel Cron Job Configuration

The `vercel.json` file is already configured to run the weekly email job every Monday at 9 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/send-weekly-email",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Note**: Vercel Cron Jobs are only available on paid plans. For free tier, you can:
- Use an external cron service (e.g., cron-job.org) to call your API endpoint
- Use Vercel's scheduled functions (if available)

### 6. Testing the Email Functionality

#### Test Locally

1. Start your development server:
```bash
npm run dev
```

2. In a new terminal, call the API endpoint:
```bash
curl -X POST http://localhost:3000/api/send-weekly-email \
  -H "Authorization: Bearer your_cron_secret"
```

3. Check your email inbox (or Resend dashboard logs) for the test email

#### Test in Production

1. Enable email summaries in your user settings
2. Wait for Monday at 9 AM UTC, or manually trigger the cron job from Vercel dashboard

### 7. User Settings

Users can enable/disable weekly email summaries in Settings → Email Summary section. The toggle saves their preference to Firestore.

## Email Template

The email template includes:
- Weekly stats (habits completed, XP earned, daily average, streak)
- Best day highlight
- Top 5 performing habits
- Link to dashboard
- Unsubscribe link (via settings)

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**: Ensure `RESEND_API_KEY` is set correctly
2. **Check Domain Verification**: For production, ensure your domain is verified in Resend
3. **Check Cron Secret**: Ensure `CRON_SECRET` matches in both environment variables and the request header
4. **Check Resend Dashboard**: View logs in Resend dashboard for error messages
5. **Check User Preference**: Ensure users have `emailSummaryEnabled: true` in Firestore

### Common Issues

- **"Unauthorized" error**: Check that `CRON_SECRET` matches
- **"Domain not verified"**: Verify your domain in Resend dashboard
- **"Invalid API key"**: Regenerate your API key in Resend dashboard
- **No emails received**: Check spam folder, verify email address in user document

## Free Tier Limits

Resend's free tier includes:
- 3,000 emails/month
- 100 emails/day
- Test domain available

For higher limits, upgrade to a paid plan.

## Security Notes

1. Never commit `CRON_SECRET` or `RESEND_API_KEY` to version control
2. Use different secrets for development and production
3. The cron endpoint requires authentication via `Authorization` header
4. Only users with `emailSummaryEnabled: true` will receive emails

## Schedule Customization

To change when emails are sent, modify the cron schedule in `vercel.json`:

- `0 9 * * 1` - Every Monday at 9 AM UTC
- `0 10 * * 0` - Every Sunday at 10 AM UTC
- `0 0 1 * *` - First day of every month at midnight UTC

Use [crontab.guru](https://crontab.guru/) to generate custom schedules.

