# LevelUp – Level Up Life

A productivity app using gamification to build habits, block distractions, and achieve goals through daily challenges.

## Features

- **Habit Tracking**: Create and track daily habits with XP rewards
- **Gamification**: Level up, earn XP, and unlock achievements
- **Daily Challenges**: Complete challenges to boost your progress
- **Distraction Blocking**: Block distracting websites during focus sessions
- **Statistics Dashboard**: Comprehensive analytics and progress tracking
- **Achievements System**: Unlock achievements for milestones
- **Habit Reminders**: Browser notifications for habit reminders
- **Weekly Email Summaries**: Receive weekly progress reports via email
- **Dark Mode**: Full dark mode support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Email**: Resend
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled
- Resend account (for email summaries)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd levelup
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=LevelUp <noreply@yourdomain.com>
CRON_SECRET=your_random_secret_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up Firebase:
   - Enable Authentication (Email/Password and Google Sign-In)
   - Enable Firestore Database
   - Deploy Firestore security rules from `firestore.rules`
   - Add your domain to Authorized Domains in Firebase Console

5. Set up Resend:
   - Create an account at [resend.com](https://resend.com)
   - Get your API key
   - Verify your domain (or use Resend's test domain)
   - Add the API key to your `.env.local`

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

The weekly email cron job will automatically run every Monday at 9 AM UTC.

### Environment Variables for Production

Make sure to add these in Vercel:
- All `NEXT_PUBLIC_FIREBASE_*` variables
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET` (generate a random string)
- `NEXT_PUBLIC_APP_URL` (your production URL)

### Firebase Configuration

1. Add your Vercel domain to Firebase Authorized Domains
2. Update Firestore security rules if needed
3. Ensure Firebase Authentication is properly configured

## Weekly Email Summaries

The app sends weekly progress summaries every Monday at 9 AM UTC to users who have enabled email summaries in their settings.

To test the email functionality locally, you can call the API endpoint:
```bash
curl -X POST http://localhost:3000/api/send-weekly-email \
  -H "Authorization: Bearer your_cron_secret"
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── achievements/      # Achievements page
│   ├── challenges/        # Challenges page
│   ├── focus/             # Focus mode page
│   ├── habits/            # Habits management page
│   ├── settings/          # Settings page
│   ├── statistics/        # Statistics dashboard
│   └── page.tsx           # Dashboard
├── components/            # React components
├── lib/                   # Utility functions
│   ├── firebase.ts        # Firebase initialization
│   ├── firestore.ts       # Firestore operations
│   ├── auth.ts            # Authentication functions
│   ├── achievements.ts    # Achievement logic
│   └── notifications.ts   # Browser notifications
├── store/                 # Zustand stores
├── types/                 # TypeScript types
└── public/                # Static assets
```

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflow and guidelines.

## Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## License

MIT
