import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import { App } from '../modules/App';
function renderWithRoute(initialPath) {
    return render(_jsx(MemoryRouter, { initialEntries: [initialPath], children: _jsx(App, {}) }));
}
test('renders main navigation items', () => {
    renderWithRoute('/');
    const links = [
        'Dashboard',
        'Products',
        'Stock',
        'Sales',
        'Purchases',
        'Parties',
        'Reports',
        'Settings',
    ];
    for (const text of links) {
        expect(screen.getByRole('link', { name: text })).toBeInTheDocument();
    }
});
test('navigates to Products route', () => {
    renderWithRoute('/products');
    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
});
