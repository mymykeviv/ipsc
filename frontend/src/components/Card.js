import { jsx as _jsx } from "react/jsx-runtime";
export function Card({ children, className, ...rest }) {
    const classes = ['card', className].filter(Boolean).join(' ');
    return (_jsx("div", { className: classes, ...rest, children: children }));
}
