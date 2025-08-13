import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../modules/AuthContext';
import { apiListExpenses, apiGetExpense, apiDeleteExpense, apiListParties } from '../lib/api';
import { Button } from '../components/Button';
import { ExpenseForm } from '../components/ExpenseForm';
export function Expenses({ mode = 'manage' }) {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [expenses, setExpenses] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [expenseTypeFilter, setExpenseTypeFilter] = useState('');
    const [currentExpense, setCurrentExpense] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    // Expense categories and types
    const expenseCategories = [
        { value: 'Direct/COGS', label: 'Direct/COGS' },
        { value: 'Indirect/Operating', label: 'Indirect/Operating' }
    ];
    const expenseTypes = [
        { value: 'Salary', label: 'Salary', category: 'Indirect/Operating' },
        { value: 'Rent', label: 'Rent', category: 'Indirect/Operating' },
        { value: 'Electricity', label: 'Electricity', category: 'Indirect/Operating' },
        { value: 'Raw Materials', label: 'Raw Materials', category: 'Direct/COGS' },
        { value: 'Packing Materials', label: 'Packing Materials', category: 'Direct/COGS' },
        { value: 'Freight', label: 'Freight', category: 'Direct/COGS' },
        { value: 'Office Supplies', label: 'Office Supplies', category: 'Indirect/Operating' },
        { value: 'Marketing', label: 'Marketing', category: 'Indirect/Operating' },
        { value: 'Professional Fees', label: 'Professional Fees', category: 'Indirect/Operating' },
        { value: 'Bank Charges', label: 'Bank Charges', category: 'Indirect/Operating' }
    ];
    const paymentMethods = ['Cash', 'Bank', 'UPI', 'Cheque', 'NEFT', 'RTGS', 'IMPS'];
    const accountHeads = ['Cash', 'Bank', 'Funds', 'Credit Card'];
    useEffect(() => {
        if (!token)
            return;
        if (mode === 'manage') {
            loadExpenses();
        }
        else if (mode === 'edit' && id) {
            loadExpense();
        }
        loadVendors();
    }, [token, mode, id]);
    const loadExpenses = async () => {
        try {
            setLoading(true);
            setError(null);
            const expensesData = await apiListExpenses(searchTerm, categoryFilter, expenseTypeFilter);
            setExpenses(expensesData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load expenses');
        }
        finally {
            setLoading(false);
        }
    };
    const loadExpense = async () => {
        if (!id)
            return;
        try {
            setLoading(true);
            setError(null);
            const expenseData = await apiGetExpense(parseInt(id));
            setCurrentExpense(expenseData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load expense');
        }
        finally {
            setLoading(false);
        }
    };
    const loadVendors = async () => {
        try {
            const vendorsData = await apiListParties();
            setVendors(vendorsData.filter(p => p.type === 'vendor'));
        }
        catch (err) {
            console.error('Failed to load vendors:', err);
        }
    };
    useEffect(() => {
        if (mode === 'manage') {
            loadExpenses();
            setCurrentPage(1);
        }
    }, [searchTerm, categoryFilter, expenseTypeFilter]);
    const handleDeleteExpense = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?'))
            return;
        try {
            setLoading(true);
            setError(null);
            await apiDeleteExpense(id);
            loadExpenses();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete expense');
        }
        finally {
            setLoading(false);
        }
    };
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.expense_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || expense.category === categoryFilter;
        const matchesType = !expenseTypeFilter || expense.expense_type === expenseTypeFilter;
        return matchesSearch && matchesCategory && matchesType;
    });
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);
    if (loading && expenses.length === 0) {
        return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Loading..." }) }));
    }
    // Render different modes
    if (mode === 'add' || mode === 'edit') {
        return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e9ecef'
                    }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: mode === 'add' ? 'Add Expense' : 'Edit Expense' }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/expenses'), children: "Back to Expenses" })] }), error && (_jsx("div", { style: {
                        padding: '12px 16px',
                        marginBottom: '20px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '6px',
                        color: '#c33',
                        fontSize: '14px'
                    }, children: error })), _jsx(ExpenseForm, { expenseId: mode === 'edit' ? currentExpense?.id : undefined, onSuccess: () => navigate('/expenses'), onCancel: () => navigate('/expenses') })] }));
    }
    // Manage Expenses Mode
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e9ecef'
                }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: "Manage Expenses" }), _jsx(Button, { variant: "primary", onClick: () => navigate('/expenses/add'), children: "Add Expense" })] }), _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    gap: '16px'
                }, children: [_jsx("div", { style: { flex: 1 }, children: _jsx("input", { type: "text", placeholder: "Search expenses by description, type, or category...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: {
                                width: '100%',
                                padding: '10px 16px',
                                border: '1px solid #ced4da',
                                borderRadius: '6px',
                                fontSize: '14px'
                            } }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsxs("select", { value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), style: {
                                    padding: '10px 16px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: 'white'
                                }, children: [_jsx("option", { value: "", children: "All Categories" }), expenseCategories.map(cat => (_jsx("option", { value: cat.value, children: cat.label }, cat.value)))] }), _jsxs("select", { value: expenseTypeFilter, onChange: (e) => setExpenseTypeFilter(e.target.value), style: {
                                    padding: '10px 16px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: 'white'
                                }, children: [_jsx("option", { value: "", children: "All Types" }), expenseTypes.map(type => (_jsx("option", { value: type.value, children: type.label }, type.value)))] })] })] }), error && (_jsx("div", { style: {
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
                }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Date" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Type" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Category" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Description" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Amount" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Payment Method" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Actions" })] }) }), _jsx("tbody", { children: paginatedExpenses.map(expense => (_jsxs("tr", { style: {
                                    borderBottom: '1px solid #e9ecef',
                                    backgroundColor: 'white'
                                }, children: [_jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: new Date(expense.expense_date).toLocaleDateString() }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: expense.expense_type }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: expense.category }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: expense.description }), _jsxs("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: ["\u20B9", expense.amount.toFixed(2)] }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: expense.payment_method }), _jsx("td", { style: { padding: '12px' }, children: _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", onClick: () => navigate(`/expenses/edit/${expense.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Edit" }), _jsx(Button, { variant: "secondary", onClick: () => handleDeleteExpense(expense.id), style: { fontSize: '14px', padding: '6px 12px' }, children: "Delete" })] }) })] }, expense.id))) })] }) }), totalPages > 1 && (_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '24px',
                    padding: '16px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsxs("div", { style: { fontSize: '14px', color: '#495057' }, children: ["Showing ", startIndex + 1, " to ", Math.min(endIndex, filteredExpenses.length), " of ", filteredExpenses.length, " expenses"] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, children: "Previous" }), _jsxs("span", { style: {
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '14px',
                                    color: '#495057',
                                    fontWeight: '500'
                                }, children: ["Page ", currentPage, " of ", totalPages] }), _jsx(Button, { variant: "secondary", onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)), disabled: currentPage === totalPages, children: "Next" })] })] })), filteredExpenses.length === 0 && !loading && (_jsxs("div", { style: {
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6c757d',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsx("div", { style: { fontSize: '18px', marginBottom: '8px', fontWeight: '500' }, children: "No expenses available" }), _jsx("div", { style: { fontSize: '14px' }, children: "Add your first expense to get started" })] }))] }));
}
