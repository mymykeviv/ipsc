# Filter System Documentation

## Overview

The IPSC application now includes a comprehensive filtering system that provides advanced data exploration capabilities across all major screens. This system consists of reusable components and backend API enhancements that work together to provide a consistent and powerful filtering experience.

## Architecture

### Frontend Components

#### 1. DateFilter Component
- **Location**: `frontend/src/components/DateFilter.tsx`
- **Purpose**: Provides advanced date range filtering with preset options and custom date ranges
- **Features**:
  - Preset options: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, This Quarter, Last Quarter, This Year, Last Year
  - Custom date range picker
  - Consistent styling with the application theme

#### 2. FilterDropdown Component
- **Location**: `frontend/src/components/FilterDropdown.tsx`
- **Purpose**: Reusable dropdown component with search functionality and single/multiple selection support
- **Features**:
  - Searchable options
  - Single and multiple selection modes
  - Categorized options support
  - Consistent styling and behavior

#### 3. FilterBar Component
- **Location**: `frontend/src/components/FilterBar.tsx`
- **Purpose**: Container component that organizes multiple filters with clear all functionality
- **Features**:
  - Flexible layout for multiple filters
  - Clear all filters functionality
  - Consistent styling and spacing

### Backend API Enhancements

#### Products API (`/api/products`)
**New Filter Parameters:**
- `search`: Text search across name, description, and SKU
- `category`: Filter by product category
- `item_type`: Filter by item type (tradable, consumable, manufactured)
- `gst_rate`: Filter by GST rate
- `supplier`: Filter by supplier name
- `stock_level`: Filter by stock level (low_stock, out_of_stock, in_stock)
- `price_min`/`price_max`: Filter by price range
- `status`: Filter by active/inactive status

#### Invoices API (`/api/invoices`)
**New Filter Parameters:**
- `search`: Text search across invoice number and customer name
- `status`: Filter by invoice status
- `customer_id`: Filter by specific customer
- `date_from`/`date_to`: Filter by date range
- `amount_min`/`amount_max`: Filter by amount range
- `gst_type`: Filter by GST type (cgst_sgst, igst)
- `payment_status`: Filter by payment status (paid, partially_paid, unpaid, overdue)

#### Cashflow Transactions API (`/api/cashflow/transactions`)
**New Filter Parameters:**
- `search`: Text search across description, reference, and payment method
- `type_filter`: Filter by transaction type (inflow, outflow)
- `transaction_type`: Filter by specific transaction type
- `payment_method`: Filter by payment method
- `account_head`: Filter by account head
- `amount_min`/`amount_max`: Filter by amount range
- `start_date`/`end_date`: Filter by date range

## Implementation Details

### Filter State Management

Each page maintains its own filter state using React useState hooks:

```typescript
const [searchTerm, setSearchTerm] = useState('')
const [categoryFilter, setCategoryFilter] = useState('all')
const [dateFilter, setDateFilter] = useState('all')
// ... other filter states
```

### Real-time Filter Updates

Filters automatically trigger data reloads when changed:

```typescript
useEffect(() => {
  if (mode === 'manage') {
    loadData()
  }
}, [searchTerm, categoryFilter, dateFilter, /* other filters */])
```

### URL Parameter Building

Filters are converted to URL parameters for API calls:

```typescript
const params = new URLSearchParams()
if (searchTerm) params.append('search', searchTerm)
if (categoryFilter !== 'all') params.append('category', categoryFilter)
// ... other parameters
```

## Usage Examples

### Products Page Filters

```typescript
<FilterBar onClearAll={() => {
  setSearchTerm('')
  setCategoryFilter('all')
  setItemTypeFilter('all')
  // ... reset all filters
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span>Search:</span>
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search products..."
    />
  </div>
  
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span>Category:</span>
    <FilterDropdown
      value={categoryFilter}
      onChange={(value) => setCategoryFilter(Array.isArray(value) ? value[0] || 'all' : value)}
      options={[
        { value: 'all', label: 'All Categories' },
        { value: 'Electronics', label: 'Electronics' },
        // ... more options
      ]}
      placeholder="Select category"
    />
  </div>
  
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span>Date:</span>
    <DateFilter
      value={dateFilter}
      onChange={setDateFilter}
      placeholder="Select date range"
    />
  </div>
</FilterBar>
```

### Date Filter Usage

The DateFilter component supports both preset options and custom date ranges:

```typescript
// Preset options
<DateFilter value="thisMonth" onChange={setDateFilter} />

// Custom date range
<DateFilter value="custom:2024-01-01:2024-12-31" onChange={setDateFilter} />
```

## Filter Options by Screen

### Products Page
- **Search**: Name, SKU, description, supplier
- **Category**: Electronics, Office Supplies, Raw Materials, Finished Goods, Consumables
- **Item Type**: Tradable, Consumable, Manufactured
- **GST Rate**: 0%, 5%, 12%, 18%, 28%
- **Stock Level**: Low Stock (< 10), Out of Stock, In Stock
- **Price Range**: ₹0-100, ₹100-500, ₹500-1,000, ₹1,000-5,000, ₹5,000+
- **Date**: All preset options and custom ranges

### Invoices Page
- **Search**: Invoice number, customer name
- **Status**: Draft, Sent, Partial Payment, Paid, Overdue
- **Payment Status**: Paid, Partially Paid, Unpaid, Overdue
- **Amount Range**: ₹0-1,000, ₹1,000-5,000, ₹5,000-10,000, ₹10,000-50,000, ₹50,000+
- **GST Type**: CGST + SGST, IGST
- **Date**: All preset options and custom ranges

### Cashflow Transactions Page
- **Search**: Description, reference number, payment method
- **Type**: All Transactions, Cash Inflow, Cash Outflow
- **Transaction Type**: Invoice Payment, Purchase Payment, Expense, Income
- **Payment Method**: Cash, Bank Transfer, Cheque, UPI, Credit Card
- **Account Head**: Cash, Bank, Funds
- **Amount Range**: ₹0-1,000, ₹1,000-5,000, ₹5,000-10,000, ₹10,000-50,000, ₹50,000+
- **Date**: All preset options and custom ranges

## Performance Considerations

### Backend Optimization
- Database indexes on frequently filtered fields
- Efficient query building with conditional filters
- Pagination support for large datasets

### Frontend Optimization
- Debounced search inputs to prevent excessive API calls
- Efficient filter state management
- Optimized re-renders using React best practices

## Future Enhancements

### Planned Features
1. **Filter Presets**: Save and load custom filter combinations
2. **Advanced Search**: Full-text search with relevance scoring
3. **Filter Analytics**: Track most used filters for optimization
4. **Export Filtered Data**: Export filtered results to CSV/Excel
5. **Filter History**: Remember user's last used filters

### Technical Improvements
1. **Server-side Pagination**: Implement proper pagination for all filtered results
2. **Caching**: Add Redis caching for frequently accessed filtered data
3. **Search Indexing**: Implement Elasticsearch for advanced search capabilities
4. **Filter Validation**: Add client-side validation for filter parameters

## Troubleshooting

### Common Issues

1. **Filters not updating data**
   - Check if the useEffect dependency array includes all filter states
   - Verify that the API endpoint supports the filter parameters
   - Check browser console for API errors

2. **Date filter not working**
   - Ensure date format is YYYY-MM-DD
   - Check if the backend properly handles date range queries
   - Verify timezone handling

3. **Performance issues with large datasets**
   - Implement pagination if not already present
   - Add database indexes on filtered columns
   - Consider implementing virtual scrolling for large tables

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG_FILTERS=true
```

This will log filter state changes and API calls to the console for debugging purposes.
