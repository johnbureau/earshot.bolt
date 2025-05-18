import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Search, X, Send, ChevronLeft, Calendar, ChevronDown, ChevronRight, PlusCircle, User } from 'lucide-react';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format, isAfter, isToday, isYesterday } from 'date-fns';
import { Chat as ChatType, Event } from '../types';

interface EventDropdownProps {
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const EventDropdown: React.FC<EventDropdownProps> = ({ events, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-30">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="block p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            onClick={onClose}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <div className="text-sm text-gray-500 mt-1">
                  {format(new Date(event.event_date), 'MMMM d, yyyy')}
                </div>
                {event.location && (
                  <div className="text-sm text-gray-500 mt-1">
                    {event.location}
                  </div>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-400 mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const Chat: React.FC = () => {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatType[]>([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatData, setChatData] = useState<ChatType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileList, setShowMobileList] = useState(window.innerWidth >= 1024);
  const [showActiveEvents, setShowActiveEvents] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const chatListRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowMobileList(true);
      } else {
        setShowMobileList(!id);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setShowMobileList(!id);
    }
  }, [id]);

  useEffect(() => {
    if (!profile) return;

    const fetchChats = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('chats')
          .select(`
            *,
            event:events(title),
            host:profilesv2!host_id(*),
            creator:profilesv2!creator_id(*)
          `)
          .or(`host_id.eq.${profile.id},creator_id.eq.${profile.id}`)
          .order('last_message_at', { ascending: false });

        if (fetchError) throw fetchError;
        setChats(data || []);
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load chats');
      }
    };

    fetchChats();

    const sub = supabase
      .channel('chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => fetchChats())
      .subscribe();

    return () => sub.unsubscribe();
  }, [profile]);

  useEffect(() => {
    if (!id || !profile) return;

    const fetchChatData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch chat details
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .select(`
            *,
            event:events(*),
            host:profilesv2!host_id(*),
            creator:profilesv2!creator_id(*)
          `)
          .eq('id', id)
          .maybeSingle();

        if (chatError) throw chatError;
        if (!chat) throw new Error('Chat not found');
        if (chat.host_id !== profile.id && chat.creator_id !== profile.id) {
          throw new Error('You do not have permission to view this chat');
        }

        setChatData(chat);

        // Fetch messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`*, sender:profilesv2(*)`)
          .eq('chat_id', id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messages || []);

        // Set up real-time subscription for new messages
        const subscription = supabase
          .channel('messages')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages', 
              filter: `chat_id=eq.${id}` 
            },
            async (payload) => {
              const { data: newMessage } = await supabase
                .from('messages')
                .select(`*, sender:profilesv2(*)`)
                .eq('id', payload.new.id)
                .single();

              if (newMessage) {
                setMessages(current => [...current, newMessage]);
              }
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error('Error loading chat:', err);
        setError(err.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [id, profile]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatData) return;

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatData.id,
          sender_id: profile?.id,
          content: newMessage.trim()
        })
        .select(`*, sender:profilesv2(*)`)
        .single();

      if (error) throw error;

      setMessages(current => [...current, message]);
      setNewMessage('');

      // Update last_message_at
      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatData.id);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const filteredChats = chats.filter(chat => {
    const other = chat.host_id === profile?.id ? chat.creator : chat.host;
    const name = getDisplayName(other);
    const s = searchQuery.toLowerCase();
    return name.toLowerCase().includes(s) || chat.event?.title?.toLowerCase().includes(s);
  });

  const formatLastMessageTime = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'h:mm a')}`;
    } else {
      return format(messageDate, 'M/d h:mm a');
    }
  };

  if (loading && !chats.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Get the other user in the chat
  const otherUser = chatData ? (
    chatData.host_id === profile?.id ? chatData.creator : chatData.host
  ) : null;

  // Get active and past events
  const activeEvents = events.filter(event => isAfter(new Date(event.event_date), new Date()));
  const pastEvents = events.filter(event => !isAfter(new Date(event.event_date), new Date()));

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Chat List */}
      <div
        className={`
          w-full sm:w-80 flex-none bg-white border-r border-gray-200 flex flex-col
          ${showMobileList ? 'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)]' : 'hidden'}
          lg:relative lg:top-0 lg:left-0 lg:z-0 lg:h-auto lg:block
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${showMobileList ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex-none p-4 border-b border-gray-200 bg-white">
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => navigate('/profiles')}
              icon={<PlusCircle size={16} />}
            >
              Start New Chat
            </Button>
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-custom">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No chats yet</p>
              <p className="text-sm mt-1">Start a conversation from an event or profile</p>
            </div>
          ) : (
            filteredChats.map(chat => {
              const other = chat.host_id === profile?.id ? chat.creator : chat.host;
              const name = getDisplayName(other);
              const isActive = chat.id === id;
              return (
                <Link 
                  key={chat.id} 
                  to={`/chats/${chat.id}`} 
                  className={`block p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${isActive ? 'bg-primary-50' : ''}`}
                  onClick={() => setShowMobileList(false)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar src={other?.avatar_url} fallback={name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
                        <span className="text-xs text-gray-500">{formatLastMessageTime(chat.last_message_at)}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{chat.event?.title}</p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {showMobileList && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setShowMobileList(false)}
        />
      )}

      {/* Chat Content */}
      {chatData ? (
        <div className="flex-1 flex flex-col h-full">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="lg:hidden -ml-2 p-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft size={24} />
                </button>
                <Avatar src={otherUser?.avatar_url} fallback={getDisplayName(otherUser)} size="md" />
                <div>
                  <h2 className="font-medium text-gray-900">{getDisplayName(otherUser)}</h2>
                  <p className="text-sm text-gray-500">{chatData.event?.title}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full hidden sm:flex"
                  onClick={() => navigate(`/profiles/${otherUser?.id}`)}
                >
                  <User size={20} />
                </Button>
                
                <div className="relative sm:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                  >
                    <User size={20} />
                  </Button>

                  {showMobileMenu && (
                    <>
                      <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        {activeEvents.length > 0 && (
                          <button
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setShowActiveEvents(true);
                              setShowMobileMenu(false);
                            }}
                          >
                            Active Events
                          </button>
                        )}
                        {pastEvents.length > 0 && (
                          <button
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setShowPastEvents(true);
                              setShowMobileMenu(false);
                            }}
                          >
                            Past Events
                          </button>
                        )}
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            navigate(`/profiles/${otherUser?.id}`);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className="flex items-center">
                            <User size={16} className="mr-2" />
                            View Profile
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gray-50 p-6 scrollbar-custom">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isOwn = message.sender_id === profile?.id;
                  const showDate = index === 0 || format(new Date(message.created_at), 'yyyy-MM-dd') !== format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd');
                  const senderName = getDisplayName(message.sender);
                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {format(new Date(message.created_at), 'PPP')}
                          </div>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {!isOwn && (
                          <Avatar
                            src={message.sender?.avatar_url}
                            fallback={senderName}
                            size="sm"
                            className="mr-2 mt-2"
                          />
                        )}
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200'}`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
                            {format(new Date(message.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-20">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="rounded-full px-6"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a chat to start messaging
            </h3>
            <p className="text-gray-500">
              Choose from your conversations on the left
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;