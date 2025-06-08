import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import PrivateRoute from './components/layout/PrivateRoute';
import Spinner from './components/common/Spinner';

function App() {
    const { isAuthenticated, fetchUser, accessToken } = useAuthStore();
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const init = async () => {
            if (accessToken) {
                await fetchUser();
            }
            setLoading(false);
        };
        init();
    }, [accessToken, fetchUser]);
    
    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center"><Spinner size="16" /></div>;
    }

    return (
        <Router>
            <Toaster position="top-center" reverseOrder={false} />
            <Routes>
                <Route path="/auth" element={isAuthenticated ? <Navigate to="/" /> : <AuthPage />} />
                <Route element={<PrivateRoute />}>
                    <Route path="/" element={<ChatPage />} />
                </Route>
                <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/auth"} />} />
            </Routes>
        </Router>
    );
}

export default App;