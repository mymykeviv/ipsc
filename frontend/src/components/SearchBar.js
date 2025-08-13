import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SearchBar({ value, onChange, placeholder = "Search...", style }) {
    return (_jsxs("div", { style: {
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            ...style
        }, children: [_jsx("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, style: {
                    width: '100%',
                    padding: '10px 16px 10px 40px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                }, onFocus: (e) => {
                    e.target.style.borderColor = '#007bff';
                    e.target.style.boxShadow = '0 0 0 0.2rem rgba(0,123,255,.25)';
                }, onBlur: (e) => {
                    e.target.style.borderColor = '#ced4da';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                } }), _jsx("div", { style: {
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6c757d',
                    fontSize: '16px'
                }, children: "\uD83D\uDD0D" })] }));
}
