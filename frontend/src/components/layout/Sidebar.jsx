import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { toast } from 'react-hot-toast';
import { IoSettingsOutline, IoLogOutOutline, IoAdd, IoPeople } from 'react-icons/io5';
import { RiRobot2Line } from 'react-icons/ri';
import Avatar from '../common/Avatar';
import GroupListItem from '../chat/GroupListItem';
import UserSearch from '../chat/UserSearch';
import CreateGroupModal from '../chat/CreateGroupModal';
import ProfileSettings from '../ProfileSettings';
import AIConfigModal from '../chat/AIConfigModal';

const Sidebar = ({ isMobileMenuOpen = false, setIsMobileMenuOpen }) => {
    const { user, logout } = useAuthStore();
    const { groups, fetchGroups, selectGroup, selectedGroup, clearChatState } = useChatStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isAIConfigOpen, setIsAIConfigOpen] = useState(false);

    // Calculate total unread messages count
    const totalUnreadCount = groups.reduce((total, group) => total + (group.unread_count || 0), 0);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleLogout = async () => {
        try {
            await logout();
            clearChatState();
            toast.success('Logged out successfully');
        } catch (error) {
            toast.error('Logout failed');
        }
    };    const handleGroupSelect = (group) => {
        selectGroup(group);
        // Close mobile menu when selecting a chat on mobile
        if (setIsMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    };return (
        <>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                    onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed md:relative inset-y-0 left-0 z-40 
                w-80 md:w-1/4 bg-gray-100 border-r border-gray-200 
                flex flex-col h-screen
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Avatar src={user?.profile_picture} size={10} />
                        {totalUnreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                            </div>
                        )}
                    </div>
                    <div className="hidden sm:block">
                        <h2 className="text-lg md:text-xl font-semibold truncate">{user?.name}</h2>
                        {totalUnreadCount > 0 && (
                            <p className="text-xs text-red-600 font-medium">
                                {totalUnreadCount} unread message{totalUnreadCount > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => setIsAIConfigOpen(true)} 
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-200"
                        title="AI Assistant Settings"
                    >
                        <RiRobot2Line size={20} />
                    </button>
                    <button 
                        onClick={() => setIsSettingsOpen(true)} 
                        className="p-2 text-gray-500 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-200"
                        title="Settings"
                    >
                        <IoSettingsOutline size={20} />
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-200"
                        title="Logout"
                    >
                        <IoLogOutOutline size={20} />
                    </button>
                </div>
            </div>            <div className="p-4 space-y-3">
                <UserSearch />
                <button
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <IoPeople size={16} />
                    <span className="hidden sm:inline">Create Group</span>
                    <span className="sm:hidden">Create</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="px-2">
                    {groups.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 px-4">
                            <p className="text-sm md:text-base">No chats yet</p>
                            <p className="text-xs md:text-sm">Search for users to start chatting</p>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <GroupListItem
                                key={group.id}
                                group={group}
                                isSelected={selectedGroup?.id === group.id}
                                onSelect={() => handleGroupSelect(group)}
                            />
                        ))
                    )}
                </div>
            </div>            
            
            <ProfileSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
            <AIConfigModal isOpen={isAIConfigOpen} onClose={() => setIsAIConfigOpen(false)} />
        </div>
        </>
    );
};

export default Sidebar;