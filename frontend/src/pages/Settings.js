import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/AuthContext';
import { createApiErrorHandler } from '../lib/apiUtils';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { formStyles, getSectionHeaderColor } from '../utils/formStyles';
export function Settings({ section = 'company' }) {
    const navigate = useNavigate();
    const { forceLogout } = useAuth();
    const handleApiError = createApiErrorHandler(forceLogout);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    // Company Settings
    const [companySettings, setCompanySettings] = useState({
        company_name: '',
        company_address: '',
        company_email: '',
        company_phone: '',
        company_website: '',
        gst_number: '',
        pan_number: '',
        logo_url: ''
    });
    // Tax Settings
    const [taxSettings, setTaxSettings] = useState({
        gst_rate: '18',
        cgst_rate: '9',
        sgst_rate: '9',
        igst_rate: '18',
        utgst_rate: '18',
        cess_rate: '0',
        tax_registration_number: ''
    });
    // User Settings
    const [userSettings, setUserSettings] = useState({
        username: '',
        email: '',
        role: 'user',
        is_active: true
    });
    // Email Settings
    const [emailSettings, setEmailSettings] = useState({
        smtp_server: '',
        smtp_port: '587',
        smtp_username: '',
        smtp_password: '',
        from_email: '',
        from_name: '',
        email_provider: 'gmail'
    });
    // Invoice Settings
    const [invoiceSettings, setInvoiceSettings] = useState({
        invoice_prefix: 'INV',
        invoice_number_format: 'INV-{YEAR}-{NUMBER}',
        default_currency: 'INR',
        payment_terms: 'Net 30',
        invoice_template: 'detailed',
        auto_numbering: true
    });
    useEffect(() => {
        loadSettings();
    }, [section]);
    const loadSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            // TODO: Implement API calls to load settings
            // For now, use default values
        }
        catch (err) {
            console.error('Failed to load settings:', err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCompanySubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            // TODO: Implement API call to save company settings
            setSuccess('Company settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        }
        catch (err) {
            console.error('Failed to save company settings:', err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleTaxSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            // TODO: Implement API call to save tax settings
            setSuccess('Tax settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        }
        catch (err) {
            console.error('Failed to save tax settings:', err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            // TODO: Implement API call to save user settings
            setSuccess('User settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        }
        catch (err) {
            console.error('Failed to save user settings:', err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            // TODO: Implement API call to save email settings
            setSuccess('Email settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        }
        catch (err) {
            console.error('Failed to save email settings:', err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleInvoiceSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            // TODO: Implement API call to save invoice settings
            setSuccess('Invoice settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        }
        catch (err) {
            console.error('Failed to save invoice settings:', err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value, settingsType) => {
        switch (settingsType) {
            case 'company':
                setCompanySettings(prev => ({ ...prev, [field]: value }));
                break;
            case 'tax':
                setTaxSettings(prev => ({ ...prev, [field]: value }));
                break;
            case 'user':
                setUserSettings(prev => ({ ...prev, [field]: value }));
                break;
            case 'email':
                setEmailSettings(prev => ({ ...prev, [field]: value }));
                break;
            case 'invoice':
                setInvoiceSettings(prev => ({ ...prev, [field]: value }));
                break;
        }
    };
    const getSectionTitle = () => {
        switch (section) {
            case 'company': return 'Company Details';
            case 'tax': return 'Tax Settings';
            case 'users': return 'User Management';
            case 'email': return 'Email Configuration';
            case 'invoice': return 'Invoice Settings';
            default: return 'Settings';
        }
    };
    const renderCompanySettings = () => (_jsxs("form", { onSubmit: handleCompanySubmit, style: { maxWidth: '800px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('company') }, children: "Company Information" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Company Name *" }), _jsx("input", { type: "text", value: companySettings.company_name, onChange: (e) => handleInputChange('company_name', e.target.value, 'company'), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Company Email" }), _jsx("input", { type: "email", value: companySettings.company_email, onChange: (e) => handleInputChange('company_email', e.target.value, 'company'), style: formStyles.input })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Company Phone" }), _jsx("input", { type: "tel", value: companySettings.company_phone, onChange: (e) => handleInputChange('company_phone', e.target.value, 'company'), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Company Website" }), _jsx("input", { type: "url", value: companySettings.company_website, onChange: (e) => handleInputChange('company_website', e.target.value, 'company'), style: formStyles.input })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Company Address" }), _jsx("textarea", { value: companySettings.company_address, onChange: (e) => handleInputChange('company_address', e.target.value, 'company'), style: formStyles.textarea, rows: 3 })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('tax') }, children: "Tax Information" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "GST Number" }), _jsx("input", { type: "text", value: companySettings.gst_number, onChange: (e) => handleInputChange('gst_number', e.target.value, 'company'), style: formStyles.input, placeholder: "22AAAAA0000A1Z5" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "PAN Number" }), _jsx("input", { type: "text", value: companySettings.pan_number, onChange: (e) => handleInputChange('pan_number', e.target.value, 'company'), style: formStyles.input, placeholder: "ABCDE1234F" })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('logo') }, children: "Company Logo" }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Logo URL" }), _jsx("input", { type: "url", value: companySettings.logo_url, onChange: (e) => handleInputChange('logo_url', e.target.value, 'company'), style: formStyles.input, placeholder: "https://example.com/logo.png" })] })] }), _jsx("div", { style: { display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }, children: _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Saving...' : 'Save Company Settings' }) })] }));
    const renderTaxSettings = () => (_jsxs("form", { onSubmit: handleTaxSubmit, style: { maxWidth: '800px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('gst') }, children: "GST Rates" }), _jsxs("div", { style: formStyles.grid3Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "GST Rate (%)" }), _jsx("input", { type: "number", value: taxSettings.gst_rate, onChange: (e) => handleInputChange('gst_rate', e.target.value, 'tax'), style: formStyles.input, min: "0", max: "100", step: "0.01" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "CGST Rate (%)" }), _jsx("input", { type: "number", value: taxSettings.cgst_rate, onChange: (e) => handleInputChange('cgst_rate', e.target.value, 'tax'), style: formStyles.input, min: "0", max: "100", step: "0.01" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "SGST Rate (%)" }), _jsx("input", { type: "number", value: taxSettings.sgst_rate, onChange: (e) => handleInputChange('sgst_rate', e.target.value, 'tax'), style: formStyles.input, min: "0", max: "100", step: "0.01" })] })] }), _jsxs("div", { style: formStyles.grid3Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "IGST Rate (%)" }), _jsx("input", { type: "number", value: taxSettings.igst_rate, onChange: (e) => handleInputChange('igst_rate', e.target.value, 'tax'), style: formStyles.input, min: "0", max: "100", step: "0.01" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "UTGST Rate (%)" }), _jsx("input", { type: "number", value: taxSettings.utgst_rate, onChange: (e) => handleInputChange('utgst_rate', e.target.value, 'tax'), style: formStyles.input, min: "0", max: "100", step: "0.01" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "CESS Rate (%)" }), _jsx("input", { type: "number", value: taxSettings.cess_rate, onChange: (e) => handleInputChange('cess_rate', e.target.value, 'tax'), style: formStyles.input, min: "0", max: "100", step: "0.01" })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('registration') }, children: "Tax Registration" }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Tax Registration Number" }), _jsx("input", { type: "text", value: taxSettings.tax_registration_number, onChange: (e) => handleInputChange('tax_registration_number', e.target.value, 'tax'), style: formStyles.input })] })] }), _jsx("div", { style: { display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }, children: _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Saving...' : 'Save Tax Settings' }) })] }));
    const renderUserSettings = () => (_jsxs("form", { onSubmit: handleUserSubmit, style: { maxWidth: '800px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('user') }, children: "User Information" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Username *" }), _jsx("input", { type: "text", value: userSettings.username, onChange: (e) => handleInputChange('username', e.target.value, 'user'), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Email *" }), _jsx("input", { type: "email", value: userSettings.email, onChange: (e) => handleInputChange('email', e.target.value, 'user'), style: formStyles.input, required: true })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Role" }), _jsxs("select", { value: userSettings.role, onChange: (e) => handleInputChange('role', e.target.value, 'user'), style: formStyles.select, children: [_jsx("option", { value: "admin", children: "Administrator" }), _jsx("option", { value: "manager", children: "Manager" }), _jsx("option", { value: "user", children: "User" })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Status" }), _jsxs("select", { value: userSettings.is_active ? 'active' : 'inactive', onChange: (e) => handleInputChange('is_active', e.target.value === 'active' ? 'true' : 'false', 'user'), style: formStyles.select, children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" })] })] })] })] }), _jsx("div", { style: { display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }, children: _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Saving...' : 'Save User Settings' }) })] }));
    const renderEmailSettings = () => (_jsxs("form", { onSubmit: handleEmailSubmit, style: { maxWidth: '800px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('email') }, children: "Email Provider" }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Email Provider" }), _jsxs("select", { value: emailSettings.email_provider, onChange: (e) => handleInputChange('email_provider', e.target.value, 'email'), style: formStyles.select, children: [_jsx("option", { value: "gmail", children: "Gmail" }), _jsx("option", { value: "outlook", children: "Outlook.com" }), _jsx("option", { value: "custom", children: "Custom SMTP" })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('smtp') }, children: "SMTP Configuration" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "SMTP Server" }), _jsx("input", { type: "text", value: emailSettings.smtp_server, onChange: (e) => handleInputChange('smtp_server', e.target.value, 'email'), style: formStyles.input, placeholder: "smtp.gmail.com" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "SMTP Port" }), _jsx("input", { type: "number", value: emailSettings.smtp_port, onChange: (e) => handleInputChange('smtp_port', e.target.value, 'email'), style: formStyles.input, placeholder: "587" })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "SMTP Username" }), _jsx("input", { type: "email", value: emailSettings.smtp_username, onChange: (e) => handleInputChange('smtp_username', e.target.value, 'email'), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "SMTP Password" }), _jsx("input", { type: "password", value: emailSettings.smtp_password, onChange: (e) => handleInputChange('smtp_password', e.target.value, 'email'), style: formStyles.input })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('sender') }, children: "Sender Information" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "From Email" }), _jsx("input", { type: "email", value: emailSettings.from_email, onChange: (e) => handleInputChange('from_email', e.target.value, 'email'), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "From Name" }), _jsx("input", { type: "text", value: emailSettings.from_name, onChange: (e) => handleInputChange('from_name', e.target.value, 'email'), style: formStyles.input })] })] })] }), _jsx("div", { style: { display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }, children: _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Saving...' : 'Save Email Settings' }) })] }));
    const renderInvoiceSettings = () => (_jsxs("form", { onSubmit: handleInvoiceSubmit, style: { maxWidth: '800px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('invoice') }, children: "Invoice Configuration" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Invoice Prefix" }), _jsx("input", { type: "text", value: invoiceSettings.invoice_prefix, onChange: (e) => handleInputChange('invoice_prefix', e.target.value, 'invoice'), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Default Currency" }), _jsxs("select", { value: invoiceSettings.default_currency, onChange: (e) => handleInputChange('default_currency', e.target.value, 'invoice'), style: formStyles.select, children: [_jsx("option", { value: "INR", children: "Indian Rupee (\u20B9)" }), _jsx("option", { value: "USD", children: "US Dollar ($)" }), _jsx("option", { value: "EUR", children: "Euro (\u20AC)" })] })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Invoice Number Format" }), _jsx("input", { type: "text", value: invoiceSettings.invoice_number_format, onChange: (e) => handleInputChange('invoice_number_format', e.target.value, 'invoice'), style: formStyles.input, placeholder: "INV-{YEAR}-{NUMBER}" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Terms" }), _jsx("input", { type: "text", value: invoiceSettings.payment_terms, onChange: (e) => handleInputChange('payment_terms', e.target.value, 'invoice'), style: formStyles.input, placeholder: "Net 30" })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('template') }, children: "Invoice Template" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Invoice Template" }), _jsxs("select", { value: invoiceSettings.invoice_template, onChange: (e) => handleInputChange('invoice_template', e.target.value, 'invoice'), style: formStyles.select, children: [_jsx("option", { value: "simple", children: "Simple Format" }), _jsx("option", { value: "detailed", children: "Detailed Format" })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Auto Numbering" }), _jsxs("select", { value: invoiceSettings.auto_numbering ? 'true' : 'false', onChange: (e) => handleInputChange('auto_numbering', e.target.value, 'invoice'), style: formStyles.select, children: [_jsx("option", { value: "true", children: "Enabled" }), _jsx("option", { value: "false", children: "Disabled" })] })] })] })] }), _jsx("div", { style: { display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }, children: _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Saving...' : 'Save Invoice Settings' }) })] }));
    const renderContent = () => {
        switch (section) {
            case 'company':
                return renderCompanySettings();
            case 'tax':
                return renderTaxSettings();
            case 'users':
                return renderUserSettings();
            case 'email':
                return renderEmailSettings();
            case 'invoice':
                return renderInvoiceSettings();
            default:
                return (_jsxs("div", { style: { textAlign: 'center', padding: '40px' }, children: [_jsx("h2", { children: "Welcome to Settings" }), _jsx("p", { children: "Please select a settings section from the sidebar." })] }));
        }
    };
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsx("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e9ecef'
                }, children: _jsx("h1", { style: {
                        margin: '0',
                        fontSize: '28px',
                        fontWeight: '600',
                        color: '#2c3e50'
                    }, children: getSectionTitle() }) }), error && _jsx(ErrorMessage, { message: error }), success && (_jsx("div", { style: {
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '6px',
                    color: '#155724',
                    fontSize: '14px'
                }, children: success })), loading && !error ? (_jsx("div", { style: { textAlign: 'center', padding: '40px' }, children: _jsx("div", { children: "Loading settings..." }) })) : (renderContent())] }));
}
