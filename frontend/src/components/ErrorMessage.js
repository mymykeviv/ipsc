import { jsx as _jsx } from "react/jsx-runtime";
import { errorStyles } from '../utils/formStyles';
export const ErrorMessage = ({ message, className = '', style = {} }) => {
    if (!message)
        return null;
    return (_jsx("div", { className: className, style: { ...errorStyles.container, ...style }, role: "alert", "aria-live": "polite", children: message }));
};
