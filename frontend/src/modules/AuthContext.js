import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { apiLogin } from '../lib/api';
const AuthContext = createContext(undefined);
function parseJwtExp(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (typeof payload.exp === 'number')
            return payload.exp * 1000;
        return null;
    }
    catch {
        return null;
    }
}
export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [expiresAt, setExpiresAt] = useState(null);
    const logoutTimer = useRef(null);
    // Reset session timer on user activity
    const resetSessionTimer = useCallback(() => {
        if (token && expiresAt) {
            const newExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
            setExpiresAt(newExpiry);
            localStorage.setItem('auth_exp', String(newExpiry));
        }
    }, [token, expiresAt]);
    // Add event listeners for user activity
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        const handleUserActivity = () => {
            resetSessionTimer();
        };
        events.forEach(event => {
            document.addEventListener(event, handleUserActivity, true);
        });
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleUserActivity, true);
            });
        };
    }, [resetSessionTimer]);
    // initialize from localStorage
    useEffect(() => {
        const t = localStorage.getItem('auth_token');
        const expStr = localStorage.getItem('auth_exp');
        const exp = expStr ? parseInt(expStr, 10) : null;
        if (t && exp && Date.now() < exp) {
            setToken(t);
            setExpiresAt(exp);
        }
        else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_exp');
            // Redirect to login if session expired
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
    }, []);
    // schedule auto logout
    useEffect(() => {
        if (logoutTimer.current) {
            window.clearTimeout(logoutTimer.current);
            logoutTimer.current = null;
        }
        if (token && expiresAt) {
            const delay = Math.max(0, expiresAt - Date.now());
            logoutTimer.current = window.setTimeout(() => {
                setToken(null);
                setExpiresAt(null);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_exp');
                // Redirect to login when session expires
                window.location.href = '/login';
            }, delay);
        }
    }, [token, expiresAt]);
    const value = useMemo(() => ({
        token,
        async login(u, p) {
            const res = await apiLogin(u, p);
            const t = res.access_token;
            const exp = parseJwtExp(t) ?? (Date.now() + 30 * 60 * 1000); // 30 minutes
            setToken(t);
            setExpiresAt(exp);
            localStorage.setItem('auth_token', t);
            localStorage.setItem('auth_exp', String(exp));
        },
        logout() {
            setToken(null);
            setExpiresAt(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_exp');
            window.location.href = '/login';
        },
        forceLogout() {
            setToken(null);
            setExpiresAt(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_exp');
            // Force redirect to login without using window.location.href
            window.location.replace('/login');
        },
        isAuthenticated: !!token,
        expiresAt
    }), [token, expiresAt]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
