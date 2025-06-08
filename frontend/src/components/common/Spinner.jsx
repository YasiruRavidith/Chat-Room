import React from 'react';

const Spinner = ({ size = '8' }) => {
    return (
        <div className={`w-${size} h-${size} border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin`}></div>
    );
};

export default Spinner;