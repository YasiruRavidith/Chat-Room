import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Input from '../common/Input';
import { 
    IoPersonAdd, 
    IoPersonRemove, 
    IoExitOutline, 
    IoTrash, 
    IoColorWandSharp  , 
    IoSave, 
    IoClose, 
    IoImage,
    IoPeople,
    IoCalendarOutline,
    IoInformationCircle
} from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { API_URLS } from '../../api/urls';

const GroupInfoModal = ({ isOpen, onClose, group }) => {
    const { user: currentUser } = useAuthStore();
    const { leaveGroup, deleteChat } = useChatStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [groupData, setGroupData] = useState({
        name: '',
        description: '',
        group_picture: null
    });
    const [newPicture, setNewPicture] = useState(null);
    const [picturePreview, setPicturePreview] = useState(null);
    const [memberDetails, setMemberDetails] = useState([]);

    const isGroupAdmin = group?.created_by === currentUser?.id;
    const isPrivateChat = group?.group_type === 'private';

    useEffect(() => {
        if (group) {
            setGroupData({
                name: group.name || '',
                description: group.description || '',
                group_picture: group.group_picture
            });
            
            // Fetch detailed member information
            if (group.members) {
                setMemberDetails(group.members);
            }
        }
    }, [group]);

    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }
            setNewPicture(file);
            const reader = new FileReader();
            reader.onload = (e) => setPicturePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async () => {
        if (!isGroupAdmin) {
            toast.error('Only group admin can edit group details');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', groupData.name);
            formData.append('description', groupData.description);
            
            if (newPicture) {
                formData.append('group_picture', newPicture);
            }

            const response = await api.put(API_URLS.GROUP_DETAIL(group.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Group updated successfully');
            setIsEditing(false);
            setNewPicture(null);
            setPicturePreview(null);
            
            // Update the group data locally
            // You might want to refresh the group data from the server here
            
        } catch (error) {
            toast.error('Failed to update group');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (window.confirm('Are you sure you want to leave this group?')) {
            try {
                await leaveGroup(group.id);
                toast.success('Left group successfully');
                onClose();
            } catch (error) {
                toast.error('Failed to leave group');
            }
        }
    };

    const handleDeleteGroup = async () => {
        if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
            try {
                await deleteChat(group.id);
                toast.success('Group deleted successfully');
                onClose();
            } catch (error) {
                toast.error('Failed to delete group');
            }
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!isGroupAdmin) {
            toast.error('Only group admin can remove members');
            return;
        }

        if (window.confirm('Are you sure you want to remove this member?')) {
            try {
                await api.post(API_URLS.REMOVE_MEMBER(group.id), { user_id: memberId });
                toast.success('Member removed successfully');
                
                // Update local member list
                setMemberDetails(memberDetails.filter(member => member.id !== memberId));
            } catch (error) {
                toast.error('Failed to remove member');
                console.error(error);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getOnlineMembersCount = () => {
        return memberDetails.filter(member => member.is_online).length;
    };

    if (!group) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isPrivateChat ? "Chat Info" : "Group Info"}>
            <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Group/Chat Header */}
                <div className="text-center">
                    <div className="relative inline-block">
                        {isEditing && !isPrivateChat ? (
                            <div className="relative">
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                    {picturePreview ? (
                                        <img src={picturePreview} alt="Group" className="w-full h-full object-cover" />
                                    ) : groupData.group_picture ? (
                                        <img src={groupData.group_picture} alt="Group" className="w-full h-full object-cover" />
                                    ) : (
                                        <IoPeople className="text-gray-400" size={32} />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="edit-group-picture"
                                    accept="image/*"
                                    onChange={handlePictureChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="edit-group-picture"
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600"
                                >
                                    <IoImage size={16} />
                                </label>
                            </div>
                        ) : (
                            <Avatar 
                                src={isPrivateChat ? 
                                    group.members?.find(m => m.id !== currentUser?.id)?.profile_picture : 
                                    group.group_picture
                                } 
                                size={24} 
                                isOnline={isPrivateChat ? 
                                    group.members?.find(m => m.id !== currentUser?.id)?.is_online : 
                                    undefined
                                }
                            />
                        )}
                    </div>
                    
                    {isEditing && !isPrivateChat ? (
                        <div className="mt-4 space-y-3">
                            <Input
                                placeholder="Group Name"
                                value={groupData.name}
                                onChange={(e) => setGroupData({...groupData, name: e.target.value})}
                            />
                            <textarea
                                placeholder="Group Description"
                                value={groupData.description}
                                onChange={(e) => setGroupData({...groupData, description: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows="3"
                            />
                        </div>
                    ) : (
                        <div className="mt-4">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {isPrivateChat ? 
                                    group.members?.find(m => m.id !== currentUser?.id)?.name : 
                                    group.name
                                }
                            </h3>
                            {!isPrivateChat && group.description && (
                                <p className="text-sm text-gray-600 mt-2">{group.description}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Group Statistics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{memberDetails.length}</div>
                        <div className="text-sm text-gray-600">Members</div>
                    </div>
                    {!isPrivateChat && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{getOnlineMembersCount()}</div>
                            <div className="text-sm text-gray-600">Online</div>
                        </div>
                    )}
                </div>

                {/* Group Details */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <IoCalendarOutline className="text-gray-400" size={20} />
                        <div>
                            <p className="text-sm font-medium text-gray-700">Created</p>
                            <p className="text-sm text-gray-600">{formatDate(group.created_at)}</p>
                        </div>
                    </div>

                    {group.created_by && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <IoInformationCircle className="text-gray-400" size={20} />
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    {isPrivateChat ? 'Chat with' : 'Created by'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {memberDetails.find(m => m.id === group.created_by)?.name || 'Unknown'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Members List */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">
                        Members ({memberDetails.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {memberDetails.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Avatar 
                                        src={member.profile_picture} 
                                        size={8} 
                                        isOnline={member.is_online}
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{member.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {member.id === group.created_by ? 'Admin' : 'Member'}
                                            {member.id === currentUser?.id && ' (You)'}
                                        </p>
                                    </div>
                                </div>
                                
                                {isGroupAdmin && 
                                 member.id !== currentUser?.id && 
                                 member.id !== group.created_by && 
                                 !isPrivateChat && (
                                    <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded-full"
                                    >
                                        <IoPersonRemove size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t">
                    {isEditing && !isPrivateChat ? (
                        <div className="flex space-x-3">
                            <Button
                                onClick={handleSaveChanges}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center space-x-2"
                            >
                                <IoSave size={16} />
                                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsEditing(false);
                                    setNewPicture(null);
                                    setPicturePreview(null);
                                }}
                                variant="secondary"
                                className="flex items-center justify-center"
                            >
                                <IoClose size={16} />
                            </Button>
                        </div>
                    ) : (
                        <>
                            {isGroupAdmin && !isPrivateChat && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    variant="secondary"
                                    className="w-full flex items-center justify-center space-x-2"
                                >
                                    <IoColorWandSharp   size={16} />
                                    <span>Edit Group</span>
                                </Button>
                            )}

                            {!isPrivateChat && (
                                <Button
                                    onClick={handleLeaveGroup}
                                    variant="secondary"
                                    className="w-full flex items-center justify-center space-x-2"
                                >
                                    <IoExitOutline size={16} />
                                    <span>Leave Group</span>
                                </Button>
                            )}

                            {(isGroupAdmin || isPrivateChat) && (
                                <Button
                                    onClick={isPrivateChat ? () => handleDeleteGroup() : handleDeleteGroup}
                                    variant="danger"
                                    className="w-full flex items-center justify-center space-x-2"
                                >
                                    <IoTrash size={16} />
                                    <span>Delete {isPrivateChat ? 'Chat' : 'Group'}</span>
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default GroupInfoModal;
