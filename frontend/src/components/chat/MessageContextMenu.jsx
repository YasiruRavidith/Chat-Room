import React, { useState, useEffect } from 'react';
import { IoTrash, IoArrowRedo, IoCopy, IoFlag } from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

const MessageContextMenu = ({ isOpen, position, message, onClose }) => {
    const { deleteMessage } = useChatStore();
    const { user } = useAuthStore();
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        setShowMenu(isOpen);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isOpen, onClose]);

    const handleCopyMessage = () => {
        if (message.content) {
            navigator.clipboard.writeText(message.content);
            toast.success('Message copied to clipboard');
        }
        onClose();
    };

    const handleDeleteMessage = async () => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                await deleteMessage(message.id);
                toast.success('Message deleted');
            } catch (error) {
                toast.error('Failed to delete message');
            }
        }
        onClose();
    };

    const handleForwardMessage = () => {
        toast.info('Forward feature coming soon!');
        onClose();
    };

    const handleReportMessage = () => {
        toast.info('Report feature coming soon!');
        onClose();
    };

    if (!isOpen || !message) return null;

    const isSender = message.sender === user?.id;

    return (
        <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]"
            style={{
                top: position.y,
                left: position.x,
                transform: 'translate(-50%, -10px)'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {message.content && (
                <button
                    onClick={handleCopyMessage}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                    <IoCopy className="mr-3" size={16} />
                    Copy Text
                </button>
            )}

            <button
                onClick={handleForwardMessage}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
                <IoArrowRedo className="mr-3" size={16} />
                Forward
            </button>

            {isSender && (
                <button
                    onClick={handleDeleteMessage}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                    <IoTrash className="mr-3" size={16} />
                    Delete
                </button>
            )}

            {!isSender && (
                <button
                    onClick={handleReportMessage}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                    <IoFlag className="mr-3" size={16} />
                    Report
                </button>
            )}
        </div>
    );
};

export default MessageContextMenu;
