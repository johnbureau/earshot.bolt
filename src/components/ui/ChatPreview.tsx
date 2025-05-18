import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import Avatar from './Avatar';
import Badge from './Badge';
import { Chat } from '../../types';

interface ChatPreviewProps {
  chat: Chat;
  currentUserId: string;
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ chat, currentUserId }) => {
  const otherUser = chat.host_id === currentUserId ? chat.creator : chat.host;
  const isOnline = false; // TODO: Implement online status

  // Get user's display name using consistent format
  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  const userDisplayName = getDisplayName(otherUser);

  return (
    <Link to={`/chats/${chat.id}`}>
      <div className="group bg-white hover:bg-gray-50 transition-colors p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Avatar with online indicator */}
          <div className="relative">
            <Avatar
              src={otherUser?.avatar_url}
              fallback={userDisplayName}
              size="md"
            />
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white rounded-full" />
            )}
          </div>

          {/* Chat info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600">
                  {userDisplayName}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {chat.event?.title}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500">
                  {format(new Date(chat.last_message_at), 'h:mm a')}
                </span>
                {chat.unread_count && chat.unread_count > 0 && (
                  <Badge variant="primary" size="sm" rounded>
                    {chat.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ChatPreview;