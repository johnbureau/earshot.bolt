import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, ChevronLeft, Clock, DollarSign, Users, AlertCircle, MapPin } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from 'react-select';
import { Profile } from '../types';
import { format } from 'date-fns';

const CATEGORIES = [
  'Community',
  'Entertainment',
  'Fitness',
  'Food',
  'Games',
  'Music'
];

const ACTIVITIES = {
  'Community': [
    'Bike Night',
    'Book Club',
    'Discussion Group',
    'Market',
    'Pop-up Shop'
  ],
  'Entertainment': [
    'Arts & Crafts',
    'Comedy',
    'Improv',
    'Line Dancing',
    'Movie',
    'Theatre',
    'Variety Open Mic'
  ],
  'Fitness': [
    'Bike Club',
    'HIIT',
    'Pilates',
    'Run Club',
    'Workout Class',
    'Yoga'
  ],
  'Food': [
    'Class',
    'Food Truck',
    'Guest Chef',
    'Pop-up'
  ],
  'Games': [
    'Bingo',
    'Cornhole Tournament',
    'DJ Trivia',
    'Live Music Bingo',
    'Mixtape Matchup',
    'Music Bingo',
    'Poker',
    'Sip & Spell',
    'Survey Says',
    'Themed Trivia',
    'Trivia'
  ],
  'Music': [
    'Jam',
    'Karaoke',
    'Live Music',
    'Open Mic',
    'Singing Competition',
    'Song Request Night'
  ]
};

const AGE_RESTRICTIONS = [
  { value: '', label: 'No age restriction' },
  { value: '18+', label: '18+ only' },
  { value: '21+', label: '21+ only' }
];

interface EventForm {
  title: string;
  description: string;
  category: string;
  activity: string;
  date: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  recurringEndDate?: string;
  isPrivate: boolean;
  hasCost: boolean;
  cost?: string;
  costType?: 'ticket' | 'cover' | 'entry' | 'donation';
  ageRestriction: string;
  location: string;
  maxApplications: number;
  applicationDeadline: string;
  seekingCreators: boolean;
  selectedCreator?: string;
  recurringDayOfWeek?: number;
  recurringDayOfMonth?: number;
}

const EventCreate: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCreators, setAvailableCreators] = useState<Profile[]>([]);
  
  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    category: '',
    activity: '',
    date: '',
    startTime: '',
    endTime: '',
    isRecurring: false,
    isPrivate: false,
    hasCost: false,
    cost: '',
    ageRestriction: '',
    location: '',
    maxApplications: 1,
    applicationDeadline: '',
    seekingCreators: false,
    selectedCreator: undefined,
    recurringDayOfWeek: undefined,
    recurringDayOfMonth: undefined
  });

  useEffect(() => {
    const fetchCreators = async () => {
      if (!form.activity) return;

      try {
        const { data: creators } = await supabase
          .from('profilesv2')
          .select('*')
          .eq('role', 'creator')
          .eq('Activity', form.activity);

        setAvailableCreators(creators || []);
      } catch (error) {
        console.error('Error fetching creators:', error);
      }
    };

    fetchCreators();
  }, [form.activity]);

  useEffect(() => {
    const fetchHostProfile = async () => {
      if (!profile) return;

      try {
        const { data: hostProfile, error } = await supabase
          .from('profilesv2')
          .select('*')
          .eq('id', profile.id)
          .single();

        if (error) throw error;

        if (hostProfile?.location) {
          setForm(prev => ({
            ...prev,
            location: hostProfile.location
          }));
        }
      } catch (error) {
        console.error('Error fetching host profile:', error);
      }
    };

    fetchHostProfile();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const selectedDate = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        throw new Error('Event date cannot be in the past');
      }

      const eventDate = new Date(form.date);
      if (form.startTime) {
        const [hours, minutes] = form.startTime.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
      }
      
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          creator_id: profile.id,
          title: form.title,
          description: form.description,
          category: form.category,
          activity: form.activity,
          event_date: eventDate.toISOString(),
          start_time: form.startTime,
          end_time: form.endTime,
          is_recurring: form.isRecurring,
          recurring_frequency: form.recurringFrequency,
          recurring_end_date: form.recurringEndDate,
          recurring_day_of_week: form.recurringDayOfWeek,
          recurring_day_of_month: form.recurringDayOfMonth,
          is_private: form.isPrivate,
          cost: form.hasCost ? form.cost : null,
          cost_type: form.hasCost ? form.costType : null,
          age_restriction: form.ageRestriction || null,
          location: form.location,
          seeking_creators: form.seekingCreators || !!form.selectedCreator,
          max_applications: form.seekingCreators ? form.maxApplications : null,
          application_deadline: form.seekingCreators ? form.applicationDeadline : null,
        })
        .select()
        .single();
        
      if (eventError) throw eventError;

      if (form.selectedCreator && event) {
        const { error: applicationError } = await supabase
          .from('applications')
          .insert({
            event_id: event.id,
            creator_id: form.selectedCreator,
            status: 'approved'
          });

        if (applicationError) throw applicationError;
      }
      
      navigate(`/events/${event.id}`);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event. Please try again.');
      setLoading(false);
    }
  };

  const getDisplayName = (user: Profile) => {
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-3xl">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Dashboard
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Create a New Event
            </h1>
            <p className="text-gray-600 mb-8">
              Fill in the details below to create your event
            </p>
            
            {error && (
              <div className="mb-6 flex items-center gap-2 text-error-700 bg-error-50 px-4 py-3 rounded-lg">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                
                <Input
                  label="Event Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Give your event a clear, descriptive title"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="input min-h-[120px]"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe your event, what attendees can expect, etc."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      className="input"
                      value={form.category}
                      onChange={(e) => setForm({ 
                        ...form, 
                        category: e.target.value,
                        activity: ''
                      })}
                      required
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Type
                    </label>
                    <select
                      className="input"
                      value={form.activity}
                      onChange={(e) => setForm({ ...form, activity: e.target.value })}
                      required
                      disabled={!form.category}
                    >
                      <option value="">Select an activity</option>
                      {form.category && ACTIVITIES[form.category].map(activity => (
                        <option key={activity} value={activity}>{activity}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Date and Time</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    type="date"
                    label="Event Date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    startIcon={<Calendar size={18} className="text-gray-400" />}
                  />
                  
                  <Input
                    type="time"
                    label="Start Time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                    startIcon={<Clock size={18} className="text-gray-400" />}
                  />
                  
                  <Input
                    type="time"
                    label="End Time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                    startIcon={<Clock size={18} className="text-gray-400" />}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={form.isRecurring}
                      onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
                      This is a recurring event
                    </label>
                  </div>

                  {form.isRecurring && (
                    <div className="pl-6 space-y-4 border-l-2 border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          How often does it repeat?
                        </label>
                        <select
                          value={form.recurringFrequency}
                          onChange={(e) => setForm({ 
                            ...form, 
                            recurringFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' 
                          })}
                          className="input"
                          required={form.isRecurring}
                        >
                          <option value="">Select frequency</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                          {form.recurringFrequency === 'daily' && 'Event will repeat every day'}
                          {form.recurringFrequency === 'weekly' && 'Event will repeat on the same day each week'}
                          {form.recurringFrequency === 'monthly' && 'Event will repeat on the same date each month'}
                        </p>
                      </div>

                      {form.recurringFrequency === 'weekly' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Repeat on
                          </label>
                          <select
                            value={form.recurringDayOfWeek}
                            onChange={(e) => setForm({ 
                              ...form, 
                              recurringDayOfWeek: parseInt(e.target.value)
                            })}
                            className="input"
                            required={form.recurringFrequency === 'weekly'}
                          >
                            <option value="">Select day of week</option>
                            <option value="0">Sunday</option>
                            <option value="1">Monday</option>
                            <option value="2">Tuesday</option>
                            <option value="3">Wednesday</option>
                            <option value="4">Thursday</option>
                            <option value="5">Friday</option>
                            <option value="6">Saturday</option>
                          </select>
                          <p className="mt-1 text-sm text-gray-500">
                            The event will repeat on this day of the week
                          </p>
                        </div>
                      )}

                      {form.recurringFrequency === 'monthly' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Repeat on day
                          </label>
                          <select
                            value={form.recurringDayOfMonth}
                            onChange={(e) => setForm({ 
                              ...form, 
                              recurringDayOfMonth: parseInt(e.target.value)
                            })}
                            className="input"
                            required={form.recurringFrequency === 'monthly'}
                          >
                            <option value="">Select day of month</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>
                                {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-sm text-gray-500">
                            The event will repeat on this day of each month
                          </p>
                        </div>
                      )}

                      {form.recurringFrequency && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            When does the series end?
                          </label>
                          <input
                            type="date"
                            value={form.recurringEndDate}
                            onChange={(e) => {
                              const endDate = new Date(e.target.value);
                              const startDate = new Date(form.date);
                              
                              if (endDate < startDate) {
                                setError('End date must be after the start date');
                                return;
                              }
                              
                              // Validate end date is not too far in the future (1 year max)
                              const maxDate = new Date();
                              maxDate.setFullYear(maxDate.getFullYear() + 1);
                              
                              if (endDate > maxDate) {
                                setError('Recurring events cannot be scheduled more than 1 year in advance');
                                return;
                              }
                              
                              setForm({ ...form, recurringEndDate: e.target.value });
                              setError(null);
                            }}
                            min={form.date}
                            max={(() => {
                              const maxDate = new Date();
                              maxDate.setFullYear(maxDate.getFullYear() + 1);
                              return maxDate.toISOString().split('T')[0];
                            })()}
                            className="input"
                            required={form.isRecurring}
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            The last occurrence will be on this date. You can set this up to one year in advance.
                          </p>
                        </div>
                      )}

                      {form.recurringFrequency && form.recurringEndDate && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Event Series Summary</h4>
                          <p className="text-sm text-gray-600">
                            This event will occur {form.recurringFrequency} from{' '}
                            {format(new Date(form.date), 'MMMM d, yyyy')} until{' '}
                            {format(new Date(form.recurringEndDate), 'MMMM d, yyyy')}.
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {(() => {
                              const start = new Date(form.date);
                              const end = new Date(form.recurringEndDate);
                              const diffTime = Math.abs(end.getTime() - start.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              switch (form.recurringFrequency) {
                                case 'daily':
                                  return `Total occurrences: ${diffDays + 1}`;
                                case 'weekly':
                                  return `Total occurrences: ${Math.floor(diffDays / 7) + 1}`;
                                case 'monthly':
                                  const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                                               (end.getMonth() - start.getMonth());
                                  return `Total occurrences: ${months + 1}`;
                                default:
                                  return '';
                              }
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Event Settings</h2>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={form.isPrivate}
                        onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Private Event
                      </label>
                      <p className="text-sm text-gray-500">
                        Only invited guests can view this event
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={form.hasCost}
                        onChange={(e) => setForm({ ...form, hasCost: e.target.checked })}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Event Cost
                      </label>
                      <p className="text-sm text-gray-500">
                        This event has an entry fee, ticket price, or suggested donation
                      </p>
                    </div>
                  </div>

                  {form.hasCost && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cost Type
                        </label>
                        <select
                          className="input"
                          value={form.costType}
                          onChange={(e) => setForm({ 
                            ...form, 
                            costType: e.target.value as typeof form.costType 
                          })}
                          required
                        >
                          <option value="">Select type</option>
                          <option value="ticket">Ticket</option>
                          <option value="cover">Cover Charge</option>
                          <option value="entry">Entry Fee</option>
                          <option value="donation">Suggested Donation</option>
                        </select>
                      </div>

                      <Input
                        type="text"
                        label="Amount"
                        value={form.cost}
                        onChange={(e) => setForm({ ...form, cost: e.target.value })}
                        required
                        placeholder="e.g. 20.00"
                        startIcon={<DollarSign size={18} className="text-gray-400" />}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age Restriction
                    </label>
                    <select
                      className="input"
                      value={form.ageRestriction}
                      onChange={(e) => setForm({ ...form, ageRestriction: e.target.value })}
                    >
                      {AGE_RESTRICTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Select an age restriction if required, or leave as "No age restriction"
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                
                <Input
                  label="Venue / Location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                  placeholder="Enter the event location"
                  startIcon={<MapPin size={18} className="text-gray-400" />}
                />
              </div>

              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Creator Settings</h2>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={form.seekingCreators}
                      onChange={(e) => {
                        const seeking = e.target.checked;
                        setForm(prev => ({ 
                          ...prev, 
                          seekingCreators: seeking,
                          selectedCreator: seeking ? undefined : prev.selectedCreator 
                        }));
                      }}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">
                      Open Applications
                    </label>
                    <p className="text-sm text-gray-500">
                      Allow creators to apply to participate in this event
                    </p>
                  </div>
                </div>

                {form.seekingCreators && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7">
                    <Input
                      type="number"
                      label="Maximum Applications"
                      value={form.maxApplications}
                      onChange={(e) => setForm({ ...form, maxApplications: parseInt(e.target.value) })}
                      required
                      min="1"
                      startIcon={<Users size={18} className="text-gray-400" />}
                    />

                    <Input
                      type="date"
                      label="Application Deadline"
                      value={form.applicationDeadline}
                      onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })}
                      required
                      startIcon={<Calendar size={18} className="text-gray-400" />}
                    />
                  </div>
                )}

                {!form.seekingCreators && form.activity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Send to a Creator
                    </label>
                    <Select
                      isClearable
                      value={form.selectedCreator ? {
                        value: form.selectedCreator,
                        label: availableCreators.find(c => c.id === form.selectedCreator)?.Name || 'Unknown Creator'
                      } : null}
                      onChange={(option) => setForm({ ...form, selectedCreator: option?.value })}
                      options={availableCreators.map(creator => ({
                        value: creator.id,
                        label: getDisplayName(creator)
                      }))}
                      placeholder="Select a creator..."
                      isDisabled={!form.activity}
                    />
                    {!availableCreators.length && form.activity && (
                      <p className="mt-1 text-sm text-gray-500">
                        No creators available for this activity type
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  isLoading={loading}
                  fullWidth
                >
                  Create Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCreate;