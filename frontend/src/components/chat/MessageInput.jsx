// filepath: src/components/chat/MessageInput.jsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { IoSend, IoAttach, IoClose, IoDocument } from 'react-icons/io5';
import api from '../../api';
import { API_URLS } from '../../api/urls';
import { useChatStore } from '../../store/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { toast } from 'react-hot-toast';

const MessageInput = () => {
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const selectedGroup = useChatStore(state => state.selectedGroup);
    const { sendTypingStatus } = useWebSocket();

    // THIS FUNCTION IS CORRECT. It relies on the server to broadcast the message.
    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!content.trim() && !file) || !selectedGroup) return;

        setSending(true);
        sendTypingStatus(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        try {
            const formData = new FormData();
            formData.append('group', selectedGroup.id);
            if (content.trim()) formData.append('content', content);
            if (file) formData.append('file_attachment', file);

            // 1. Send the message to the server via HTTP POST.
            // The server will save it and then broadcast it via WebSocket.
            await api.post(API_URLS.MESSAGES(selectedGroup.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // 2. The UI will update automatically when the WebSocket hook receives the broadcast.
            //    We do NOT need to manually call `addMessage` here.

            // 3. Clear the input fields for the next message.
            setContent('');
            setFile(null);
            setFilePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error) {
            toast.error("Failed to send message.");
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    // --- The rest of the component is also correct ---

    const handleContentChange = useCallback((e) => {
        const newContent = e.target.value;
        setContent(newContent);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (newContent.trim()) {
            sendTypingStatus(true);
            typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 2000);
        } else {
            sendTypingStatus(false);
        }
    }, [sendTypingStatus]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }
        setFile(selectedFile);
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(selectedFile);
        } else {
            setFilePreview(null);
        }
    };

    const removeFile = () => {
        setFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);
    return (
        <div className="p-3 md:p-4 bg-white border-t border-gray-200">
            {file && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {filePreview ? (
                                <img src={filePreview} alt="Preview" className="w-10 md:w-12 h-10 md:h-12 object-cover rounded" />
                            ) : (
                                <div className="w-10 md:w-12 h-10 md:h-12 bg-gray-200 rounded flex items-center justify-center">
                                    <IoDocument className="text-gray-500" size={20} />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button onClick={removeFile} className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-200 flex-shrink-0">
                            <IoClose size={20} />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end space-x-2 md:space-x-3">
                <label htmlFor="file-upload" className="p-2 text-gray-500 hover:text-blue-500 cursor-pointer transition-colors flex-shrink-0">
                    <IoAttach size={20} />
                </label>
                <input ref={fileInputRef} type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.txt,.zip" />
                
                <div className="flex-1 min-w-0">
                    <textarea
                        value={content}
                        onChange={handleContentChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="w-full px-3 md:px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm md:text-base"
                        rows="1"
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                        }}
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={(!content.trim() && !file) || sending}
                    className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                    <IoSend size={18} />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;