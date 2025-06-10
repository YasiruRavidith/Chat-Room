import React, { useState } from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Clone children and pass the toggle function
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { onToggleSidebar: toggleMobileMenu });
        }
        return child;
    });    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar 
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {childrenWithProps}
            </main>
        </div>
    );
};

export default MainLayout;