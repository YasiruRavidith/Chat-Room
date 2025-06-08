// filepath: src/hooks/useWebSocket.js

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { WEBSOCKET_URLS } from '../api/urls';
import notificationService from '../services/notificationService';

export const useWebSocket = () => {
    const { accessToken, user: currentUser } = useAuthStore();
    const { selectedGroup, addMessage, updateMessageStatus, fetchGroups } = useChatStore();
    const chatSocketRef = useRef(null);
    const notificationSocketRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState({
        notifications: 'disconnected',
        chat: 'disconnected'
    });
    const [typingUsers, setTypingUsers] = useState([]);

    const connectSocket = useCallback((url, onMessage, onOpen, onClose, onError, socketType) => {
        if (!accessToken) {
            console.log(`[WebSocket] Auth token not found. Cannot connect to ${socketType}.`);
            return null;
        }

        console.log(`[WebSocket] Connecting to ${socketType} at ${url}`);
        const socket = new WebSocket(`${url}?token=${accessToken}`);

        socket.onopen = onOpen;
        socket.onclose = onClose;
        socket.onerror = onError;
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (e) {
                console.error(`[WebSocket] Error parsing message for ${socketType}:`, e);
            }
        };

        return socket;
    }, [accessToken]);


    // --- Notification WebSocket Effect ---
    useEffect(() => {
        const onOpen = () => setConnectionStatus(prev => ({ ...prev, notifications: 'connected' }));
        const onClose = () => setConnectionStatus(prev => ({ ...prev, notifications: 'disconnected' }));
        const onError = (err) => console.error('[WebSocket] Notifications error:', err);
        const onMessage = (data) => {
            console.log('[WebSocket] Notification received:', data);
            if (data.type === 'new_message' && selectedGroup?.id !== data.group_id) {
                notificationService.showMessageNotification(data.message, data.group_name, data.sender);
                fetchGroups(); // Refresh list to show unread status
            }
            // Add other notification types here (e.g., user_status)
        };
        
        notificationSocketRef.current = connectSocket(WEBSOCKET_URLS.NOTIFICATIONS, onMessage, onOpen, onClose, onError, 'notifications');

        return () => {
            if (notificationSocketRef.current) {
                notificationSocketRef.current.close(1000, "Component unmounting");
                notificationSocketRef.current = null;
            }
        };
    }, [accessToken, connectSocket, fetchGroups, selectedGroup?.id]);


    // --- Chat Room WebSocket Effect ---
    useEffect(() => {
        if (!selectedGroup) {
             if (chatSocketRef.current) {
                chatSocketRef.current.close(1000, "Leaving group");
                chatSocketRef.current = null;
            }
            return;
        }

        const onOpen = () => setConnectionStatus(prev => ({ ...prev, chat: 'connected' }));
        const onClose = () => setConnectionStatus(prev => ({ ...prev, chat: 'disconnected' }));
        const onError = (err) => console.error(`[WebSocket] Chat error for group ${selectedGroup.id}:`, err);
        const onMessage = (data) => {
            console.log('[WebSocket] Chat message received:', data);
            switch(data.type) {
                case 'chat_message':
                    // The backend should send a complete message object.
                    // The 'addMessage' function in the store will add it to the state.
                    addMessage(data);
                    break;
                case 'typing_indicator':
                    // This logic correctly handles adding/removing typing users.
                    setTypingUsers(prev => {
                        const isUserTyping = prev.some(u => u.user_id === data.user_id);
                        if (data.is_typing && !isUserTyping) {
                            return [...prev, { user_id: data.user_id, name: data.user }];
                        }
                        if (!data.is_typing && isUserTyping) {
                            return prev.filter(u => u.user_id !== data.user_id);
                        }
                        return prev;
                    });
                    break;
                case 'error':
                    // Handle errors sent from the backend consumer
                    console.error(`[WebSocket] Backend Error: ${data.message}`);
                    break;
                default:
                    console.warn(`[WebSocket] Unknown message type: ${data.type}`);
            }
        };

        chatSocketRef.current = connectSocket(WEBSOCKET_URLS.CHAT(selectedGroup.id), onMessage, onOpen, onClose, onError, 'chat');

        return () => {
            if (chatSocketRef.current) {
                chatSocketRef.current.close(1000, "Switching group");
                chatSocketRef.current = null;
            }
            setTypingUsers([]); // Clear typing users when leaving a group
        };
    }, [selectedGroup, accessToken, addMessage, connectSocket]);


    // --- Functions to send data to WebSockets ---

    const sendChatMessage = useCallback((messageContent) => {
        if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
            chatSocketRef.current.send(JSON.stringify({
                type: 'chat_message',
                message: messageContent,
                // The backend consumer will get the sender from the scope
            }));
            return true;
        }
        console.error('[WebSocket] Cannot send message, chat socket is not open.');
        return false;
    }, []);

    const sendTypingStatus = useCallback((isTyping) => {
        if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
            chatSocketRef.current.send(JSON.stringify({
                type: 'typing',
                is_typing: isTyping
            }));
        }
    }, []);

    return { 
        sendChatMessage, 
        sendTypingStatus, 
        connectionStatus,
        typingUsers,
    };
};