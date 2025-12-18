'use client'

import { useEffect, useState } from 'react'
import NotificationManager from './NotificationManager'

export default function ClientNotificationManager() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <NotificationManager />
}

