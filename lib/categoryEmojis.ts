/**
 * Category Emoji Mapping
 * Maps spending categories to emojis for visual representation
 */

export const CATEGORY_EMOJIS: Record<string, string> = {
  // Bills & Utilities
  'Bills': '📄',
  'Kommunaalid': '🏠',
  'Utilities': '💡',
  'Electricity': '⚡',
  'Water': '💧',
  'Internet': '📶',
  'Phone': '📱',
  
  // Food & Dining
  'Food & Dining': '🍽️',
  'Restaurants': '🍴',
  'Groceries': '🛒',
  'Coffee': '☕',
  'Fast Food': '🍔',
  'Dining': '🍽️',
  
  // Shopping
  'Shopping': '🛍️',
  'Clothing': '👕',
  'Electronics': '📱',
  'Home': '🏠',
  'Fashion': '👗',
  
  // Transportation
  'Transportation': '🚗',
  'Gas': '⛽',
  'Parking': '🅿️',
  'Public Transport': '🚌',
  'Taxi': '🚕',
  'Car': '🚗',
  
  // Entertainment
  'Entertainment': '🎬',
  'Movies': '🎥',
  'Music': '🎵',
  'Games': '🎮',
  'Sports': '⚽',
  'Gym': '💪',
  'Health & Fitness': '🏋️',
  
  // Health
  'Health': '🏥',
  'Medical': '💊',
  'Pharmacy': '💉',
  'Dental': '🦷',
  
  // Education
  'Education': '📚',
  'Books': '📖',
  'School': '🎓',
  
  // Travel
  'Travel': '✈️',
  'Hotels': '🏨',
  'Flights': '✈️',
  'Vacation': '🏖️',
  
  // Financial
  'Savings': '💰',
  'Investment': '📈',
  'Insurance': '🛡️',
  'Bank Fees': '🏦',
  'Loan': '💳',
  'Kodulaen': '🏡',
  
  // Personal
  'Personal Care': '💅',
  'Beauty': '💄',
  'Haircut': '✂️',
  
  // Other
  'Card Payment': '💳',
  'ATM Withdrawal': '🏧',
  'Other': '📦',
  'ESTO': '🏛️',
  'Transfer': '💸',
  'Income': '💵',
}

/**
 * Get emoji for a category
 */
export function getCategoryEmoji(category: string | undefined | null): string {
  if (!category) return '📦'
  
  // Direct match
  if (CATEGORY_EMOJIS[category]) {
    return CATEGORY_EMOJIS[category]
  }
  
  // Partial match (case insensitive)
  const categoryLower = category.toLowerCase()
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (categoryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(categoryLower)) {
      return emoji
    }
  }
  
  // Default emoji
  return '📦'
}

/**
 * Get color for a category (for visual consistency)
 */
export function getCategoryColor(category: string | undefined | null): string {
  if (!category) return '#6366f1'
  
  const colors = [
    '#6366f1', // indigo
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#14b8a6', // teal
    '#a855f7', // violet
    '#eab308', // yellow
  ]
  
  // Simple hash function for consistent color assignment
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

