// filepath: src/hooks/useWebSocket.js

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { WEBSOCKET_URLS } from '../api/urls';
import notificationService from '../services/notificationService';

export const useWebSocket = () => {
    const { accessToken } = useAuthStore();
    const { selectedGroup, addMessage, fetchGroups, updateMessageStatus, updateMessageReadStatus } = useChatStore();
    const chatSocketRef = useRef(null);
    const notificationSocketRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState({
        notifications: 'disconnected',
        chat: 'disconnected'
    });
    const [typingUsers, setTypingUsers] = useState([]);

    const connectSocket = useCallback((url, onMessage, onOpen, onClose, onError, socketType) => {
        if (!accessToken) {
            console.log(`[WebSocket] Auth token not found for ${socketType}. Cannot connect.`);
            return null;
        }

        console.log(`[WebSocket] Connecting to ${socketType}...`);
        const socket = new WebSocket(`${url}?token=${accessToken}`);

        socket.onopen = onOpen;
        socket.onclose = onClose;
        socket.onerror = onError;
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (e) {
                console.error(`[WebSocket] Error parsing message for ${socketType}:`, e, event.data);
            }
        };

        return socket;
    }, [accessToken]);


    // --- Notification WebSocket Effect ---
    useEffect(() => {
        const onOpen = () => {
            console.log('[WebSocket] Notifications connected.');
            setConnectionStatus(prev => ({ ...prev, notifications: 'connected' }));
        };
        const onClose = () => {
            console.log('[WebSocket] Notifications disconnected.');
            setConnectionStatus(prev => ({ ...prev, notifications: 'disconnected' }));
        };
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
            }
        };
    }, [accessToken, connectSocket, fetchGroups, selectedGroup?.id]);


    // --- Chat Room WebSocket Effect ---
    useEffect(() => {
        // Disconnect from previous chat socket if one exists
        if (chatSocketRef.current) {
            chatSocketRef.current.close(1000, "Switching group");
        }

        if (!selectedGroup) {
            setConnectionStatus(prev => ({ ...prev, chat: 'disconnected' }));
            return;
        }

        const onOpen = () => {
            console.log(`[WebSocket] Chat connected to group ${selectedGroup.id}.`);
            setConnectionStatus(prev => ({ ...prev, chat: 'connected' }));
        };
        const onClose = () => {
            console.log(`[WebSocket] Chat disconnected from group ${selectedGroup.id}.`);
            setConnectionStatus(prev => ({ ...prev, chat: 'disconnected' }));
        };
        const onError = (err) => console.error(`[WebSocket] Chat error for group ${selectedGroup.id}:`, err);
          // THIS IS THE CORRECTED onMessage HANDLER
        const onMessage = (data) => {
            console.log('[WebSocket] Chat data received:', data);

            // The backend consumer sends two types of data:
            // 1. An object with a 'type' key for events like typing.
            // 2. A full message object when a message is broadcast. This object will NOT have a 'type' key.
              if (data.type === 'typing' || data.type === 'typing_indicator') {
                // Handle typing indicator - backend sends 'typing_indicator' type
                console.log('[WebSocket] Processing typing indicator:', data);
                setTypingUsers(prev => {
                    const isUserTyping = prev.some(u => u.user_id === data.user_id);
                    if (data.is_typing && !isUserTyping) {
                        return [...prev, { user_id: data.user_id, name: data.user }];
                    }
                    if (!data.is_typing && isUserTyping) {
                        return prev.filter(u => u.user_id !== data.user_id);
                    }
                    return prev;
                });            }else if (data.type === 'message_status_update') {
                // Handle real-time message status updates
                console.log('[WebSocket] Processing message status update:', data);
                
                if (data.bulk_update && data.message_ids) {
                    // Handle bulk status updates (e.g., mark all as read)
                    data.message_ids.forEach(messageId => {
                        updateMessageStatus(messageId, data.status);
                    });
                } else if (data.message_id) {
                    // Handle single message status update
                    updateMessageStatus(data.message_id, data.status);
                }
                
                // Refresh groups list to update unread counts in sidebar
                setTimeout(() => {
                    fetchGroups();
                }, 200);
            }else if (data.id && data.sender !== undefined) {
                // This is a message object (it has an 'id' and 'sender' key).
                // The 'addMessage' function in the store will add it to the state.
                addMessage(data);
            } else {
                 console.warn(`[WebSocket] Unknown message format received:`, data);
            }
        };

        chatSocketRef.current = connectSocket(WEBSOCKET_URLS.CHAT(selectedGroup.id), onMessage, onOpen, onClose, onError, 'chat');

        return () => {
            if (chatSocketRef.current) {
                chatSocketRef.current.close(1000, "Component unmounting or group changed");
            }
            setTypingUsers([]); // Clear typing users when leaving a group
        };
    }, [selectedGroup, accessToken, addMessage, connectSocket, updateMessageStatus, updateMessageReadStatus]);


    // --- Functions to send data to WebSockets ---

    const sendChatMessage = useCallback((messageContent) => {
        if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
            // This is for sending messages directly from client to websocket consumer.
            // This is less common. The primary way is via API.
            chatSocketRef.current.send(JSON.stringify({
                type: 'chat_message',
                message: messageContent,
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
        // sendChatMessage is not used by MessageInput, but kept for potential future use
        sendChatMessage, 
        sendTypingStatus, 
        connectionStatus,
        typingUsers,
    };
};