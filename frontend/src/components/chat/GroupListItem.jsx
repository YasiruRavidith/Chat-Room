import React from 'react';
import Avatar from '../common/Avatar';
import { useAuthStore } from '../../store/authStore';
import { getPrivateChatName } from '../../lib/utils';

const GroupListItem = ({ group, isSelected, onSelect }) => {
    const currentUser = useAuthStore(state => state.user);
    const displayName = getPrivateChatName(group, currentUser);
    const unreadCount = group.unread_count || 0;    return (
        <div
            onClick={onSelect}
            className={`flex items-center p-3 md:p-4 cursor-pointer border-l-4 relative transition-colors touch-manipulation ${
                isSelected ? 'bg-blue-100 border-blue-500' : 'border-transparent hover:bg-gray-200 active:bg-gray-300'
            }`}
            style={{ minHeight: '60px' }} // Ensure touch-friendly height
        >
            <div className="relative flex-shrink-0">
                <Avatar src={group.group_picture} size={10} />
                {unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </div>
            <div className="flex-1 ml-3 min-w-0">
                <div className="flex items-center justify-between">
                    <p className={`truncate text-sm md:text-base ${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                        {displayName}
                    </p>
                    {unreadCount > 0 && (
                        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0 ml-2">
                            <span className="text-xs font-medium text-red-600 hidden sm:inline">
                                {unreadCount} new
                            </span>
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                    )}
                </div>
                {/* <p className="text-sm text-gray-500 truncate">Last message...</p> */}
            </div>
            {/* <div className="text-xs text-gray-400">10:30 AM</div> */}
        </div>
    );
};

export default GroupListItem;