import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAuth } from '../modules/AuthContext';
import { apiGetCashflowTransactions } from '../lib/api';
import { Button } from '../components/Button';
export function Cashflow() {
    const { token } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);
    useEffect(() => {
        if (!token)
            return;
        loadTransactions();
    }, [token]);
    const loadTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiGetCashflowTransactions();
            setTransactions(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load transactions');
        }
        finally {
            setLoading(false);
        }
    };
    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.payment_method.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        return matchesSearch && matchesType;
    });
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };
    if (loading && transactions.length === 0) {
        return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Loading..." }) }));
    }
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsx("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e9ecef'
                }, children: _jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: "Cashflow Transactions" }) }), _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    gap: '16px'
                }, children: [_jsx("div", { style: { flex: 1 }, children: _jsx("input", { type: "text", placeholder: "Search transactions by description, reference, or payment method...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: {
                                width: '100%',
                                padding: '10px 16px',
                                border: '1px solid #ced4da',
                                borderRadius: '6px',
                                fontSize: '14px'
                            } }) }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: _jsxs("select", { value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), style: {
                                padding: '10px 16px',
                                border: '1px solid #ced4da',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white'
                            }, children: [_jsx("option", { value: "all", children: "All Transactions" }), _jsx("option", { value: "inflow", children: "Cash Inflow" }), _jsx("option", { value: "outflow", children: "Cash Outflow" })] }) })] }), error && (_jsx("div", { style: {
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '6px',
                    color: '#c33',
                    fontSize: '14px'
                }, children: error })), _jsx("div", { style: {
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Date" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Type" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Description" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Reference" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Payment Method" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Amount" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Account Head" })] }) }), _jsx("tbody", { children: paginatedTransactions.map(transaction => (_jsxs("tr", { style: {
                                    borderBottom: '1px solid #e9ecef',
                                    backgroundColor: 'white'
                                }, children: [_jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: new Date(transaction.transaction_date).toLocaleDateString() }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: _jsx("span", { style: {
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                backgroundColor: transaction.type === 'inflow' ? '#d4edda' : '#f8d7da',
                                                color: transaction.type === 'inflow' ? '#155724' : '#721c24'
                                            }, children: transaction.type === 'inflow' ? 'Cash Inflow' : 'Cash Outflow' }) }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: transaction.description }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: transaction.reference_number || '-' }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: transaction.payment_method }), _jsxs("td", { style: {
                                            padding: '12px',
                                            borderRight: '1px solid #e9ecef',
                                            color: transaction.type === 'inflow' ? '#28a745' : '#dc3545',
                                            fontWeight: '600'
                                        }, children: [transaction.type === 'inflow' ? '+' : '-', formatCurrency(transaction.amount)] }), _jsx("td", { style: { padding: '12px' }, children: transaction.account_head })] }, transaction.id))) })] }) }), totalPages > 1 && (_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '24px',
                    padding: '16px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsxs("div", { style: { fontSize: '14px', color: '#495057' }, children: ["Showing ", startIndex + 1, " to ", Math.min(endIndex, filteredTransactions.length), " of ", filteredTransactions.length, " transactions"] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, children: "Previous" }), _jsxs("span", { style: {
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '14px',
                                    color: '#495057',
                                    fontWeight: '500'
                                }, children: ["Page ", currentPage, " of ", totalPages] }), _jsx(Button, { variant: "secondary", onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)), disabled: currentPage === totalPages, children: "Next" })] })] })), filteredTransactions.length === 0 && !loading && (_jsxs("div", { style: {
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6c757d',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsx("div", { style: { fontSize: '18px', marginBottom: '8px', fontWeight: '500' }, children: "No transactions available" }), _jsx("div", { style: { fontSize: '14px' }, children: "Transactions will appear here as you create invoices and payments" })] }))] }));
}
