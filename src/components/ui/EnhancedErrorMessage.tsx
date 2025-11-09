import { HTMLAttributes, ReactNode } from 'react'

interface EnhancedErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  message?: string
  title?: string
  onRetry?: () => void
  retryText?: string
  onDismiss?: () => void
  dismissText?: string
  variant?: 'default' | 'compact' | 'full' | 'inline'
  type?: 'error' | 'warning' | 'info'
  showIcon?: boolean
  children?: ReactNode
  code?: string | number
}

export function EnhancedErrorMessage({
  message = 'Something went wrong. Please try again.',
  title = 'Error',
  onRetry,
  retryText = 'Try Again',
  onDismiss,
  dismissText = 'Dismiss',
  variant = 'default',
  type = 'error',
  showIcon = true,
  children,
  code,
  className = '',
  ...props
}: EnhancedErrorMessageProps) {
  const alertType = {
    error: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info'
  }[type]

  const variantClasses = {
    default: '',
    compact: 'p-3',
    full: 'text-center py-5 my-5',
    inline: 'd-inline-block p-2'
  }

  const containerClasses = `alert ${alertType} ${variantClasses[variant]} ${className}`

  return (
    <div className={containerClasses} role="alert" {...props}>
      <div className="d-flex justify-content-between align-items-start">
        <div className="d-flex align-items-start flex-grow-1">
          {showIcon && (
            <div className="flex-shrink-0 me-3">
              <ErrorIcon type={type} />
            </div>
          )}
          <div className="flex-grow-1">
            <div className="d-flex align-items-center mb-1">
              {title && <h6 className="alert-heading mb-0 me-2">{title}</h6>}
              {code && (
                <small className="text-muted">(Code: {code})</small>
              )}
            </div>
            <p className="mb-2">{message}</p>
            {children}
            
            {(onRetry || onDismiss) && (
              <div className="d-flex gap-2 mt-3">
                {onRetry && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={onRetry}
                  >
                    {retryText}
                  </button>
                )}
                {onDismiss && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={onDismiss}
                  >
                    {dismissText}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {onDismiss && variant !== 'inline' && (
          <button
            type="button"
            className="btn-close flex-shrink-0 ms-2"
            onClick={onDismiss}
            aria-label="Close"
          />
        )}
      </div>
    </div>
  )
}

const ErrorIcon = ({ type }: { type: 'error' | 'warning' | 'info' }) => {
  const iconColor = {
    error: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0'
  }[type]

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={iconColor}>
      {type === 'error' && (
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      )}
      {type === 'warning' && (
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      )}
      {type === 'info' && (
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      )}
    </svg>
  )
}