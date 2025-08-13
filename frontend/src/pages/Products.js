import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/AuthContext';
import { createApiErrorHandler } from '../lib/apiUtils';
import { Button } from '../components/Button';
import { SearchBar } from '../components/SearchBar';
import { ErrorMessage } from '../components/ErrorMessage';
import { apiGetProducts, apiCreateProduct, apiUpdateProduct, apiToggleProduct, apiAdjustStock, apiListParties } from '../lib/api';
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
                    }, children: [_jsx("h1", { style: { margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }, children: mode === 'add' ? 'Add New Product' : 'Edit Product' }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/products'), children: "\u2190 Back to Products" })] }), error && _jsx(ErrorMessage, { message: error }), _jsxs("form", { onSubmit: mode === 'add' ? handleAddProduct : handleEditProduct, style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: [_jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("h3", { style: { marginBottom: '8px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '4px' }, children: "Product Details" }), _jsxs("div", { style: formStyles.grid, children: [_jsxs("div", { style: formStyles.grid4Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData(prev => ({ ...prev, name: e.target.value })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Code *" }), _jsx("input", { type: "text", value: formData.product_code, onChange: (e) => setFormData(prev => ({ ...prev, product_code: e.target.value })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "SKU" }), _jsx("input", { type: "text", value: formData.sku, onChange: (e) => setFormData(prev => ({ ...prev, sku: e.target.value })), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Unit of Measure *" }), _jsxs("select", { value: formData.unit, onChange: (e) => setFormData(prev => ({ ...prev, unit: e.target.value })), style: formStyles.select, required: true, children: [_jsx("option", { value: "Pcs", children: "Pieces" }), _jsx("option", { value: "Kg", children: "Kilograms" }), _jsx("option", { value: "Ltr", children: "Liters" }), _jsx("option", { value: "Mtr", children: "Meters" }), _jsx("option", { value: "Box", children: "Box" }), _jsx("option", { value: "Set", children: "Set" })] })] })] }), _jsxs("div", { style: formStyles.grid4Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Supplier" }), _jsxs("select", { value: formData.supplier, onChange: (e) => setFormData(prev => ({ ...prev, supplier: e.target.value })), style: formStyles.select, children: [_jsx("option", { value: "", children: "Select Supplier" }), vendors.map(vendor => (_jsx("option", { value: vendor.name, children: vendor.name }, vendor.id)))] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Type *" }), _jsxs("select", { value: formData.product_type, onChange: (e) => setFormData(prev => ({ ...prev, product_type: e.target.value })), style: formStyles.select, required: true, children: [_jsx("option", { value: "Goods", children: "Goods" }), _jsx("option", { value: "Services", children: "Services" })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Category *" }), _jsx("input", { type: "text", value: formData.category, onChange: (e) => setFormData(prev => ({ ...prev, category: e.target.value })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Product Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })), style: formStyles.textarea, placeholder: "Enter detailed product description..." })] })] })] })] }), _jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("h3", { style: { marginBottom: '8px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '4px' }, children: "Price Details" }), _jsx("div", { style: formStyles.grid, children: _jsxs("div", { style: formStyles.grid4Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Purchase Price" }), _jsx("input", { type: "number", step: "0.01", value: formData.purchase_price, onChange: (e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value })), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Selling Price *" }), _jsx("input", { type: "number", step: "0.01", value: formData.sales_price, onChange: (e) => setFormData(prev => ({ ...prev, sales_price: e.target.value })), style: formStyles.input, required: true })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "GST Rate *" }), _jsxs("select", { value: formData.gst_rate, onChange: (e) => setFormData(prev => ({ ...prev, gst_rate: e.target.value })), style: formStyles.select, required: true, children: [_jsx("option", { value: "0", children: "0%" }), _jsx("option", { value: "5", children: "5%" }), _jsx("option", { value: "12", children: "12%" }), _jsx("option", { value: "18", children: "18%" }), _jsx("option", { value: "28", children: "28%" })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "HSN Code *" }), _jsx("input", { type: "text", value: formData.hsn_code, onChange: (e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value })), style: formStyles.input, required: true })] })] }) })] }), _jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("h3", { style: { marginBottom: '8px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '4px' }, children: "Stock Details" }), _jsx("div", { style: formStyles.grid, children: _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Opening Stock" }), _jsx("input", { type: "number", step: "1", value: formData.opening_stock, onChange: (e) => setFormData(prev => ({ ...prev, opening_stock: e.target.value })), style: formStyles.input, placeholder: "Enter opening stock quantity" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(prev => ({ ...prev, notes: e.target.value })), style: formStyles.textarea, placeholder: "Enter any additional notes..." })] })] }) })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate('/products'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Saving...' : (mode === 'add' ? 'Add Product' : 'Update Product') })] })] })] }));
    }
    // Stock Adjustment Mode
    if (mode === 'stock-adjustment') {
        const [stockFormData, setStockFormData] = useState({
            quantity: '',
            adjustmentType: 'add',
            date_of_receipt: new Date().toISOString().split('T')[0],
            reference_bill_number: '',
            supplier: '',
            category: '',
            notes: ''
        });
        const [selectedProductId, setSelectedProductId] = useState('');
        const [stockLoading, setStockLoading] = useState(false);
        const handleStockSubmit = async (e) => {
            e.preventDefault();
            if (!selectedProductId) {
                setError('Please select a product');
                return;
            }
            try {
                setStockLoading(true);
                setError(null);
                const result = await apiAdjustStock(parseInt(selectedProductId), parseFloat(stockFormData.quantity), stockFormData.adjustmentType, stockFormData.date_of_receipt, stockFormData.reference_bill_number || undefined, stockFormData.supplier || undefined, stockFormData.category || undefined, stockFormData.notes || undefined);
                if (result.ok) {
                    // Reset form and show success
                    setStockFormData({
                        quantity: '',
                        adjustmentType: 'add',
                        date_of_receipt: new Date().toISOString().split('T')[0],
                        reference_bill_number: '',
                        supplier: '',
                        category: '',
                        notes: ''
                    });
                    setSelectedProductId('');
                    alert(`Stock adjusted successfully. New stock: ${result.new_stock}`);
                }
            }
            catch (err) {
                console.error('Failed to adjust stock:', err);
                const errorMessage = handleApiError(err);
                setError(errorMessage);
            }
            finally {
                setStockLoading(false);
            }
        };
        const handleStockInputChange = (field, value) => {
            setStockFormData(prev => ({ ...prev, [field]: value }));
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
                            }, children: "Stock Adjustment" }), _jsx(Button, { onClick: () => navigate('/products'), variant: "secondary", style: {
                                padding: '10px 16px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }, children: "\u2190 Back to Products" })] }), error && _jsx(ErrorMessage, { message: error }), _jsxs("form", { onSubmit: handleStockSubmit, style: { maxWidth: '800px' }, children: [_jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('product') }, children: "Product Selection" }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Select Product *" }), _jsxs("select", { value: selectedProductId, onChange: (e) => setSelectedProductId(e.target.value), style: formStyles.select, required: true, children: [_jsx("option", { value: "", children: "Choose a product..." }), products.map(product => (_jsxs("option", { value: product.id, children: [product.name, " (Current Stock: ", product.stock, ")"] }, product.id)))] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('adjustment') }, children: "Adjustment Details" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Adjustment Type *" }), _jsxs("select", { value: stockFormData.adjustmentType, onChange: (e) => handleStockInputChange('adjustmentType', e.target.value), style: formStyles.select, required: true, children: [_jsx("option", { value: "add", children: "Add Stock (Incoming)" }), _jsx("option", { value: "reduce", children: "Reduce Stock (Outgoing)" })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Quantity *" }), _jsx("input", { type: "number", value: stockFormData.quantity, onChange: (e) => handleStockInputChange('quantity', e.target.value), style: formStyles.input, min: "0", step: "0.01", required: true })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsxs("label", { style: formStyles.label, children: [stockFormData.adjustmentType === 'add' ? 'Date of Receipt' : 'Date of Issue', " *"] }), _jsx("input", { type: "date", value: stockFormData.date_of_receipt, onChange: (e) => handleStockInputChange('date_of_receipt', e.target.value), style: formStyles.input, required: true })] })] }), stockFormData.adjustmentType === 'add' && (_jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('reference') }, children: "Reference Information" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Reference Bill Number" }), _jsx("input", { type: "text", value: stockFormData.reference_bill_number, onChange: (e) => handleStockInputChange('reference_bill_number', e.target.value), style: formStyles.input, placeholder: "Enter bill/invoice number" })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Supplier" }), _jsxs("select", { value: stockFormData.supplier, onChange: (e) => handleStockInputChange('supplier', e.target.value), style: formStyles.select, children: [_jsx("option", { value: "", children: "Select supplier..." }), vendors.map(vendor => (_jsx("option", { value: vendor.name, children: vendor.name }, vendor.id)))] })] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Category" }), _jsx("input", { type: "text", value: stockFormData.category, onChange: (e) => handleStockInputChange('category', e.target.value), style: formStyles.input, placeholder: "Enter category" })] })] })), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, color: getSectionHeaderColor('notes') }, children: "Additional Information" }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Notes" }), _jsx("textarea", { value: stockFormData.notes, onChange: (e) => handleStockInputChange('notes', e.target.value), style: formStyles.textarea, rows: 3, placeholder: "Additional notes about this stock adjustment..." })] })] }), _jsxs("div", { style: { display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate('/products'), disabled: stockLoading, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: stockLoading, children: stockLoading ? 'Adjusting Stock...' : 'Adjust Stock' })] })] })] }));
    }
    // Stock History Mode
    if (mode === 'stock-history') {
        const [selectedProductId, setSelectedProductId] = useState('');
        const [stockHistory, setStockHistory] = useState([]);
        const [historyLoading, setHistoryLoading] = useState(false);
        const loadStockHistory = async () => {
            if (!selectedProductId)
                return;
            try {
                setHistoryLoading(true);
                setError(null);
                // TODO: Implement stock history API call
                // For now, show a placeholder message
                setStockHistory([]);
            }
            catch (err) {
                console.error('Failed to load stock history:', err);
                const errorMessage = handleApiError(err);
                setError(errorMessage);
            }
            finally {
                setHistoryLoading(false);
            }
        };
        useEffect(() => {
            if (selectedProductId) {
                loadStockHistory();
            }
        }, [selectedProductId]);
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
                            }, children: "Stock History" }), _jsx(Button, { onClick: () => navigate('/products'), variant: "secondary", style: {
                                padding: '10px 16px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }, children: "\u2190 Back to Products" })] }), error && _jsx(ErrorMessage, { message: error }), _jsx("div", { style: { marginBottom: '24px' }, children: _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Select Product" }), _jsxs("select", { value: selectedProductId, onChange: (e) => setSelectedProductId(e.target.value), style: formStyles.select, children: [_jsx("option", { value: "", children: "Choose a product to view stock history..." }), products.map(product => (_jsxs("option", { value: product.id, children: [product.name, " (Current Stock: ", product.stock, ")"] }, product.id)))] })] }) }), selectedProductId && (_jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }, children: "Stock History" }), historyLoading ? (_jsx("div", { style: { textAlign: 'center', padding: '40px' }, children: _jsx("div", { children: "Loading stock history..." }) })) : stockHistory.length > 0 ? (_jsx("div", { style: {
                                backgroundColor: '#fff',
                                border: '1px solid #e9ecef',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Date" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Type" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Quantity" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Reference" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }, children: "Notes" })] }) }), _jsx("tbody", { children: stockHistory.map((entry, index) => (_jsxs("tr", { style: { borderBottom: '1px solid #f8f9fa' }, children: [_jsx("td", { style: { padding: '12px', fontSize: '14px' }, children: entry.date }), _jsx("td", { style: { padding: '12px', fontSize: '14px' }, children: _jsx("span", { style: {
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            backgroundColor: entry.type === 'add' ? '#d4edda' : '#f8d7da',
                                                            color: entry.type === 'add' ? '#155724' : '#721c24'
                                                        }, children: entry.type === 'add' ? 'Incoming' : 'Outgoing' }) }), _jsx("td", { style: { padding: '12px', fontSize: '14px' }, children: entry.quantity }), _jsx("td", { style: { padding: '12px', fontSize: '14px' }, children: entry.reference || '-' }), _jsx("td", { style: { padding: '12px', fontSize: '14px' }, children: entry.notes || '-' })] }, index))) })] }) })) : (_jsxs("div", { style: { padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }, children: [_jsx("p", { style: { color: '#6c757d', fontSize: '16px', textAlign: 'center' }, children: "No stock history available for this product." }), _jsx("p", { style: { color: '#6c757d', fontSize: '14px', textAlign: 'center', marginTop: '8px' }, children: "Stock history will be displayed here once stock adjustments are made." })] }))] }))] }));
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
                                            }, children: product.is_active ? 'Active' : 'Inactive' }) }), _jsx("td", { style: { padding: '12px' }, children: _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", onClick: () => navigate(`/products/edit/${product.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Edit" }), _jsx(Button, { variant: "secondary", onClick: () => navigate(`/products/stock-adjustment?product=${product.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "Stock" }), _jsx(Button, { variant: "secondary", onClick: () => navigate(`/products/stock-history?product=${product.id}`), style: { fontSize: '14px', padding: '6px 12px' }, children: "History" }), _jsx(Button, { variant: "secondary", onClick: () => handleToggleProduct(product.id), style: { fontSize: '14px', padding: '6px 12px' }, children: product.is_active ? 'Deactivate' : 'Activate' })] }) })] }, product.id))) })] }) }), totalPages > 1 && (_jsxs("div", { style: {
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
