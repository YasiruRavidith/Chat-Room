import React, {useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import Input from '../common/Input';
import Button from '../common/Button';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore(state => state.login);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(username, password);
            toast.success('Logged in successfully!');
        } catch (error) {
            toast.error('Login failed. Please check your credentials.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input type="password" name="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
            </Button>
        </form>
    );
};

export default LoginForm;