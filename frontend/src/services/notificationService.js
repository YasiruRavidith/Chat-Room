import { toast } from 'react-hot-toast';

class NotificationService {
    constructor() {
        this.permission = null;
        this.initializePermission();
    }

    async initializePermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
        }
    }

    async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        }
        return false;
    }

    showNotification(title, options = {}) {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return;
        }

        if (this.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'chat-notification',
                renotify: true,
                ...options
            });

            // Auto close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            return notification;
        } else if (this.permission === 'default') {
            this.requestPermission().then(granted => {
                if (granted) {
                    this.showNotification(title, options);
                }
            });
        }
    }

    showMessageNotification(message, groupName, senderName) {
        // Don't show notification if tab is active
        if (!document.hidden) {
            return;
        }

        const title = `${senderName} in ${groupName}`;
        const options = {
            body: message.content || 'Sent a file',
            icon: message.sender_info?.profile_picture || '/favicon.ico',
            data: {
                messageId: message.id,
                groupId: message.group,
                senderId: message.sender
            },
            actions: [
                {
                    action: 'reply',
                    title: 'Reply'
                },
                {
                    action: 'mark-read',
                    title: 'Mark as Read'
                }
            ]
        };

        return this.showNotification(title, options);
    }

    showTypingNotification(senderName, groupName) {
        if (!document.hidden) {
            return;
        }

        const title = `${senderName} is typing...`;
        const options = {
            body: `In ${groupName}`,
            silent: true,
            tag: `typing-${senderName}`,
            data: {
                type: 'typing',
                sender: senderName,
                group: groupName
            }
        };

        return this.showNotification(title, options);
    }

    showUserOnlineNotification(userName) {
        if (!document.hidden) {
            return;
        }

        const title = `${userName} is now online`;
        const options = {
            silent: true,
            tag: `online-${userName}`,
            data: {
                type: 'user-online',
                user: userName
            }
        };

        return this.showNotification(title, options);
    }

    showGroupInviteNotification(groupName, inviterName) {
        const title = 'New Group Invitation';
        const options = {
            body: `${inviterName} invited you to join ${groupName}`,
            data: {
                type: 'group-invite',
                group: groupName,
                inviter: inviterName
            }
        };

        return this.showNotification(title, options);
    }

    isSupported() {
        return 'Notification' in window;
    }

    isPermissionGranted() {
        return this.permission === 'granted';
    }

    getPermissionStatus() {
        return this.permission;
    }
}

// Create a singleton instance
const notificationService = new NotificationService();

// Handle notification clicks
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification-click') {
            // Handle notification click actions
            const { action, data } = event.data;
            
            switch (action) {
                case 'reply':
                    // Focus the chat window and scroll to the message
                    window.focus();
                    break;
                case 'mark-read':
                    // Mark message as read
                    console.log('Marking message as read:', data.messageId);
                    break;
                default:
                    // Default action - focus the window
                    window.focus();
            }
        }
    });
}

export default notificationService;
