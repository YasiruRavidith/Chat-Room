import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-center text-gray-800">
                    {isLogin ? 'Welcome Back!' : 'Create an Account'}
                </h2>
                {isLogin ? <LoginForm /> : <RegisterForm onRegisterSuccess={() => setIsLogin(true)} />}
                <div className="text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline">
                        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;