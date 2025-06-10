import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { getPrivateChatName } from '../../lib/utils';
import Avatar from '../common/Avatar';
import UserInfoModal from './UserInfoModal';
import GroupInfoModal from './GroupInfoModal';
import { IoEllipsisVertical, IoTrash, IoExitOutline, IoInformationCircle, IoMenuOutline } from 'react-icons/io5';
import { toast } from 'react-hot-toast';

const ChatHeader = ({ group, onToggleSidebar }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const currentUser = useAuthStore(state => state.user);
    const { leaveGroup, deleteChat } = useChatStore();
    
    const displayName = getPrivateChatName(group, currentUser);
    const otherMember = group.members?.find(member => member.id !== currentUser?.id);
    const isPrivateChat = group.group_type === 'private';
    const isGroupAdmin = group.created_by === currentUser?.id;    const handleLeaveGroup = async () => {
        try {
            await leaveGroup(group.id);
            toast.success('Left group successfully');
        } catch (error) {
            toast.error('Failed to leave group');
        }
        setShowDropdown(false);
    };

    const handleShowInfo = () => {
        setShowDropdown(false);
        if (isPrivateChat) {
            setShowUserInfo(true);
        } else {
            setShowGroupInfo(true);
        }
    };

    const handleDeleteChat = async () => {
        if (window.confirm(`Are you sure you want to delete this ${isPrivateChat ? 'chat' : 'group'}?`)) {
            try {
                await deleteChat(group.id);
                toast.success(`${isPrivateChat ? 'Chat' : 'Group'} deleted successfully`);
            } catch (error) {
                toast.error(`Failed to delete ${isPrivateChat ? 'chat' : 'group'}`);
            }
        }
        setShowDropdown(false);
    };

    const getStatusText = () => {
        if (isPrivateChat) {
            return otherMember?.is_online ? 'Online' : 'Offline';
        } else {
            const memberCount = group.members?.length || 0;
            const onlineCount = group.members?.filter(member => member.is_online)?.length || 0;
            return `${memberCount} members, ${onlineCount} online`;
        }
    };    return (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
                {/* Mobile sidebar toggle button */}
                <button
                    onClick={onToggleSidebar}
                    className="md:hidden p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
                    aria-label="Toggle sidebar"
                >
                    <IoMenuOutline size={24} />
                </button>
                
                <Avatar 
                    src={isPrivateChat ? otherMember?.profile_picture : group.group_picture} 
                    size={10} 
                    isOnline={isPrivateChat ? otherMember?.is_online : undefined}
                />
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">{displayName}</h2>
                    <p className="text-sm text-gray-500 truncate">{getStatusText()}</p>
                </div>
            </div>

            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                    <IoEllipsisVertical size={20} />
                </button>

                {showDropdown && (
                    <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <div className="py-1">                            <button
                                onClick={handleShowInfo}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <IoInformationCircle className="mr-3" size={16} />
                                {isPrivateChat ? 'User Info' : 'Group Info'}
                            </button>
                            
                            {!isPrivateChat && (
                                <button
                                    onClick={handleLeaveGroup}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <IoExitOutline className="mr-3" size={16} />
                                    Leave Group
                                </button>
                            )}
                            
                            {(isPrivateChat || isGroupAdmin) && (
                                <button
                                    onClick={handleDeleteChat}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <IoTrash className="mr-3" size={16} />
                                    Delete {isPrivateChat ? 'Chat' : 'Group'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setShowDropdown(false)}
                />
            )}

            {/* Modals */}
            <UserInfoModal 
                isOpen={showUserInfo}
                onClose={() => setShowUserInfo(false)}
                user={otherMember}
                group={group}
            />
            
            <GroupInfoModal 
                isOpen={showGroupInfo}
                onClose={() => setShowGroupInfo(false)}
                group={group}
            />
        </div>
    );
};

export default ChatHeader;