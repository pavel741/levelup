/**
 * Server-Sent Events (SSE) Client
 * Provides real-time updates without polling
 * Falls back to polling if SSE not available
 */

export interface SSEOptions {
  onMessage: (data: any) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  onClose?: () => void
}

export class SSEClient {
  private eventSource: EventSource | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isActive = false

  constructor(
    private url: string,
    private options: SSEOptions
  ) {}

  connect(): void {
    if (typeof EventSource === 'undefined') {
      console.warn('EventSource not supported, falling back to polling')
      this.options.onError?.(new Error('EventSource not supported'))
      return
    }

    this.isActive = true
    this.eventSource = new EventSource(this.url)

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0
      this.options.onOpen?.()
    }

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.options.onMessage(data)
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }

    this.eventSource.onerror = () => {
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.handleReconnect()
      } else {
        this.options.onError?.(new Error('SSE connection error'))
      }
    }
  }

  private handleReconnect(): void {
    if (!this.isActive || this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.disconnect()
      this.options.onError?.(new Error('Max reconnection attempts reached'))
      return
    }

    this.reconnectAttempts++
    setTimeout(() => {
      if (this.isActive) {
        this.connect()
      }
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  disconnect(): void {
    this.isActive = false
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.options.onClose?.()
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

/**
 * Create SSE connection for finance data
 */
export function createFinanceSSE(
  userId: string,
  dataType: 'transactions' | 'categories' | 'settings',
  onMessage: (data: any) => void,
  options?: Partial<SSEOptions>
): SSEClient {
  const url = `/api/finance/sse?userId=${encodeURIComponent(userId)}&type=${dataType}`
  
  return new SSEClient(url, {
    onMessage,
    ...options,
  })
}

