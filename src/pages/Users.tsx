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

  const skills = user.skills || [];
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
              fallback={user.name || user.email}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">{user.name || user.email}</h3>
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
                <span>{user.email}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar size={16} className="mr-2" />
                <span>Joined {format(createdAt, 'MMMM yyyy')}</span>
              </div>
            </div>
          </div>

          {user.bio && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
              <p className="text-gray-600 whitespace-pre-line">{user.bio}</p>
            </div>
          )}

          {skills.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {skill}
                  </Badge>
                ))}
              </div>
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
            {currentProfile && (
              <Button
                icon={<MessageSquare size={16} />}
                onClick={() => onSendMessage(user)}
                isLoading={isSendingMessage}
              >
                Send Message
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Users: React.FC = () => {
  const { profile: currentProfile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profilesv2')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSendMessage = async (user: Profile) => {
    if (!currentProfile) {
      navigate('/login');
      return;
    }
    
    setIsSendingMessage(true);
    try {
      // Check for existing chat with either user combination
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

      // Create new chat with correct role assignment
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
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesLocation = !locationFilter || user.location?.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  const locations = Array.from(new Set(users.filter(u => u.location).map(u => u.location)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom max-w-7xl py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Community</h1>
              <p className="text-sm text-gray-500 mt-1">
                Connect with hosts and creators
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search size={18} />}
                className="w-full sm:w-64"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => {}}
                icon={<Filter size={18} />}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Location:</span>
              <select
                className="input py-1"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
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
      <div className="container-custom max-w-7xl py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
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
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-300">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={user.avatar_url}
                      fallback={user.name || user.email}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600">
                          {user.name || user.email}
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

                      {user.bio && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {user.bio}
                        </p>
                      )}
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

export default Users;