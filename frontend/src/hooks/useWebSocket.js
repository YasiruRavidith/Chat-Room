import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { WEBSOCKET_URLS } from '../api/urls';
import notificationService from '../services/notificationService';

export const useWebSocket = () => {
    const { accessToken, isAuthenticated } = useAuthStore();
    const { selectedGroup, addMessage, updateMessageStatus, updateOnlineUsers } = useChatStore();
    const chatSocketRef = useRef(null);
    const notificationSocketRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState({
        notifications: 'disconnected',
        chat: 'disconnected'
    });
    const [typingUsers, setTypingUsers] = useState([]);

    const connect = useCallback((url, onMessage, socketType = 'default') => {
        if (!accessToken || !isAuthenticated) {
            console.log(`🔒 No access token available for ${socketType} WebSocket`);
            return null;
        }

        console.log(`🔗 Connecting to ${socketType} WebSocket:`, url);
        const socket = new WebSocket(`${url}?token=${accessToken}`);

        socket.onopen = () => {
            console.log(`✅ ${socketType} WebSocket connected successfully`);
            setConnectionStatus(prev => ({ ...prev, [socketType]: 'connected' }));
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`📨 ${socketType} message received:`, data);
                onMessage(data);
            } catch (error) {
                console.error(`❌ Error parsing ${socketType} message:`, error);
            }
        };        socket.onclose = (event) => {
            console.log(`🔌 ${socketType} WebSocket closed:`, event.code, event.reason);
            setConnectionStatus(prev => ({ ...prev, [socketType]: 'disconnected' }));
            
            // Reconnect after delay if it wasn't a manual close
            if (event.code !== 1000 && accessToken && isAuthenticated) {
                console.log(`🔄 Attempting to reconnect ${socketType} WebSocket in 3 seconds...`);
                setTimeout(() => connect(url, onMessage, socketType), 3000);
            }
        };

        socket.onerror = (error) => {
            console.error(`❌ ${socketType} WebSocket error:`, error);
            setConnectionStatus(prev => ({ ...prev, [socketType]: 'error' }));
        };

        return socket;
    }, [accessToken, isAuthenticated]);

    // Notification WebSocket Effect
    useEffect(() => {
        if (!accessToken || !isAuthenticated) return;

        const handleNotificationMessage = (data) => {
            switch (data.type) {
                case 'user_status':
                    updateOnlineUsers(data.online_users || []);
                    // Show notification for user status changes
                    if (data.user_info && data.status) {
                        notificationService.showUserStatusNotification(
                            data.user_info.name,
                            data.status
                        );
                    }
                    break;
                case 'new_message_notification':
                    console.log('🔔 New message notification:', data);
                    break;
                case 'group_update':
                    console.log('👥 Group update:', data);
                    // Show notification for group updates
                    if (data.message) {
                        notificationService.showGroupUpdateNotification(data.message);
                    }
                    break;
                case 'group_invite':
                    console.log('📥 Group invite:', data);
                    // Show notification for group invites
                    if (data.group_name && data.inviter_name) {
                        notificationService.showGroupInviteNotification(
                            data.group_name,
                            data.inviter_name
                        );
                    }
                    break;
                default:
                    console.log('❓ Unknown notification type:', data);
            }
        };

        notificationSocketRef.current = connect(
            WEBSOCKET_URLS.NOTIFICATIONS, 
            handleNotificationMessage, 
            'notifications'
        );

        return () => {
            if (notificationSocketRef.current) {
                notificationSocketRef.current.close();
                notificationSocketRef.current = null;
            }
        };
    }, [connect, accessToken, isAuthenticated, updateOnlineUsers]);

    // Chat WebSocket Effect
    useEffect(() => {
        if (!selectedGroup || !accessToken || !isAuthenticated) {
            if (chatSocketRef.current) {
                chatSocketRef.current.close();
                chatSocketRef.current = null;
            }
            return;
        }

        const handleChatMessage = (data) => {
            switch (data.type) {
                case 'chat_message':
                    const newMessage = {
                        id: data.message_id || new Date().getTime(),
                        content: data.message,
                        sender_info: data.sender_info,
                        sender: data.sender_id,
                        message_type: data.message_type || 'text',
                        file_attachment: data.file_attachment,
                        status: data.status || 'sent',
                        created_at: data.timestamp || new Date().toISOString(),
                    };
                    
                    addMessage(newMessage);
                    
                    // Show notification for new messages from other users
                    if (data.sender_id !== useAuthStore.getState().user?.id) {
                        notificationService.showMessageNotification(
                            newMessage,
                            selectedGroup?.name || 'Chat',
                            data.sender_info?.name || 'Someone'
                        );
                    }
                    break;
                case 'typing':
                    setTypingUsers(prev => {
                        const filtered = prev.filter(user => user.id !== data.sender_id);
                        if (data.is_typing) {
                            return [...filtered, { id: data.sender_id, name: data.sender_name }];
                        }
                        return filtered;
                    });
                    
                    // Show typing notification
                    if (data.is_typing && data.sender_id !== useAuthStore.getState().user?.id) {
                        notificationService.showTypingNotification(
                            data.sender_name || 'Someone',
                            selectedGroup?.name || 'Chat'
                        );
                    }
                    
                    // Auto-remove typing status after 3 seconds
                    setTimeout(() => {
                        setTypingUsers(prev => prev.filter(user => user.id !== data.sender_id));
                    }, 3000);
                    break;
                case 'message_status':
                    updateMessageStatus(data.message_id, data.status);
                    break;
                case 'ai_response':
                    addMessage({
                        id: data.message_id || new Date().getTime(),
                        content: data.message,
                        sender_info: { name: 'AI Assistant', profile_picture: null },
                        sender: 'ai',
                        message_type: 'ai_response',
                        created_at: data.timestamp || new Date().toISOString(),
                    });
                    break;
                default:
                    console.log('❓ Unknown chat message type:', data);
            }
        };

        chatSocketRef.current = connect(
            WEBSOCKET_URLS.CHAT(selectedGroup.id), 
            handleChatMessage, 
            'chat'
        );

        return () => {
            if (chatSocketRef.current) {
                chatSocketRef.current.close();
                chatSocketRef.current = null;
            }
            setTypingUsers([]);
        };
    }, [selectedGroup, connect, addMessage, updateMessageStatus, accessToken, isAuthenticated]);

    const sendChatMessage = useCallback((message, messageType = 'text') => {
        if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
            const messageData = {
                type: 'chat_message',
                message: message,
                message_type: messageType,
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 Sending chat message:', messageData);
            chatSocketRef.current.send(JSON.stringify(messageData));
            return true;
        } else {
            console.error('❌ Chat WebSocket is not connected');
            return false;
        }
    }, []);

    const sendTypingStatus = useCallback((isTyping = true) => {
        if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
            const typingData = {
                type: 'typing',
                is_typing: isTyping,
                timestamp: new Date().toISOString()
            };
            
            chatSocketRef.current.send(JSON.stringify(typingData));
            return true;
        }
        return false;
    }, []);

    const updateUserStatus = useCallback((status = 'online') => {
        if (notificationSocketRef.current?.readyState === WebSocket.OPEN) {
            const statusData = {
                type: 'user_status',
                status: status,
                timestamp: new Date().toISOString()
            };
            
            notificationSocketRef.current.send(JSON.stringify(statusData));
            return true;
        }
        return false;
    }, []);

    return { 
        sendChatMessage, 
        sendTypingStatus, 
        updateUserStatus,
        connectionStatus,
        typingUsers,
        isConnected: connectionStatus.notifications === 'connected' || connectionStatus.chat === 'connected'
    };
};