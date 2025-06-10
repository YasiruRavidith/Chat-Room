const API_BASE_URL = 'http://192.168.1.101:8000/api';
const WS_BASE_URL = 'ws://192.168.1.101:8000';

export const API_URLS = {
    BASE: API_BASE_URL,
    
    // Auth
    LOGIN: `${API_BASE_URL}/token/`,
    REFRESH_TOKEN: `${API_BASE_URL}/token/refresh/`,
    REGISTER: `${API_BASE_URL}/users/register/`,
    LOGOUT: `${API_BASE_URL}/token/blacklist/`,
    
    // User
    USER_INFO: `${API_BASE_URL}/users/info/`,
    USER_PROFILE: `${API_BASE_URL}/users/profile/`,
    USER_SEARCH: (query) => `${API_BASE_URL}/users/search/?q=${query}`,
    BLOCK_USER: `${API_BASE_URL}/users/block/`,
    UNBLOCK_USER: (userId) => `${API_BASE_URL}/users/unblock/${userId}/`,
    BLOCKED_USERS: `${API_BASE_URL}/users/blocked/`,
      // Groups & Chats
    GROUPS: `${API_BASE_URL}/groups/`,
    CREATE_PRIVATE_CHAT: `${API_BASE_URL}/groups/private/create/`,
    GROUP_DETAIL: (groupId) => `${API_BASE_URL}/groups/${groupId}/`,
    LEAVE_GROUP: (groupId) => `${API_BASE_URL}/groups/${groupId}/leave/`,
    DELETE_GROUP: (groupId) => `${API_BASE_URL}/groups/${groupId}/`,
    REMOVE_MEMBER: (groupId) => `${API_BASE_URL}/groups/${groupId}/remove-member/`,
      // Messages
    MESSAGES: (groupId) => `${API_BASE_URL}/groups/${groupId}/messages/`,
    DELETE_MESSAGE: (messageId) => `${API_BASE_URL}/messages/${messageId}/`,
    MESSAGE_STATUS: (messageId) => `${API_BASE_URL}/messages/${messageId}/status/`,
    MARK_MESSAGES_READ: (groupId) => `${API_BASE_URL}/groups/${groupId}/messages/read/`,
    
    // AI
    AI_CONFIG: `${API_BASE_URL}/ai/config/`,
};

export const WEBSOCKET_URLS = {
    NOTIFICATIONS: `${WS_BASE_URL}/ws/notifications/`,
    CHAT: (groupId) => `${WS_BASE_URL}/ws/chat/${groupId}/`,
};