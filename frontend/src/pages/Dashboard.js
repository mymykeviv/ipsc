import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/AuthContext';
import { apiGetCashflowSummary } from '../lib/api';
import { createApiErrorHandler } from '../lib/apiUtils';
import { Button } from '../components/Button';
export function Dashboard() {
    const { token, forceLogout } = useAuth();
    const navigate = useNavigate();
    const [cashflowData, setCashflowData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Create error handler that will automatically log out on 401 errors
    const handleApiError = createApiErrorHandler(forceLogout);
    const [periodType, setPeriodType] = useState('month');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].substring(0, 7) + '-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    useEffect(() => {
        if (!token)
            return;
        loadCashflowData();
    }, [token, startDate, endDate]);
    const loadCashflowData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiGetCashflowSummary(startDate, endDate);
            setCashflowData(data);
        }
        catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };
    const getNetCashflowColor = (amount) => {
        return amount >= 0 ? '#28a745' : '#dc3545';
    };
    const getPeriodLabel = () => {
        if (periodType === 'month') {
            return `${new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        }
        else if (periodType === 'quarter') {
            const quarter = Math.ceil((new Date(startDate).getMonth() + 1) / 3);
            return `Q${quarter} ${new Date(startDate).getFullYear()}`;
        }
        else if (periodType === 'year') {
            return `${new Date(startDate).getFullYear()}`;
        }
        else {
            return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
        }
    };
    const handlePeriodChange = (type) => {
        setPeriodType(type);
        const now = new Date();
        if (type === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
        }
        else if (type === 'quarter') {
            const quarter = Math.ceil((now.getMonth() + 1) / 3);
            const startMonth = (quarter - 1) * 3;
            const start = new Date(now.getFullYear(), startMonth, 1);
            const end = new Date(now.getFullYear(), startMonth + 3, 0);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
        }
        else if (type === 'year') {
            const start = new Date(now.getFullYear(), 0, 1);
            const end = new Date(now.getFullYear(), 11, 31);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
        }
    };
    if (loading && !cashflowData) {
        return (_jsxs("div", { style: { padding: '20px' }, children: [_jsx("h1", { children: "Dashboard" }), _jsx("div", { children: "Loading..." })] }));
    }
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e9ecef'
                }, children: [_jsx("h1", { style: {
                            margin: '0',
                            fontSize: '28px',
                            fontWeight: '600',
                            color: '#2c3e50'
                        }, children: "Dashboard - Cashflow Summary" }), _jsxs("div", { style: {
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                        }, children: [_jsx(Button, { onClick: () => navigate('/expenses/add'), variant: "primary", style: {
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }, children: "\uD83D\uDCB0 Add Expense" }), _jsx(Button, { onClick: () => navigate('/invoices/add'), variant: "primary", style: {
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }, children: "\uD83D\uDCC4 New Invoice" }), _jsx(Button, { onClick: () => navigate('/purchases/add'), variant: "primary", style: {
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }, children: "\uD83D\uDCE6 New Purchase" }), _jsx(Button, { onClick: () => navigate('/products'), variant: "primary", style: {
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }, children: "\uD83C\uDFF7\uFE0F Manage Products" })] })] }), error && (_jsx("div", { style: {
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '6px',
                    color: '#c33',
                    fontSize: '14px'
                }, children: error })), cashflowData ? (_jsxs("div", { style: { display: 'grid', gap: '24px' }, children: [_jsxs("div", { style: {
                            padding: '20px',
                            borderBottom: '1px solid #e9ecef'
                        }, children: [_jsxs("div", { style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '20px'
                                }, children: [_jsx("h3", { style: { margin: '0', color: '#495057', fontSize: '20px', fontWeight: '600' }, children: "\uD83D\uDCCA Income & Expenses Summary" }), _jsxs("div", { style: { display: 'flex', gap: '12px', alignItems: 'center' }, children: [_jsxs("div", { style: {
                                                    padding: '6px 12px',
                                                    backgroundColor: '#e7f3ff',
                                                    borderRadius: '6px',
                                                    border: '1px solid #b3d9ff',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#0056b3'
                                                }, children: ["Period: ", getPeriodLabel()] }), _jsxs("select", { value: periodType, onChange: (e) => handlePeriodChange(e.target.value), style: {
                                                    padding: '6px 12px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    backgroundColor: 'white'
                                                }, children: [_jsx("option", { value: "month", children: "This Month" }), _jsx("option", { value: "quarter", children: "This Quarter" }), _jsx("option", { value: "year", children: "This Year" }), _jsx("option", { value: "custom", children: "Custom Range" })] }), periodType === 'custom' && (_jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'center' }, children: [_jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), style: {
                                                            padding: '6px 8px',
                                                            border: '1px solid #ced4da',
                                                            borderRadius: '6px',
                                                            fontSize: '14px'
                                                        } }), _jsx("span", { style: { fontSize: '12px' }, children: "to" }), _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), style: {
                                                            padding: '6px 8px',
                                                            border: '1px solid #ced4da',
                                                            borderRadius: '6px',
                                                            fontSize: '14px'
                                                        } })] })), _jsx("button", { onClick: loadCashflowData, disabled: loading, style: {
                                                    padding: '6px 12px',
                                                    backgroundColor: '#007bff',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: loading ? 'not-allowed' : 'pointer',
                                                    fontSize: '14px',
                                                    opacity: loading ? 0.6 : 1
                                                }, children: loading ? 'Refreshing...' : '🔄' })] })] }), _jsxs("div", { style: { display: 'grid', gap: '20px' }, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '20% 40% 40%', gap: '20px' }, children: [_jsxs("div", { style: {
                                                    textAlign: 'center',
                                                    padding: '20px',
                                                    border: '2px solid #e9ecef',
                                                    borderRadius: '8px'
                                                }, children: [_jsx("h2", { style: { margin: '0 0 12px 0', color: '#6c757d', fontSize: '18px', fontWeight: '600' }, children: "Net Cashflow" }), _jsx("div", { style: {
                                                            fontSize: '28px',
                                                            fontWeight: 'bold',
                                                            color: getNetCashflowColor(cashflowData?.cashflow?.net_cashflow || 0),
                                                            marginBottom: '8px'
                                                        }, children: formatCurrency(cashflowData?.cashflow?.net_cashflow || 0) }), _jsx("div", { style: {
                                                            fontSize: '14px',
                                                            color: '#6c757d',
                                                            fontWeight: '500'
                                                        }, children: (cashflowData?.cashflow?.net_cashflow || 0) >= 0 ? 'Positive Cashflow' : 'Negative Cashflow' })] }), _jsxs("div", { style: {
                                                    padding: '20px',
                                                    border: '2px solid #d4edda',
                                                    borderRadius: '8px'
                                                }, children: [_jsx("h4", { style: { margin: '0 0 16px 0', color: '#155724', fontSize: '18px', textAlign: 'center', fontWeight: '600' }, children: "\uD83D\uDCB0 Income" }), _jsxs("div", { style: { display: 'grid', gap: '12px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '16px' }, children: [_jsx("span", { children: "Invoice Amount:" }), _jsx("strong", { children: formatCurrency(cashflowData?.income?.total_invoice_amount || 0) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '16px' }, children: [_jsx("span", { children: "Payments Received:" }), _jsx("strong", { children: formatCurrency(cashflowData?.income?.total_payments_received || 0) })] }), _jsx("hr", { style: { border: 'none', borderTop: '2px solid #d4edda', margin: '12px 0' } }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }, children: [_jsx("span", { children: "Total Income:" }), _jsx("span", { style: { color: '#28a745' }, children: formatCurrency(cashflowData?.cashflow?.cash_inflow || 0) })] })] })] }), _jsxs("div", { style: {
                                                    padding: '20px',
                                                    border: '2px solid #f8d7da',
                                                    borderRadius: '8px'
                                                }, children: [_jsx("h4", { style: { margin: '0 0 16px 0', color: '#721c24', fontSize: '18px', textAlign: 'center', fontWeight: '600' }, children: "\uD83D\uDCB8 Expenses" }), _jsxs("div", { style: { display: 'grid', gap: '12px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '16px' }, children: [_jsx("span", { children: "Direct Expenses:" }), _jsx("strong", { children: formatCurrency(cashflowData?.expenses?.total_expenses || 0) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '16px' }, children: [_jsx("span", { children: "Purchase Payments:" }), _jsx("strong", { children: formatCurrency(cashflowData?.expenses?.total_purchase_payments || 0) })] }), _jsx("hr", { style: { border: 'none', borderTop: '2px solid #f8d7da', margin: '12px 0' } }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }, children: [_jsx("span", { children: "Total Outflow:" }), _jsx("span", { style: { color: '#dc3545' }, children: formatCurrency(cashflowData?.cashflow?.cash_outflow || 0) })] })] })] })] }), _jsxs("div", { style: {
                                            padding: '20px',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px'
                                        }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }, children: "Detailed Breakdown" }), _jsx("div", { style: { display: 'grid', gap: '16px' }, children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { style: {
                                                                padding: '16px',
                                                                border: '1px solid #e9ecef',
                                                                borderRadius: '6px'
                                                            }, children: [_jsx("div", { style: { fontSize: '14px', color: '#6c757d', marginBottom: '8px', fontWeight: '500' }, children: "Invoice Amount" }), _jsx("div", { style: { fontSize: '18px', fontWeight: 'bold' }, children: formatCurrency(cashflowData?.income?.total_invoice_amount || 0) })] }), _jsxs("div", { style: {
                                                                padding: '16px',
                                                                border: '1px solid #e9ecef',
                                                                borderRadius: '6px'
                                                            }, children: [_jsx("div", { style: { fontSize: '14px', color: '#6c757d', marginBottom: '8px', fontWeight: '500' }, children: "Payments Received" }), _jsx("div", { style: { fontSize: '18px', fontWeight: 'bold', color: '#28a745' }, children: formatCurrency(cashflowData?.income?.total_payments_received || 0) })] }), _jsxs("div", { style: {
                                                                padding: '16px',
                                                                border: '1px solid #e9ecef',
                                                                borderRadius: '6px'
                                                            }, children: [_jsx("div", { style: { fontSize: '14px', color: '#6c757d', marginBottom: '8px', fontWeight: '500' }, children: "Direct Expenses" }), _jsx("div", { style: { fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }, children: formatCurrency(cashflowData?.expenses?.total_expenses || 0) })] }), _jsxs("div", { style: {
                                                                padding: '16px',
                                                                border: '1px solid #e9ecef',
                                                                borderRadius: '6px'
                                                            }, children: [_jsx("div", { style: { fontSize: '14px', color: '#6c757d', marginBottom: '8px', fontWeight: '500' }, children: "Purchase Payments" }), _jsx("div", { style: { fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }, children: formatCurrency(cashflowData?.expenses?.total_purchase_payments || 0) })] })] }) })] })] })] }), _jsxs("div", { style: {
                            padding: '20px',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px'
                        }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', color: '#495057', fontSize: '20px', fontWeight: '600' }, children: "\uD83D\uDCCA Cashflow Analysis" }), _jsxs("div", { style: { display: 'grid', gap: '12px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px' }, children: [_jsx("span", { children: "Cash Inflow:" }), _jsx("span", { style: { fontWeight: 'bold', color: '#28a745', fontSize: '18px' }, children: formatCurrency(cashflowData?.cashflow?.cash_inflow || 0) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px' }, children: [_jsx("span", { children: "Cash Outflow:" }), _jsx("span", { style: { fontWeight: 'bold', color: '#dc3545', fontSize: '18px' }, children: formatCurrency(cashflowData?.cashflow?.cash_outflow || 0) })] }), _jsx("hr", { style: { border: 'none', borderTop: '2px solid #e9ecef', margin: '12px 0' } }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' }, children: [_jsx("span", { children: "Net Cashflow:" }), _jsx("span", { style: { color: getNetCashflowColor(cashflowData?.cashflow?.net_cashflow || 0), fontSize: '20px' }, children: formatCurrency(cashflowData?.cashflow?.net_cashflow || 0) })] })] })] })] })) : (_jsxs("div", { style: {
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6c757d',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsx("div", { style: { fontSize: '18px', marginBottom: '8px', fontWeight: '500' }, children: "No cashflow data available" }), _jsx("div", { style: { fontSize: '14px' }, children: "Click the refresh button to load data" })] }))] }));
}
