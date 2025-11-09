import { HTMLAttributes } from 'react'

interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  message?: string
  title?: string
  onRetry?: () => void
  retryText?: string
  variant?: 'default' | 'compact' | 'full'
  showIcon?: boolean
}

export function ErrorMessage({
  message = 'Something went wrong. Please try again.',
  title = 'Error',
  onRetry,
  retryText = 'Try Again',
  variant = 'default',
  showIcon = true,
  className = '',
  ...props
}: ErrorMessageProps) {
  const baseClasses = 'alert alert-danger'
  
  const variantClasses = {
    default: '',
    compact: 'p-3',
    full: 'text-center py-5 my-5'
  }

  const containerClasses = `${baseClasses} ${variantClasses[variant]} ${className}`

  return (
    <div className={containerClasses} role="alert" {...props}>
      <div className="d-flex align-items-center">
        {showIcon && (
          <div className="flex-shrink-0 me-3">
            <ErrorIcon />
          </div>
        )}
        <div className="flex-grow-1">
          {title && <h5 className="alert-heading mb-2">{title}</h5>}
          <p className="mb-0">{message}</p>
          {onRetry && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm mt-3"
              onClick={onRetry}
            >
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const ErrorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>
)