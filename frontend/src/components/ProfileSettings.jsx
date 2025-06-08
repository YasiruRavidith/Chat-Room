import React, { useState, useEffect } from 'react';
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
    const [profilePicture, setProfilePicture] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                username: user.username || '',
                offline_mode_enabled: user.offline_mode_enabled || false,
                offline_ai_message: user.offline_ai_message || '',
            });
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleFileChange = (e) => {
        setProfilePicture(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const updateData = new FormData();
        Object.keys(formData).forEach(key => {
            updateData.append(key, formData[key]);
        });
        if (profilePicture) {
            updateData.append('profile_picture', profilePicture);
        }

        try {
            const response = await api.patch(API_URLS.USER_PROFILE, updateData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            updateUser(response.data); // Update zustand store
            await fetchUser(); // re-fetch to get fresh data like image URL
            toast.success('Profile updated successfully!');
            onClose();
        } catch (error) {
            toast.error('Failed to update profile.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                    <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm" />
                </div>
                <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} />
                <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
                <Input name="username" placeholder="Username" value={formData.username} onChange={handleChange} />
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="offline_mode_enabled"
                        checked={formData.offline_mode_enabled}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
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
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Custom offline message..."
                    />
                )}
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Modal>
    );
};

export default ProfileSettings;