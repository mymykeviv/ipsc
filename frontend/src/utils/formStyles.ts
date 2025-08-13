// Standardized form styling utilities
// This file provides consistent styling for all form elements across the application

export const formStyles = {
  // Standard input field styling
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: '16px',
    lineHeight: '1.5',
    color: 'var(--text)',
    backgroundColor: 'white',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  } as const,

  // Input focus state
  inputFocus: {
    outline: 'none',
    borderColor: 'var(--primary)',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  } as const,

  // Standard select field styling
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: '16px',
    lineHeight: '1.5',
    color: 'var(--text)',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  } as const,

  // Standard textarea styling
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: '16px',
    lineHeight: '1.5',
    color: 'var(--text)',
    backgroundColor: 'white',
    resize: 'vertical',
    minHeight: '100px',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  } as const,

  // Standard label styling
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '16px',
    fontWeight: '500',
    color: 'var(--text)',
  } as const,

  // Form group container
  formGroup: {
    marginBottom: '20px',
  } as const,

  // Form section styling
  section: {
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
  } as const,

  // Section header styling
  sectionHeader: {
    marginBottom: '20px',
    color: '#fff',
    backgroundColor: '#007bff',
    padding: '12px 20px',
    fontSize: '18px',
    fontWeight: '600',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as const,

  // Grid container for form fields
  grid: {
    display: 'grid',
    gap: '20px',
  } as const,

  // Two column grid
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  } as const,

  // Three column grid
  grid3Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '20px',
  } as const,

  // Four column grid
  grid4Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '20px',
  } as const,
} as const;

// Standardized error message styling
export const errorStyles = {
  container: {
    color: '#dc2626',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '14px',
    marginBottom: '16px',
    marginTop: '8px',
  } as const,
};

// Standardized success message styling
export const successStyles = {
  container: {
    color: '#059669',
    padding: '12px 16px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
    fontSize: '14px',
    marginBottom: '16px',
    marginTop: '8px',
  } as const,
};

// Helper function to combine styles
export const combineStyles = (...styles: any[]) => {
  return styles.reduce((combined, style) => ({ ...combined, ...style }), {});
};

// Helper function to get section header color based on section type
export const getSectionHeaderColor = (sectionType: string) => {
  const colors = {
    basic: '#007bff',    // Blue
    billing: '#ffc107',  // Yellow
    shipping: '#6c757d', // Gray
    gst: '#28a745',      // Green
    payment: '#17a2b8',  // Cyan
    items: '#007bff',    // Blue
    totals: '#28a745',   // Green
    other: '#6c757d',    // Gray
  };
  
  return colors[sectionType as keyof typeof colors] || '#007bff';
};
