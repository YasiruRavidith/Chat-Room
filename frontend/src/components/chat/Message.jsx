import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { formatTimestamp } from '../../lib/utils';
import Avatar from '../common/Avatar';
import MessageContextMenu from './MessageContextMenu';
import { IoCheckmark, IoCheckmarkDone, IoDownload } from 'react-icons/io5';

const Message = ({ message }) => {
    const { user } = useAuthStore();
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const isSender = message.sender === user.id;

    const handleContextMenu = (e) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    const renderAttachment = (attachment) => {
        if (!attachment) return null;
        
        const isImage = attachment.includes('image/') || attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const fileName = attachment.split('/').pop();
        
        if (isImage) {
            return (
                <div className="mt-2">
                    <img 
                        src={attachment} 
                        alt="Attachment" 
                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(attachment, '_blank')}
                    />
                </div>
            );
        } else {
            return (
                <div className="mt-2 p-2 bg-gray-100 rounded-lg flex items-center space-x-2 cursor-pointer hover:bg-gray-200"
                     onClick={() => window.open(attachment, '_blank')}>
                    <IoDownload className="text-gray-600" />
                    <span className="text-sm text-gray-700">{fileName}</span>
                </div>
            );
        }
    };

    const renderReadStatus = () => {
        if (!isSender) return null;
        
        const status = message.status || 'sent';
        return (
            <div className="inline-flex items-center ml-1">
                {status === 'delivered' && <IoCheckmark className="text-gray-400 text-xs" />}
                {status === 'read' && <IoCheckmarkDone className="text-blue-400 text-xs" />}
            </div>
        );
    };    return (
        <div className={`flex items-start my-2 ${isSender ? 'justify-end' : ''}`}>
            {!isSender && <Avatar src={message.sender_info?.profile_picture} size={8} />}
            <div className={`mx-2 max-w-lg`}>
                {!isSender && (
                    <p className="text-xs text-gray-500 mb-1">{message.sender_info?.name}</p>
                )}
                <div
                    className={`px-4 py-2 rounded-lg cursor-pointer ${
                        isSender ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                    }`}
                    onContextMenu={handleContextMenu}
                >
                    {message.content && <p className="text-sm">{message.content}</p>}
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
};

export default Message;