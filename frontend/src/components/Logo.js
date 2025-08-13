import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Logo({ size = 'medium', showText = true, className = '', centered = false }) {
    const sizeClasses = {
        small: 'w-6 h-6',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };
    const textSizes = {
        small: 'text-sm',
        medium: 'text-lg',
        large: 'text-2xl'
    };
    return (_jsxs("div", { className: `flex items-center gap-2 ${centered ? 'justify-center' : ''} ${className}`, style: { minWidth: 0, flexShrink: 1 }, children: [_jsx("div", { className: `${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`, children: _jsx("span", { className: size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-lg', children: "CF" }) }), showText && (_jsxs("div", { className: "flex flex-col", style: { minWidth: 0, flexShrink: 1 }, children: [_jsx("span", { className: `${textSizes[size]} font-bold text-gray-900 leading-none whitespace-nowrap`, children: "CASHFLOW" }), _jsx("div", { className: `${size === 'small' ? 'text-xs' : 'text-sm'} text-gray-600 font-medium leading-tight`, children: "Financial Management System" })] }))] }));
}
