import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, MoreVertical, Undo } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  type: string;
  link?: string;
}

interface NotificationsDropdownProps {
  notifications?: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications = [], // Provide empty array as default value
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAsUnread,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    if (updatingIds.has(id)) return;
    setError(null);
    
    try {
      setUpdatingIds(prev => new Set([...prev, id]));
      
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (updateError) throw updateError;

      // If update was successful, update the UI
      onMarkAsRead(id);
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError('Failed to update notification. Please try again.');
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    if (updatingIds.has(id)) return;
    setError(null);
    
    try {
      setUpdatingIds(prev => new Set([...prev, id]));
      
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: false })
        .eq('id', id);

      if (updateError) throw updateError;

      // If update was successful, update the UI
      onMarkAsUnread(id);
    } catch (err: any) {
      console.error('Error marking notification as unread:', err);
      setError('Failed to update notification. Please try again.');
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
        onClick={onClose}
      />

      <div className={`
        fixed lg:absolute 
        inset-x-0 top-16 lg:top-auto lg:right-0 lg:left-auto
        lg:mt-2 
        lg:w-80 
        bg-white 
        lg:rounded-lg 
        shadow-lg 
        border border-gray-100 
        overflow-hidden 
        z-50
        max-h-[calc(100vh-4rem)] lg:max-h-[32rem]
        flex flex-col
      `}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-error-50 border-b border-error-100 text-error-700 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => {
              const isUpdating = updatingIds.has(notification.id);
              
              const NotificationLink = ({ children }: { children: React.ReactNode }) => (
                notification.link ? (
                  <Link 
                    to={notification.link}
                    className="block"
                    onClick={async (e) => {
                      e.preventDefault(); // Prevent navigation until update completes
                      if (!notification.read) {
                        await handleMarkAsRead(notification.id);
                        if (!error) { // Only navigate if update was successful
                          onClose();
                          window.location.href = notification.link;
                        }
                      } else {
                        onClose();
                        window.location.href = notification.link;
                      }
                    }}
                  >
                    {children}
                  </Link>
                ) : (
                  <div onClick={async () => {
                    if (!notification.read) {
                      await handleMarkAsRead(notification.id);
                    }
                  }}>
                    {children}
                  </div>
                )
              );

              return (
                <div key={notification.id} className="relative">
                  <NotificationLink>
                    <div className={`
                      p-4 border-b border-gray-100 cursor-pointer
                      ${notification.read ? 'bg-white' : 'bg-blue-50'}
                      hover:bg-gray-50 transition-colors duration-200
                      pr-12
                      ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
                    `}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full" />
                        )}
                      </div>
                    </div>
                  </NotificationLink>

                  <button
                    className="absolute right-2 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === notification.id ? null : notification.id);
                    }}
                    disabled={isUpdating}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {activeMenu === notification.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-50" 
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-2 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (notification.read) {
                              await handleMarkAsUnread(notification.id);
                            } else {
                              await handleMarkAsRead(notification.id);
                            }
                            if (!error) {
                              setActiveMenu(null);
                            }
                          }}
                          disabled={isUpdating}
                        >
                          <Undo size={16} className="mr-2" />
                          Mark as {notification.read ? 'unread' : 'read'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <Link
            to="/notifications"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotificationsDropdown;