import { DateRange } from '../components/DateFilter'

/**
 * Default filter states for all application pages
 * These represent the original state when no filters are applied
 */
export const defaultFilterStates = {
  // Products Page
  products: {
    searchTerm: '',
    statusFilter: 'all',
    categoryFilter: 'all',
    itemTypeFilter: 'all',
    gstRateFilter: 'all',
    stockLevelFilter: 'all',
    supplierFilter: 'all',
    priceRangeFilter: 'all',
    dateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange
  },

  // Invoices Page
  invoices: {
    searchTerm: '',
    statusFilter: 'all',
    customerFilter: 'all',
    gstTypeFilter: 'all',
    amountRangeFilter: 'all',
    pendingAmountRangeFilter: 'all',
    paymentStatusFilter: 'all',
    dateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange,
    overdueDateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange
  },

  // Purchases Page
  purchases: {
    searchTerm: '',
    statusFilter: 'all',
    vendorFilter: 'all',
    gstTypeFilter: 'all',
    amountRangeFilter: 'all',
    pendingAmountRangeFilter: 'all',
    paymentStatusFilter: 'all',
    dateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange,
    overdueDateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange
  },

  // Payments Page
  payments: {
    invoiceNumberFilter: 'all',
    paymentAmountFilter: 'all',
    paymentMethodFilter: 'all',
    financialYearFilter: 'all',
    dateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange
  },

  // Expenses Page
  expenses: {
    searchTerm: '',
    categoryFilter: 'all',
    expenseTypeFilter: 'all',
    paymentMethodFilter: 'all',
    amountRangeFilter: 'all',
    financialYearFilter: 'all',
    dateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange
  },

  // Cashflow Page
  cashflow: {
    searchTerm: '',
    typeFilter: 'all',
    transactionTypeFilter: 'all',
    paymentMethodFilter: 'all',
    accountHeadFilter: 'all',
    amountRangeFilter: 'all',
    dateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange
  },

  // Parties Page (handles both customers and vendors)
  parties: {
    search: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    gstStatus: '',
    gstRegistration: '',
    gstStateCode: '',
    partyType: 'both',
    status: 'all',
    dateRange: { start: '', end: '' },
    hasNotes: false
  },

  // Stock History Page
  stockHistory: {
    productFilter: 'all',
    categoryFilter: 'all',
    supplierFilter: 'all',
    stockLevelFilter: 'all',
    entryTypeFilter: 'all',
    dateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange
  },

  // GST Reports Page
  gstReports: {
    periodTypeFilter: 'month',
    periodValueFilter: 'all',
    reportTypeFilter: 'gstr1'
  },

  // Financial Reports Page
  financialReports: {
    reportTypeFilter: 'profit_loss',
    dateFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    } as DateRange
  }
}

/**
 * Get default filter state for a specific page
 * @param pageName - Name of the page
 * @returns Default filter state for the page
 */
export function getDefaultFilterState(pageName: keyof typeof defaultFilterStates) {
  return defaultFilterStates[pageName]
}

/**
 * Check if current filter state matches default state
 * @param currentState - Current filter state
 * @param pageName - Name of the page
 * @returns True if current state matches default
 */
export function isDefaultFilterState(
  currentState: Record<string, any>,
  pageName: keyof typeof defaultFilterStates
): boolean {
  const defaultState = defaultFilterStates[pageName]
  
  for (const [key, value] of Object.entries(defaultState)) {
    if (currentState[key] !== value) {
      return false
    }
  }
  
  return true
}

/**
 * Reset filter state to default for a specific page
 * @param pageName - Name of the page
 * @returns Default filter state
 */
export function resetToDefaultState(pageName: keyof typeof defaultFilterStates) {
  return { ...defaultFilterStates[pageName] }
}
