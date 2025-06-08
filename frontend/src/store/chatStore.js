// filepath: src/store/chatStore.js

import { create } from 'zustand';
import api from '../api';
import { API_URLS } from '../api/urls';

export const useChatStore = create((set, get) => ({
    groups: [],
    selectedGroup: null,
    messages: [],
    loading: false,
    blockedUsers: [],
    onlineUsers: [],

    fetchGroups: async () => {
        try {
            const response = await api.get(API_URLS.GROUPS);
            set({ groups: response.data.results || [] });
        } catch (error) {
            console.error("Failed to fetch groups", error);
        }
    },

    fetchBlockedUsers: async () => {
        try {
            const response = await api.get(API_URLS.BLOCKED_USERS);
            // The response for blocked users is a list of `BlockedUser` objects
            // We need to extract the actual user from `blocked_user` field
            const extractedUsers = response.data.map(item => item.blocked_user);
            set({ blockedUsers: extractedUsers || [] });
        } catch (error) {
            console.error("Failed to fetch blocked users", error);
        }
    },
    
    // --- THIS IS THE CORRECTED selectGroup FUNCTION ---
    selectGroup: async (group) => {
        // Set loading state immediately to give user feedback
        set({ selectedGroup: group, messages: [], loading: true });
        
        try {
            // Step 1: Fetch the messages for the selected group.
            const response = await api.get(API_URLS.MESSAGES(group.id));
            set({ messages: response.data.results || [] });

            // Step 2: After successfully fetching messages, mark them as read.
            // This prevents a potential race condition or database lock (especially in SQLite).
            await api.post(API_URLS.MARK_MESSAGES_READ(group.id));

            // Step 3: Refresh the groups list in the background to update unread counts.
            get().fetchGroups();

        } catch (error)
        {
            console.error("Failed to fetch messages or mark as read:", error);
            // Even if it fails, show an empty message list.
            set({ messages: [] });
        } finally {
            // Step 4: Always turn off the loading indicator.
            set({ loading: false });
        }
    },

    // --- THIS IS THE CORRECTED addMessage FUNCTION ---
    addMessage: (newMessage) => {
        // A message object from the WebSocket broadcast should have a unique ID.
        // We use this to prevent adding the same message twice.
        const messageId = newMessage.id || newMessage.message_id;

        set((state) => {
            // Check if a message with the same ID already exists.
            const messageExists = state.messages.some(msg => msg.id === messageId);

            if (messageExists) {
                // If it already exists, do nothing. Just return the current state.
                console.log(`[ChatStore] Duplicate message ${messageId} ignored.`);
                return state;
            }
            
            // If it's a new message, add it to the end of the array.
            return { messages: [...state.messages, newMessage] };
        });
    },

    // ... The rest of your functions are correct ...
    blockUser: async (userId) => {
        try {
            await api.post(API_URLS.BLOCK_USER, { user_id: userId });
            await get().fetchBlockedUsers();
        } catch (error) {
            console.error("Failed to block user", error);
            throw error;
        }
    },

    unblockUser: async (userId) => {
        try {
            // Unblock uses DELETE method on a specific URL
            await api.delete(API_URLS.UNBLOCK_USER(userId));
            await get().fetchBlockedUsers();
        } catch (error) {
            console.error("Failed to unblock user", error);
            throw error;
        }
    },
    
    updateMessageStatus: (messageId, status) => {
        set((state) => ({
            messages: state.messages.map(msg => 
                msg.id === messageId ? { ...msg, status } : msg
            )
        }));
    },

    deleteMessage: async (messageId) => {
        try {
            await api.delete(API_URLS.DELETE_MESSAGE(messageId));
            set((state) => ({
                messages: state.messages.filter(msg => msg.id !== messageId)
            }));
        } catch (error) {
            console.error("Failed to delete message", error);
            throw error;
        }
    },
    
    createPrivateChat: async (userId, callback) => {
        try {
            const response = await api.post(API_URLS.CREATE_PRIVATE_CHAT, { user_id: userId });
            const newGroup = response.data;
            set(state => ({
                groups: [newGroup, ...state.groups.filter(g => g.id !== newGroup.id)]
            }));
            get().selectGroup(newGroup);
            if(callback) callback(newGroup);
        } catch (error) {
            console.error("Failed to create private chat", error);
            throw error;
        }
    },

    createGroupChat: async (formData) => {
        try {
            const response = await api.post(API_URLS.GROUPS, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newGroup = response.data;
            set(state => ({
                groups: [newGroup, ...state.groups]
            }));
            get().selectGroup(newGroup);
            return newGroup;
        } catch (error) {
            console.error("Failed to create group chat", error);
            throw error;
        }
    },

    leaveGroup: async (groupId) => {
        try {
            await api.post(API_URLS.LEAVE_GROUP(groupId));
            set((state) => ({
                groups: state.groups.filter(g => g.id !== groupId),
                selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup,
                messages: state.selectedGroup?.id === groupId ? [] : state.messages
            }));
        } catch (error) {
            console.error("Failed to leave group", error);
            throw error;
        }
    },

    deleteChat: async (groupId) => {
        try {
            await api.delete(API_URLS.DELETE_GROUP(groupId));
            set((state) => ({
                groups: state.groups.filter(g => g.id !== groupId),
                selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup,
                messages: state.selectedGroup?.id === groupId ? [] : state.messages
            }));
        } catch (error) {
            console.error("Failed to delete chat", error);
            throw error;
        }
    },

    updateOnlineUsers: (users) => {
        set({ onlineUsers: users });
    },

    clearChatState: () => {
        set({ 
            groups: [], 
            selectedGroup: null, 
            messages: [], 
            blockedUsers: [],
            onlineUsers: []
        });
    }
}));