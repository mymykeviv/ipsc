import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './modules/App';
import { AuthProvider } from './modules/AuthContext';
import './theme.css';
// Version tracking
const VERSION = "1.0.0";
const BUILD_DATE = "2024-01-15";
// Log version info
console.log(`IPSC Frontend v${VERSION} (${BUILD_DATE})`);
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(AuthProvider, { children: _jsx(App, {}) }) }) }));
