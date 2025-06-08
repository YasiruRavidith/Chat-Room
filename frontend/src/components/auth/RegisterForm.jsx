import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../api';
import { API_URLS } from '../../api/urls';

const RegisterForm = ({ onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(API_URLS.REGISTER, formData);
            toast.success('Registration successful! Please log in.');
            onRegisterSuccess();
        } catch (error) {
            toast.error('Registration failed. Please try again.');
            console.error(error.response?.data || error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
            <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <Input name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
            <Input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
            <Button type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </Button>
        </form>
    );
};

export default RegisterForm;