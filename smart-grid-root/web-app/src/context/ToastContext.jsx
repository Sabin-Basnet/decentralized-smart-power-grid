import React, { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((message, variant = 'info', duration = 4000) => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, variant }])
    if (duration) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const value = {
    success: (msg, d) => push(msg, 'success', d),
    error: (msg, d) => push(msg, 'error', d),
    info: (msg, d) => push(msg, 'info', d),
    dismiss,
  }

  const icons = { success: CheckCircle2, error: AlertTriangle, info: Info }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = icons[t.variant] || Info
          return (
            <div key={t.id} className={`toast toast--${t.variant}`}>
              <Icon size={18} />
              <span>{t.message}</span>
              <button
                className="toast__close"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
