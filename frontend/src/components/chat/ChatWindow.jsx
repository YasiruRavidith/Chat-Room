import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import ChatHeader from './ChatHeader';
import Message from './Message';
import MessageInput from './MessageInput';
import Spinner from '../common/Spinner';

const ChatWindow = () => {
    const { selectedGroup, messages, loading } = useChatStore();
    const { sendChatMessage, typingUsers, connectionStatus } = useWebSocket();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (loading) {
        return <div className="flex-1 flex justify-center items-center"><Spinner /></div>;
    }

    if (!selectedGroup) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500 bg-gray-50">
                <div className="max-w-md mx-auto">
                    <h2 className="text-2xl font-semibold mb-4">Welcome to ChatApp</h2>
                    <p className="text-lg mb-2">Start a conversation by searching for users</p>
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
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen">
            <ChatHeader group={selectedGroup} />
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <Message key={message.id} message={message} />
                    ))
                )}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex items-center space-x-2 mt-4 text-gray-500 text-sm">
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
                
                <div ref={messagesEndRef} />
            </div>
            
            <MessageInput sendChatMessage={sendChatMessage} />
        </div>
    );
};

export default ChatWindow;