import { useAuth } from '../modules/AuthContext'

export function createApiErrorHandler(forceLogout: () => void) {
  return (error: any): string => {
    console.error('API Error:', error)
    
    // Handle different types of errors
    if (error.status === 401) {
      forceLogout()
      return "Session expired. Please log in again."
    } else if (error.status === 403) {
      return "You don't have permission to perform this action."
    } else if (error.status === 404) {
      return "The requested resource was not found."
    } else if (error.status === 422) {
      // Validation errors
      if (error.data && error.data.detail) {
        if (Array.isArray(error.data.detail)) {
          return error.data.detail.map((err: any) => err.msg).join(', ')
        }
        return error.data.detail
      }
      return "Please check your input and try again."
    } else if (error.status === 500) {
      return "Server error. Please try again later."
    } else if (error.status === 0 || error.message === 'Network Error') {
      return "Network error. Please check your connection and try again."
    } else if (error.message) {
      return error.message
    }
    
    return "An unexpected error occurred. Please try again."
  }
}

export function createInvoiceErrorHandler(forceLogout: () => void) {
  return (error: any): string => {
    console.error('Invoice API Error:', error)
    
    // Handle different types of errors
    if (error.status === 401) {
      forceLogout()
      return "Session expired. Please log in again."
    } else if (error.status === 403) {
      return "You don't have permission to perform this action."
    } else if (error.status === 404) {
      return "Invoice not found."
    } else if (error.status === 422) {
      // Validation errors
      if (error.data && error.data.detail) {
        if (Array.isArray(error.data.detail)) {
          return error.data.detail.map((err: any) => err.msg).join(', ')
        }
        return error.data.detail
      }
      return "Please check your invoice data and try again."
    } else if (error.status === 500) {
      return "Server error. Please try again later."
    } else if (error.status === 0 || error.message === 'Network Error') {
      return "Network error. Please check your connection and try again."
    } else if (error.message) {
      return error.message
    }
    
    return "An unexpected error occurred while processing the invoice."
  }
}

export function createInvoiceGridErrorHandler(forceLogout: () => void) {
  return (error: any): string => {
    console.error('Invoice Grid API Error:', error)
    
    // Handle different types of errors
    if (error.status === 401) {
      forceLogout()
      return "Session expired. Please log in again."
    } else if (error.status === 403) {
      return "You don't have permission to view invoices."
    } else if (error.status === 404) {
      return "Invoice data not found."
    } else if (error.status === 422) {
      // Validation errors
      if (error.data && error.data.detail) {
        if (Array.isArray(error.data.detail)) {
          return error.data.detail.map((err: any) => err.msg).join(', ')
        }
        return error.data.detail
      }
      return "Please check your filter criteria and try again."
    } else if (error.status === 500) {
      return "Server error. Please try again later."
    } else if (error.status === 0 || error.message === 'Network Error') {
      return "Network error. Please check your connection and try again."
    } else if (error.message) {
      return error.message
    }
    
    return "An unexpected error occurred while loading invoice data."
  }
}

export function handleApiError(error: any): string {
  console.error('API Error:', error)
  
  // Handle different types of errors
  if (error.status === 401) {
    return "Session expired. Please log in again."
  } else if (error.status === 403) {
    return "You don't have permission to perform this action."
  } else if (error.status === 404) {
    return "The requested resource was not found."
  } else if (error.status === 422) {
    // Validation errors
    if (error.data && error.data.detail) {
      if (Array.isArray(error.data.detail)) {
        return error.data.detail.map((err: any) => err.msg).join(', ')
      }
      return error.data.detail
    }
    return "Please check your input and try again."
  } else if (error.status === 500) {
    return "Server error. Please try again later."
  } else if (error.status === 0 || error.message === 'Network Error') {
    return "Network error. Please check your connection and try again."
  } else if (error.message) {
    return error.message
  }
  
  return "An unexpected error occurred. Please try again."
}

// Enhanced error component
export function ErrorMessage({ 
  error, 
  onRetry, 
  onDismiss 
}: { 
  error: string
  onRetry?: () => void
  onDismiss?: () => void
}) {
  return (
    <div style={{
      padding: '12px 16px',
      marginBottom: '16px',
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '6px',
      color: '#721c24',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
          Error
        </div>
        <div style={{ fontSize: '14px' }}>
          {error}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '4px 8px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              color: '#721c24',
              border: '1px solid #721c24',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

// Success message component
export function SuccessMessage({ 
  message, 
  onDismiss 
}: { 
  message: string
  onDismiss?: () => void
}) {
  return (
    <div style={{
      padding: '12px 16px',
      marginBottom: '16px',
      backgroundColor: '#d4edda',
      border: '1px solid #c3e6cb',
      borderRadius: '6px',
      color: '#155724',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
          Success
        </div>
        <div style={{ fontSize: '14px' }}>
          {message}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            padding: '4px 8px',
            backgroundColor: 'transparent',
            color: '#155724',
            border: '1px solid #155724',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
