import React from 'react';

const Button = ({ 
    children, 
    onClick, 
    type = 'button', 
    disabled = false, 
    fullWidth = true, 
    variant = 'primary',
    className = '' 
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'secondary':
                return 'text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500';
            case 'danger':
                return 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'primary':
            default:
                return 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                ${fullWidth ? 'w-full' : ''}
                px-4 py-2 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:bg-gray-400 disabled:cursor-not-allowed
                ${getVariantClasses()}
                ${className}
            `}
        >
            {children}
        </button>
    );
};

export default Button;