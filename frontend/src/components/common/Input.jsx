import React from 'react';

const Input = ({ 
    type = 'text', 
    name, 
    value, 
    onChange, 
    placeholder, 
    required = false, 
    fullWidth = true,
    className = '',
    ...props 
}) => {
    const baseClasses = "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
    const widthClasses = fullWidth ? "w-full" : "";
    const combinedClasses = `${baseClasses} ${widthClasses} ${className}`.trim();

    return (
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={combinedClasses}
            {...props}
        />
    );
};

export default Input;