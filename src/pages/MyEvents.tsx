import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X,
  DollarSign,
  Users,
  MessageSquare,
  ChevronDown,
  Repeat
} from 'lucide-react';
import Select from 'react-select';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EventCard from '../components/ui/EventCard';
import ApplicationCard from '../components/ui/ApplicationCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Event, Application } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';

interface EventModalProps {
  event: Event | null;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {event.category && (
                  <Badge variant="secondary">{event.category}</Badge>
                )}
                {event.activity && (
                  <Badge variant="secondary">{event.activity}</Badge>
                )}
                {event.seeking_creators && (
                  <Badge variant="primary">Seeking Creators</Badge>
                )}
                {event.is_recurring && (
                  <Badge variant="info">
                    <Repeat size={14} className="mr-1" />
                    Recurring
                  </Badge>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Event Details */}
          <div className="space-y-6">
            {/* Date & Time */}
            <div className="flex items-center gap-6">
              <div className="flex items-center text-gray-600">
                <CalendarIcon size={18} className="mr-2" />
                <span>{format(new Date(event.event_date), 'MMMM d, yyyy')}</span>
              </div>
              {event.start_time && (
                <div className="flex items-center text-gray-600">
                  <Clock size={18} className="mr-2" />
                  <span>{event.start_time}{event.end_time && ` - ${event.end_time}`}</span>
                </div>
              )}
            </div>

            {/* Recurring Event Details */}
            {event.is_recurring && event.recurring_frequency && (
              <div className="flex items-center text-gray-600">
                <Repeat size={18} className="mr-2" />
                <span>
                  Repeats {event.recurring_frequency}
                  {event.recurring_end_date && ` until ${format(new Date(event.recurring_end_date), 'MMMM d, yyyy')}`}
                </span>
              </div>
            )}

            {/* Location */}
            {event.location && (
              <div className="flex items-center text-gray-600">
                <MapPin size={18} className="mr-2" />
                <span>{event.location}</span>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-2">About this Event</h3>
                <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
              </div>
            )}

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.max_applications && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Creator Spots</h4>
                  <div className="flex items-center text-gray-600">
                    <Users size={16} className="mr-2" />
                    <span>{event.max_applications} available</span>
                  </div>
                </div>
              )}

              {event.application_deadline && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Application Deadline</h4>
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon size={16} className="mr-2" />
                    <span>{format(new Date(event.application_deadline), 'MMMM d, yyyy')}</span>
                  </div>
                </div>
              )}

              {event.cost && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Event Cost</h4>
                  <div className="flex items-center text-gray-600">
                    <DollarSign size={16} className="mr-2" />
                    <span>${event.cost} {event.cost_type}</span>
                  </div>
                </div>
              )}

              {event.age_restriction && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Age Restriction</h4>
                  <Badge variant="warning">{event.age_restriction}</Badge>
                </div>
              )}
            </div>

            {/* Host Information */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Event Host</h3>
              <div className="flex items-start gap-4">
                <Avatar
                  src={event.creator?.avatar_url}
                  fallback={getDisplayName(event.creator)}
                  size="lg"
                />
                <div className="flex-1">
                  <h4 className="text-base font-medium">{getDisplayName(event.creator)}</h4>
                  {event.creator?.['User Sub-Type'] && (
                    <p className="text-sm text-gray-600">{event.creator['User Sub-Type']}</p>
                  )}
                  {event.creator?.location && (
                    <p className="text-sm text-gray-500 mt-1">
                      <MapPin size={14} className="inline mr-1" />
                      {event.creator.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 mt-6 pt-6">
            <Link to={`/events/${event.id}`}>
              <Button fullWidth>
                View Event Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyEvents: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'applications', label: 'Applications' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'history', label: 'History' }
  ];

  // Event status colors for the legend
  const eventColors = {
    'Booked with Creator': 'bg-success-50 text-success-700 border-success-200',
    'Open for Applications': 'bg-primary-100 text-primary-700 border-primary-200',
    'Pending Application Reviews': 'bg-warning-50 text-warning-700 border-warning-200',
    'No Creators Needed': 'bg-gray-100 text-gray-600 border-gray-200',
  };

  useEffect(() => {
    if (!profile) return;

    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Get all events for the user, including recurring ones
        const { data } = await supabase
          .from('events')
          .select(`
            *,
            creator:profilesv2(*),
            applications(
              id,
              status,
              creator:profilesv2(*)
            )
          `)
          .eq('creator_id', profile.id)
          .order('event_date', { ascending: true });

        const coloredEvents = (data || []).map(event => {
          let status = 'No Creators Needed';
          const hasApprovedApplication = event.applications?.some(app => app.status === 'approved');
          
          if (hasApprovedApplication) {
            status = 'Booked with Creator';
          } else if (event.seeking_creators && event.applications?.length > 0) {
            status = 'Pending Application Reviews';
          } else if (event.seeking_creators) {
            status = 'Open for Applications';
          }

          return {
            ...event,
            status,
            colorClass: eventColors[status]
          };
        });

        setEvents(coloredEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [profile]);

  const handleApplicationUpdate = async (applicationId: string, status: 'approved' | 'declined') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      // Refresh applications only if there are events
      if (events.length > 0) {
        const { data: updatedApplications } = await supabase
          .from('applications')
          .select(`
            *,
            creator:profilesv2(*),
            event:events(*),
            chat:chats(id)
          `)
          .in('event_id', events.map(e => e.id))
          .order('created_at', { ascending: false });

        setApplications(updatedApplications || []);
      }
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  // Calendar functions
  const getDaysToDisplay = () => {
    if (calendarView === 'month') {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({ start, end });
    } else if (calendarView === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate)
      });
    } else {
      return [currentDate];
    }
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.event_date);
      
      // If it's a recurring event, check if the date falls within the recurring pattern
      if (event.is_recurring && event.recurring_frequency && event.recurring_end_date) {
        const endDate = parseISO(event.recurring_end_date);
        if (date > endDate) return false;
        
        switch (event.recurring_frequency) {
          case 'daily':
            return date >= eventDate && date <= endDate;
          case 'weekly':
            // For weekly events, check if it's the specified day of the week
            return date >= eventDate && 
                   date <= endDate && 
                   date.getDay() === (event.recurring_day_of_week ?? eventDate.getDay());
          case 'monthly':
            // For monthly events, check if it's the specified day of the month
            return date >= eventDate && 
                   date <= endDate && 
                   date.getDate() === (event.recurring_day_of_month ?? eventDate.getDate());
          default:
            return false;
        }
      }
      
      // For non-recurring events, just check if it's the same day
      return isSameDay(eventDate, date);
    });
  };

  const navigate_date = (direction: 'prev' | 'next') => {
    setCurrentDate(current => {
      if (calendarView === 'month') {
        return direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
      } else if (calendarView === 'week') {
        return direction === 'prev' ? addDays(current, -7) : addDays(current, 7);
      } else {
        return direction === 'prev' ? addDays(current, -1) : addDays(current, 1);
      }
    });
  };

  const renderCalendarContent = () => {
    const days = getDaysToDisplay();

    return (
      <div className="border-t border-l border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="
              bg-gray-50 px-2 py-3
              text-sm font-medium text-gray-900 text-center
              border-b border-r border-gray-200
            ">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`
                  min-h-[100px] p-2
                  bg-white border-b border-r border-gray-200
                  ${!isCurrentMonth ? 'bg-gray-50' : ''}
                  ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
                `}
              >
                <p className={`
                  text-sm font-medium mb-1
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                `}>
                  {format(day, 'd')}
                </p>

                <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-custom">
                  {dayEvents.map((event) => {
                    const hasApprovedApplication = event.applications?.some(app => app.status === 'approved');
                    let status = 'No Creators Needed';
                    let colorClass = eventColors['No Creators Needed'];
                    
                    if (hasApprovedApplication) {
                      status = 'Booked with Creator';
                      colorClass = eventColors['Booked with Creator'];
                    } else if (event.seeking_creators && event.applications?.length > 0) {
                      status = 'Pending Application Reviews';
                      colorClass = eventColors['Pending Application Reviews'];
                    } else if (event.seeking_creators) {
                      status = 'Open for Applications';
                      colorClass = eventColors['Open for Applications'];
                    }

                    return (
                      <button
                        key={`${event.id}-${format(day, 'yyyy-MM-dd')}`}
                        onClick={() => setSelectedEvent(event)}
                        className={`
                          w-full px-2 py-1 text-xs rounded-md border
                          truncate cursor-pointer transition-all duration-200
                          hover:transform hover:scale-[1.02]
                          ${colorClass}
                        `}
                        title={`${event.title} (${status})`}
                      >
                        {event.title}
                        {event.is_recurring && (
                          <span className="ml-1 text-xs opacity-75">(Recurring)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || event.category === categoryFilter;
    const matchesLocation = !locationFilter || event.location === locationFilter;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  const upcomingEvents = filteredEvents.filter(event => 
    new Date(event.event_date) >= new Date()
  );

  const pastEvents = filteredEvents
    .filter(event => new Date(event.event_date) < new Date())
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="py-6">
            <div className="flex items-center justify-between mb-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
                <p className="text-gray-600 mt-1">Manage your events and track applications</p>
              </div>
              
              <Link to="/events/create">
                <Button icon={<PlusCircle size={18} />}>
                  Create Event
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 px-4 py-4 text-center text-sm font-medium
                      ${activeTab === tab.id
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-wrap gap-4">
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startIcon={<Search size={18} />}
                  className="w-full md:w-64"
                />

                {activeTab === 'calendar' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate_date('prev')}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate_date('next')}
                    >
                      Next
                    </Button>
                    <select
                      className="input py-1"
                      value={calendarView}
                      onChange={(e) => setCalendarView(e.target.value as any)}
                    >
                      <option value="month">Month</option>
                      <option value="week">Week</option>
                      <option value="day">Day</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  {activeTab === 'upcoming' && (
                    <div className="space-y-4">
                      {upcomingEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                      ))}
                      {upcomingEvents.length === 0 && (
                        <div className="text-center py-12">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No upcoming events
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Create your first event to get started
                          </p>
                          <Link to="/events/create">
                            <Button icon={<PlusCircle size={18} />}>
                              Create Event
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'applications' && (
                    <div className="space-y-4">
                      {applications.map(application => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          onApprove={() => handleApplicationUpdate(application.id, 'approved')}
                          onDecline={() => handleApplicationUpdate(application.id, 'declined')}
                          showCreator
                        />
                      ))}
                      {applications.length === 0 && (
                        <div className="text-center py-12">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No applications yet
                          </h3>
                          <p className="text-gray-500">
                            When creators apply to your events, they'll appear here
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'calendar' && (
                    <>
                      {renderCalendarContent()}
                      
                      {/* Event Status Legend */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Event Status</h3>
                        <div className="flex flex-wrap gap-3 sm:gap-6">
                          {Object.entries(eventColors).map(([status, colorClass]) => (
                            <div key={status} className="flex items-center">
                              <div 
                                className={`
                                  w-4 h-4 sm:w-6 sm:h-6 rounded-md border shadow-sm
                                  ${colorClass.split(' ')[0]}
                                  ${colorClass.split(' ')[2]}
                                `}
                              />
                              <span className="ml-2 text-xs sm:text-sm text-gray-700">{status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      {pastEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                      ))}
                      {pastEvents.length === 0 && (
                        <div className="text-center py-12">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No past events
                          </h3>
                          <p className="text-gray-500">
                            Your completed events will appear here
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};

export default MyEvents;