import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Dashboard } from '../pages/Dashboard';
import { Products } from '../pages/Products';
import { Purchases } from '../pages/Purchases';
import { Parties } from '../pages/Parties';
import { Reports } from '../pages/Reports';
import { Settings } from '../pages/Settings';
import { Login } from '../pages/Login';
import { useAuth } from './AuthContext';
import { Invoices } from '../pages/Invoices';
import { Expenses } from '../pages/Expenses';
import { Cashflow } from '../pages/Cashflow';
import { Logo } from '../components/Logo';
import { SessionTimer } from '../components/SessionTimer';
function Shell() {
    const { token, isAuthenticated, logout, expiresAt } = useAuth();
    const location = useLocation();
    const [collapsedSections, setCollapsedSections] = useState({
        products: false,
        invoices: false,
        purchases: false,
        customers: false,
        cashflow: false,
        settings: false
    });
    const toggleSection = (section) => {
        setCollapsedSections(prev => {
            const newState = { ...prev };
            // If the section is currently collapsed, open it and close all others
            if (prev[section]) {
                // Close all sections first
                Object.keys(newState).forEach(key => {
                    newState[key] = true;
                });
                // Then open the clicked section
                newState[section] = false;
            }
            else {
                // If the section is open, close it
                newState[section] = true;
            }
            return newState;
        });
    };
    // Helper function to check if a link is active
    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        // For exact matches (like /invoices/add), use exact path matching
        if (path.includes('/add') || path.includes('/edit') || path.includes('/payments') || path.includes('/email') || path.includes('/print')) {
            return location.pathname === path;
        }
        // For base paths (like /invoices), check if it's the exact path or a sub-path that doesn't match specific patterns
        if (path === '/invoices' && location.pathname.startsWith('/invoices')) {
            // Only highlight /invoices if we're not on a specific sub-path
            return !location.pathname.includes('/add') &&
                !location.pathname.includes('/edit') &&
                !location.pathname.includes('/payments') &&
                !location.pathname.includes('/email') &&
                !location.pathname.includes('/print');
        }
        if (path === '/purchases' && location.pathname.startsWith('/purchases')) {
            // Only highlight /purchases if we're not on a specific sub-path
            return !location.pathname.includes('/add') &&
                !location.pathname.includes('/edit') &&
                !location.pathname.includes('/payments');
        }
        if (path === '/products' && location.pathname.startsWith('/products')) {
            // Only highlight /products if we're not on a specific sub-path
            return !location.pathname.includes('/add') &&
                !location.pathname.includes('/edit');
        }
        if (path === '/customers' && location.pathname.startsWith('/customers')) {
            // Only highlight /customers if we're not on a specific sub-path
            return !location.pathname.includes('/add') &&
                !location.pathname.includes('/edit');
        }
        if (path === '/vendors' && location.pathname.startsWith('/vendors')) {
            // Only highlight /vendors if we're not on a specific sub-path
            return !location.pathname.includes('/add') &&
                !location.pathname.includes('/edit');
        }
        if (path === '/expenses' && location.pathname.startsWith('/expenses')) {
            // Only highlight /expenses if we're not on a specific sub-path
            return !location.pathname.includes('/add') &&
                !location.pathname.includes('/edit');
        }
        return location.pathname.startsWith(path);
    };
    // If not authenticated, show only login page
    if (!isAuthenticated) {
        return (_jsx("div", { className: "app-shell", children: _jsx("main", { className: "content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }) }) }));
    }
    // If authenticated, show full app with sidebar
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("aside", { className: "sidebar", children: [_jsx("div", { className: "brand", children: _jsx(Logo, { size: "large" }) }), _jsxs("nav", { className: "nav", children: [_jsx(Link, { className: `nav-link ${isActive('/') ? 'active' : ''}`, to: "/", children: "\uD83D\uDCCA Dashboard" }), _jsxs("div", { className: "nav-section", children: [_jsxs("div", { className: "nav-section-header", onClick: () => toggleSection('products'), style: { cursor: 'pointer', userSelect: 'none' }, children: ["\uD83C\uDFF7\uFE0F Products ", collapsedSections.products ? '▼' : '▶'] }), !collapsedSections.products && (_jsxs(_Fragment, { children: [_jsx(Link, { className: `nav-link sub-link ${isActive('/products') ? 'active' : ''}`, to: "/products", children: "Manage Products" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/products/add') ? 'active' : ''}`, to: "/products/add", children: "Add/Edit Product" })] }))] }), _jsxs("div", { className: "nav-section", children: [_jsxs("div", { className: "nav-section-header", onClick: () => toggleSection('invoices'), style: { cursor: 'pointer', userSelect: 'none' }, children: ["\uD83D\uDCC4 Invoices ", collapsedSections.invoices ? '▼' : '▶'] }), !collapsedSections.invoices && (_jsxs(_Fragment, { children: [_jsx(Link, { className: `nav-link sub-link ${isActive('/invoices') ? 'active' : ''}`, to: "/invoices", children: "Manage Invoices" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/invoices/add') ? 'active' : ''}`, to: "/invoices/add", children: "Add/Edit Invoice" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/invoices/payments') ? 'active' : ''}`, to: "/invoices/payments", children: "Invoice Payments" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/invoices/payments/add') ? 'active' : ''}`, to: "/invoices/payments/add", children: "Add/Edit Invoice Payment" })] }))] }), _jsxs("div", { className: "nav-section", children: [_jsxs("div", { className: "nav-section-header", onClick: () => toggleSection('purchases'), style: { cursor: 'pointer', userSelect: 'none' }, children: ["\uD83D\uDCE6 Purchases ", collapsedSections.purchases ? '▼' : '▶'] }), !collapsedSections.purchases && (_jsxs(_Fragment, { children: [_jsx(Link, { className: `nav-link sub-link ${isActive('/purchases') ? 'active' : ''}`, to: "/purchases", children: "Manage Purchases" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/purchases/add') ? 'active' : ''}`, to: "/purchases/add", children: "Add/Edit Purchase" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/purchases/payments') ? 'active' : ''}`, to: "/purchases/payments", children: "Purchase Payments" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/purchases/payments/add') ? 'active' : ''}`, to: "/purchases/payments/add", children: "Add/Edit Purchase Payment" })] }))] }), _jsxs("div", { className: "nav-section", children: [_jsxs("div", { className: "nav-section-header", onClick: () => toggleSection('customers'), style: { cursor: 'pointer', userSelect: 'none' }, children: ["\uD83D\uDC65 Customers / Vendors ", collapsedSections.customers ? '▼' : '▶'] }), !collapsedSections.customers && (_jsxs(_Fragment, { children: [_jsx(Link, { className: `nav-link sub-link ${isActive('/customers') ? 'active' : ''}`, to: "/customers", children: "Customers" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/customers/add') ? 'active' : ''}`, to: "/customers/add", children: "Add/Edit Customer" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/vendors') ? 'active' : ''}`, to: "/vendors", children: "Vendors" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/vendors/add') ? 'active' : ''}`, to: "/vendors/add", children: "Add/Edit Vendor" })] }))] }), _jsxs("div", { className: "nav-section", children: [_jsxs("div", { className: "nav-section-header", onClick: () => toggleSection('cashflow'), style: { cursor: 'pointer', userSelect: 'none' }, children: ["\uD83D\uDCB0 Cashflow ", collapsedSections.cashflow ? '▼' : '▶'] }), !collapsedSections.cashflow && (_jsxs(_Fragment, { children: [_jsx(Link, { className: `nav-link sub-link ${isActive('/cashflow') ? 'active' : ''}`, to: "/cashflow", children: "View Cashflow Transactions" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/expenses') ? 'active' : ''}`, to: "/expenses", children: "Manage Expenses" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/expenses/add') ? 'active' : ''}`, to: "/expenses/add", children: "Add/Edit Expense" })] }))] }), _jsxs("div", { className: "nav-section", children: [_jsxs("div", { className: "nav-section-header", onClick: () => toggleSection('settings'), style: { cursor: 'pointer', userSelect: 'none' }, children: ["\u2699\uFE0F Settings ", collapsedSections.settings ? '▼' : '▶'] }), !collapsedSections.settings && (_jsxs(_Fragment, { children: [_jsx(Link, { className: `nav-link sub-link ${isActive('/settings/company') ? 'active' : ''}`, to: "/settings/company", children: "Company Details" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/settings/tax') ? 'active' : ''}`, to: "/settings/tax", children: "Tax Settings" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/settings/users') ? 'active' : ''}`, to: "/settings/users", children: "Users" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/settings/email') ? 'active' : ''}`, to: "/settings/email", children: "Email Settings" }), _jsx(Link, { className: `nav-link sub-link ${isActive('/settings/invoice') ? 'active' : ''}`, to: "/settings/invoice", children: "Invoice Settings" })] }))] }), expiresAt && (_jsx("div", { className: "session-timer", children: _jsx(SessionTimer, { expiryTime: Math.floor(expiresAt / 1000), onExpire: logout }) })), _jsxs("button", { onClick: () => logout(), className: "nav-link logout-btn", style: { border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }, children: [_jsx("svg", { className: "w-4 h-4 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }), "Logout"] })] })] }), _jsx("main", { className: "content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/products", element: _jsx(Products, {}) }), _jsx(Route, { path: "/products/add", element: _jsx(Products, { mode: "add" }) }), _jsx(Route, { path: "/products/edit/:id", element: _jsx(Products, { mode: "edit" }) }), _jsx(Route, { path: "/invoices", element: _jsx(Invoices, {}) }), _jsx(Route, { path: "/invoices/add", element: _jsx(Invoices, { mode: "add" }) }), _jsx(Route, { path: "/invoices/edit/:id", element: _jsx(Invoices, { mode: "edit" }) }), _jsx(Route, { path: "/invoices/payments", element: _jsx(Invoices, { mode: "payments" }) }), _jsx(Route, { path: "/invoices/add-payment/:id", element: _jsx(Invoices, { mode: "add-payment" }) }), _jsx(Route, { path: "/invoices/email/:id", element: _jsx(Invoices, { mode: "email" }) }), _jsx(Route, { path: "/invoices/print/:id", element: _jsx(Invoices, { mode: "print" }) }), _jsx(Route, { path: "/purchases", element: _jsx(Purchases, {}) }), _jsx(Route, { path: "/purchases/add", element: _jsx(Purchases, { mode: "add" }) }), _jsx(Route, { path: "/purchases/edit/:id", element: _jsx(Purchases, { mode: "edit" }) }), _jsx(Route, { path: "/purchases/payments", element: _jsx(Purchases, { mode: "payments" }) }), _jsx(Route, { path: "/purchases/add-payment/:id", element: _jsx(Purchases, { mode: "add-payment" }) }), _jsx(Route, { path: "/customers", element: _jsx(Parties, { type: "customer" }) }), _jsx(Route, { path: "/customers/add", element: _jsx(Parties, { type: "customer", mode: "add" }) }), _jsx(Route, { path: "/customers/edit/:id", element: _jsx(Parties, { type: "customer", mode: "edit" }) }), _jsx(Route, { path: "/vendors", element: _jsx(Parties, { type: "vendor" }) }), _jsx(Route, { path: "/vendors/add", element: _jsx(Parties, { type: "vendor", mode: "add" }) }), _jsx(Route, { path: "/vendors/edit/:id", element: _jsx(Parties, { type: "vendor", mode: "edit" }) }), _jsx(Route, { path: "/cashflow", element: _jsx(Cashflow, {}) }), _jsx(Route, { path: "/settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "/settings/company", element: _jsx(Settings, { section: "company" }) }), _jsx(Route, { path: "/settings/tax", element: _jsx(Settings, { section: "tax" }) }), _jsx(Route, { path: "/settings/users", element: _jsx(Settings, { section: "users" }) }), _jsx(Route, { path: "/settings/email", element: _jsx(Settings, { section: "email" }) }), _jsx(Route, { path: "/settings/invoice", element: _jsx(Settings, { section: "invoice" }) }), _jsx(Route, { path: "/expenses", element: _jsx(Expenses, {}) }), _jsx(Route, { path: "/expenses/add", element: _jsx(Expenses, { mode: "add" }) }), _jsx(Route, { path: "/expenses/edit/:id", element: _jsx(Expenses, { mode: "edit" }) }), _jsx(Route, { path: "/parties", element: _jsx(Parties, {}) }), _jsx(Route, { path: "/reports", element: _jsx(Reports, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) })] }));
}
export function App() {
    return _jsx(Shell, {});
}
