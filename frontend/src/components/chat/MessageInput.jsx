import React, { useState, useRef, useCallback } from 'react';
import { IoSend, IoAttach, IoClose, IoImage, IoDocument } from 'react-icons/io5';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !file) return;

        setSending(true);
        
        // Stop typing indicator
        sendTypingStatus(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        try {
            const formData = new FormData();
            formData.append('group', selectedGroup.id);
            if (content.trim()) {
                formData.append('content', content);
            }
            if (file) {
                formData.append('file_attachment', file);
            }

            await api.post(API_URLS.MESSAGES(selectedGroup.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setContent('');
            setFile(null);
            setFilePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            toast.error("Failed to send message.");
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const handleContentChange = useCallback((e) => {
        const newContent = e.target.value;
        setContent(newContent);

        // Send typing indicator
        if (newContent.trim()) {
            sendTypingStatus(true);
            
            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Stop typing indicator after 1 second of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingStatus(false);
            }, 1000);
        } else {
            sendTypingStatus(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    }, [sendTypingStatus]);
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Check file size (10MB limit)
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);

        // Create preview for images
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Cleanup typing timeout on unmount
    React.useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            sendTypingStatus(false);
        };
    }, [sendTypingStatus]);

    return (
        <div className="p-4 bg-white border-t border-gray-200">
            {/* File Preview */}
            {file && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {filePreview ? (
                                <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                            ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                    <IoDocument className="text-gray-500" size={24} />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-200"
                        >
                            <IoClose size={20} />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                <input 
                    ref={fileInputRef}
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <label 
                    htmlFor="file-upload" 
                    className="p-2 text-gray-500 hover:text-blue-500 cursor-pointer transition-colors"
                >
                    <IoAttach size={24} />
                </label>
                
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={handleContentChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows="1"
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={(!content.trim() && !file) || sending}
                    className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <IoSend size={20} />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;