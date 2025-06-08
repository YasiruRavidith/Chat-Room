import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { IoPersonAdd, IoPersonRemove, IoCall, IoVideocam, IoMail, IoTimeOutline, IoShieldCheckmark } from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { API_URLS } from '../../api/urls';

const UserInfoModal = ({ isOpen, onClose, user: targetUser, group }) => {
    const { user: currentUser } = useAuthStore();
    const { blockUser, unblockUser, blockedUsers } = useChatStore();
    const [isBlocked, setIsBlocked] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (targetUser) {
            setIsBlocked(blockedUsers.some(blockedUser => blockedUser.id === targetUser.id));
        }
    }, [targetUser, blockedUsers]);

    const handleBlockUser = async () => {
        if (!targetUser) return;
        
        setLoading(true);
        try {
            if (isBlocked) {
                await unblockUser(targetUser.id);
                toast.success(`Unblocked ${targetUser.name}`);
                setIsBlocked(false);
            } else {
                await blockUser(targetUser.id);
                toast.success(`Blocked ${targetUser.name}`);
                setIsBlocked(true);
            }
        } catch (error) {
            toast.error(`Failed to ${isBlocked ? 'unblock' : 'block'} user`);
        } finally {
            setLoading(false);
        }
    };

    const handleStartCall = () => {
        toast.info('Voice call feature coming soon!');
    };

    const handleStartVideoCall = () => {
        toast.info('Video call feature coming soon!');
    };

    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'Never';
        const date = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
        return date.toLocaleDateString();
    };

    if (!targetUser) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="User Information">
            <div className="space-y-6">
                {/* User Profile Section */}
                <div className="text-center">
                    <div className="relative inline-block">
                        <Avatar 
                            src={targetUser.profile_picture} 
                            size={24} 
                            isOnline={targetUser.is_online}
                        />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-gray-900">{targetUser.name}</h3>
                    <p className="text-sm text-gray-500">@{targetUser.username}</p>
                    <div className="flex items-center justify-center mt-2">
                        <div className={`w-2 h-2 rounded-full mr-2 ${targetUser.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-600">
                            {targetUser.is_online ? 'Online' : `Last seen ${formatLastSeen(targetUser.last_seen)}`}
                        </span>
                    </div>
                </div>

                {/* User Details */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <IoMail className="text-gray-400" size={20} />
                        <div>
                            <p className="text-sm font-medium text-gray-700">Email</p>
                            <p className="text-sm text-gray-600">{targetUser.email || 'Not provided'}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <IoTimeOutline className="text-gray-400" size={20} />
                        <div>
                            <p className="text-sm font-medium text-gray-700">Member since</p>
                            <p className="text-sm text-gray-600">
                                {new Date(targetUser.date_joined || targetUser.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {targetUser.role && targetUser.role !== 'user' && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <IoShieldCheckmark className="text-gray-400" size={20} />
                            <div>
                                <p className="text-sm font-medium text-gray-700">Role</p>
                                <p className="text-sm text-gray-600 capitalize">{targetUser.role}</p>
                            </div>
                        </div>
                    )}

                    {targetUser.offline_mode_enabled && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-800">AI Assistant Enabled</p>
                            <p className="text-xs text-blue-600 mt-1">
                                This user has offline AI assistance enabled
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {targetUser.id !== currentUser?.id && (
                    <div className="space-y-3">
                        <div className="flex space-x-3">
                            <Button
                                onClick={handleStartCall}
                                variant="secondary"
                                className="flex-1 flex items-center justify-center space-x-2"
                            >
                                <IoCall size={16} />
                                <span>Call</span>
                            </Button>
                            <Button
                                onClick={handleStartVideoCall}
                                variant="secondary"
                                className="flex-1 flex items-center justify-center space-x-2"
                            >
                                <IoVideocam size={16} />
                                <span>Video</span>
                            </Button>
                        </div>

                        <Button
                            onClick={handleBlockUser}
                            disabled={loading}
                            variant={isBlocked ? "secondary" : "danger"}
                            className="w-full flex items-center justify-center space-x-2"
                        >
                            {isBlocked ? <IoPersonAdd size={16} /> : <IoPersonRemove size={16} />}
                            <span>{loading ? 'Processing...' : (isBlocked ? 'Unblock User' : 'Block User')}</span>
                        </Button>
                    </div>
                )}

                {/* Group-specific Information */}
                {group && (
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">In this group</h4>
                        <div className="space-y-2">
                            {group.members?.find(member => member.id === targetUser.id) && (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600">Role</span>
                                    <span className="text-sm font-medium capitalize">
                                        {group.members.find(member => member.id === targetUser.id)?.role || 'Member'}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Joined</span>
                                <span className="text-sm font-medium">
                                    {group.members?.find(member => member.id === targetUser.id)?.joined_at 
                                        ? new Date(group.members.find(member => member.id === targetUser.id).joined_at).toLocaleDateString()
                                        : 'Unknown'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default UserInfoModal;
