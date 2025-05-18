import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Users, 
  ChevronLeft, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  X, 
  DollarSign,
  MessageSquare,
  Mail,
  Briefcase,
  Repeat
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Avatar from '../components/ui/Avatar';
import { Event, Application, Profile } from '../types';
import { format, parseISO, differenceInDays } from 'date-fns';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

interface UserModalProps {
  user: Profile | null;
  onClose: () => void;
  onSendMessage: (user: Profile) => void;
  isSendingMessage: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSendMessage, isSendingMessage }) => {
  if (!user) return null;

  const displayName = user.Name || user.Email?.split('@')[0] || 'Unknown User';

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

              {user['User Sub-Type'] && (
                <div className="flex items-center text-gray-600 mb-2">
                  <Briefcase size={16} className="mr-2" />
                  <span>{user['User Sub-Type']}</span>
                </div>
              )}

              {user.location && (
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin size={16} className="mr-2" />
                  <span>{user.location}</span>
                </div>
              )}

              <div className="flex items-center text-gray-600">
                <Mail size={16} className="mr-2" />
                <span>{user.Email}</span>
              </div>
            </div>
          </div>

          {user.Description && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
              <p className="text-gray-600 whitespace-pre-line">{user.Description}</p>
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

          {user.Spotify && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Spotify</h4>
              <a 
                href={user.Spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700"
              >
                View Profile
              </a>
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

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-error-100 sm:mx-0 sm:h-10 sm:w-10">
                <Trash2 className="h-6 w-6 text-error-600" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  Delete Event
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this event? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button
              onClick={onConfirm}
              variant="outline"
              className="!bg-error-600 !text-white hover:!bg-error-700 !border-error-600"
              isLoading={isLoading}
            >
              Delete
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="mr-3"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    category: '',
    seeking_creators: false,
    max_applications: 0,
    application_deadline: ''
  });
  
  useEffect(() => {
    if (!id || !profile) return;
    
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            creator:profilesv2(*)
          `)
          .eq('id', id)
          .single();
          
        if (eventError) throw eventError;
        setEvent(eventData);
        setEditForm({
          title: eventData.title,
          description: eventData.description || '',
          event_date: format(new Date(eventData.event_date), 'yyyy-MM-dd'),
          location: eventData.location || '',
          category: eventData.category || '',
          seeking_creators: eventData.seeking_creators,
          max_applications: eventData.max_applications || 0,
          application_deadline: eventData.application_deadline ? 
            format(new Date(eventData.application_deadline), 'yyyy-MM-dd') : ''
        });
        
        if (profile.role === 'creator') {
          const { data: applicationData } = await supabase
            .from('applications')
            .select('*, chat:chats(id)')
            .eq('event_id', id)
            .eq('creator_id', profile.id)
            .maybeSingle();
            
          setApplication(applicationData || null);
        }
        
        if (profile.role === 'host' && eventData.creator_id === profile.id) {
          const { data: applicationsData } = await supabase
            .from('applications')
            .select(`
              *,
              creator:profilesv2(*),
              chat:chats(id)
            `)
            .eq('event_id', id)
            .order('created_at', { ascending: false });
            
          setApplications(applicationsData || []);
        }
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError('Event not found or you do not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id, profile]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: editForm.title,
          description: editForm.description,
          event_date: editForm.event_date,
          location: editForm.location,
          category: editForm.category,
          seeking_creators: editForm.seeking_creators,
          max_applications: editForm.max_applications,
          application_deadline: editForm.application_deadline
        })
        .eq('id', event.id);

      if (error) throw error;

      // Update local state
      setEvent(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating event:', err);
      setError('Failed to update event. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleDeleteEvent = async () => {
    if (!event || !profile || profile.id !== event.creator_id) return;
    
    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);
        
      if (error) throw error;
      
      navigate('/events');
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
      setActionLoading(false);
    }
  };
  
  const handleApply = async () => {
    if (!profile || !event) return;
    
    setActionLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          event_id: event.id,
          creator_id: profile.id,
          status: 'pending',
        })
        .select()
        .single();
        
      if (error) throw error;
      setApplication(data);
    } catch (err: any) {
      console.error('Error applying to event:', err);
      setError('Failed to apply to this event. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (user: Profile) => {
    if (!profile) return;
    
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
  
  const handleApplicationUpdate = async (applicationId: string, status: 'approved' | 'declined') => {
    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);
        
      if (error) throw error;
      
      if (status === 'approved') {
        const application = applications.find(a => a.id === applicationId);
        
        if (application) {
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .insert({
              event_id: event?.id,
              host_id: profile?.id,
              creator_id: application.creator_id,
              last_message_at: new Date().toISOString(),
            })
            .select()
            .single();
            
          if (chatError) throw chatError;
          
          const { error: updateError } = await supabase
            .from('applications')
            .update({ chat_id: chatData.id })
            .eq('id', applicationId);
            
          if (updateError) throw updateError;
        }
      }
      
      const { data: updatedApplications } = await supabase
        .from('applications')
        .select(`
          *,
          creator:profilesv2(*),
          chat:chats(id)
        `)
        .eq('event_id', event?.id)
        .order('created_at', { ascending: false });
        
      setApplications(updatedApplications || []);
    } catch (err: any) {
      console.error('Error updating application:', err);
      setError(`Failed to ${status} application. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Event not found'}
            </h2>
            <Button
              variant="outline"
              onClick={() => navigate('/events')}
              icon={<ChevronLeft size={18} />}
            >
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isHost = profile?.id === event.creator_id;
  const canApply = profile?.role === 'creator' && event.seeking_creators && !application;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Events
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <Input
                  label="Event Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="input min-h-[120px]"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Describe your event..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="date"
                    label="Event Date"
                    value={editForm.event_date}
                    onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                    required
                  />

                  <Input
                    label="Location"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Event location"
                  />

                  <Input
                    label="Category"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    placeholder="Event category"
                  />

                  <Input
                    type="number"
                    label="Maximum Applications"
                    value={editForm.max_applications}
                    onChange={(e) => setEditForm({ ...editForm, max_applications: parseInt(e.target.value) })}
                    min="0"
                  />

                  <Input
                    type="date"
                    label="Application Deadline"
                    value={editForm.application_deadline}
                    onChange={(e) => setEditForm({ ...editForm, application_deadline: e.target.value })}
                  />
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={editForm.seeking_creators}
                      onChange={(e) => setEditForm({ ...editForm, seeking_creators: e.target.checked })}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-700">
                      Seeking Creators
                    </label>
                    <p className="text-gray-500">
                      Check this if you're looking for creators to collaborate with.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={actionLoading}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="flex-grow">
                    {/* Event Title and Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mr-2">
                        {event.title}
                      </h1>
                      <div className="flex flex-wrap gap-2">
                        {event.seeking_creators && (
                          <Badge variant="primary">Seeking Creators</Badge>
                        )}
                        {event.category && (
                          <Badge variant="secondary">{event.category}</Badge>
                        )}
                        {event.activity && (
                          <Badge variant="secondary">{event.activity}</Badge>
                        )}
                        {event.is_private && (
                          <Badge variant="warning">Private Event</Badge>
                        )}
                      </div>
                    </div>

                    {/* Host Info */}
                    <div className="flex items-center gap-3 mb-6">
                      <Avatar
                        src={event.creator?.avatar_url}
                        fallback={getDisplayName(event.creator)}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center">
                          <Users size={16} className="mr-1.5" />
                          {isHost ? (
                            <span className="text-gray-700">You are the host</span>
                          ) : (
                            <button 
                              className="text-primary-600 hover:text-primary-700 hover:underline"
                              onClick={() => setSelectedUser(event.creator)}
                            >
                              View Host Profile
                            </button>
                          )}
                        </div>
                        {event.creator?.['User Sub-Type'] && (
                          <p className="text-sm text-gray-500 mt-1">
                            {event.creator['User Sub-Type']}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Key Event Details */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-8 space-y-4">
                      {/* Date & Time */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center text-gray-700">
                          <Calendar size={20} className="mr-3" />
                          <div>
                            <div className="font-medium">{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}</div>
                            {event.start_time && (
                              <div className="text-sm text-gray-600 mt-0.5">
                                {event.start_time}{event.end_time && ` - ${event.end_time}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center text-gray-700">
                          <MapPin size={20} className="mr-3" />
                          <div>
                            <div className="font-medium">{event.location}</div>
                          </div>
                        </div>
                      )}

                      {/* Cost */}
                      {event.cost && (
                        <div className="flex items-center text-gray-700">
                          <DollarSign size={20} className="mr-3" />
                          <div>
                            <div className="font-medium">${event.cost} {event.cost_type}</div>
                          </div>
                        </div>
                      )}

                      {/* Age Restriction */}
                      {event.age_restriction && (
                        <div className="flex items-center text-gray-700">
                          <Users size={20} className="mr-3" />
                          <div>
                            <div className="font-medium">Age Restriction</div>
                            <div className="text-sm text-gray-600 mt-0.5">{event.age_restriction}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recurring Event Details */}
                    {event.is_recurring && event.recurring_frequency && (
                      <div className="bg-blue-50 rounded-xl p-6 mb-8">
                        <div className="flex items-center text-blue-700 mb-3">
                          <Repeat size={20} className="mr-2" />
                          <span className="font-medium">Recurring Event</span>
                        </div>
                        <div className="space-y-2 text-gray-700">
                          <p>
                            <span className="font-medium">Frequency:</span>{' '}
                            {event.recurring_frequency === 'weekly' && event.recurring_day_of_week !== undefined
                              ? `Every ${format(parseISO(event.event_date), 'EEEE')}`
                              : event.recurring_frequency === 'monthly' && event.recurring_day_of_month !== undefined
                              ? `Every ${event.recurring_day_of_month}${event.recurring_day_of_month === 1 ? 'st' : event.recurring_day_of_month === 2 ? 'nd' : event.recurring_day_of_month === 3 ? 'rd' : 'th'} of the month`
                              : event.recurring_frequency.charAt(0).toUpperCase() + event.recurring_frequency.slice(1)}
                          </p>
                          <p>
                            <span className="font-medium">Start Date:</span>{' '}
                            {format(parseISO(event.event_date), 'MMMM d, yyyy')}
                          </p>
                          <p>
                            <span className="font-medium">End Date:</span>{' '}
                            {format(parseISO(event.recurring_end_date), 'MMMM d, yyyy')}
                          </p>
                          <p>
                            <span className="font-medium">Total Occurrences:</span>{' '}
                            {(() => {
                              const start = parseISO(event.event_date);
                              const end = parseISO(event.recurring_end_date);
                              const days = differenceInDays(end, start);
                              
                              switch (event.recurring_frequency) {
                                case 'daily':
                                  return Math.floor(days) + 1;
                                case 'weekly':
                                  return Math.floor(days / 7) + 1;
                                case 'monthly':
                                  return Math.floor(days / 30) + 1;
                                default:
                                  return 0;
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Creator Application Details */}
                    {event.seeking_creators && (
                      <div className="bg-green-50 rounded-xl p-6 mb-8">
                        <div className="flex items-center text-green-700 mb-3">
                          <Users size={20} className="mr-2" />
                          <span className="font-medium">Creator Opportunities</span>
                        </div>
                        <div className="space-y-4">
                          {event.max_applications && (
                            <div>
                              <div className="font-medium text-gray-700">Available Spots</div>
                              <div className="text-gray-600 mt-1">
                                {event.max_applications} positions available
                              </div>
                            </div>
                          )}
                          {event.application_deadline && (
                            <div>
                              <div className="font-medium text-gray-700">Application Deadline</div>
                              <div className="text-gray-600 mt-1">
                                {format(new Date(event.application_deadline), 'MMMM d, yyyy')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {event.description && (
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">About this Event</h3>
                        <div className="prose prose-gray max-w-none">
                          <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side Actions */}
                  <div className="md:ml-8 md:w-72 flex-shrink-0">
                    <div className="sticky top-24">
                      {isHost ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                          <h3 className="font-medium text-gray-900">Event Management</h3>
                          <div className="flex flex-col gap-3">
                            <Button
                              variant="outline"
                              icon={<Edit size={16} />}
                              onClick={() => setIsEditing(true)}
                              fullWidth
                            >
                              Edit Event
                            </Button>
                            <Button
                              variant="outline"
                              icon={<Trash2 size={16} />}
                              onClick={() => setShowDeleteModal(true)}
                              fullWidth
                            >
                              Delete Event
                            </Button>
                          </div>
                        </div>
                      ) : canApply ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <Button 
                            onClick={handleApply} 
                            isLoading={actionLoading}
                            fullWidth
                          >
                            Apply for this Event
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {application && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium mb-2">Your Application</h3>
                      <div className="flex items-center">
                        <span className="mr-2">Status:</span>
                        {application.status === 'pending' && (
                          <Badge variant="warning">Pending Review</Badge>
                        )}
                        {application.status === 'approved' && (
                          <Badge variant="success">Approved</Badge>
                        )}
                        {application.status === 'declined' && (
                          <Badge variant="error">Declined</Badge>
                        )}
                      </div>

                      {application.status === 'approved' && application.chat_id && (
                        <div className="mt-4">
                          <Link to={`/chats/${application.chat_id}`}>
                            <Button size="sm">Go to Chat</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isHost && applications.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Applications ({applications.length})
                    </h3>

                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div 
                          key={app.id}
                          className="bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="mb-3 sm:mb-0">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={app.creator?.avatar_url}
                                fallback={getDisplayName(app.creator)}
                                size="sm"
                              />
                              <div>
                                <button 
                                  className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                  onClick={() => setSelectedUser(app.creator)}
                                >
                                  {getDisplayName(app.creator)}
                                </button>
                                {app.creator?.['User Sub-Type'] && (
                                  <p className="text-sm text-gray-500">
                                    {app.creator['User Sub-Type']}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                              Applied {format(new Date(app.created_at), 'MMM d, yyyy')}
                            </div>
                            <div className="mt-2">
                              {app.status === 'pending' && (
                                <Badge variant="warning">Pending</Badge>
                              )}
                              {app.status === 'approved' && (
                                <Badge variant="success">Approved</Badge>
                              )}
                              {app.status === 'declined' && (
                                <Badge variant="error">Declined</Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            {app.status === 'pending' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApplicationUpdate(app.id, 'declined')}
                                  isLoading={actionLoading}
                                >
                                  Decline
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApplicationUpdate(app.id, 'approved')}
                                  isLoading={actionLoading}
                                >
                                  Approve
                                </Button>
                              </>
                            ) : app.status === 'approved' && app.chat_id ? (
                              <Link to={`/chats/${app.chat_id}`}>
                                <Button size="sm">View Chat</Button>
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteEvent}
        isLoading={actionLoading}
      />

      <UserModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSendMessage={handleSendMessage}
        isSendingMessage={isSendingMessage}
      />
    </div>
  );
};

export default EventDetail;