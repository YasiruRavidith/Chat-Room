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
            set({ blockedUsers: response.data.results || [] });
        } catch (error) {
            console.error("Failed to fetch blocked users", error);
        }
    },

    blockUser: async (userId) => {
        try {
            await api.post(API_URLS.BLOCK_USER, { blocked_user_id: userId });
            await get().fetchBlockedUsers(); // Re-fetch for consistency
        } catch (error) {
            console.error("Failed to block user", error);
            throw error;
        }
    },

    unblockUser: async (userId) => {
        try {
            await api.delete(API_URLS.UNBLOCK_USER(userId));
            await get().fetchBlockedUsers(); // Re-fetch for consistency
        } catch (error) {
            console.error("Failed to unblock user", error);
            throw error;
        }
    },

    selectGroup: async (group) => {
        set({ selectedGroup: group, messages: [], loading: true });
        try {
            const response = await api.get(API_URLS.MESSAGES(group.id));
            set({ messages: response.data.results || [], loading: false });
            await api.post(API_URLS.MARK_MESSAGES_READ(group.id));
        } catch (error) {
            console.error("Failed to fetch messages", error);
            set({ loading: false });
        }
    },

    addMessage: (message) => {
        set((state) => ({ messages: [...state.messages, message] }));
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

    // **This is the corrected and simplified function.**
    // It now expects a pre-built FormData object and sends it.
    createGroupChat: async (formData) => {
        try {
            const response = await api.post(API_URLS.GROUPS, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            const newGroup = response.data;
            set(state => ({
                // Add the new group to the top of the list
                groups: [newGroup, ...state.groups]
            }));
            
            // Automatically select the newly created group
            get().selectGroup(newGroup);
            
            return newGroup;
        } catch (error) {
            console.error("Failed to create group chat", error);
            throw error; // Re-throw the error so the component can catch it
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