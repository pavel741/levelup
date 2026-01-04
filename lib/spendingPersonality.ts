/**
 * Spending Personality Analyzer
 * Categorizes spending patterns into personality types
 */

import type { FinanceTransaction } from '@/types/finance'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { getSuggestedCategory } from '@/lib/transactionCategorizer'

export interface SpendingPersonality {
  type: string
  title: string
  description: string
  icon: string
  traits: string[]
  score: number // 0-100
  insights: string[]
}

export interface PersonalityAnalysis {
  primary: SpendingPersonality
  secondary?: SpendingPersonality
  allPersonalities: SpendingPersonality[]
  insights: string[]
}

const PERSONALITY_TYPES = {
  COFFEE_ENTHUSIAST: {
    type: 'coffee_enthusiast',
    title: 'Coffee Enthusiast ☕',
    description: 'You love your daily coffee fix! Coffee shops are a regular part of your routine.',
    icon: '☕',
    keywords: ['coffee', 'cafe', 'starbucks', 'espresso', 'latte', 'cappuccino'],
    categories: ['Food & Dining', 'Restaurants', 'Coffee'],
  },
  HOMEBODY: {
    type: 'homebody',
    title: 'Homebody 🏠',
    description: 'You prefer staying in. Most spending goes to home, groceries, and online shopping.',
    icon: '🏠',
    keywords: ['grocery', 'supermarket', 'home', 'amazon', 'online', 'delivery'],
    categories: ['Groceries', 'Shopping', 'Home', 'Utilities'],
  },
  ADVENTURE_SEEKER: {
    type: 'adventure_seeker',
    title: 'Adventure Seeker 🌍',
    description: 'You love experiences! Travel, dining out, and entertainment are your priorities.',
    icon: '🌍',
    keywords: ['travel', 'hotel', 'flight', 'restaurant', 'entertainment', 'ticket', 'tour'],
    categories: ['Travel', 'Entertainment', 'Restaurants', 'Dining'],
  },
  FITNESS_FOCUSED: {
    type: 'fitness_focused',
    title: 'Fitness Focused 💪',
    description: 'Health and fitness are important to you. Gym memberships and healthy food are priorities.',
    icon: '💪',
    keywords: ['gym', 'fitness', 'health', 'supplement', 'protein', 'yoga', 'sport'],
    categories: ['Health & Fitness', 'Sports', 'Gym'],
  },
  TECH_SAVVY: {
    type: 'tech_savvy',
    title: 'Tech Savvy 📱',
    description: 'You invest in technology. Gadgets, subscriptions, and digital services are common.',
    icon: '📱',
    keywords: ['tech', 'apple', 'samsung', 'subscription', 'software', 'app', 'digital'],
    categories: ['Electronics', 'Technology', 'Subscriptions', 'Software'],
  },
  FOODIE: {
    type: 'foodie',
    title: 'Foodie 🍽️',
    description: 'You love good food! Restaurants, food delivery, and cooking ingredients are your thing.',
    icon: '🍽️',
    keywords: ['restaurant', 'food', 'dining', 'delivery', 'uber eats', 'grubhub', 'cooking'],
    categories: ['Restaurants', 'Food & Dining', 'Groceries'],
  },
  FASHIONISTA: {
    type: 'fashionista',
    title: 'Fashionista 👗',
    description: 'You invest in your style. Clothing, accessories, and personal care are priorities.',
    icon: '👗',
    keywords: ['clothing', 'fashion', 'apparel', 'shoes', 'accessories', 'beauty', 'cosmetics'],
    categories: ['Shopping', 'Clothing', 'Personal Care', 'Beauty'],
  },
  SAVER: {
    type: 'saver',
    title: 'Smart Saver 💰',
    description: 'You\'re financially conscious. Low spending, high savings rate, and smart choices.',
    icon: '💰',
    keywords: ['savings', 'investment', 'low spending'],
    categories: ['Savings', 'Investment'],
  },
}

export function analyzeSpendingPersonality(transactions: FinanceTransaction[]): PersonalityAnalysis {
  if (transactions.length === 0) {
    return {
      primary: {
        type: 'unknown',
        title: 'No Data Yet',
        description: 'Start tracking your spending to discover your personality!',
        icon: '📊',
        traits: [],
        score: 0,
        insights: ['Add more transactions to get insights'],
      },
      allPersonalities: [],
      insights: [],
    }
  }

  // Analyze spending patterns
  const categorySpending: Record<string, number> = {}
  const keywordMatches: Record<string, number> = {}
  let totalExpenses = 0
  let totalIncome = 0
  let transactionCount = 0
  const recentTransactions = transactions.slice(0, 100) // Analyze recent transactions

  recentTransactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    const isExpense = type === 'expense' || amount < 0
    const isIncome = type === 'income' || (type !== 'expense' && amount > 0)

    if (isIncome) {
      totalIncome += Math.abs(amount)
    } else if (isExpense) {
      totalExpenses += Math.abs(amount)
      transactionCount++

      // Get category
      let category = tx.category || 'Other'
      const description = (tx.description || '').toLowerCase()
      const recipientName = (tx.recipientName || '').toLowerCase()

      // Try to recategorize if needed
      if (!category || category === 'Other' || category.includes('POS:')) {
        const suggested = getSuggestedCategory(
          tx.description || category,
          tx.referenceNumber,
          tx.recipientName,
          amount
        )
        if (suggested) category = suggested
      }

      const absAmount = Math.abs(amount)
      categorySpending[category] = (categorySpending[category] || 0) + absAmount

      // Check keywords
      const searchText = `${description} ${recipientName} ${category}`.toLowerCase()
      Object.entries(PERSONALITY_TYPES).forEach(([key, personality]) => {
        personality.keywords.forEach((keyword) => {
          if (searchText.includes(keyword.toLowerCase())) {
            keywordMatches[key] = (keywordMatches[key] || 0) + absAmount
          }
        })
        personality.categories.forEach((cat) => {
          if (category.toLowerCase().includes(cat.toLowerCase())) {
            keywordMatches[key] = (keywordMatches[key] || 0) + absAmount
          }
        })
      })
    }
  })

  // Calculate personality scores
  const personalityScores: Array<{ type: string; score: number; data: typeof PERSONALITY_TYPES[keyof typeof PERSONALITY_TYPES] }> = []

  Object.entries(PERSONALITY_TYPES).forEach(([key, personality]) => {
    const keywordScore = keywordMatches[key] || 0
    const categoryScore = personality.categories.reduce((sum, cat) => {
      return sum + (categorySpending[cat] || 0)
    }, 0)

    // Calculate score based on percentage of total spending
    const totalScore = keywordScore + categoryScore
    const percentage = totalExpenses > 0 ? (totalScore / totalExpenses) * 100 : 0
    const score = Math.min(100, percentage * 2) // Scale up for visibility

    if (score > 5) { // Only include if significant
      personalityScores.push({ type: key, score, data: personality })
    }
  })

  // Check for Saver personality (low spending, high savings rate)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
  if (savingsRate > 20 && totalExpenses < totalIncome * 0.7) {
    personalityScores.push({
      type: 'SAVER',
      score: Math.min(100, savingsRate),
      data: PERSONALITY_TYPES.SAVER,
    })
  }

  // Sort by score
  personalityScores.sort((a, b) => b.score - a.score)

  // Generate insights
  const insights: string[] = []
  const topCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat)

  if (topCategories.length > 0) {
    insights.push(`Top spending category: ${topCategories[0]}`)
  }

  if (savingsRate > 0) {
    insights.push(`Savings rate: ${savingsRate.toFixed(1)}%`)
  }

  if (transactionCount > 0) {
    const avgTransaction = totalExpenses / transactionCount
    insights.push(`Average transaction: €${avgTransaction.toFixed(2)}`)
  }

  // Build personality objects
  const allPersonalities: SpendingPersonality[] = personalityScores.map(({ type, score, data }) => {
    const traits: string[] = []
    if (score > 50) traits.push('Strong preference')
    if (score > 30) traits.push('Regular spending')
    if (score > 15) traits.push('Occasional')

    return {
      type: data.type,
      title: data.title,
      description: data.description,
      icon: data.icon,
      traits,
      score: Math.round(score),
      insights: [],
    }
  })

  const primary = allPersonalities[0] || {
    type: 'balanced',
    title: 'Balanced Spender ⚖️',
    description: 'Your spending is well-distributed across different categories.',
    icon: '⚖️',
    traits: ['Diverse spending'],
    score: 50,
    insights: [],
  }

  const secondary = allPersonalities[1]

  return {
    primary,
    secondary,
    allPersonalities,
    insights,
  }
}

