# LevelUp – Level Up Life

A productivity app using gamification to build habits, block distractions, and achieve goals through daily challenges and community support.

## Features

### 🎯 Habit Tracking
- Create and manage daily habits
- Track completion streaks
- Earn XP for completing habits
- Visual progress indicators

### 🏆 Gamification System
- Level up by earning XP
- Complete challenges for bonus rewards
- Track your streak and longest streak
- Unlock achievements

### 🛡️ Focus Mode
- Block distracting websites
- Quick-add common social media sites
- Enable/disable focus mode with one click
- Track blocked sites

### 🎮 Daily Challenges
- Join community challenges
- Earn bonus XP
- Compete with others
- Track challenge progress

### 👥 Community
- Global leaderboard
- See your rank
- Share achievements
- Compete with friends

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase account (for data persistence)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Copy your Firebase config values

3. Configure environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` with your Firebase configuration.

4. Set up Firestore security rules (see `DEPLOYMENT.md`)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

See `DEPLOYMENT.md` for detailed deployment instructions.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Lucide React** - Icons
- **date-fns** - Date utilities

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── page.tsx        # Home/Dashboard page
│   ├── habits/         # Habits page
│   ├── challenges/     # Challenges page
│   ├── focus/          # Focus mode page
│   ├── community/      # Community/Leaderboard page
│   └── settings/       # Settings page
├── components/         # React components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── HabitCard.tsx   # Habit card component
│   ├── ChallengeCard.tsx # Challenge card component
│   ├── Sidebar.tsx     # Navigation sidebar
│   └── Header.tsx      # Top header
├── store/              # State management
│   └── useStore.ts     # Zustand store
└── types/              # TypeScript types
    └── index.ts        # Type definitions
```

## Key Features Explained

### XP and Leveling System
- Complete habits to earn XP
- Level up automatically as you gain XP
- Each level requires more XP than the previous one

### Streak System
- Maintain daily streaks by completing habits
- Track your current and longest streak
- Streaks reset if you miss a day

### Challenge System
- Join challenges to earn bonus XP
- Different difficulty levels (easy, medium, hard)
- Track participation and completion

## Future Enhancements

- [ ] Backend integration for data persistence
- [ ] User authentication
- [ ] Real-time leaderboard updates
- [ ] Mobile app version
- [ ] Browser extension for distraction blocking
- [ ] Achievement system with badges
- [ ] Social features (friends, groups)
- [ ] Custom themes and personalization

## License

MIT

