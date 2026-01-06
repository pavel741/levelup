// Browser notification utilities

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const notification = new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }

  return notification
}

// Check if it's time for a reminder
export const shouldShowReminder = (reminderTime: string, lastReminderDate?: string): boolean => {
  if (!reminderTime) return false

  const now = new Date()
  const [hours, minutes] = reminderTime.split(':').map(Number)
  const reminderDate = new Date()
  reminderDate.setHours(hours, minutes, 0, 0)

  // If reminder time has passed today, check if we already reminded today
  const today = now.toISOString().split('T')[0]
  if (lastReminderDate === today) {
    return false
  }

  // Check if current time is past reminder time
  if (now >= reminderDate) {
    return true
  }

  return false
}

