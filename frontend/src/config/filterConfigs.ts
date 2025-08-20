import { FilterConfig, QuickFilter } from '../components/UnifiedFilterSystem'

// Common filter options
export const commonFilterOptions = {
  status: [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ],
  
  paymentStatus: [
    { value: 'all', label: 'All Payment Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partially_paid', label: 'Partially Paid' }
  ],
  
  paymentMethod: [
    { value: 'all', label: 'All Payment Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online_payment', label: 'Online Payment' }
  ],
  
  gstType: [
    { value: 'all', label: 'All GST Types' },
    { value: 'regular', label: 'Regular' },
    { value: 'composition', label: 'Composition' },
    { value: 'exempted', label: 'Exempted' }
  ],
  
  amountRanges: [
    { value: 'all', label: 'All Amounts' },
    { value: '0-1000', label: '₹0 - ₹1,000' },
    { value: '1000-5000', label: '₹1,000 - ₹5,000' },
    { value: '5000-10000', label: '₹5,000 - ₹10,000' },
    { value: '10000-50000', label: '₹10,000 - ₹50,000' },
    { value: '50000+', label: '₹50,000+' }
  ],
  
  stockLevels: [
    { value: 'all', label: 'All Stock Levels' },
    { value: 'low', label: 'Low Stock (< 10)' },
    { value: 'normal', label: 'Normal Stock (10-50)' },
    { value: 'high', label: 'High Stock (> 50)' },
    { value: 'out', label: 'Out of Stock (0)' }
  ],
  
  gstRates: [
    { value: 'all', label: 'All GST Rates' },
    { value: '0', label: '0%' },
    { value: '5', label: '5%' },
    { value: '12', label: '12%' },
    { value: '18', label: '18%' },
    { value: '28', label: '28%' }
  ],
  
  itemTypes: [
    { value: 'all', label: 'All Types' },
    { value: 'goods', label: 'Goods' },
    { value: 'service', label: 'Service' }
  ],
  
  entryTypes: [
    { value: 'all', label: 'All Entries' },
    { value: 'incoming', label: 'Incoming' },
    { value: 'outgoing', label: 'Outgoing' },
    { value: 'adjustment', label: 'Adjustment' }
  ]
}

// Filter configurations for each screen
export const filterConfigs = {
  // Products Page
  products: {
    filters: [
      {
        id: 'search',
        type: 'search' as const,
        label: 'Search Products',
        placeholder: 'Search by name, code, SKU, category, HSN, supplier...',
        width: 'full' as const
      },
      {
        id: 'productName',
        type: 'search' as const,
        label: 'Product Name',
        placeholder: 'Search product name...',
        width: 'third' as const
      },
      {
        id: 'supplier',
        type: 'dropdown' as const,
        label: 'Supplier',
        placeholder: 'Select supplier...',
        width: 'third' as const
      },
      {
        id: 'category',
        type: 'dropdown' as const,
        label: 'Product Category',
        placeholder: 'Select category...',
        width: 'third' as const
      },
      {
        id: 'stockLevel',
        type: 'stock-level' as const,
        label: 'Stock Level',
        width: 'third' as const
      },
      {
        id: 'itemType',
        type: 'dropdown' as const,
        label: 'Type',
        options: commonFilterOptions.itemTypes,
        width: 'third' as const
      },
      {
        id: 'gstRate',
        type: 'dropdown' as const,
        label: 'GST Rate',
        options: commonFilterOptions.gstRates,
        width: 'third' as const
      },
      {
        id: 'status',
        type: 'dropdown' as const,
        label: 'Status',
        options: commonFilterOptions.status,
        width: 'quarter' as const
      },
      {
        id: 'priceRange',
        type: 'amount-range' as const,
        label: 'Price Range',
        options: commonFilterOptions.amountRanges,
        width: 'quarter' as const
      },
      {
        id: 'dateRange',
        type: 'date-range' as const,
        label: 'Date Range',
        width: 'half' as const
      }
    ],
    quickFilters: [
      {
        id: 'lowStock',
        label: 'Low Stock Items',
        icon: '⚠️',
        action: () => {},
        isActive: false
      },
      {
        id: 'highValue',
        label: 'High Value Items',
        icon: '💰',
        action: () => {},
        isActive: false
      },
      {
        id: 'recent',
        label: 'Recent Additions',
        icon: '🆕',
        action: () => {},
        isActive: false
      }
    ]
  },

  // Invoices Page
  invoices: {
    filters: [
      {
        id: 'search',
        type: 'search' as const,
        label: 'Search Invoices',
        placeholder: 'Search by invoice number, customer name, GSTIN, email...',
        width: 'full' as const
      },
      {
        id: 'customer',
        type: 'dropdown' as const,
        label: 'Customer',
        placeholder: 'Select customer...',
        width: 'third' as const
      },
      {
        id: 'status',
        type: 'dropdown' as const,
        label: 'Status',
        options: [
          { value: 'all', label: 'All Status' },
          { value: 'draft', label: 'Draft' },
          { value: 'sent', label: 'Sent' },
          { value: 'paid', label: 'Paid' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'cancelled', label: 'Cancelled' }
        ],
        width: 'third' as const
      },
      {
        id: 'gstType',
        type: 'dropdown' as const,
        label: 'GST Type',
        options: commonFilterOptions.gstType,
        width: 'third' as const
      },
      {
        id: 'amountRange',
        type: 'amount-range' as const,
        label: 'Invoice Amount Range',
        options: commonFilterOptions.amountRanges,
        width: 'third' as const
      },
      {
        id: 'pendingAmountRange',
        type: 'amount-range' as const,
        label: 'Pending Amount Range',
        options: commonFilterOptions.amountRanges,
        width: 'third' as const
      },
      {
        id: 'paymentStatus',
        type: 'dropdown' as const,
        label: 'Payment Status',
        options: commonFilterOptions.paymentStatus,
        width: 'third' as const
      },
      {
        id: 'createdDateRange',
        type: 'date-range' as const,
        label: 'Created Date Range',
        width: 'half' as const
      },
      {
        id: 'overdueDateRange',
        type: 'date-range' as const,
        label: 'Overdue Date Range',
        width: 'half' as const
      }
    ],
    quickFilters: [
      {
        id: 'recent',
        label: 'Recent Invoices',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'overdue',
        label: 'Overdue Invoices',
        icon: '⏰',
        action: () => {},
        isActive: false
      },
      {
        id: 'unpaid',
        label: 'Unpaid Invoices',
        icon: '💳',
        action: () => {},
        isActive: false
      }
    ]
  },

  // Purchases Page
  purchases: {
    filters: [
      {
        id: 'search',
        type: 'search' as const,
        label: 'Search Purchases',
        placeholder: 'Search by PO number, vendor name, GSTIN, email...',
        width: 'full' as const
      },
      {
        id: 'vendor',
        type: 'dropdown' as const,
        label: 'Vendor',
        placeholder: 'Select vendor...',
        width: 'third' as const
      },
      {
        id: 'status',
        type: 'dropdown' as const,
        label: 'Status',
        options: [
          { value: 'all', label: 'All Status' },
          { value: 'draft', label: 'Draft' },
          { value: 'received', label: 'Received' },
          { value: 'cancelled', label: 'Cancelled' }
        ],
        width: 'third' as const
      },
      {
        id: 'gstType',
        type: 'dropdown' as const,
        label: 'GST Type',
        options: commonFilterOptions.gstType,
        width: 'third' as const
      },
      {
        id: 'amountRange',
        type: 'amount-range' as const,
        label: 'Purchase Amount Range',
        options: commonFilterOptions.amountRanges,
        width: 'third' as const
      },
      {
        id: 'pendingAmountRange',
        type: 'amount-range' as const,
        label: 'Pending Amount Range',
        options: commonFilterOptions.amountRanges,
        width: 'third' as const
      },
      {
        id: 'paymentStatus',
        type: 'dropdown' as const,
        label: 'Payment Status',
        options: commonFilterOptions.paymentStatus,
        width: 'third' as const
      },
      {
        id: 'createdDateRange',
        type: 'date-range' as const,
        label: 'Created Date Range',
        width: 'half' as const
      },
      {
        id: 'overdueDateRange',
        type: 'date-range' as const,
        label: 'Overdue Date Range',
        width: 'half' as const
      }
    ],
    quickFilters: [
      {
        id: 'recent',
        label: 'Recent Purchases',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'overdue',
        label: 'Overdue Purchases',
        icon: '⏰',
        action: () => {},
        isActive: false
      },
      {
        id: 'pending',
        label: 'Pending Payments',
        icon: '💳',
        action: () => {},
        isActive: false
      }
    ]
  },

  // Payments Page
  payments: {
    filters: [
      {
        id: 'search',
        type: 'search' as const,
        label: 'Search Payments',
        placeholder: 'Search by invoice number, customer name, amount...',
        width: 'full' as const
      },
      {
        id: 'invoice',
        type: 'dropdown' as const,
        label: 'Invoice',
        placeholder: 'Select invoice...',
        width: 'third' as const
      },
      {
        id: 'customer',
        type: 'dropdown' as const,
        label: 'Customer',
        placeholder: 'Select customer...',
        width: 'third' as const
      },
      {
        id: 'paymentStatus',
        type: 'dropdown' as const,
        label: 'Payment Status',
        options: commonFilterOptions.paymentStatus,
        width: 'third' as const
      },
      {
        id: 'paymentMethod',
        type: 'dropdown' as const,
        label: 'Payment Method',
        options: commonFilterOptions.paymentMethod,
        width: 'third' as const
      },
      {
        id: 'amountRange',
        type: 'amount-range' as const,
        label: 'Payment Amount Range',
        options: commonFilterOptions.amountRanges,
        width: 'third' as const
      },
      {
        id: 'dueDateRange',
        type: 'date-range' as const,
        label: 'Payment Due Date Range',
        width: 'half' as const
      }
    ],
    quickFilters: [
      {
        id: 'recent',
        label: 'Recent Payments',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'overdue',
        label: 'Overdue Payments',
        icon: '⏰',
        action: () => {},
        isActive: false
      },
      {
        id: 'pending',
        label: 'Pending Payments',
        icon: '💳',
        action: () => {},
        isActive: false
      }
    ]
  },

  // Expenses Page
  expenses: {
    filters: [
      {
        id: 'search',
        type: 'search' as const,
        label: 'Search Expenses',
        placeholder: 'Search by category, type, description, reference...',
        width: 'full' as const
      },
      {
        id: 'category',
        type: 'dropdown' as const,
        label: 'Expense Category',
        placeholder: 'Select category...',
        width: 'third' as const
      },
      {
        id: 'expenseType',
        type: 'dropdown' as const,
        label: 'Expense Type',
        placeholder: 'Select type...',
        width: 'third' as const
      },
      {
        id: 'paymentMethod',
        type: 'dropdown' as const,
        label: 'Payment Method',
        options: commonFilterOptions.paymentMethod,
        width: 'third' as const
      },
      {
        id: 'accountHead',
        type: 'dropdown' as const,
        label: 'Account Head',
        options: [
          { value: 'all', label: 'All Account Heads' },
          { value: 'cash', label: 'Cash' },
          { value: 'bank', label: 'Bank' },
          { value: 'other', label: 'Other' }
        ],
        width: 'third' as const
      },
      {
        id: 'amountRange',
        type: 'amount-range' as const,
        label: 'Expense Amount Range',
        options: commonFilterOptions.amountRanges,
        width: 'third' as const
      },
      {
        id: 'vendor',
        type: 'dropdown' as const,
        label: 'Vendor',
        placeholder: 'Select vendor...',
        width: 'third' as const
      },
      {
        id: 'dateRange',
        type: 'date-range' as const,
        label: 'Date Range',
        width: 'half' as const
      }
    ],
    quickFilters: [
      {
        id: 'recent',
        label: 'Recent Expenses',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'direct',
        label: 'Direct/COGS Expenses',
        icon: '📊',
        action: () => {},
        isActive: false
      },
      {
        id: 'cash',
        label: 'Cash Expenses',
        icon: '💵',
        action: () => {},
        isActive: false
      }
    ]
  },

  // Cashflow Page
  cashflow: {
    filters: [
      {
        id: 'type',
        type: 'dropdown' as const,
        label: 'Type',
        options: [
          { value: 'all', label: 'All Types' },
          { value: 'inflow', label: 'Inflow' },
          { value: 'outflow', label: 'Outflow' }
        ],
        width: 'third' as const
      },
      {
        id: 'amountRange',
        type: 'amount-range' as const,
        label: 'Amount Range',
        options: commonFilterOptions.amountRanges,
        width: 'third' as const
      },
      {
        id: 'dateRange',
        type: 'date-range' as const,
        label: 'Date Range',
        width: 'third' as const
      }
    ],
    quickFilters: [
      {
        id: 'thisMonth',
        label: 'This Month',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'lastMonth',
        label: 'Last Month',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'inflows',
        label: 'Inflows Only',
        icon: '📈',
        action: () => {},
        isActive: false
      },
      {
        id: 'outflows',
        label: 'Outflows Only',
        icon: '📉',
        action: () => {},
        isActive: false
      }
    ]
  },

  // Customers Page
  customers: {
    filters: [
      {
        id: 'search',
        type: 'search' as const,
        label: 'Search Customers',
        placeholder: 'Search by name, GSTIN, email, phone...',
        width: 'full' as const
      },
      {
        id: 'status',
        type: 'dropdown' as const,
        label: 'Status',
        options: commonFilterOptions.status,
        width: 'third' as const
      },
      {
        id: 'paymentStatus',
        type: 'dropdown' as const,
        label: 'Payment Status',
        options: commonFilterOptions.paymentStatus,
        width: 'third' as const
      },
      {
        id: 'dateRange',
        type: 'date-range' as const,
        label: 'Date Range',
        width: 'third' as const
      }
    ],
    quickFilters: [
      {
        id: 'recent',
        label: 'Recent Additions',
        icon: '🆕',
        action: () => {},
        isActive: false
      },
      {
        id: 'highValue',
        label: 'High Value Customers',
        icon: '💰',
        action: () => {},
        isActive: false
      },
      {
        id: 'outstanding',
        label: 'With Outstanding Balance',
        icon: '⚠️',
        action: () => {},
        isActive: false
      }
    ]
  },

  // Vendors Page
  vendors: {
    filters: [
      {
        id: 'search',
        type: 'search' as const,
        label: 'Search Vendors',
        placeholder: 'Search by name, GSTIN, email, phone...',
        width: 'full' as const
      },
      {
        id: 'status',
        type: 'dropdown' as const,
        label: 'Status',
        options: commonFilterOptions.status,
        width: 'third' as const
      },
      {
        id: 'paymentStatus',
        type: 'dropdown' as const,
        label: 'Payment Status',
        options: commonFilterOptions.paymentStatus,
        width: 'third' as const
      },
      {
        id: 'dateRange',
        type: 'date-range' as const,
        label: 'Date Range',
        width: 'third' as const
      }
    ],
    quickFilters: [
      {
        id: 'recent',
        label: 'Recent Additions',
        icon: '🆕',
        action: () => {},
        isActive: false
      },
      {
        id: 'highValue',
        label: 'High Value Vendors',
        icon: '💰',
        action: () => {},
        isActive: false
      },
      {
        id: 'pending',
        label: 'Pending Payments',
        icon: '💳',
        action: () => {},
        isActive: false
      }
    ]
  },

  // Stock History Page
  stockHistory: {
    filters: [
      {
        id: 'product',
        type: 'dropdown' as const,
        label: 'Product',
        placeholder: 'Select product...',
        width: 'third' as const
      },
      {
        id: 'category',
        type: 'dropdown' as const,
        label: 'Product Category',
        placeholder: 'Select category...',
        width: 'third' as const
      },
      {
        id: 'supplier',
        type: 'dropdown' as const,
        label: 'Supplier',
        placeholder: 'Select supplier...',
        width: 'third' as const
      },
      {
        id: 'stockLevel',
        type: 'stock-level' as const,
        label: 'Stock Level',
        width: 'third' as const
      },
      {
        id: 'entryType',
        type: 'dropdown' as const,
        label: 'Entry Type',
        options: commonFilterOptions.entryTypes,
        width: 'third' as const
      },
      {
        id: 'dateRange',
        type: 'date-range' as const,
        label: 'Date Range',
        width: 'half' as const
      }
    ],
    quickFilters: [
      {
        id: 'currentFY',
        label: 'Current FY',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'lastFY',
        label: 'Last FY',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'incoming',
        label: 'Incoming Only',
        icon: '📥',
        action: () => {},
        isActive: false
      },
      {
        id: 'outgoing',
        label: 'Outgoing Only',
        icon: '📤',
        action: () => {},
        isActive: false
      },
      {
        id: 'lowStock',
        label: 'Low Stock',
        icon: '⚠️',
        action: () => {},
        isActive: false
      }
    ]
  },

  // GST Reports Page
  gstReports: {
    filters: [
      {
        id: 'periodType',
        type: 'dropdown' as const,
        label: 'Period Type',
        options: [
          { value: 'month', label: 'Month' },
          { value: 'quarter', label: 'Quarter' },
          { value: 'year', label: 'Year' }
        ],
        width: 'third' as const
      },
      {
        id: 'periodValue',
        type: 'dropdown' as const,
        label: 'Period Value',
        placeholder: 'Select period...',
        width: 'third' as const
      },
      {
        id: 'reportType',
        type: 'dropdown' as const,
        label: 'Report Type',
        options: [
          { value: 'gstr1', label: 'GSTR-1' },
          { value: 'gstr2', label: 'GSTR-2' },
          { value: 'gstr3b', label: 'GSTR-3B' }
        ],
        width: 'third' as const
      }
    ],
    quickFilters: [
      {
        id: 'lastMonth',
        label: 'Last Month',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'lastQuarter',
        label: 'Last Quarter',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'currentFY',
        label: 'Current FY',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'lastFY',
        label: 'Last FY',
        icon: '📅',
        action: () => {},
        isActive: false
      }
    ]
  },

  // Financial Reports Page
  financialReports: {
    filters: [
      {
        id: 'reportType',
        type: 'dropdown' as const,
        label: 'Report Type',
        options: [
          { value: 'profit_loss', label: 'Profit & Loss' },
          { value: 'balance_sheet', label: 'Balance Sheet' },
          { value: 'cash_flow', label: 'Cash Flow' }
        ],
        width: 'third' as const
      },
      {
        id: 'dateRange',
        type: 'date-range' as const,
        label: 'Date Range',
        width: 'half' as const
      }
    ],
    quickFilters: [
      {
        id: 'currentYear',
        label: 'Current Year',
        icon: '📅',
        action: () => {},
        isActive: false
      },
      {
        id: 'lastYear',
        label: 'Last Year',
        icon: '📅',
        action: () => {},
        isActive: false
      }
    ]
  }
}

// Helper function to get filter config for a specific screen
export function getFilterConfig(screenName: keyof typeof filterConfigs) {
  return filterConfigs[screenName]
}

// Helper function to get common filter options
export function getCommonFilterOptions() {
  return commonFilterOptions
}
