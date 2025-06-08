import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import { API_URLS } from '../api/urls';
import Modal from './common/Modal';
import Input from './common/Input';
import Button from './common/Button';
import { toast } from 'react-hot-toast';

const ProfileSettings = ({ isOpen, onClose }) => {
    const { user, updateUser, fetchUser } = useAuthStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        offline_mode_enabled: false,
        offline_ai_message: '',
    });
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [isPictureRemoved, setIsPictureRemoved] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Reset state and populate form when modal opens
    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                username: user.username || '',
                offline_mode_enabled: user.offline_mode_enabled || false,
                offline_ai_message: user.offline_ai_message || '',
            });
            // Reset picture-related state each time
            setProfilePictureFile(null);
            setIsPictureRemoved(false);
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePictureFile(file);
            // If user selects a new file, we are no longer in a "removed" state
            setIsPictureRemoved(false);
        }
    };

    const handleRemovePicture = () => {
        setIsPictureRemoved(true);
        setProfilePictureFile(null);
        // Clear the file input visually
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let response;
            // Case 1: A new file is selected. Use multipart/form-data.
            if (profilePictureFile) {
                const updateData = new FormData();
                Object.keys(formData).forEach(key => {
                    updateData.append(key, formData[key]);
                });
                updateData.append('profile_picture', profilePictureFile);

                response = await api.patch(API_URLS.USER_PROFILE, updateData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                // Case 2: No new file. Use application/json.
                // This handles text-only updates and picture removal.
                const updatePayload = { ...formData };
                if (isPictureRemoved) {
                    updatePayload.profile_picture = null;
                }
                
                response = await api.patch(API_URLS.USER_PROFILE, updatePayload, {
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Common success logic for both cases
            updateUser(response.data);
            await fetchUser(); // Re-fetch to get fresh data, including the updated/removed image URL
            toast.success('Profile updated successfully!');
            onClose();

        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Failed to update profile.';
            toast.error(errorMessage);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const currentPictureUrl = user?.profile_picture;
    const showCurrentPicture = currentPictureUrl && !isPictureRemoved;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                    {showCurrentPicture && (
                        <div className="mt-2 flex items-center space-x-4">
                             <img 
                                src={currentPictureUrl} 
                                alt="Current profile" 
                                className="h-16 w-16 rounded-full object-cover" 
                             />
                             <div className='flex space-x-4'><Button type="button" onClick={handleRemovePicture} variant="danger" size="xs">
                                 Remove
                             </Button></div>
                             
                        </div>
                    )}
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        ref={fileInputRef}
                        className="mt-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                        accept="image/*"
                    />
                </div>
                <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} />
                <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
                <Input name="username" placeholder="Username" value={formData.username} onChange={handleChange} />
                <div className="flex items-center">
                    <input
                        id="offline_mode_enabled"
                        type="checkbox"
                        name="offline_mode_enabled"
                        checked={formData.offline_mode_enabled}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="offline_mode_enabled" className="ml-2 block text-sm text-gray-900">
                        Enable Offline AI Assistant
                    </label>
                </div>
                {formData.offline_mode_enabled && (
                     <textarea
                        name="offline_ai_message"
                        value={formData.offline_ai_message}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Custom offline message..."
                    />
                )}
                <Button type="submit" disabled={loading} fullWidth>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Modal>
    );
};

export default ProfileSettings;