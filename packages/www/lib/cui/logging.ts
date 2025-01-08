type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: number
  level: LogLevel
  message: string
  data?: any
}

declare global {
  interface Window {
    logs: Logger
  }
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs: number = 1000

  constructor() {
    // Create debug window for viewing logs
    const logWindow = window.open('', 'Debug Logs', 'width=800,height=600')
    if (logWindow) {
      logWindow.document.write('<pre id="logs"></pre>')
      this.logWindow = logWindow
    }
  }

  private logWindow: Window | null = null

  private add(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
    }

    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    this.updateDebugWindow()
  }

  private updateDebugWindow() {
    if (!this.logWindow?.document) return

    const pre = this.logWindow.document.getElementById('logs')
    if (!pre) return

    const formatted = this.logs
      .map((entry) => {
        const time = new Date(entry.timestamp).toISOString()
        const data = entry.data
          ? '\n' + JSON.stringify(entry.data, null, 2)
          : ''
        return `[${time}] ${entry.level.toUpperCase()}: ${entry.message}${data}`
      })
      .join('\n')

    pre.textContent = formatted
  }

  debug(message: string, data?: any) {
    this.add('debug', message, data)
  }

  info(message: string, data?: any) {
    this.add('info', message, data)
  }

  warn(message: string, data?: any) {
    this.add('warn', message, data)
  }

  error(message: string, data?: any) {
    this.add('error', message, data)
  }

  clear() {
    this.logs = []
    this.updateDebugWindow()
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }
}

// Initialize logger
window.logs = new Logger()

// Export a convenience object for importing
export const logger = window.logs
