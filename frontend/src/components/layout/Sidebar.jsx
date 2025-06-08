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

const Sidebar = () => {
    const { user, logout } = useAuthStore();
    const { groups, fetchGroups, selectGroup, selectedGroup, clearChatState } = useChatStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isAIConfigOpen, setIsAIConfigOpen] = useState(false);

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
    };

    return (
        <div className="w-1/4 bg-gray-100 border-r border-gray-200 flex flex-col h-screen">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Avatar src={user?.profile_picture} size={10} />
                    <h2 className="text-xl font-semibold">{user?.name}</h2>
                </div>                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => setIsAIConfigOpen(true)} 
                        className="text-gray-500 hover:text-blue-600 transition-colors"
                        title="AI Assistant Settings"
                    >
                        <RiRobot2Line size={22} />
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="text-gray-500 hover:text-gray-800">
                        <IoSettingsOutline size={22} />
                    </button>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-500">
                        <IoLogOutOutline size={24} />
                    </button>
                </div>
            </div>            <div className="p-4 space-y-3">
                <UserSearch />
                <button
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <IoPeople size={16} />
                    <span>Create Group</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="px-2">
                    {groups.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p>No chats yet</p>
                            <p className="text-sm">Search for users to start chatting</p>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <GroupListItem
                                key={group.id}
                                group={group}
                                isSelected={selectedGroup?.id === group.id}
                                onSelect={() => selectGroup(group)}
                            />
                        ))
                    )}
                </div>
            </div>            
            <ProfileSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
            <AIConfigModal isOpen={isAIConfigOpen} onClose={() => setIsAIConfigOpen(false)} />
        </div>
    );
};

export default Sidebar;