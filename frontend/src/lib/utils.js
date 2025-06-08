import { formatDistanceToNow, parseISO } from 'date-fns';

export const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
        return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch (error) {
        console.error("Error formatting timestamp:", error);
        return 'just now';
    }
};

// Helper to get a display name for a private chat
export const getPrivateChatName = (group, currentUser) => {
    if (!group || group.group_type !== 'private' || !currentUser) {
        return group?.name || 'Group Chat';
    }
    const otherMember = group.members.find(member => member.id !== currentUser.id);
    return otherMember ? otherMember.name : 'Unknown User';
};