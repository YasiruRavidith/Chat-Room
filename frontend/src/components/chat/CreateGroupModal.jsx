// filepath: src/components/chat/CreateGroupModal.jsx

import React, { useState, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import { IoClose, IoSearch, IoImage } from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { API_URLS } from '../../api/urls';

const CreateGroupModal = ({ isOpen, onClose }) => {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupPicture, setGroupPicture] = useState(null);
    const [picturePreview, setPicturePreview] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const { createGroupChat } = useChatStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (searchQuery.length > 1) {
            const timer = setTimeout(() => {
                searchUsers();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, selectedMembers]);

    const searchUsers = async () => {
        setSearchLoading(true);
        try {
            const response = await api.get(API_URLS.USER_SEARCH(searchQuery));
            const newResults = response.data.users.filter(
                (user) => !selectedMembers.some((member) => member.id === user.id)
            );
            setSearchResults(newResults || []);
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }
            setGroupPicture(file);
            const reader = new FileReader();
            reader.onload = (e) => setPicturePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const addMember = (userToAdd) => {
        if (!selectedMembers.find(member => member.id === userToAdd.id)) {
            setSelectedMembers([...selectedMembers, userToAdd]);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const removeMember = (userId) => {
        setSelectedMembers(selectedMembers.filter(member => member.id !== userId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) {
            toast.error('Group name is required');
            return;
        }
        if (selectedMembers.length === 0) {
            toast.error('Please add at least one member');
            return;
        }
        setLoading(true);

        // **STEP 1: Create the FormData object here.**
        const formData = new FormData();
        formData.append('name', groupName);
        formData.append('description', groupDescription);
        formData.append('group_type', 'group');
        if (groupPicture) {
            formData.append('group_picture', groupPicture);
        }
        // **This is the correct way to append an array to FormData.**
        selectedMembers.forEach(member => {
            formData.append('members', member.id);
        });
        
        try {
            // **STEP 2: Pass the fully prepared FormData to the store.**
            await createGroupChat(formData);
            
            toast.success('Group created successfully!');
            resetForm();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create group');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setGroupName('');
        setGroupDescription('');
        setGroupPicture(null);
        setPicturePreview(null);
        setSelectedMembers([]);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Group Chat">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {picturePreview ? (
                                <img src={picturePreview} alt="Group" className="w-full h-full object-cover" />
                            ) : (
                                <IoImage className="text-gray-400" size={24} />
                            )}
                        </div>
                        <input type="file" id="group-picture" accept="image/*" onChange={handlePictureChange} className="hidden" />
                        <label htmlFor="group-picture" className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600">
                            <IoImage size={12} />
                        </label>
                    </div>
                    <div className="flex-1">
                        <Input placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
                    </div>
                </div>
                <textarea placeholder="Group Description (optional)" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows="2" />
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Add Members</label>
                    <div className="relative">
                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg">
                            <IoSearch className="ml-3 text-gray-400" />
                            <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-3 py-2 bg-transparent focus:outline-none" />
                        </div>
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                {searchResults.map((user) => (
                                    <div key={user.id} onClick={() => addMember(user)} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                                        <Avatar src={user.profile_picture} size={6} />
                                        <div className="ml-2">
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-gray-500">@{user.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {selectedMembers.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Selected Members ({selectedMembers.length})</label>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                    <div className="flex items-center">
                                        <Avatar src={member.profile_picture} size={6} />
                                        <div className="ml-2">
                                            <p className="text-sm font-medium">{member.name}</p>
                                            <p className="text-xs text-gray-500">@{member.username}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeMember(member.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-full"><IoClose size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={loading || !groupName.trim() || selectedMembers.length === 0}>{loading ? 'Creating...' : 'Create Group'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateGroupModal;