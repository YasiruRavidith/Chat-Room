import React, { useState, useCallback, useEffect } from 'react';
import api from '../../api';
import { API_URLS } from '../../api/urls';
import { useChatStore } from '../../store/chatStore';
import Avatar from '../common/Avatar';
import { IoPersonAdd, IoChatbubble, } from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import debounce from 'lodash.debounce';

const UserSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { createPrivateChat, blockUser, unblockUser, blockedUsers, fetchBlockedUsers } = useChatStore();

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const debouncedSearch = useCallback(
        debounce(async (searchQuery) => {
            if (searchQuery.length > 1) {
                setLoading(true);
                try {
                    const response = await api.get(API_URLS.USER_SEARCH(searchQuery));
                    setResults(response.data.users || []);
                } catch (error) {
                    console.error("Search failed:", error);
                    toast.error("Search failed");
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300),
        []
    );

    const handleQueryChange = (e) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        debouncedSearch(newQuery);
    };

    const handleUserSelect = async (user) => {
        try {
            await createPrivateChat(user.id);
            setQuery('');
            setResults([]);
            toast.success(`Started chat with ${user.name}`);
        } catch (error) {
            toast.error("Failed to start chat");
        }
    };

    const handleBlockUser = async (userId, userName) => {
        try {
            await blockUser(userId);
            toast.success(`Blocked ${userName}`);
            setResults(results.filter(user => user.id !== userId));
        } catch (error) {
            toast.error("Failed to block user");
        }
    };

    const handleUnblockUser = async (userId, userName) => {
        try {
            await unblockUser(userId);
            toast.success(`Unblocked ${userName}`);
        } catch (error) {
            toast.error("Failed to unblock user");
        }
    };

    const isUserBlocked = (userId) => {
        return blockedUsers.some(blocked => blocked.blocked_user.id === userId);
    };    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Search users to chat..."
                value={query}
                onChange={handleQueryChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {loading && (
                <div className="absolute top-12 left-0 w-full text-center p-2 bg-white border border-gray-200 rounded-lg shadow">
                    Searching...
                </div>
            )}
            {query && results.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((user) => {
                        const isBlocked = isUserBlocked(user.id);
                        return (
                            <li
                                key={user.id}
                                className="flex items-center justify-between p-3 hover:bg-gray-50"
                            >
                                <div className="flex items-center flex-1">
                                    <Avatar 
                                        src={user.profile_picture} 
                                        size={8} 
                                        isOnline={user.is_online}
                                    />
                                    <div className="ml-3">
                                        <p className="font-semibold text-gray-800">{user.name}</p>
                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {!isBlocked ? (
                                        <>
                                            <button
                                                onClick={() => handleUserSelect(user)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                                title="Start Chat"
                                            >
                                                <IoChatbubble size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleBlockUser(user.id, user.name)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Block User"
                                            >
                                                <IoPersonAdd size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleUnblockUser(user.id, user.name)}
                                            className="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors"
                                        >
                                            Unblock
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            {query && results.length === 0 && !loading && (
                <div className="absolute top-12 left-0 w-full text-center p-4 bg-white border border-gray-200 rounded-lg shadow text-gray-500">
                    No users found
                </div>
            )}
        </div>
    );
};

export default UserSearch;