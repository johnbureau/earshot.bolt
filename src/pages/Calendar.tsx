import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  X
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Event } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, event }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <Badge variant={
              event.status === 'Booked with Creator' ? 'success' :
              event.status === 'Open for Applications' ? 'primary' :
              event.status === 'Pending Application Reviews' ? 'warning' :
              'default'
            }>
              {event.status}
            </Badge>

            <div className="flex items-center text-gray-600">
              <Clock size={18} className="mr-2" />
              <span>{format(parseISO(event.event_date), 'MMMM d, yyyy')}</span>
            </div>

            {event.location && (
              <div className="flex items-center text-gray-600">
                <MapPin size={18} className="mr-2" />
                <span>{event.location}</span>
              </div>
            )}

            {event.description && (
              <p className="text-gray-700 mt-4">{event.description}</p>
            )}

            <div className="flex items-center mt-6">
              <Avatar
                src={event.creator?.avatar_url}
                fallback={event.creator?.name || event.creator?.email}
                size="sm"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {event.creator?.name || event.creator?.email}
                </p>
                <p className="text-xs text-gray-500">Event Host</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button onClick={() => window.location.href = `/events/${event.id}`} fullWidth>
              View Event Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

type ViewType = 'month' | 'week' | 'day';
type CalendarEvent = Event & { colorClass: string; status: string };

const Calendar: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
        let start, end;
        
        if (view === 'month') {
          start = startOfMonth(currentDate);
          end = endOfMonth(currentDate);
        } else if (view === 'week') {
          start = startOfWeek(currentDate);
          end = endOfWeek(currentDate);
        } else {
          start = startOfDay(currentDate);
          end = endOfDay(currentDate);
        }

        // First, get all events that could potentially occur in this period
        const { data } = await supabase
          .from('events')
          .select(`
            *,
            creator:profiles(*),
            applications(id, status)
          `)
          .or(`creator_id.eq.${profile.id},seeking_creators.eq.true`)
          .or(`event_date.lte.${format(end, 'yyyy-MM-dd')},is_recurring.eq.true`)
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
  }, [profile, currentDate, view]);

  const getDaysToDisplay = () => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({ start, end });
    } else if (view === 'week') {
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
            return date >= eventDate;
          case 'weekly':
            return date >= eventDate && 
                   date.getDay() === eventDate.getDay();
          case 'monthly':
            return date >= eventDate && 
                   date.getDate() === eventDate.getDate();
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
      if (view === 'month') {
        return direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
      } else if (view === 'week') {
        return direction === 'prev' ? addDays(current, -7) : addDays(current, 7);
      } else {
        return direction === 'prev' ? addDays(current, -1) : addDays(current, 1);
      }
    });
  };

  const renderDayContent = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isToday = isSameDay(day, new Date());

    return (
      <div
        className={`
          min-h-[100px] sm:min-h-[120px] p-1 sm:p-2
          bg-white border-b border-r border-gray-200
          ${!isCurrentMonth ? 'bg-gray-50' : ''}
          ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
        `}
      >
        <p className={`
          text-sm font-medium mb-1 p-1
          ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
        `}>
          {format(day, view === 'day' ? 'MMMM d, yyyy' : 'd')}
        </p>

        <div className="space-y-1 overflow-y-auto max-h-[80px] sm:max-h-[100px] scrollbar-custom">
          {dayEvents.map((event) => (
            <button
              key={`${event.id}-${format(day, 'yyyy-MM-dd')}`}
              onClick={() => setSelectedEvent(event)}
              className={`
                w-full px-1.5 py-1 text-xs rounded-md border
                truncate cursor-pointer transition-all duration-200
                hover:transform hover:scale-[1.02]
                ${event.colorClass}
              `}
              title={`${event.title} (${event.status})`}
            >
              {event.title}
              {event.is_recurring && (
                <span className="ml-1 text-xs opacity-75">(Recurring)</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container-custom">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {/* Calendar Header */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {format(currentDate, 'MMMM yyyy')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Create Event Button */}
              <Button
                onClick={() => navigate('/events/create')}
                icon={<Plus size={18} />}
                className="w-full sm:w-auto"
              >
                Create Event
              </Button>

              {/* View Toggle */}
              <div className="bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <div className="grid grid-cols-3 gap-1">
                  {(['month', 'week', 'day'] as ViewType[]).map((viewType) => (
                    <button
                      key={viewType}
                      onClick={() => setView(viewType)}
                      className={`
                        px-3 py-1.5 text-sm font-medium rounded-md capitalize
                        ${view === viewType 
                          ? 'bg-white text-primary-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                        }
                      `}
                    >
                      {viewType}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate_date('prev')}
                  icon={<ChevronLeft size={16} />}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate_date('next')}
                  icon={<ChevronRight size={16} />}
                />
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border-t border-l border-gray-200 rounded-lg overflow-hidden">
            <div className={`
              grid gap-0
              ${view === 'month' ? 'grid-cols-7' : view === 'week' ? 'grid-cols-7' : 'grid-cols-1'}
            `}>
              {/* Day Headers */}
              {view !== 'day' && (
                <>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="
                      bg-gray-50 px-1 sm:px-2 py-2 sm:py-3
                      text-xs sm:text-sm font-medium text-gray-900 text-center
                      border-b border-r border-gray-200
                    ">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.charAt(0)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Calendar Days */}
              {getDaysToDisplay().map((day) => (
                <div key={day.toString()}>
                  {renderDayContent(day)}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
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
        </div>
      </div>

      {/* Event Details Modal */}
      <EventModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent || undefined}
      />
    </div>
  );
};

export default Calendar;