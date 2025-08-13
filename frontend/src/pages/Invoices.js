import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiDeleteInvoice, apiEmailInvoice, apiAddPayment, apiGetInvoices } from '../lib/api';
import { useAuth } from '../modules/AuthContext';
import { createApiErrorHandler } from '../lib/apiUtils';
import { Button } from '../components/Button';
import { ComprehensiveInvoiceForm } from '../components/ComprehensiveInvoiceForm';
import { formStyles, getSectionHeaderColor } from '../utils/formStyles';
export function Invoices({ mode = 'manage' }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, forceLogout } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    // Create error handler that will automatically log out on 401 errors
    const handleApiError = createApiErrorHandler(forceLogout);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total_count: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    // Form states for different modes
    const [paymentForm, setPaymentForm] = useState({
        payment_amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        payment_notes: ''
    });
    const [emailForm, setEmailForm] = useState({
        email_address: '',
        subject: '',
        message: ''
    });
    useEffect(() => {
        if (mode === 'manage') {
            loadInvoices();
        }
        else if (mode === 'edit' && id) {
            loadInvoice(parseInt(id));
        }
        else if (mode === 'payments' && id) {
            loadInvoice(parseInt(id));
        }
        else if (mode === 'add-payment' && id) {
            loadInvoice(parseInt(id));
        }
        else if (mode === 'email' && id) {
            loadInvoice(parseInt(id));
        }
        else if (mode === 'print' && id) {
            loadInvoice(parseInt(id));
        }
        else if (mode === 'add') {
            setLoading(false);
        }
    }, [mode, id]);
    const loadInvoices = async () => {
        try {
            setLoading(true);
            const data = await apiGetInvoices(undefined, undefined, pagination.page, pagination.limit);
            setInvoices(data.invoices);
            setPagination(data.pagination);
        }
        catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const loadInvoice = async (invoiceId) => {
        try {
            setLoading(true);
            const data = await apiGetInvoices(undefined, undefined, 1, 1000); // Get all invoices to find the specific one
            const invoice = data.invoices.find(inv => inv.id === invoiceId);
            if (invoice) {
                setCurrentInvoice(invoice);
                // Pre-populate forms based on mode
                if (mode === 'add-payment') {
                    setPaymentForm({
                        payment_amount: invoice.grand_total,
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_method: 'Cash',
                        payment_notes: ''
                    });
                }
                else if (mode === 'email') {
                    setEmailForm({
                        email_address: '',
                        subject: `Invoice ${invoice.invoice_no}`,
                        message: `Please find attached invoice ${invoice.invoice_no} for ₹${invoice.grand_total.toFixed(2)}.`
                    });
                }
            }
            else {
                setError('Invoice not found');
            }
        }
        catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this invoice?'))
            return;
        try {
            await apiDeleteInvoice(id);
            loadInvoices();
        }
        catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
    };
    const handleAddPayment = async (e) => {
        e.preventDefault();
        if (!currentInvoice || paymentForm.payment_amount <= 0)
            return;
        try {
            setLoading(true);
            await apiAddPayment(currentInvoice.id, {
                payment_amount: paymentForm.payment_amount,
                payment_date: paymentForm.payment_date,
                payment_method: paymentForm.payment_method,
                account_head: 'Cash',
                reference_number: `PAY-${Date.now()}`,
                notes: paymentForm.payment_notes
            });
            navigate('/invoices');
        }
        catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!currentInvoice || !emailForm.email_address)
            return;
        try {
            setLoading(true);
            await apiEmailInvoice(currentInvoice.id, emailForm.email_address);
            navigate('/invoices');
        }
        catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handlePrint = async () => {
        if (!currentInvoice)
            return;
        try {
            // TODO: Implement actual PDF generation and printing
            alert('PDF generation and printing functionality will be implemented here.');
            navigate('/invoices');
        }
        catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
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
                    }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: mode === 'add' ? 'Add New Invoice' : 'Edit Invoice' }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/invoices'), children: "\u2190 Back to Invoices" })] }), _jsx(ComprehensiveInvoiceForm, { onSuccess: () => navigate('/invoices'), onCancel: () => navigate('/invoices') })] }));
    }
    if (mode === 'payments') {
        return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e9ecef'
                    }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: "Invoice Payments" }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/invoices'), children: "\u2190 Back to Invoices" })] }), _jsx("div", { style: {
                        padding: '20px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa'
                    }, children: _jsx("p", { style: { margin: '0', color: '#6c757d' }, children: "Invoice payment management functionality will be implemented here." }) })] }));
    }
    if (mode === 'add-payment') {
        if (loading) {
            return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Loading..." }) }));
        }
        if (!currentInvoice) {
            return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Invoice not found" }) }));
        }
        return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e9ecef'
                    }, children: [_jsxs("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: ["Add Payment for Invoice ", currentInvoice.invoice_no] }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/invoices'), children: "\u2190 Back to Invoices" })] }), error && (_jsx("div", { style: {
                        padding: '12px 16px',
                        marginBottom: '20px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '6px',
                        color: '#c33',
                        fontSize: '14px'
                    }, children: error })), _jsxs("form", { onSubmit: handleAddPayment, style: { display: 'flex', flexDirection: 'column', gap: '24px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('basic') }, children: "\uD83D\uDCC4 Invoice Details" }), _jsxs("div", { style: formStyles.grid, children: [_jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Invoice Number" }), _jsx("input", { type: "text", value: currentInvoice.invoice_no, disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Customer" }), _jsx("input", { type: "text", value: currentInvoice.customer_name, disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Invoice Amount" }), _jsx("input", { type: "text", value: `₹${currentInvoice.grand_total.toFixed(2)}`, disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Due Date" }), _jsx("input", { type: "text", value: new Date(currentInvoice.due_date).toLocaleDateString(), disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('payment') }, children: "\uD83D\uDCB0 Payment Details" }), _jsxs("div", { style: formStyles.grid, children: [_jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Amount *" }), _jsx("input", { type: "number", step: "0.01", min: "0", max: currentInvoice.grand_total, value: paymentForm.payment_amount, onChange: (e) => setPaymentForm(prev => ({ ...prev, payment_amount: Number(e.target.value) })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Date *" }), _jsx("input", { type: "date", value: paymentForm.payment_date, onChange: (e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value })), style: formStyles.input, required: true })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Method *" }), _jsxs("select", { value: paymentForm.payment_method, onChange: (e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value })), style: formStyles.select, required: true, children: [_jsx("option", { value: "Cash", children: "Cash" }), _jsx("option", { value: "Bank Transfer", children: "Bank Transfer" }), _jsx("option", { value: "Cheque", children: "Cheque" }), _jsx("option", { value: "UPI", children: "UPI" }), _jsx("option", { value: "Credit Card", children: "Credit Card" }), _jsx("option", { value: "Debit Card", children: "Debit Card" })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Notes (Optional)" }), _jsx("textarea", { value: paymentForm.payment_notes, onChange: (e) => setPaymentForm(prev => ({ ...prev, payment_notes: e.target.value })), maxLength: 200, rows: 3, style: formStyles.textarea, placeholder: "Enter payment notes (max 200 characters)" }), _jsxs("div", { style: { fontSize: '12px', color: '#6c757d', marginTop: '4px' }, children: [paymentForm.payment_notes.length, "/200 characters"] })] })] })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate('/invoices'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading || paymentForm.payment_amount <= 0 || paymentForm.payment_amount > currentInvoice.grand_total, children: loading ? 'Adding Payment...' : 'Add Payment' })] })] })] }));
    }
    if (mode === 'email') {
        if (loading) {
            return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Loading..." }) }));
        }
        if (!currentInvoice) {
            return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Invoice not found" }) }));
        }
        return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e9ecef'
                    }, children: [_jsxs("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: ["Send Invoice ", currentInvoice.invoice_no, " via Email"] }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/invoices'), children: "\u2190 Back to Invoices" })] }), error && (_jsx("div", { style: {
                        padding: '12px 16px',
                        marginBottom: '20px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '6px',
                        color: '#c33',
                        fontSize: '14px'
                    }, children: error })), _jsxs("form", { onSubmit: handleSendEmail, style: { display: 'flex', flexDirection: 'column', gap: '24px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('basic') }, children: "\uD83D\uDCC4 Invoice Details" }), _jsxs("div", { style: formStyles.grid, children: [_jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Invoice Number" }), _jsx("input", { type: "text", value: currentInvoice.invoice_no, disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Customer" }), _jsx("input", { type: "text", value: currentInvoice.customer_name, disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Invoice Amount" }), _jsx("input", { type: "text", value: `₹${currentInvoice.grand_total.toFixed(2)}`, disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Due Date" }), _jsx("input", { type: "text", value: new Date(currentInvoice.due_date).toLocaleDateString(), disabled: true, style: { ...formStyles.input, backgroundColor: '#f8f9fa' } })] })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('other') }, children: "\uD83D\uDCE7 Email Details" }), _jsxs("div", { style: formStyles.grid, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Email Address *" }), _jsx("input", { type: "email", value: emailForm.email_address, onChange: (e) => setEmailForm(prev => ({ ...prev, email_address: e.target.value })), style: formStyles.input, placeholder: "Enter customer email address", required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Subject *" }), _jsx("input", { type: "text", value: emailForm.subject, onChange: (e) => setEmailForm(prev => ({ ...prev, subject: e.target.value })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Message *" }), _jsx("textarea", { value: emailForm.message, onChange: (e) => setEmailForm(prev => ({ ...prev, message: e.target.value })), rows: 6, style: formStyles.textarea, placeholder: "Enter email message", required: true })] }), _jsxs("div", { style: {
                                                padding: '12px',
                                                backgroundColor: '#e7f3ff',
                                                borderRadius: '6px',
                                                border: '1px solid #b3d9ff'
                                            }, children: [_jsx("div", { style: { fontSize: '14px', fontWeight: '500', marginBottom: '4px' }, children: "\uD83D\uDCCE Attachment" }), _jsx("div", { style: { fontSize: '12px', color: '#6c757d' }, children: "Invoice PDF will be automatically attached to this email." })] })] })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate('/invoices'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading || !emailForm.email_address || !emailForm.subject || !emailForm.message, children: loading ? 'Sending Email...' : 'Send Email' })] })] })] }));
    }
    if (mode === 'print') {
        if (loading) {
            return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Loading..." }) }));
        }
        if (!currentInvoice) {
            return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Invoice not found" }) }));
        }
        return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e9ecef'
                    }, children: [_jsxs("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: ["Print Invoice ", currentInvoice.invoice_no] }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/invoices'), children: "\u2190 Back to Invoices" })] }), error && (_jsx("div", { style: {
                        padding: '12px 16px',
                        marginBottom: '20px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '6px',
                        color: '#c33',
                        fontSize: '14px'
                    }, children: error })), _jsxs("div", { style: {
                        padding: '24px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        backgroundColor: 'white'
                    }, children: [_jsx("h2", { style: { marginBottom: '20px', color: '#2c3e50' }, children: "Invoice Preview" }), _jsxs("div", { style: { display: 'grid', gap: '16px', marginBottom: '24px' }, children: [_jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Invoice Number" }), _jsx("div", { style: { padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }, children: currentInvoice.invoice_no })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Customer" }), _jsx("div", { style: { padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }, children: currentInvoice.customer_name })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Amount" }), _jsxs("div", { style: { padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }, children: ["\u20B9", currentInvoice.grand_total.toFixed(2)] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Date" }), _jsx("div", { style: { padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }, children: new Date(currentInvoice.date).toLocaleDateString() })] })] })] }), _jsxs("div", { style: {
                                padding: '12px',
                                backgroundColor: '#e7f3ff',
                                borderRadius: '6px',
                                border: '1px solid #b3d9ff',
                                marginBottom: '24px'
                            }, children: [_jsx("div", { style: { fontSize: '14px', fontWeight: '500', marginBottom: '4px' }, children: "\uD83D\uDCC4 PDF Generation" }), _jsx("div", { style: { fontSize: '12px', color: '#6c757d' }, children: "The invoice will be generated as a PDF using a standard Indian GST invoice template." })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' }, children: [_jsx(Button, { variant: "secondary", onClick: () => navigate('/invoices'), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: handlePrint, children: "Generate PDF & Print" })] })] })] }));
    }
    // Manage Invoices Mode
    if (loading) {
        return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Loading..." }) }));
    }
    // Filter invoices
    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = invoice.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e9ecef'
                }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: "Manage Invoices" }), _jsx(Button, { variant: "primary", onClick: () => navigate('/invoices/add'), children: "Create Invoice" })] }), error && (_jsx("div", { style: {
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
                }, children: [_jsx("div", { style: { flex: 1 }, children: _jsx("input", { type: "text", placeholder: "Search invoices by number or customer...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: {
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
                            }, children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "Draft", children: "Draft" }), _jsx("option", { value: "Sent", children: "Sent" }), _jsx("option", { value: "Paid", children: "Paid" }), _jsx("option", { value: "Overdue", children: "Overdue" })] }) })] }), _jsx("div", { style: {
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Invoice No" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Customer" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Date" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Due Date" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Amount" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Status" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Actions" })] }) }), _jsx("tbody", { children: filteredInvoices.map(invoice => (_jsxs("tr", { style: {
                                    borderBottom: '1px solid #e9ecef',
                                    backgroundColor: 'white'
                                }, children: [_jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: invoice.invoice_no }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: invoice.customer_name }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: new Date(invoice.date).toLocaleDateString() }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: new Date(invoice.due_date).toLocaleDateString() }), _jsxs("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: ["\u20B9", invoice.grand_total.toFixed(2)] }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: _jsx("span", { style: {
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                backgroundColor: invoice.status === 'paid' ? '#d4edda' : '#fff3cd',
                                                color: invoice.status === 'paid' ? '#155724' : '#856404'
                                            }, children: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) }) }), _jsx("td", { style: { padding: '12px' }, children: _jsxs("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' }, children: [_jsx(Button, { variant: "secondary", onClick: () => navigate(`/invoices/edit/${invoice.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Edit" }), _jsx(Button, { variant: "secondary", onClick: () => navigate(`/invoices/print/${invoice.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Print" }), _jsx(Button, { variant: "secondary", onClick: () => navigate(`/invoices/add-payment/${invoice.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Add Payment" }), _jsx(Button, { variant: "secondary", onClick: () => navigate(`/invoices/email/${invoice.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Email" }), _jsx(Button, { variant: "secondary", onClick: () => handleDelete(invoice.id), style: { fontSize: '14px', padding: '6px 12px' }, children: "Delete" })] }) })] }, invoice.id))) })] }) }), pagination.total_pages > 1 && (_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '24px',
                    padding: '16px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsxs("div", { style: { fontSize: '14px', color: '#495057' }, children: ["Showing ", ((pagination.page - 1) * pagination.limit) + 1, " to ", Math.min(pagination.page * pagination.limit, pagination.total_count), " of ", pagination.total_count, " invoices"] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setPagination(prev => ({ ...prev, page: prev.page - 1 })), disabled: !pagination.has_prev, children: "Previous" }), _jsxs("span", { style: {
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '14px',
                                    color: '#495057',
                                    fontWeight: '500'
                                }, children: ["Page ", pagination.page, " of ", pagination.total_pages] }), _jsx(Button, { variant: "secondary", onClick: () => setPagination(prev => ({ ...prev, page: prev.page + 1 })), disabled: !pagination.has_next, children: "Next" })] })] })), filteredInvoices.length === 0 && !loading && (_jsxs("div", { style: {
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6c757d',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsx("div", { style: { fontSize: '18px', marginBottom: '8px', fontWeight: '500' }, children: "No invoices available" }), _jsx("div", { style: { fontSize: '14px' }, children: "Create your first invoice to get started" })] }))] }));
}
