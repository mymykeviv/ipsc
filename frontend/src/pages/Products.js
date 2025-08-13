import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/AuthContext';
import { createApiErrorHandler } from '../lib/apiUtils';
import { Button } from '../components/Button';
import { SearchBar } from '../components/SearchBar';
import { ErrorMessage } from '../components/ErrorMessage';
import { apiGetProducts, apiCreateProduct, apiUpdateProduct, apiToggleProduct, apiListParties } from '../lib/api';
import { formStyles, getSectionHeaderColor } from '../utils/formStyles';
export function Products({ mode = 'manage' }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { forceLogout } = useAuth();
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentProduct, setCurrentProduct] = useState(null);
    // Create error handler that will automatically log out on 401 errors
    const handleApiError = createApiErrorHandler(forceLogout);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showStockHistoryModal, setShowStockHistoryModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [formData, setFormData] = useState({
        // Product Details
        name: '',
        product_code: '',
        sku: '',
        unit: 'Pcs',
        supplier: '',
        description: '',
        product_type: 'Goods',
        category: '',
        // Price Details
        purchase_price: '',
        sales_price: '',
        gst_rate: '18',
        hsn_code: '',
        // Stock Details
        opening_stock: '',
        // Other Details
        notes: ''
    });
    const [stockFormData, setStockFormData] = useState({
        quantity: '',
        adjustmentType: 'add',
        date_of_receipt: new Date().toISOString().split('T')[0],
        reference_bill_number: '',
        supplier: '',
        category: '',
        notes: ''
    });
    useEffect(() => {
        if (mode === 'manage') {
            loadProducts();
            loadVendors();
        }
        else if (mode === 'edit' && id) {
            loadProduct(parseInt(id));
            loadVendors();
        }
        else if (mode === 'add') {
            loadVendors();
            setLoading(false);
        }
    }, [mode, id]);
    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await apiGetProducts();
            setProducts(data);
        }
        catch (error) {
            handleApiError(error);
            setError('Failed to load products');
        }
        finally {
            setLoading(false);
        }
    };
    const loadProduct = async (productId) => {
        try {
            setLoading(true);
            const data = await apiGetProducts();
            const product = data.find(p => p.id === productId);
            if (product) {
                setCurrentProduct(product);
                // Populate form data
                setFormData({
                    name: product.name,
                    product_code: product.sku || '',
                    sku: product.sku || '',
                    unit: product.unit,
                    supplier: product.supplier || '',
                    description: product.description || '',
                    product_type: product.item_type,
                    category: product.category || '',
                    purchase_price: product.purchase_price?.toString() || '',
                    sales_price: product.sales_price.toString(),
                    gst_rate: product.gst_rate.toString(),
                    hsn_code: product.hsn || '',
                    opening_stock: product.stock.toString(),
                    notes: product.notes || ''
                });
            }
            else {
                setError('Product not found');
            }
        }
        catch (error) {
            handleApiError(error);
            setError('Failed to load product');
        }
        finally {
            setLoading(false);
        }
    };
    const loadVendors = async () => {
        try {
            const data = await apiListParties();
            const vendorData = data.filter(party => party.type === 'vendor');
            setVendors(vendorData);
        }
        catch (error) {
            handleApiError(error);
        }
    };
    const resetForm = () => {
        setFormData({
            name: '',
            product_code: '',
            sku: '',
            unit: 'Pcs',
            supplier: '',
            description: '',
            product_type: 'Goods',
            category: '',
            purchase_price: '',
            sales_price: '',
            gst_rate: '18',
            hsn_code: '',
            opening_stock: '',
            notes: ''
        });
        setError(null);
    };
    const handleAddProduct = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                item_type: formData.product_type,
                sales_price: parseFloat(formData.sales_price),
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
                stock: parseFloat(formData.opening_stock),
                sku: formData.sku,
                unit: formData.unit,
                supplier: formData.supplier,
                category: formData.category,
                notes: formData.notes,
                hsn: formData.hsn_code,
                gst_rate: parseFloat(formData.gst_rate)
            };
            await apiCreateProduct(payload);
            navigate('/products');
        }
        catch (error) {
            handleApiError(error);
            let errorMessage = 'Failed to create product. Please try again.';
            if (error.message) {
                errorMessage = error.message;
            }
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const handleEditProduct = async (e) => {
        e.preventDefault();
        if (!currentProduct)
            return;
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                item_type: formData.product_type,
                sales_price: parseFloat(formData.sales_price),
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
                stock: parseFloat(formData.opening_stock),
                sku: formData.sku,
                unit: formData.unit,
                supplier: formData.supplier,
                category: formData.category,
                notes: formData.notes,
                hsn: formData.hsn_code,
                gst_rate: parseFloat(formData.gst_rate)
            };
            await apiUpdateProduct(currentProduct.id, payload);
            navigate('/products');
        }
        catch (error) {
            handleApiError(error);
            setError('Failed to update product');
        }
    };
    const handleToggleProduct = async (productId) => {
        try {
            await apiToggleProduct(productId);
            loadProducts();
        }
        catch (error) {
            handleApiError(error);
        }
    };
    // Render different content based on mode
    if (mode === 'add' || mode === 'edit') {
        return (_jsxs("div", { style: { padding: '20px' }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e9ecef'
                    }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: mode === 'add' ? 'Add New Product' : 'Edit Product' }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/products'), children: "\u2190 Back to Products" })] }), error && _jsx(ErrorMessage, { message: error }), _jsxs("form", { onSubmit: mode === 'add' ? handleAddProduct : handleEditProduct, style: { display: 'flex', flexDirection: 'column', gap: '24px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('basic') }, children: "\uD83D\uDCE6 Product Details" }), _jsxs("div", { style: formStyles.grid, children: [_jsxs("div", { style: formStyles.grid3Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData(prev => ({ ...prev, name: e.target.value })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Code *" }), _jsx("input", { type: "text", value: formData.product_code, onChange: (e) => setFormData(prev => ({ ...prev, product_code: e.target.value })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "SKU" }), _jsx("input", { type: "text", value: formData.sku, onChange: (e) => setFormData(prev => ({ ...prev, sku: e.target.value })), style: formStyles.input })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Unit of Measure *" }), _jsxs("select", { value: formData.unit, onChange: (e) => setFormData(prev => ({ ...prev, unit: e.target.value })), style: formStyles.select, required: true, children: [_jsx("option", { value: "Pcs", children: "Pieces" }), _jsx("option", { value: "Kg", children: "Kilograms" }), _jsx("option", { value: "Ltr", children: "Liters" }), _jsx("option", { value: "Mtr", children: "Meters" }), _jsx("option", { value: "Box", children: "Box" }), _jsx("option", { value: "Set", children: "Set" })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Supplier" }), _jsxs("select", { value: formData.supplier, onChange: (e) => setFormData(prev => ({ ...prev, supplier: e.target.value })), style: formStyles.select, children: [_jsx("option", { value: "", children: "Select Supplier" }), vendors.map(vendor => (_jsx("option", { value: vendor.name, children: vendor.name }, vendor.id)))] })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Type *" }), _jsxs("select", { value: formData.product_type, onChange: (e) => setFormData(prev => ({ ...prev, product_type: e.target.value })), style: formStyles.select, required: true, children: [_jsx("option", { value: "Goods", children: "Goods" }), _jsx("option", { value: "Services", children: "Services" })] })] }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Category *" }), _jsx("input", { type: "text", value: formData.category, onChange: (e) => setFormData(prev => ({ ...prev, category: e.target.value })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Description" }), _jsx("input", { type: "text", value: formData.description, onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })), style: formStyles.input })] })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('payment') }, children: "\uD83D\uDCB0 Price Details" }), _jsx("div", { style: formStyles.grid, children: _jsxs("div", { style: formStyles.grid4Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Purchase Price" }), _jsx("input", { type: "number", step: "0.01", value: formData.purchase_price, onChange: (e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value })), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Selling Price *" }), _jsx("input", { type: "number", step: "0.01", value: formData.sales_price, onChange: (e) => setFormData(prev => ({ ...prev, sales_price: e.target.value })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "GST Rate *" }), _jsxs("select", { value: formData.gst_rate, onChange: (e) => setFormData(prev => ({ ...prev, gst_rate: e.target.value })), style: formStyles.select, required: true, children: [_jsx("option", { value: "0", children: "0%" }), _jsx("option", { value: "5", children: "5%" }), _jsx("option", { value: "12", children: "12%" }), _jsx("option", { value: "18", children: "18%" }), _jsx("option", { value: "28", children: "28%" })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "HSN Code *" }), _jsx("input", { type: "text", value: formData.hsn_code, onChange: (e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value })), style: formStyles.input, required: true })] })] }) })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('other') }, children: "\uD83D\uDCCA Stock Details" }), _jsx("div", { style: formStyles.grid, children: _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Opening Stock" }), _jsx("input", { type: "number", step: "1", value: formData.opening_stock, onChange: (e) => setFormData(prev => ({ ...prev, opening_stock: e.target.value })), style: formStyles.input })] }) })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h2", { style: { ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('other') }, children: "\uD83D\uDCDD Other Details" }), _jsx("div", { style: formStyles.grid, children: _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(prev => ({ ...prev, notes: e.target.value })), style: formStyles.textarea, rows: 3 })] }) })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate('/products'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Saving...' : (mode === 'add' ? 'Add Product' : 'Update Product') })] })] })] }));
    }
    // Manage Products Mode
    if (loading) {
        return (_jsx("div", { style: { padding: '20px' }, children: _jsx("div", { children: "Loading..." }) }));
    }
    // Filter and sort products
    const filteredProducts = products.filter(product => {
        const searchLower = searchTerm.toLowerCase();
        return (product.name.toLowerCase().includes(searchLower) ||
            (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
            (product.category && product.category.toLowerCase().includes(searchLower)) ||
            (product.description && product.description.toLowerCase().includes(searchLower)) ||
            (product.supplier && product.supplier.toLowerCase().includes(searchLower)));
    });
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        // Handle null values
        if (aValue === null && bValue === null)
            return 0;
        if (aValue === null)
            return sortDirection === 'asc' ? 1 : -1;
        if (bValue === null)
            return sortDirection === 'asc' ? -1 : 1;
        if (aValue < bValue)
            return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue)
            return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex);
    const exportToCSV = () => {
        const headers = ['Name', 'SKU', 'Category', 'Unit', 'Stock', 'Sales Price', 'GST Rate', 'Status'];
        const csvContent = [
            headers.join(','),
            ...paginatedProducts.map(product => [
                product.name,
                product.sku || '',
                product.category || '',
                product.unit,
                product.stock,
                product.sales_price,
                product.gst_rate,
                product.is_active ? 'Active' : 'Inactive'
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };
    const SortableHeader = ({ children, field }) => (_jsxs("th", { onClick: () => {
            if (sortField === field) {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            }
            else {
                setSortField(field);
                setSortDirection('asc');
            }
        }, style: {
            padding: '12px',
            textAlign: 'left',
            fontWeight: '600',
            color: '#495057',
            cursor: 'pointer',
            userSelect: 'none'
        }, children: [children, " ", sortField === field && (sortDirection === 'asc' ? '↑' : '↓')] }));
    return (_jsxs("div", { style: { padding: '20px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e9ecef'
                }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: "Manage Products" }), _jsxs("div", { style: { display: 'flex', gap: '12px' }, children: [_jsx(Button, { variant: "secondary", onClick: exportToCSV, children: "Export CSV" }), _jsx(Button, { variant: "primary", onClick: () => navigate('/products/add'), children: "Add Product" })] })] }), _jsx("div", { style: { marginBottom: '24px' }, children: _jsx(SearchBar, { value: searchTerm, onChange: setSearchTerm, placeholder: "Search products by name, SKU, category, description, or supplier..." }) }), _jsx("div", { style: {
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }, children: [_jsx(SortableHeader, { field: "name", children: "Name" }), _jsx(SortableHeader, { field: "sku", children: "SKU" }), _jsx(SortableHeader, { field: "category", children: "Category" }), _jsx(SortableHeader, { field: "unit", children: "Unit" }), _jsx(SortableHeader, { field: "stock", children: "Stock" }), _jsx(SortableHeader, { field: "sales_price", children: "Sales Price" }), _jsx(SortableHeader, { field: "gst_rate", children: "GST Rate" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Status" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }, children: "Actions" })] }) }), _jsx("tbody", { children: paginatedProducts.map(product => (_jsxs("tr", { style: {
                                    opacity: product.is_active ? 1 : 0.6,
                                    borderBottom: '1px solid #e9ecef',
                                    backgroundColor: 'white'
                                }, children: [_jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: product.name }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: product.sku || '-' }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: product.category || '-' }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: product.unit }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: product.stock }), _jsxs("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: ["\u20B9", product.sales_price.toFixed(2)] }), _jsxs("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: [product.gst_rate, "%"] }), _jsx("td", { style: { padding: '12px', borderRight: '1px solid #e9ecef' }, children: _jsx("span", { style: {
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                backgroundColor: product.is_active ? '#d4edda' : '#f8d7da',
                                                color: product.is_active ? '#155724' : '#721c24'
                                            }, children: product.is_active ? 'Active' : 'Inactive' }) }), _jsx("td", { style: { padding: '12px' }, children: _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", onClick: () => navigate(`/products/edit/${product.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Edit" }), _jsx(Button, { variant: "secondary", onClick: () => {
                                                        setSelectedProduct(product);
                                                        setShowStockModal(true);
                                                    }, style: { fontSize: '14px', padding: '6px 12px' }, children: "Stock" }), _jsx(Button, { variant: "secondary", onClick: () => {
                                                        setSelectedProduct(product);
                                                        setShowStockHistoryModal(true);
                                                    }, style: { fontSize: '14px', padding: '6px 12px' }, children: "History" }), _jsx(Button, { variant: "secondary", onClick: () => handleToggleProduct(product.id), style: { fontSize: '14px', padding: '6px 12px' }, children: product.is_active ? 'Deactivate' : 'Activate' })] }) })] }, product.id))) })] }) }), totalPages > 1 && (_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '24px',
                    padding: '16px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsxs("div", { style: { fontSize: '14px', color: '#495057' }, children: ["Showing ", startIndex + 1, " to ", Math.min(endIndex, sortedProducts.length), " of ", sortedProducts.length, " products"] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, children: "Previous" }), _jsxs("span", { style: {
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '14px',
                                    color: '#495057',
                                    fontWeight: '500'
                                }, children: ["Page ", currentPage, " of ", totalPages] }), _jsx(Button, { variant: "secondary", onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)), disabled: currentPage === totalPages, children: "Next" })] })] })), paginatedProducts.length === 0 && !loading && (_jsxs("div", { style: {
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6c757d',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }, children: [_jsx("div", { style: { fontSize: '18px', marginBottom: '8px', fontWeight: '500' }, children: "No products found" }), _jsx("div", { style: { fontSize: '14px' }, children: searchTerm ? 'Try adjusting your search criteria' : 'Create your first product to get started' })] })), showStockModal && selectedProduct && (_jsx("div", { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }, children: _jsxs("div", { style: {
                        width: '80%',
                        height: '80%',
                        maxWidth: '1400px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '24px'
                    }, children: [_jsxs("h2", { children: ["Stock Adjustment for ", selectedProduct.name] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setShowStockModal(false), children: "Cancel" }), _jsx(Button, { variant: "primary", children: "Apply Adjustment" })] })] }) })), showStockHistoryModal && selectedProduct && (_jsx("div", { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }, children: _jsxs("div", { style: {
                        width: '80%',
                        height: '80%',
                        maxWidth: '1400px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '24px'
                    }, children: [_jsxs("h2", { children: ["Stock History for ", selectedProduct.name] }), _jsx("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }, children: _jsx(Button, { variant: "secondary", onClick: () => setShowStockHistoryModal(false), children: "\u2190 Back to Products" }) })] }) }))] }));
}
