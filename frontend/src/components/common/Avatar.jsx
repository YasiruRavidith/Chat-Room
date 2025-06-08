// src/components/common/Avatar.jsx

import React from 'react';

const Avatar = ({ src, size = 10, isOnline = false, alt = "Avatar" }) => {
    // Use a more reliable placeholder service
    const defaultAvatar = `https://placehold.co/${size*4}x${size*4}/EFEFEF/AAAAAA&text=...`;

    const handleImageError = (e) => {
        // Prevent the infinite loop by removing the error handler
        // after the first error.
        e.target.onerror = null; 
        e.target.src = defaultAvatar;
    };

    return (
        <div className="relative">
            <img
                src={src || defaultAvatar}
                alt={alt}
                className={`w-${size} h-${size} rounded-full object-cover border-2 border-gray-200`}
                onError={handleImageError}
            />
            {isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
            )}
        </div>
    );
};

export default Avatar;