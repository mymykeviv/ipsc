import { jsx as _jsx } from "react/jsx-runtime";
import { successStyles } from '../utils/formStyles';
export const SuccessMessage = ({ message, className = '', style = {} }) => {
    if (!message)
        return null;
    return (_jsx("div", { className: className, style: { ...successStyles.container, ...style }, role: "alert", "aria-live": "polite", children: message }));
};
