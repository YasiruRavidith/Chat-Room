// Hook for automatically marking messages as read when they come into view
import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

export const useMessageVisibility = (message) => {
    const { markMessageAsRead } = useChatStore();
    const { user } = useAuthStore();
    const elementRef = useRef(null);
    const hasBeenMarkedRead = useRef(false);

    const markAsRead = useCallback(async () => {
        // Only mark as read if:
        // 1. Current user is not the sender
        // 2. Message hasn't been read by current user
        // 3. We haven't already tried to mark it as read
        if (message && 
            message.sender !== user?.id && 
            !message.is_read_by_current_user && 
            !hasBeenMarkedRead.current) {
            
            hasBeenMarkedRead.current = true;
            try {
                await markMessageAsRead(message.id);
            } catch (error) {
                console.error('Failed to mark message as read:', error);
                hasBeenMarkedRead.current = false; // Reset on error to allow retry
            }
        }
    }, [message, markMessageAsRead, user?.id]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Reset the flag when message changes
        hasBeenMarkedRead.current = false;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        // Message is at least 50% visible
                        markAsRead();
                    }
                });
            },
            {
                threshold: 0.5, // Trigger when 50% of the message is visible
                rootMargin: '0px 0px -50px 0px' // Only consider messages that are not at the very bottom
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [message?.id, markAsRead]);

    return elementRef;
};
