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

    this.eventSource = new EventSource(this.url)

    this.eventSource.onopen = () => {
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
      // Check for empty response or connection errors
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        // Connection closed - likely serverless timeout or network issue
        this.disconnect()
        this.options.onError?.(new Error('SSE connection closed - serverless environments may not support long-lived connections'))
      } else if (this.eventSource?.readyState === EventSource.CONNECTING) {
        // Still connecting - might be a network issue
        // Don't immediately error, let it try to connect
      } else {
        // Other errors - trigger fallback
        this.options.onError?.(new Error('SSE connection error'))
      }
    }
  }

  disconnect(): void {
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

