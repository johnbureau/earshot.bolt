import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string;
}

const Notifications: React.FC = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
      setLoading(false);
    };

    fetchNotifications();

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-8">Notifications</h1>
      
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No notifications yet</p>
            <p>When you receive notifications, they'll appear here</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const NotificationContent = () => (
              <div className="flex items-start justify-between p-4">
                <div className="flex-grow">
                  <h4 className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2" />
                )}
              </div>
            );

            return (
              <div
                key={notification.id}
                className={`
                  hover:bg-gray-50 transition-colors duration-200
                  ${notification.read ? 'bg-white' : 'bg-blue-50'}
                `}
              >
                {notification.link ? (
                  <Link
                    to={notification.link}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <NotificationContent />
                  </Link>
                ) : (
                  <div onClick={() => handleMarkAsRead(notification.id)}>
                    <NotificationContent />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;