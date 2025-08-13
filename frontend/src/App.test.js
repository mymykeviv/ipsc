import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './modules/AuthContext';
import { App } from './modules/App';
describe('App', () => {
    it('renders without crashing', () => {
        render(_jsx(BrowserRouter, { children: _jsx(AuthProvider, { children: _jsx(App, {}) }) }));
        // Basic test to ensure the app renders
        expect(document.body).toBeDefined();
    });
});
