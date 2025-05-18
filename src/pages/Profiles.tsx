import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Search, MapPin, Filter, Calendar, X, MessageSquare } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Profile } from '../types';
import { format } from 'date-fns';
import Select from 'react-select';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

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

const stripePromise = loadStripe('pk_test_...'); // Your publishable key

const Profiles: React.FC = () => {
  const { id } = useParams();
  const { profile: currentProfile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let query = supabase
          .from('profilesv2')
          .select('*');

        if (id) {
          // If we have an ID, fetch just that user
          query = query.eq('id', id);
        } else {
          // Otherwise fetch all users
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;
        
        if (id && data && data.length > 0) {
          setSelectedUser(data[0]);
        }
        
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [id]);

  const handleSendMessage = async (user: Profile) => {
    if (!currentProfile) {
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
          `and(host_id.eq.${currentProfile.id},creator_id.eq.${user.id}),` +
          `and(host_id.eq.${user.id},creator_id.eq.${currentProfile.id})`
        );

      if (queryError) throw queryError;

      if (existingChats && existingChats.length > 0) {
        // Use existing chat
        navigate(`/chats/${existingChats[0].id}`);
        return;
      }

      // Create new chat
      const chatData = {
        host_id: currentProfile.role === 'host' ? currentProfile.id : user.id,
        creator_id: currentProfile.role === 'creator' ? currentProfile.id : user.id,
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = (
      user.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.Email?.split('@')[0].toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.Description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesLocation = !locationFilter || user.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;

    return matchesSearch && matchesLocation && matchesRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name':
        return (a.Name || '').localeCompare(b.Name || '');
      default:
        return 0;
    }
  });

  const locations = Array.from(new Set(users.filter(u => u.location).map(u => u.location))).sort();

  const getDisplayName = (user: Profile) => {
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom max-w-7xl py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {id ? 'Profile' : 'Profiles'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {id ? 'View user profile' : 'Connect with hosts and creators'}
              </p>
            </div>

            {!id && (
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:max-w-md">
                  <Input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    startIcon={<Search size={18} />}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters((prev) => !prev)}
                  icon={<Filter size={18} />}
                >
                  Filters
                </Button>
              </div>
            )}
          </div>

          {/* Filters */}
          {!id && showFilters && (
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    className="input w-full"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <option value="">All locations</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    className="input w-full"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All roles</option>
                    <option value="host">Hosts</option>
                    <option value="creator">Creators</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                  <select
                    className="input w-full"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLocationFilter('');
                      setRoleFilter('');
                      setSortBy('newest');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container-custom max-w-7xl py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : id ? (
          // Single user view
          selectedUser ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    <Avatar
                      src={selectedUser.avatar_url}
                      fallback={getDisplayName(selectedUser)}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{getDisplayName(selectedUser)}</h3>
                        <Badge
                          variant={selectedUser.role === 'host' ? 'primary' : 'accent'}
                          size="sm"
                        >
                          {selectedUser.role}
                        </Badge>
                      </div>

                      {selectedUser.location && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin size={16} className="mr-2" />
                          <span>{selectedUser.location}</span>
                        </div>
                      )}

                      {selectedUser.Description && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                          <p className="text-gray-600 whitespace-pre-line">{selectedUser.Description}</p>
                        </div>
                      )}

                      {currentProfile && currentProfile.id !== selectedUser.id && (
                        <div className="mt-6">
                          <Button
                            variant="primary"
                            onClick={() => handleSendMessage(selectedUser)}
                            disabled={isSendingMessage}
                            icon={<MessageSquare size={16} />}
                          >
                            Send Message
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                User not found
              </h3>
              <p className="text-gray-500">
                The user you're looking for doesn't exist or has been removed
              </p>
            </div>
          )
        ) : (
          // Community view
          sortedUsers.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedUsers.map((user) => (
                <div
                  key={user.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/profiles/${user.id}`)}
                >
                  <div className="bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-300">
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={user.avatar_url}
                        fallback={getDisplayName(user)}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600">
                            {getDisplayName(user)}
                          </h3>
                          <Badge
                            variant={user.role === 'host' ? 'primary' : 'accent'}
                            size="sm"
                          >
                            {user.role}
                          </Badge>
                        </div>
                        
                        {user.location && (
                          <div className="flex items-center text-gray-600 mt-1">
                            <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                            <span className="truncate">{user.location}</span>
                          </div>
                        )}

                        {user.Description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {user.Description}
                          </p>
                        )}

                        {user['User Sub-Type'] && (
                          <div className="mt-2">
                            <Badge variant="secondary" size="sm">
                              {user['User Sub-Type']}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* User Profile Modal - Only show in community view */}
      {!id && (
        <Elements stripe={stripePromise}>
          <UserModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onSendMessage={handleSendMessage}
            isSendingMessage={isSendingMessage}
          />
        </Elements>
      )}
    </div>
  );
};

export default Profiles;