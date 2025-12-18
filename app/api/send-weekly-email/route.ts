import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { getUserData } from '@/lib/firestore'

const resend = new Resend(process.env.RESEND_API_KEY)

interface WeeklyStats {
  totalHabitsCompleted: number
  totalXP: number
  averagePerDay: number
  bestDay: { date: string; count: number }
  streak: number
  habitsCompleted: Array<{ name: string; count: number }>
}

async function getWeeklyStats(userId: string): Promise<WeeklyStats | null> {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 })

  // Get habits
  const habitsRef = collection(db, 'habits')
  const habitsQuery = query(habitsRef, where('userId', '==', userId))
  const habitsSnapshot = await getDocs(habitsQuery)
  const habits = habitsSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name || '',
      completedDates: (data.completedDates || []) as string[],
    }
  })

  // Get daily stats - Firestore doesn't support range queries with strings easily, so we'll get all and filter
  const statsRef = collection(db, 'dailyStats')
  const statsQuery = query(statsRef, where('userId', '==', userId))
  const statsSnapshot = await getDocs(statsQuery)
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd')
  const dailyStats = statsSnapshot.docs
    .map((doc) => {
      const data = doc.data()
      return {
        date: (data.date || '') as string,
        habitsCompleted: (data.habitsCompleted || 0) as number,
        xpEarned: (data.xpEarned || 0) as number,
      }
    })
    .filter((stat) => stat.date >= weekStartStr && stat.date <= weekEndStr)

  // Calculate stats
  const totalHabitsCompleted = dailyStats.reduce((sum, stat) => sum + stat.habitsCompleted, 0)
  const totalXP = dailyStats.reduce((sum, stat) => sum + stat.xpEarned, 0)
  const daysWithData = dailyStats.length || 1
  const averagePerDay = totalHabitsCompleted / daysWithData

  // Find best day
  const bestDay = dailyStats.reduce(
    (best, stat) => {
      if (stat.habitsCompleted > best.count) {
        return { date: stat.date, count: stat.habitsCompleted }
      }
      return best
    },
    { date: format(weekStart, 'yyyy-MM-dd'), count: 0 }
  )

  // Get habit completion counts
  const habitCounts: Record<string, number> = {}
  habits.forEach((habit) => {
    const completedInWeek = (habit.completedDates || []).filter((date: string) => {
      return date >= format(weekStart, 'yyyy-MM-dd') && date <= format(weekEnd, 'yyyy-MM-dd')
    }).length
    if (completedInWeek > 0) {
      habitCounts[habit.name] = completedInWeek
    }
  })

  const habitsCompleted = Object.entries(habitCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Get user for streak
  const user = await getUserData(userId)

  return {
    totalHabitsCompleted,
    totalXP,
    averagePerDay,
    bestDay,
    streak: user?.streak || 0,
    habitsCompleted,
  }
}

function generateEmailHTML(userName: string, stats: WeeklyStats): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Progress Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎯 LevelUp Weekly Summary</h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">Your progress report for this week</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${userName}! 👋
              </p>
              <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Here's your weekly progress summary. Keep up the great work!
              </p>
              
              <!-- Stats Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td width="48%" style="background-color: #eff6ff; padding: 20px; border-radius: 8px; text-align: center; margin-right: 4%;">
                    <div style="font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 5px;">${stats.totalHabitsCompleted}</div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Habits Completed</div>
                  </td>
                  <td width="48%" style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #16a34a; margin-bottom: 5px;">${stats.totalXP}</div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">XP Earned</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 15px;"></td>
                </tr>
                <tr>
                  <td width="48%" style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin-right: 4%;">
                    <div style="font-size: 32px; font-weight: bold; color: #d97706; margin-bottom: 5px;">${stats.averagePerDay.toFixed(1)}</div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Daily Average</div>
                  </td>
                  <td width="48%" style="background-color: #fce7f3; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #be185d; margin-bottom: 5px;">🔥 ${stats.streak}</div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Day Streak</div>
                  </td>
                </tr>
              </table>
              
              <!-- Best Day -->
              ${stats.bestDay.count > 0 ? `
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #8b5cf6;">
                <p style="margin: 0 0 10px; color: #374151; font-size: 14px; font-weight: 600;">🏆 Best Day This Week</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  ${format(new Date(stats.bestDay.date), 'EEEE, MMMM d')} - ${stats.bestDay.count} ${stats.bestDay.count === 1 ? 'habit' : 'habits'} completed!
                </p>
              </div>
              ` : ''}
              
              <!-- Top Habits -->
              ${stats.habitsCompleted.length > 0 ? `
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px; color: #374151; font-size: 18px; font-weight: 600;">Top Performing Habits</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${stats.habitsCompleted
                    .map(
                      (habit) => `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #374151; font-size: 14px; font-weight: 500;">${habit.name}</span>
                      <span style="float: right; color: #6b7280; font-size: 14px;">${habit.count}x</span>
                    </td>
                  </tr>
                  `
                    )
                    .join('')}
                </table>
              </div>
              ` : ''}
              
              <!-- CTA -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://levelup.vercel.app'}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  View Full Dashboard →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                You're receiving this email because you enabled weekly summaries in your settings.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://levelup.vercel.app'}/settings" style="color: #6b7280; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or has proper auth
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 })
    }

    // Get all users with email summaries enabled
    const usersRef = collection(db, 'users')
    const usersSnapshot = await getDocs(usersRef)
    const users = usersSnapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          email: (data.email || '') as string,
          name: (data.name || '') as string,
          emailSummaryEnabled: (data.emailSummaryEnabled || false) as boolean,
        }
      })
      .filter((user) => user.emailSummaryEnabled === true)

    const results = []

    for (const user of users) {
      try {
        const stats = await getWeeklyStats(user.id)
        if (!stats) {
          continue
        }

        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'LevelUp <noreply@levelup.app>',
          to: user.email,
          subject: `🎯 Your Weekly Progress Summary - ${stats.totalHabitsCompleted} Habits Completed!`,
          html: generateEmailHTML(user.name, stats),
        })

        if (error) {
          console.error(`Error sending email to ${user.email}:`, error)
          results.push({ userId: user.id, success: false, error: error.message })
        } else {
          results.push({ userId: user.id, success: true })
        }
      } catch (error: any) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({ userId: user.id, success: false, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      usersProcessed: users.length,
      results,
    })
  } catch (error: any) {
    console.error('Error in weekly email cron:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

