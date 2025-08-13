import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { apiListCustomers, apiListVendors, apiCreateParty, apiUpdateParty, apiToggleParty } from '../lib/api';
import { useAuth } from '../modules/AuthContext';
import { createApiErrorHandler } from '../lib/apiUtils';
import { formStyles, getSectionHeaderColor } from '../utils/formStyles';
export function Parties({ type = 'customer', mode = 'manage' }) {
    const { forceLogout } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const handleApiError = createApiErrorHandler(forceLogout);
    const [activeTab, setActiveTab] = useState(type === 'vendor' ? 'vendors' : 'customers');
    const [customers, setCustomers] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingParty, setEditingParty] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showInactive, setShowInactive] = useState(false);
    const [formData, setFormData] = useState({
        type: type,
        name: '',
        contact_person: '',
        contact_number: '',
        email: '',
        gstin: '',
        gst_registration_status: 'GST not registered',
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_state: '',
        billing_country: 'India',
        billing_pincode: '',
        shipping_address_line1: '',
        shipping_address_line2: '',
        shipping_city: '',
        shipping_state: '',
        shipping_country: '',
        shipping_pincode: '',
        notes: ''
    });
    // Load editing party data when in edit mode
    useEffect(() => {
        if (mode === 'edit' && id) {
            loadEditingParty();
        }
    }, [mode, id]);
    const loadEditingParty = async () => {
        try {
            setLoading(true);
            const allParties = [...customers, ...vendors];
            const party = allParties.find(p => p.id === parseInt(id));
            if (party) {
                setEditingParty(party);
                setFormData({
                    type: party.type,
                    name: party.name,
                    contact_person: party.contact_person || '',
                    contact_number: party.contact_number || '',
                    email: party.email || '',
                    gstin: party.gstin || '',
                    gst_registration_status: party.gst_registration_status,
                    billing_address_line1: party.billing_address_line1 || '',
                    billing_address_line2: party.billing_address_line2 || '',
                    billing_city: party.billing_city || '',
                    billing_state: party.billing_state || '',
                    billing_country: party.billing_country || 'India',
                    billing_pincode: party.billing_pincode || '',
                    shipping_address_line1: party.shipping_address_line1 || '',
                    shipping_address_line2: party.shipping_address_line2 || '',
                    shipping_city: party.shipping_city || '',
                    shipping_state: party.shipping_state || '',
                    shipping_country: party.shipping_country || '',
                    shipping_pincode: party.shipping_pincode || '',
                    notes: party.notes || ''
                });
            }
        }
        catch (err) {
            console.error('Failed to load party:', err);
            handleApiError(err);
            setError('Failed to load party');
        }
        finally {
            setLoading(false);
        }
    };
    const loadParties = async () => {
        try {
            setLoading(true);
            setError(null);
            const [customersData, vendorsData] = await Promise.all([
                apiListCustomers(searchTerm, showInactive),
                apiListVendors(searchTerm, showInactive)
            ]);
            setCustomers(customersData);
            setVendors(vendorsData);
        }
        catch (err) {
            console.error('Failed to load parties:', err);
            handleApiError(err);
            setError('Failed to load parties');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (mode === 'manage') {
            loadParties();
            setCurrentPage(1); // Reset to first page when search changes
        }
    }, [searchTerm, showInactive, mode]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            const payload = {
                type: formData.type,
                name: formData.name,
                contact_person: formData.contact_person || null,
                contact_number: formData.contact_number || null,
                email: formData.email || null,
                gstin: formData.gstin || null,
                gst_registration_status: formData.gst_registration_status,
                billing_address_line1: formData.billing_address_line1,
                billing_address_line2: formData.billing_address_line2 || null,
                billing_city: formData.billing_city,
                billing_state: formData.billing_state,
                billing_country: formData.billing_country,
                billing_pincode: formData.billing_pincode || null,
                shipping_address_line1: formData.shipping_address_line1 || null,
                shipping_address_line2: formData.shipping_address_line2 || null,
                shipping_city: formData.shipping_city || null,
                shipping_state: formData.shipping_state || null,
                shipping_country: formData.shipping_country || null,
                shipping_pincode: formData.shipping_pincode || null,
                notes: formData.notes || null
            };
            if (mode === 'edit' && editingParty) {
                await apiUpdateParty(editingParty.id, payload);
            }
            else {
                await apiCreateParty(payload);
            }
            // Navigate back to manage view
            navigate(`/${formData.type === 'vendor' ? 'vendors' : 'customers'}`);
        }
        catch (err) {
            console.error('Failed to save party:', err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleToggleParty = async (party) => {
        try {
            await apiToggleParty(party.id);
            loadParties();
        }
        catch (err) {
            console.error('Failed to toggle party:', err);
            handleApiError(err);
            setError('Failed to toggle party status');
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    // Render form for add/edit modes
    if (mode === 'add' || mode === 'edit') {
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
                            }, children: mode === 'add' ? `Add New ${type === 'vendor' ? 'Vendor' : 'Customer'}` : `Edit ${type === 'vendor' ? 'Vendor' : 'Customer'}` }), _jsxs(Button, { onClick: () => navigate(`/${type === 'vendor' ? 'vendors' : 'customers'}`), variant: "secondary", style: {
                                padding: '10px 16px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }, children: ["\u2190 Back to ", type === 'vendor' ? 'Vendors' : 'Customers'] })] }), error && _jsx(ErrorMessage, { message: error }), _jsxs("form", { onSubmit: handleSubmit, style: formStyles.form, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor(0) }, children: "Party Type" }), _jsx("div", { style: formStyles.grid2Col, children: _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Party Type *" }), _jsxs("select", { value: formData.type, onChange: (e) => handleInputChange('type', e.target.value), style: formStyles.select, required: true, children: [_jsx("option", { value: "customer", children: "Customer" }), _jsx("option", { value: "vendor", children: "Vendor" })] })] }) })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor(1) }, children: "Basic Information" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Contact Person" }), _jsx("input", { type: "text", value: formData.contact_person, onChange: (e) => handleInputChange('contact_person', e.target.value), style: formStyles.input })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Contact Number" }), _jsx("input", { type: "tel", value: formData.contact_number, onChange: (e) => handleInputChange('contact_number', e.target.value), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Email" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => handleInputChange('email', e.target.value), style: formStyles.input })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor(2) }, children: "GST Information" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "GSTIN" }), _jsx("input", { type: "text", value: formData.gstin, onChange: (e) => handleInputChange('gstin', e.target.value), style: formStyles.input, placeholder: "22AAAAA0000A1Z5" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "GST Registration Status" }), _jsxs("select", { value: formData.gst_registration_status, onChange: (e) => handleInputChange('gst_registration_status', e.target.value), style: formStyles.select, children: [_jsx("option", { value: "GST not registered", children: "GST not registered" }), _jsx("option", { value: "GST registered", children: "GST registered" }), _jsx("option", { value: "Composition scheme", children: "Composition scheme" })] })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor(3) }, children: "Billing Address" }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Address Line 1 *" }), _jsx("input", { type: "text", value: formData.billing_address_line1, onChange: (e) => handleInputChange('billing_address_line1', e.target.value), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Address Line 2" }), _jsx("input", { type: "text", value: formData.billing_address_line2, onChange: (e) => handleInputChange('billing_address_line2', e.target.value), style: formStyles.input })] }), _jsxs("div", { style: formStyles.grid3Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "City *" }), _jsx("input", { type: "text", value: formData.billing_city, onChange: (e) => handleInputChange('billing_city', e.target.value), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "State *" }), _jsx("input", { type: "text", value: formData.billing_state, onChange: (e) => handleInputChange('billing_state', e.target.value), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Pincode *" }), _jsx("input", { type: "text", value: formData.billing_pincode, onChange: (e) => handleInputChange('billing_pincode', e.target.value), style: formStyles.input, required: true })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Country" }), _jsx("input", { type: "text", value: formData.billing_country, onChange: (e) => handleInputChange('billing_country', e.target.value), style: formStyles.input })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor(4) }, children: "Shipping Address" }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Address Line 1" }), _jsx("input", { type: "text", value: formData.shipping_address_line1, onChange: (e) => handleInputChange('shipping_address_line1', e.target.value), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Address Line 2" }), _jsx("input", { type: "text", value: formData.shipping_address_line2, onChange: (e) => handleInputChange('shipping_address_line2', e.target.value), style: formStyles.input })] }), _jsxs("div", { style: formStyles.grid3Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "City" }), _jsx("input", { type: "text", value: formData.shipping_city, onChange: (e) => handleInputChange('shipping_city', e.target.value), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "State" }), _jsx("input", { type: "text", value: formData.shipping_state, onChange: (e) => handleInputChange('shipping_state', e.target.value), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Pincode" }), _jsx("input", { type: "text", value: formData.shipping_pincode, onChange: (e) => handleInputChange('shipping_pincode', e.target.value), style: formStyles.input })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Country" }), _jsx("input", { type: "text", value: formData.shipping_country, onChange: (e) => handleInputChange('shipping_country', e.target.value), style: formStyles.input })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor(5) }, children: "Other Details" }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => handleInputChange('notes', e.target.value), style: formStyles.textarea, rows: 3, placeholder: "Additional notes about this party..." })] })] }), _jsxs("div", { style: formStyles.formActions, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate(`/${type === 'vendor' ? 'vendors' : 'customers'}`), disabled: loading, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Saving...' : (mode === 'add' ? 'Add Party' : 'Update Party') })] })] })] }));
    }
    // Render manage mode (existing list view)
    const currentParties = activeTab === 'customers' ? customers : vendors;
    // Sorting function
    const sortedParties = [...currentParties].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (aValue === null || aValue === undefined)
            return 1;
        if (bValue === null || bValue === undefined)
            return -1;
        const comparison = String(aValue).localeCompare(String(bValue));
        return sortDirection === 'asc' ? comparison : -comparison;
    });
    // Pagination
    const totalPages = Math.ceil(sortedParties.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedParties = sortedParties.slice(startIndex, startIndex + itemsPerPage);
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortDirection('asc');
        }
    };
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };
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
                        }, children: "Parties" }), _jsxs("div", { style: {
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                        }, children: [_jsx(Button, { onClick: () => navigate('/customers/add'), variant: "primary", style: {
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }, children: "\uD83D\uDC64 Add Customer" }), _jsx(Button, { onClick: () => navigate('/vendors/add'), variant: "primary", style: {
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }, children: "\uD83C\uDFE2 Add Vendor" })] })] }), error && _jsx(ErrorMessage, { message: error }), _jsxs("div", { style: {
                    display: 'flex',
                    borderBottom: '1px solid #e9ecef',
                    marginBottom: '20px'
                }, children: [_jsxs("button", { onClick: () => setActiveTab('customers'), style: {
                            padding: '12px 24px',
                            border: 'none',
                            backgroundColor: activeTab === 'customers' ? '#007bff' : 'transparent',
                            color: activeTab === 'customers' ? '#fff' : '#6c757d',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: activeTab === 'customers' ? '600' : '400',
                            borderBottom: activeTab === 'customers' ? '2px solid #007bff' : 'none'
                        }, children: ["Customers (", customers.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('vendors'), style: {
                            padding: '12px 24px',
                            border: 'none',
                            backgroundColor: activeTab === 'vendors' ? '#007bff' : 'transparent',
                            color: activeTab === 'vendors' ? '#fff' : '#6c757d',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: activeTab === 'vendors' ? '600' : '400',
                            borderBottom: activeTab === 'vendors' ? '2px solid #007bff' : 'none'
                        }, children: ["Vendors (", vendors.length, ")"] })] }), _jsx("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    gap: '16px',
                    flexWrap: 'wrap'
                }, children: _jsxs("div", { style: { display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }, children: [_jsx("input", { type: "text", placeholder: `Search ${activeTab}...`, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: {
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                minWidth: '200px'
                            } }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }, children: [_jsx("input", { type: "checkbox", checked: showInactive, onChange: (e) => setShowInactive(e.target.checked) }), "Show Inactive"] })] }) }), loading ? (_jsx("div", { style: { textAlign: 'center', padding: '40px' }, children: _jsx("div", { children: "Loading..." }) })) : (_jsx("div", { style: {
                    backgroundColor: '#fff',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Name" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Contact" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Email" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "GSTIN" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Status" }), _jsx("th", { style: { padding: '12px', textAlign: 'center', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Actions" })] }) }), _jsx("tbody", { children: paginatedParties.map((party) => (_jsxs("tr", { style: { borderBottom: '1px solid #f8f9fa' }, children: [_jsxs("td", { style: { padding: '12px', fontSize: '14px' }, children: [_jsx("div", { style: { fontWeight: '500' }, children: party.name }), _jsx("div", { style: { fontSize: '12px', color: '#6c757d' }, children: party.type === 'customer' ? 'Customer' : 'Vendor' })] }), _jsxs("td", { style: { padding: '12px', fontSize: '14px' }, children: [_jsx("div", { children: party.contact_person || '-' }), _jsx("div", { style: { fontSize: '12px', color: '#6c757d' }, children: party.contact_number || '-' })] }), _jsx("td", { style: { padding: '12px', fontSize: '14px' }, children: party.email || '-' }), _jsx("td", { style: { padding: '12px', fontSize: '14px' }, children: party.gstin || '-' }), _jsx("td", { style: { padding: '12px', fontSize: '14px' }, children: _jsx("span", { style: {
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                backgroundColor: party.is_active ? '#d4edda' : '#f8d7da',
                                                color: party.is_active ? '#155724' : '#721c24'
                                            }, children: party.is_active ? 'Active' : 'Inactive' }) }), _jsx("td", { style: { padding: '12px', textAlign: 'center' }, children: _jsxs("div", { style: { display: 'flex', gap: '8px', justifyContent: 'center' }, children: [_jsx(Button, { onClick: () => navigate(`/${party.type === 'vendor' ? 'vendors' : 'customers'}/edit/${party.id}`), variant: "secondary", style: { padding: '6px 12px', fontSize: '12px' }, children: "Edit" }), _jsx(Button, { onClick: () => handleToggleParty(party), variant: party.is_active ? "danger" : "success", style: { padding: '6px 12px', fontSize: '12px' }, children: party.is_active ? 'Deactivate' : 'Activate' })] }) })] }, party.id))) })] }) })), totalPages > 1 && (_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '20px'
                }, children: [_jsx(Button, { onClick: () => setCurrentPage(prev => Math.max(1, prev - 1)), disabled: currentPage === 1, variant: "secondary", style: { padding: '8px 12px', fontSize: '14px' }, children: "Previous" }), _jsxs("span", { style: { fontSize: '14px', color: '#6c757d' }, children: ["Page ", currentPage, " of ", totalPages] }), _jsx(Button, { onClick: () => setCurrentPage(prev => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, variant: "secondary", style: { padding: '8px 12px', fontSize: '14px' }, children: "Next" })] }))] }));
}
