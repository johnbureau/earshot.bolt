import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Search, MapPin, Filter, Mail, Calendar, X, MessageSquare } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Profile } from '../types';
import { format } from 'date-fns';

interface UserModalProps {
  user: Profile | null;
  onClose: () => void;
  onSendMessage: (user: Profile) => void;
  isSendingMessage: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSendMessage, isSendingMessage }) => {
  if (!user) return null;

  const displayName = user.Name || user.Email?.split('@')[0] || 'Unknown User';
  const createdAt = new Date(user.created_at);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Profile Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-6">
            <Avatar
              src={user.avatar_url}
              fallback={displayName}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">{displayName}</h3>
                <Badge
                  variant={user.role === 'host' ? 'primary' : 'accent'}
                  size="sm"
                >
                  {user.role}
                </Badge>
              </div>

              {user.location && (
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin size={16} className="mr-2" />
                  <span>{user.location}</span>
                </div>
              )}

              <div className="flex items-center text-gray-600 mb-2">
                <Mail size={16} className="mr-2" />
                <span>{user.Email}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar size={16} className="mr-2" />
                <span>Joined {format(createdAt, 'MMMM yyyy')}</span>
              </div>
            </div>
          </div>

          {user.Description && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
              <p className="text-gray-600 whitespace-pre-line">{user.Description}</p>
            </div>
          )}

          {user['User Sub-Type'] && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {user.role === 'host' ? 'Venue Type' : 'Musician Type'}
              </h4>
              <Badge variant="secondary" size="sm">
                {user['User Sub-Type']}
              </Badge>
            </div>
          )}

          {user['Song Types'] && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Music Genre</h4>
              <Badge variant="secondary" size="sm">
                {user['Song Types']}
              </Badge>
            </div>
          )}

          {user.Instruments && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Instruments</h4>
              <Badge variant="secondary" size="sm">
                {user.Instruments}
              </Badge>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSendingMessage}
            >
              Close
            </Button>
            <Button
              icon={<MessageSquare size={16} />}
              onClick={() => onSendMessage(user)}
              isLoading={isSendingMessage}
            >
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Opportunities: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    // Redirect hosts to events page
    if (profile?.role === 'host') {
      navigate('/events');
      return;
    }

    const fetchOpportunities = async () => {
      if (!profile) return;
      
      setLoading(true);
      try {
        // Get events that are:
        // 1. Seeking creators
        // 2. Published
        // 3. Not created by current user
        // 4. Don't have any approved applications
        const { data: eventsData } = await supabase
          .from('events')
          .select(`
            *,
            creator:profilesv2(*),
            applications(
              id,
              status
            )
          `)
          .eq('seeking_creators', true)
          .eq('status', 'published')
          .neq('creator_id', profile.id)
          .order('event_date', { ascending: true });

        // Filter out events that have approved applications
        const availableEvents = (eventsData || []).filter(event => 
          !event.applications?.some(app => app.status === 'approved')
        );

        setEvents(availableEvents);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [profile, navigate]);

  const handleSendMessage = async (user: Profile) => {
    if (!profile) {
      navigate('/login');
      return;
    }
    
    setIsSendingMessage(true);
    try {
      // Check for existing chat
      const { data: existingChats, error: queryError } = await supabase
        .from('chats')
        .select('id')
        .or(
          `and(host_id.eq.${profile.id},creator_id.eq.${user.id}),` +
          `and(host_id.eq.${user.id},creator_id.eq.${profile.id})`
        );

      if (queryError) throw queryError;

      if (existingChats && existingChats.length > 0) {
        // Use existing chat
        navigate(`/chats/${existingChats[0].id}`);
        return;
      }

      // Create new chat
      const chatData = {
        host_id: profile.role === 'host' ? profile.id : user.id,
        creator_id: profile.role === 'creator' ? profile.id : user.id,
        last_message_at: new Date().toISOString()
      };

      const { data: newChat, error: insertError } = await supabase
        .from('chats')
        .insert(chatData)
        .select()
        .single();

      if (insertError) throw insertError;

      navigate(`/chats/${newChat.id}`);
    } catch (error) {
      console.error('Error managing chat:', error);
    } finally {
      setIsSendingMessage(false);
      setSelectedUser(null);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || event.category === categoryFilter;
    const matchesLocation = !locationFilter || event.location === locationFilter;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  const categories = Array.from(new Set(events.map(event => event.category).filter(Boolean)));
  const locations = Array.from(new Set(events.map(event => event.location).filter(Boolean)));

  const upcomingEvents = filteredEvents.filter(event => 
    new Date(event.event_date) >= new Date()
  );

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom max-w-5xl py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
              <p className="text-sm text-gray-500 mt-1">
                Find events looking for creators like you
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search size={18} />}
                className="w-full sm:w-64"
              />

              <Button
                variant="outline"
                size="sm"
                icon={<Filter size={18} />}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="input"
                value={categoryFilter || ''}
                onChange={(e) => setCategoryFilter(e.target.value || null)}
              >
                <option value="">All categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                className="input"
                value={locationFilter || ''}
                onChange={(e) => setLocationFilter(e.target.value || null)}
              >
                <option value="">All locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom max-w-5xl py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full">
              <MapPin size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No opportunities found
            </h3>
            <p className="text-gray-500">
              Check back later for new opportunities or try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedUser(event.creator)}
                className="cursor-pointer"
              >
                <div className="bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-300">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={event.creator?.avatar_url}
                      fallback={getDisplayName(event.creator)}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600">
                          {event.title}
                        </h3>
                        <Badge variant="primary" size="sm">
                          {event.category}
                        </Badge>
                      </div>

                      <div className="flex items-center text-gray-600 mt-1">
                        <Calendar size={14} className="mr-1.5 flex-shrink-0" />
                        <span>{format(new Date(event.event_date), 'MMMM d, yyyy')}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-gray-600 mt-1">
                          <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {event.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        <Link to={`/events/${event.id}`}>
                          <Button size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<MessageSquare size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendMessage(event.creator!);
                          }}
                        >
                          Message Host
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <UserModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSendMessage={handleSendMessage}
        isSendingMessage={isSendingMessage}
      />
    </div>
  );
};

export default Opportunities;