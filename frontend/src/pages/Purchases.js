import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/AuthContext';
import { createApiErrorHandler } from '../lib/apiUtils';
import { apiListPurchases, apiDeletePurchase, apiListParties, apiGetProducts } from '../lib/api';
import { Button } from '../components/Button';
import { PurchaseForm } from '../components/PurchaseForm';
import { formStyles, getSectionHeaderColor } from '../utils/formStyles';
export function Purchases({ mode = 'manage' }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, forceLogout } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [currentPurchase, setCurrentPurchase] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    // Create error handler that will automatically log out on 401 errors
    const handleApiError = createApiErrorHandler(forceLogout);
    // Form state for payment
    const [paymentForm, setPaymentForm] = useState({
        payment_amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        payment_notes: ''
    });
    useEffect(() => {
        if (mode === 'manage') {
            loadPurchases();
        }
        else if (mode === 'edit' && id) {
            loadPurchase(parseInt(id));
        }
        else if (mode === 'add-payment' && id) {
            loadPurchase(parseInt(id));
        }
        else if (mode === 'add') {
            loadVendorsAndProducts();
            setLoading(false);
        }
    }, [mode, id]);
    const loadPurchases = async () => {
        try {
            setLoading(true);
            setError(null);
            const purchasesData = await apiListPurchases(searchTerm, statusFilter);
            setPurchases(purchasesData);
        }
        catch (err) {
            handleApiError(err);
            setError('Failed to load purchases');
        }
        finally {
            setLoading(false);
        }
    };
    const loadPurchase = async (purchaseId) => {
        try {
            setLoading(true);
            const data = await apiListPurchases('', ''); // Get all purchases to find the specific one
            const purchase = data.find(p => p.id === purchaseId);
            if (purchase) {
                setCurrentPurchase(purchase);
                if (mode === 'add-payment') {
                    setPaymentForm({
                        payment_amount: purchase.grand_total,
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_method: 'Cash',
                        payment_notes: ''
                    });
                }
            }
            else {
                setError('Purchase not found');
            }
        }
        catch (err) {
            handleApiError(err);
            setError('Failed to load purchase');
        }
        finally {
            setLoading(false);
        }
    };
    const loadVendorsAndProducts = async () => {
        try {
            const [vendorsData, productsData] = await Promise.all([
                apiListParties(),
                apiGetProducts()
            ]);
            setVendors(vendorsData.filter(p => p.type === 'vendor'));
            setProducts(productsData);
        }
        catch (err) {
            handleApiError(err);
        }
    };
    const handleDeletePurchase = async (id) => {
        if (!confirm('Are you sure you want to delete this purchase?'))
            return;
        try {
            setLoading(true);
            setError(null);
            await apiDeletePurchase(id);
            loadPurchases();
        }
        catch (err) {
            handleApiError(err);
            setError('Failed to delete purchase');
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddPayment = async (e) => {
        e.preventDefault();
        if (!currentPurchase || paymentForm.payment_amount <= 0)
            return;
        try {
            setLoading(true);
            // TODO: Implement purchase payment API
            alert('Purchase payment functionality will be implemented here.');
            navigate('/purchases');
        }
        catch (err) {
            handleApiError(err);
            setError('Failed to add payment');
        }
        finally {
            setLoading(false);
        }
    };
    // Render different content based on mode
    if (mode === 'add' || mode === 'edit') {
        return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e9ecef'
                    }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: mode === 'add' ? 'Add New Purchase' : 'Edit Purchase' }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/purchases'), children: "\u2190 Back to Purchases" })] }), _jsx(PurchaseForm, { onSuccess: () => navigate('/purchases'), onCancel: () => navigate('/purchases') })] }));
    }
    if (mode === 'payments') {
        return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e9ecef'
                    }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: "Purchase Payments" }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/purchases'), children: "\u2190 Back to Purchases" })] }), _jsx("div", { style: {
                        padding: '20px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa'
                    }, children: _jsx("p", { style: { margin: '0', color: '#6c757d' }, children: "Purchase payment management functionality will be implemented here." }) })] }));
    }
    if (mode === 'add-payment') {
        if (loading) {
            return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Loading..." }) }));
        }
        if (!currentPurchase) {
            return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Purchase not found" }) }));
        }
        return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e9ecef'
                    }, children: [_jsxs("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: ["Add Payment for Purchase ", currentPurchase.purchase_no] }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/purchases'), children: "\u2190 Back to Purchases" })] }), error && (_jsx("div", { style: {
                        padding: '12px 16px',
                        marginBottom: '20px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '6px',
                        color: '#c33',
                        fontSize: '14px'
                    }, children: error })), _jsxs("form", { onSubmit: handleAddPayment, style: { display: 'flex', flexDirection: 'column', gap: '24px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('basic') }, children: "\uD83D\uDCE6 Purchase Details" }), _jsxs("div", { style: formStyles.grid, children: [_jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Purchase Number" }), _jsx("input", { type: "text", value: currentPurchase.purchase_no, disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Vendor" }), _jsx("input", { type: "text", value: currentPurchase.vendor_name, disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Purchase Amount" }), _jsx("input", { type: "text", value: `₹${currentPurchase.grand_total.toFixed(2)}`, disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Due Date" }), _jsx("input", { type: "text", value: new Date(currentPurchase.due_date).toLocaleDateString(), disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('payment') }, children: "\uD83D\uDCB0 Payment Details" }), _jsxs("div", { style: formStyles.grid, children: [_jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Amount *" }), _jsx("input", { type: "number", step: "0.01", min: "0", max: currentPurchase.grand_total, value: paymentForm.payment_amount, onChange: (e) => setPaymentForm(prev => ({ ...prev, payment_amount: Number(e.target.value) })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Date *" }), _jsx("input", { type: "date", value: paymentForm.payment_date, onChange: (e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value })), style: formStyles.input, required: true })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Method *" }), _jsxs("select", { value: paymentForm.payment_method, onChange: (e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value })), style: formStyles.select, required: true, children: [_jsx("option", { value: "Cash", children: "Cash" }), _jsx("option", { value: "Bank Transfer", children: "Bank Transfer" }), _jsx("option", { value: "Cheque", children: "Cheque" }), _jsx("option", { value: "UPI", children: "UPI" }), _jsx("option", { value: "Credit Card", children: "Credit Card" }), _jsx("option", { value: "Debit Card", children: "Debit Card" })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Notes (Optional)" }), _jsx("textarea", { value: paymentForm.payment_notes, onChange: (e) => setPaymentForm(prev => ({ ...prev, payment_notes: e.target.value })), maxLength: 200, rows: 3, style: formStyles.textarea, placeholder: "Enter payment notes (max 200 characters)" }), _jsxs("div", { style: { fontSize: '12px', color: '#6c757d', marginTop: '4px' }, children: [paymentForm.payment_notes.length, "/200 characters"] })] })] })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate('/purchases'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading || paymentForm.payment_amount <= 0 || paymentForm.payment_amount > currentPurchase.grand_total, children: loading ? 'Adding Payment...' : 'Add Payment' })] })] })] }));
    }
    // Manage Purchases Mode
    if (loading) {
        return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Loading..." }) }));
    }
    // Filter purchases
    const filteredPurchases = purchases.filter(purchase => {
        const matchesSearch = purchase.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || purchase.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    // Pagination
    const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex);
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e9ecef'
                }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: "Manage Purchases" }), _jsx(Button, { variant: "primary", onClick: () => navigate('/purchases/add'), children: "Create Purchase" })] }), error && (_jsx("div", { style: {
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '6px',
                    color: '#c33',
                    fontSize: '14px'
                }, children: error })), _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    gap: '16px'
                }, children: [_jsx("div", { style: { flex: 1 }, children: _jsx("input", { type: "text", placeholder: "Search purchases by number or vendor...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: {
                                width: '100%',
                                padding: '10px 16px',
                                border: '1px solid #ced4da',
                                borderRadius: '6px',
                                fontSize: '14px'
                            } }) }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), style: {
                                padding: '10px 16px',
                                border: '1px solid #ced4da',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white'
                            }, children: [_jsx("option", { value: "", children: "All Status" }), _jsx("option", { value: "Draft", children: "Draft" }), _jsx("option", { value: "Pending", children: "Pending" }), _jsx("option", { value: "Paid", children: "Paid" }), _jsx("option", { value: "Overdue", children: "Overdue" })] }) })] }), _jsx("div", { style: {
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Purchase No" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Vendor" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Date" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Due Date" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Amount" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Status" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Actions" })] }) }), _jsx("tbody", { children: paginatedPurchases.map(purchase => (_jsxs("tr", { style: {
                                    borderBottom: '1px solid #e9ecef',
                                    backgroundColor: 'white'
                                }, children: [_jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: purchase.purchase_no }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: purchase.vendor_name }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: new Date(purchase.date).toLocaleDateString() }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: new Date(purchase.due_date).toLocaleDateString() }), _jsxs("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: ["\u20B9", purchase.grand_total.toFixed(2)] }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: _jsx("span", { style: {
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                backgroundColor: purchase.status === 'paid' ? '#d4edda' : '#fff3cd',
                                                color: purchase.status === 'paid' ? '#155724' : '#856404'
                                            }, children: purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1) }) }), _jsx("td", { style: { padding: '12px' }, children: _jsxs("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' }, children: [_jsx(Button, { variant: "secondary", onClick: () => navigate(`/purchases/edit/${purchase.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Edit" }), _jsx(Button, { variant: "secondary", onClick: () => navigate(`/purchases/add-payment/${purchase.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Add Payment" }), _jsx(Button, { variant: "secondary", onClick: () => handleDeletePurchase(purchase.id), style: { fontSize: '14px', padding: '6px 12px' }, children: "Delete" })] }) })] }, purchase.id))) })] }) }), totalPages > 1 && (_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '24px',
                    padding: '16px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsxs("div", { style: { fontSize: '14px', color: '#495057' }, children: ["Showing ", startIndex + 1, " to ", Math.min(endIndex, filteredPurchases.length), " of ", filteredPurchases.length, " purchases"] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, children: "Previous" }), _jsxs("span", { style: {
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '14px',
                                    color: '#495057',
                                    fontWeight: '500'
                                }, children: ["Page ", currentPage, " of ", totalPages] }), _jsx(Button, { variant: "secondary", onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)), disabled: currentPage === totalPages, children: "Next" })] })] })), paginatedPurchases.length === 0 && !loading && (_jsxs("div", { style: {
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6c757d',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsx("div", { style: { fontSize: '18px', marginBottom: '8px', fontWeight: '500' }, children: "No purchases available" }), _jsx("div", { style: { fontSize: '14px' }, children: "Create your first purchase to get started" })] }))] }));
}
