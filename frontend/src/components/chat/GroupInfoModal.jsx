import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore'; // Make sure this is imported
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Input from '../common/Input';
import { 
    IoPersonRemove, 
    IoExitOutline, 
    IoTrash, 
    IoColorWandSharp, 
    IoSave, 
    IoClose, 
    IoImage,
    IoPeople,
    IoCalendarOutline,
    IoInformationCircle,
    IoRemoveCircle, // Import icon for removing picture
} from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { API_URLS } from '../../api/urls';

const GroupInfoModal = ({ isOpen, onClose, group }) => {
    const { user: currentUser } = useAuthStore();
    // Get fetchGroups from the store to refresh data after an update
    const { leaveGroup, deleteChat, fetchGroups } = useChatStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [groupData, setGroupData] = useState({ name: '', description: '' });
    const [newPictureFile, setNewPictureFile] = useState(null);
    const [picturePreview, setPicturePreview] = useState(null);
    const [isPictureRemoved, setIsPictureRemoved] = useState(false); // State to track removal
    const [memberDetails, setMemberDetails] = useState([]);

    const isGroupAdmin = group?.created_by === currentUser?.id;
    const isPrivateChat = group?.group_type === 'private';

    useEffect(() => {
        if (group) {
            setGroupData({
                name: group.name || '',
                description: group.description || '',
            });
            setPicturePreview(group.group_picture); // Start with the current picture
            setMemberDetails(group.members || []);
            
            // Reset editing state and picture changes when group or open state changes
            setIsEditing(false);
            setNewPictureFile(null);
            setIsPictureRemoved(false);
        }
    }, [group, isOpen]);

    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image size must be less than 5MB');
                return;
            }
            setNewPictureFile(file);
            setIsPictureRemoved(false); // If new picture is selected, we are not removing
            const reader = new FileReader();
            reader.onload = (e) => setPicturePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };
    
    // New handler for removing the picture
    const handleRemovePicture = () => {
        setNewPictureFile(null);
        setPicturePreview(null);
        setIsPictureRemoved(true);
        toast.success('Group picture will be removed on save.');
    };

    const handleSaveChanges = async () => {
        if (!isGroupAdmin) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', groupData.name);
            formData.append('description', groupData.description);
            
            if (newPictureFile) {
                formData.append('group_picture', newPictureFile);
            } else if (isPictureRemoved) {
                // Sending an empty string for a FileField in FormData
                // signals to Django to clear the field.
                formData.append('group_picture', ''); 
            }

            // Using PATCH is more appropriate for partial updates
            await api.patch(API_URLS.GROUP_DETAIL(group.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Group updated successfully');
            await fetchGroups(); // Refresh the group list in the sidebar
            setIsEditing(false);
            
        } catch (error) {
            toast.error('Failed to update group');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
        // Reset form to its initial state from the group prop
        setGroupData({ name: group.name || '', description: group.description || '' });
        setPicturePreview(group.group_picture);
        setNewPictureFile(null);
        setIsPictureRemoved(false);
    };

    const handleLeaveGroup = async () => {
        if (window.confirm('Are you sure you want to leave this group?')) {
            try {
                await leaveGroup(group.id);
                toast.success('Left group successfully');
                onClose();
            } catch (error) { toast.error('Failed to leave group'); }
        }
    };

    const handleDeleteGroup = async () => {
        if (window.confirm('Are you sure you want to delete this chat/group? This action cannot be undone.')) {
            try {
                await deleteChat(group.id);
                toast.success('Deleted successfully');
                onClose();
            } catch (error) { toast.error('Failed to delete'); }
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!isGroupAdmin) return;
        if (window.confirm('Are you sure you want to remove this member?')) {
            try {
                await api.post(API_URLS.REMOVE_MEMBER(group.id), { user_id: memberId });
                toast.success('Member removed successfully');
                setMemberDetails(memberDetails.filter(member => member.id !== memberId));
            } catch (error) { toast.error('Failed to remove member'); }
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const getOnlineMembersCount = () => memberDetails.filter(member => member.is_online).length;

    if (!group) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isPrivateChat ? "Chat Info" : "Group Info"}>
            <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
                {/* Group/Chat Header */}
                <div className="text-center">
                    <div className="relative inline-block">
                        {isEditing && !isPrivateChat ? (
                             <div className="relative group">
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                                    {picturePreview ? (
                                        <img src={picturePreview} alt="Group Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <IoPeople className="text-gray-400" size={32} />
                                    )}
                                </div>
                                <input type="file" id="edit-group-picture" accept="image/*" onChange={handlePictureChange} className="hidden" />
                                <label htmlFor="edit-group-picture" className="absolute -bottom-2 right-16 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-transform transform group-hover:scale-110">
                                    <IoImage size={16} />
                                </label>
                                {picturePreview && (
                                    <button onClick={handleRemovePicture} className="absolute -bottom-2 right-0 bg-red-500 text-white rounded-full p-2 cursor-pointer hover:bg-red-600 transition-transform transform group-hover:scale-110">
                                        <IoRemoveCircle size={16} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <Avatar src={isPrivateChat ? group.members?.find(m => m.id !== currentUser?.id)?.profile_picture : group.group_picture} size={24} isOnline={isPrivateChat ? group.members?.find(m => m.id !== currentUser?.id)?.is_online : undefined} />
                        )}
                    </div>
                    
                    {isEditing && !isPrivateChat ? (
                        <div className="mt-4 space-y-3">
                            <Input placeholder="Group Name" value={groupData.name} onChange={(e) => setGroupData({...groupData, name: e.target.value})} />
                            <textarea placeholder="Group Description" value={groupData.description} onChange={(e) => setGroupData({...groupData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows="3" />
                        </div>
                    ) : (
                        <div className="mt-4">
                            <h3 className="text-xl font-semibold text-gray-900">{isPrivateChat ? group.members?.find(m => m.id !== currentUser?.id)?.name : group.name}</h3>
                            {!isPrivateChat && group.description && <p className="text-sm text-gray-600 mt-2">{group.description}</p>}
                        </div>
                    )}
                </div>
                
                {/* (Rest of the JSX is the same) */}

                {/* Members List */}
                 <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Members ({memberDetails.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {memberDetails.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Avatar src={member.profile_picture} size={8} isOnline={member.is_online}/>
                                    <div>
                                        <p className="text-sm font-medium">{member.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {member.id === group.created_by ? 'Admin' : 'Member'}
                                            {member.id === currentUser?.id && ' (You)'}
                                        </p>
                                    </div>
                                </div>
                                {isGroupAdmin && member.id !== currentUser?.id && !isPrivateChat && (
                                    <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-full">
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
                            <Button onClick={handleSaveChanges} disabled={loading} className="flex-1 flex items-center justify-center space-x-2">
                                <IoSave size={16} />
                                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                            </Button>
                            <Button onClick={handleCancelEditing} variant="secondary" className="flex items-center justify-center">
                                <IoClose size={16} />
                            </Button>
                        </div>
                    ) : (
                        <>
                            {isGroupAdmin && !isPrivateChat && (
                                <Button onClick={() => setIsEditing(true)} variant="secondary" className="w-full flex items-center justify-center space-x-2">
                                    <IoColorWandSharp size={16} />
                                    <span>Edit Group</span>
                                </Button>
                            )}
                            {!isPrivateChat && (
                                <Button onClick={handleLeaveGroup} variant="secondary" className="w-full flex items-center justify-center space-x-2">
                                    <IoExitOutline size={16} />
                                    <span>Leave Group</span>
                                </Button>
                            )}
                            {(isGroupAdmin || isPrivateChat) && (
                                <Button onClick={handleDeleteGroup} variant="danger" className="w-full flex items-center justify-center space-x-2">
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