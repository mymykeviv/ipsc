import { jsx as _jsx } from "react/jsx-runtime";
export function Button({ variant = 'default', className, ...rest }) {
    const base = 'btn';
    const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : '';
    const classes = [base, variantClass, className].filter(Boolean).join(' ');
    return _jsx("button", { className: classes, ...rest });
}
