import React, { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import ChatHeader from './ChatHeader';
import Message from './Message';
import MessageInput from './MessageInput';
import Spinner from '../common/Spinner';
import { IoMenuOutline } from 'react-icons/io5';

const ChatWindow = ({ onToggleSidebar }) => {
    const { selectedGroup, messages, loading } = useChatStore();
    const { sendChatMessage, typingUsers, connectionStatus } = useWebSocket();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const previousMessageCountRef = useRef(0);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ 
            behavior: "smooth",
            block: "end"
        });
    }, []);

    // Auto-scroll when new messages arrive
    useEffect(() => {
        const currentMessageCount = messages.length;
        const previousMessageCount = previousMessageCountRef.current;
        
        // Only scroll if new messages were added
        if (currentMessageCount > previousMessageCount) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
        
        previousMessageCountRef.current = currentMessageCount;
    }, [messages, scrollToBottom]);

    // Auto-scroll when switching groups
    useEffect(() => {
        if (selectedGroup && messages.length > 0) {
            setTimeout(() => {
                scrollToBottom();
            }, 200);
        }
    }, [selectedGroup, scrollToBottom]);

    if (loading) {
        return <div className="flex-1 flex justify-center items-center"><Spinner /></div>;
    }    if (!selectedGroup) {
        return (
            <div className="flex-1 flex flex-col bg-gray-50 relative">
                {/* Mobile sidebar toggle button for welcome screen */}
                <div className="md:hidden absolute top-4 left-4 z-10">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <IoMenuOutline size={24} className="text-gray-700" />
                    </button>
                </div>
                
                <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500 px-4">
                    <div className="max-w-md mx-auto">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4">Welcome to ChatApp</h2>
                        <p className="text-base md:text-lg mb-2">Start a conversation by searching for users</p>
                        <p className="text-sm">or create a group chat to get started!</p>
                        
                        {/* Connection Status */}
                        <div className="mt-6 p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-xs text-gray-600">
                                Connection Status: 
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                    connectionStatus.chat === 'connected' || connectionStatus.notifications === 'connected'
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {connectionStatus.chat === 'connected' || connectionStatus.notifications === 'connected'
                                        ? 'Connected' 
                                        : 'Disconnected'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Fixed Header */}
            <div className="flex-shrink-0">
                <ChatHeader group={selectedGroup} onToggleSidebar={onToggleSidebar} />
            </div>
            
            {/* Scrollable Messages Area */}
            <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-50"
                style={{ maxHeight: 'calc(100vh - 140px)' }}
            >
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <Message 
                                key={`${message.id}-${index}`} 
                                message={message} 
                            />
                        ))}
                        
                        {/* Typing Indicator */}
                        {typingUsers.length > 0 && (
                            <div className="flex items-center space-x-2 mt-4 text-gray-500 text-sm animate-pulse">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span>
                                    {typingUsers.length === 1 
                                        ? `${typingUsers[0].name} is typing...`
                                        : `${typingUsers.length} people are typing...`
                                    }
                                </span>
                            </div>
                        )}
                        {/* Auto-scroll anchor point */}
                        <div ref={messagesEndRef} className="h-4" />
                    </>
                )}
            </div>
            
            {/* Fixed Message Input */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                <MessageInput sendChatMessage={sendChatMessage} />
            </div>
        </div>
    );
};

export default ChatWindow;