import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { formatTimestamp } from '../../lib/utils';
import Avatar from '../common/Avatar';
import MessageContextMenu from './MessageContextMenu';
import { useMessageVisibility } from '../../hooks/useMessageVisibility';
// Import icons for read status indicators
import { IoCheckmark, IoCheckmarkDone, IoDownload, IoSparkles, IoEyeOutline, IoEye } from 'react-icons/io5';

// Wrap the component with React.memo
const Message = React.memo(({ message }) => {
    const { user } = useAuthStore();
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    
    // Use the visibility hook for automatic read marking
    const messageRef = useMessageVisibility(message);
    
    // The backend sends sender info in different structures for API vs WebSocket
    const senderId = message.sender || message.sender_id;
    const isSender = senderId === user.id;
    const senderInfo = message.sender_info || { name: message.sender_name, profile_picture: null };
    
    // NEW: Check if the message is from the AI assistant
    const isAI = message.message_type === 'ai_response';

    const handleContextMenu = (e) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    const renderAttachment = (attachment) => {
        if (!attachment) return null;
        
        const attachmentUrl = attachment.startsWith('http') ? attachment : `${process.env.REACT_APP_API_BASE_URL}${attachment}`;
        const isImage = attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const fileName = attachment.split('/').pop().split('?')[0];
        
        if (isImage) {
            return (
                <div className="mt-2">
                    <img 
                        src={attachmentUrl} 
                        alt="Attachment" 
                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(attachmentUrl, '_blank')}
                    />
                </div>
            );
        } else {
            return (
                <div className={`mt-2 p-2 rounded-lg flex items-center space-x-2 cursor-pointer ${isAI ? 'bg-purple-200/50 hover:bg-purple-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                     onClick={() => window.open(attachmentUrl, '_blank')}>
                    <IoDownload className="text-gray-600" />
                    <span className="text-sm text-gray-700">{fileName}</span>
                </div>
            );
        }
    };    const renderReadStatus = () => {
        if (isAI) return null; // Don't show read status for AI messages
        
        if (isSender) {
            // For sender's messages, show delivery/read status
            const status = message.read_status || message.status || 'sent';
            const readBy = message.read_by || [];
            
            return (
                <div className="inline-flex items-center ml-1" title={`Status: ${status}${readBy.length > 0 ? ` • Read by ${readBy.length} user(s)` : ''}`}>
                    {status === 'sent' && <IoCheckmark className="text-gray-400 text-xs" />}
                    {status === 'delivered' && <IoCheckmarkDone className="text-gray-400 text-xs" />}
                    {status === 'read' && <IoCheckmarkDone className="text-blue-400 text-xs" />}
                    {readBy.length > 0 && (
                        <span className="text-xs text-blue-400 ml-1">
                            {readBy.length}
                        </span>
                    )}
                </div>
            );
        } else {
            // For received messages, show read/unread indicator
            const isRead = message.is_read_by_current_user;
            
            return (
                <div className="inline-flex items-center ml-1" title={isRead ? 'Read' : 'Unread'}>
                    {isRead ? (
                        <IoEye className="text-blue-400 text-xs" />
                    ) : (
                        <IoEyeOutline className="text-gray-400 text-xs" />
                    )}
                </div>
            );
        }
    };

    if (!message || !message.created_at) {
        return null;
    }    // UPDATED: Determine message bubble style based on sender, AI status, and read status
    const getBubbleClasses = () => {
        if (isSender) {
            return 'bg-blue-500 text-white';
        }
        if (isAI) {
            // A nice gradient for AI messages
            return 'bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800';
        }
        
        // For received messages, add subtle styling based on read status
        const isRead = message.is_read_by_current_user;
        if (isRead) {
            return 'bg-gray-200 text-gray-800';
        } else {
            return 'bg-gray-200 text-gray-800 border-l-4 border-blue-400';
        }
    };    return (
        <div ref={messageRef} className={`flex items-start my-2 ${isSender ? 'justify-end' : ''}`}>
            {/* If it's an AI message, show a sparkle icon instead of the user's avatar */}
            {!isSender && (
                isAI ? (
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-200">
                        <IoSparkles className="text-purple-600" />
                    </div>
                ) : (
                    <Avatar src={senderInfo?.profile_picture} size={8} />
                )
            )}            <div className={`mx-2 max-w-lg`}>
                {!isSender && (
                    // UPDATED: Add read status indicator next to sender name for received messages
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500 flex items-center">
                            {senderInfo?.name}
                            {isAI && <span className="ml-1.5 font-semibold text-purple-600">(AI Assistant)</span>}
                        </p>
                        {!isAI && (
                            <div className="flex items-center">
                                {message.is_read_by_current_user ? (
                                    <span className="text-xs text-blue-500 font-medium">Read</span>
                                ) : (
                                    <span className="text-xs text-gray-400 font-medium">Unread</span>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <div
                    className={`px-4 py-2 rounded-lg cursor-pointer ${getBubbleClasses()}`}
                    onContextMenu={handleContextMenu}
                >
                    {message.content && <p className="text-sm break-words">{message.content}</p>}
                    {renderAttachment(message.file_attachment)}
                </div>
                <div className={`flex items-center text-xs text-gray-400 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
                    <span>{formatTimestamp(message.created_at)}</span>
                    {renderReadStatus()}
                </div>
            </div>
            
            <MessageContextMenu
                isOpen={showContextMenu}
                position={contextMenuPosition}
                message={message}
                onClose={() => setShowContextMenu(false)}
            />
        </div>
    );
});

export default Message;