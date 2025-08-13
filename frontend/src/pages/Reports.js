import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAuth } from '../modules/AuthContext';
import { apiGetGstFilingReport } from '../lib/api';
import { Button } from '../components/Button';
export function Reports() {
    const { token } = useAuth();
    const [summary, setSummary] = useState(null);
    const [gstReport, setGstReport] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [from, setFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
    const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
    // GST Filing Report State
    const [periodType, setPeriodType] = useState('month');
    const [periodValue, setPeriodValue] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [reportType, setReportType] = useState('gstr1');
    const [activeTab, setActiveTab] = useState('gst-filing');
    useEffect(() => {
        if (!token)
            return;
        fetch(`/api/reports/gst-summary?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setSummary)
            .catch(() => setError('Failed to load'));
    }, [token, from, to]);
    const handleGstFilingReport = async (format = 'json') => {
        try {
            setLoading(true);
            setError(null);
            const report = await apiGetGstFilingReport(periodType, periodValue, reportType, format);
            if (format === 'json') {
                setGstReport(report);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate GST filing report');
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
    const getPeriodOptions = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (periodType === 'month') {
            const options = [];
            for (let year = currentYear - 2; year <= currentYear; year++) {
                for (let month = 1; month <= 12; month++) {
                    const value = `${year}-${String(month).padStart(2, '0')}`;
                    const label = `${year}-${String(month).padStart(2, '0')}`;
                    options.push({ value, label });
                }
            }
            return options.reverse();
        }
        else if (periodType === 'quarter') {
            const options = [];
            for (let year = currentYear - 2; year <= currentYear; year++) {
                for (let quarter = 1; quarter <= 4; quarter++) {
                    const value = `${year}-Q${quarter}`;
                    const label = `${year} Q${quarter}`;
                    options.push({ value, label });
                }
            }
            return options.reverse();
        }
        else {
            const options = [];
            for (let year = currentYear - 2; year <= currentYear; year++) {
                options.push({ value: String(year), label: String(year) });
            }
            return options.reverse();
        }
    };
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '100%' }, children: [_jsxs("div", { style: {
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e9ecef'
                }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: "Reports & GST Filing" }), _jsx("p", { style: { color: '#6c757d', marginTop: '8px', fontSize: '16px' }, children: "Generate comprehensive GST reports compliant with Indian GST portal requirements" })] }), _jsxs("div", { style: {
                    display: 'flex',
                    marginBottom: '24px',
                    borderBottom: '1px solid #e9ecef'
                }, children: [_jsx("button", { onClick: () => setActiveTab('summary'), style: {
                            padding: '12px 24px',
                            border: 'none',
                            backgroundColor: activeTab === 'summary' ? '#007bff' : 'transparent',
                            color: activeTab === 'summary' ? 'white' : '#495057',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500',
                            borderBottom: activeTab === 'summary' ? '2px solid #007bff' : 'none'
                        }, children: "GST Summary" }), _jsx("button", { onClick: () => setActiveTab('gst-filing'), style: {
                            padding: '12px 24px',
                            border: 'none',
                            backgroundColor: activeTab === 'gst-filing' ? '#007bff' : 'transparent',
                            color: activeTab === 'gst-filing' ? 'white' : '#495057',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500',
                            borderBottom: activeTab === 'gst-filing' ? '2px solid #007bff' : 'none'
                        }, children: "GST Filing Reports" })] }), error && (_jsx("div", { style: {
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '6px',
                    color: '#c33',
                    fontSize: '14px'
                }, children: error })), activeTab === 'summary' && (_jsxs("div", { style: {
                    padding: '20px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                }, children: [_jsx("h2", { style: { margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#495057' }, children: "GST Summary Report" }), _jsxs("div", { style: {
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'center',
                            marginBottom: '24px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px'
                        }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "From Date:" }), _jsx("input", { type: "date", value: from, onChange: (e) => setFrom(e.target.value), style: {
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "To Date:" }), _jsx("input", { type: "date", value: to, onChange: (e) => setTo(e.target.value), style: {
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        } })] })] }), summary && (_jsxs("div", { style: { display: 'grid', gap: '20px' }, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { style: {
                                            padding: '20px',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#6c757d', marginBottom: '8px' }, children: "Taxable Value" }), _jsx("div", { style: { fontSize: '24px', fontWeight: 'bold', color: '#495057' }, children: formatCurrency(summary.taxable_value) })] }), _jsxs("div", { style: {
                                            padding: '20px',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#6c757d', marginBottom: '8px' }, children: "CGST" }), _jsx("div", { style: { fontSize: '24px', fontWeight: 'bold', color: '#28a745' }, children: formatCurrency(summary.cgst) })] }), _jsxs("div", { style: {
                                            padding: '20px',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#6c757d', marginBottom: '8px' }, children: "SGST" }), _jsx("div", { style: { fontSize: '24px', fontWeight: 'bold', color: '#28a745' }, children: formatCurrency(summary.sgst) })] }), _jsxs("div", { style: {
                                            padding: '20px',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#6c757d', marginBottom: '8px' }, children: "IGST" }), _jsx("div", { style: { fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }, children: formatCurrency(summary.igst) })] }), _jsxs("div", { style: {
                                            padding: '20px',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#6c757d', marginBottom: '8px' }, children: "Grand Total" }), _jsx("div", { style: { fontSize: '24px', fontWeight: 'bold', color: '#007bff' }, children: formatCurrency(summary.grand_total) })] })] }), _jsxs("div", { style: {
                                    border: '1px solid #e9ecef',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: 'white'
                                }, children: [_jsx("h3", { style: {
                                            margin: '0',
                                            padding: '16px',
                                            backgroundColor: '#f8f9fa',
                                            borderBottom: '1px solid #e9ecef',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#495057'
                                        }, children: "GST Rate Breakup" }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "GST Rate (%)" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Taxable Value" })] }) }), _jsx("tbody", { children: summary.rate_breakup.map((item, index) => (_jsxs("tr", { style: { borderBottom: '1px solid #e9ecef' }, children: [_jsxs("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: [item.rate, "%"] }), _jsx("td", { style: { padding: '12px' }, children: formatCurrency(item.taxable_value) })] }, index))) })] })] })] }))] })), activeTab === 'gst-filing' && (_jsxs("div", { style: {
                    padding: '20px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                }, children: [_jsx("h2", { style: { margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#495057' }, children: "GST Filing Reports" }), _jsxs("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px'
                        }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Period Type:" }), _jsxs("select", { value: periodType, onChange: (e) => setPeriodType(e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: [_jsx("option", { value: "month", children: "Month" }), _jsx("option", { value: "quarter", children: "Quarter" }), _jsx("option", { value: "year", children: "Year" })] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Period:" }), _jsx("select", { value: periodValue, onChange: (e) => setPeriodValue(e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: getPeriodOptions().map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Report Type:" }), _jsxs("select", { value: reportType, onChange: (e) => setReportType(e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: [_jsx("option", { value: "gstr1", children: "GSTR-1" }), _jsx("option", { value: "gstr2", children: "GSTR-2" }), _jsx("option", { value: "gstr3b", children: "GSTR-3B" })] })] })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', marginBottom: '24px' }, children: [_jsx(Button, { variant: "primary", onClick: () => handleGstFilingReport('json'), disabled: loading, children: loading ? 'Generating...' : 'Generate Report' }), _jsx(Button, { variant: "secondary", onClick: () => handleGstFilingReport('csv'), disabled: loading, children: "Export CSV" }), _jsx(Button, { variant: "secondary", onClick: () => handleGstFilingReport('excel'), disabled: loading, children: "Export Excel" })] }), gstReport && (_jsxs("div", { style: {
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: 'white'
                        }, children: [_jsx("h3", { style: {
                                    margin: '0',
                                    padding: '16px',
                                    backgroundColor: '#f8f9fa',
                                    borderBottom: '1px solid #e9ecef',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#495057'
                                }, children: "Generated Report" }), _jsx("div", { style: { padding: '16px' }, children: _jsx("pre", { style: {
                                        margin: 0,
                                        fontSize: '14px',
                                        color: '#495057',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }, children: JSON.stringify(gstReport, null, 2) }) })] }))] }))] }));
}
