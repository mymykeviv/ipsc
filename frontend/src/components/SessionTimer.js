import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function SessionTimer({ expiryTime, onExpire, className = '' }) {
    const [timeLeft, setTimeLeft] = useState(0);
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = expiryTime - now;
            if (remaining <= 0) {
                onExpire();
                return 0;
            }
            return remaining;
        };
        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
        }, 1000);
        return () => clearInterval(timer);
    }, [expiryTime, onExpire]);
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };
    const getColorClass = (seconds) => {
        if (seconds <= 300)
            return 'text-red-600'; // 5 minutes or less
        if (seconds <= 600)
            return 'text-orange-600'; // 10 minutes or less
        return 'text-gray-600';
    };
    return (_jsxs("div", { className: `flex items-center gap-2 text-sm ${className}`, children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsxs("span", { className: `font-medium ${getColorClass(timeLeft)}`, children: ["Session: ", formatTime(timeLeft)] })] }));
}
