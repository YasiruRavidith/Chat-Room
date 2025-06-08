import React from 'react';
import Avatar from '../common/Avatar';
import { useAuthStore } from '../../store/authStore';
import { getPrivateChatName } from '../../lib/utils';

const GroupListItem = ({ group, isSelected, onSelect }) => {
    const currentUser = useAuthStore(state => state.user);
    const displayName = getPrivateChatName(group, currentUser);

    return (
        <div
            onClick={onSelect}
            className={`flex items-center p-3 cursor-pointer border-l-4 ${
                isSelected ? 'bg-blue-100 border-blue-500' : 'border-transparent hover:bg-gray-200'
            }`}
        >
            <Avatar src={group.group_picture} size={10} />
            <div className="flex-1 ml-3">
                <p className="font-semibold text-gray-800">{displayName}</p>
                {/* <p className="text-sm text-gray-500 truncate">Last message...</p> */}
            </div>
            {/* <div className="text-xs text-gray-400">10:30 AM</div> */}
        </div>
    );
};

export default GroupListItem;