import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Avatar from './Avatar';
import Badge from './Badge';
import { Event } from '../../types';

interface EventCardProps {
  event: Event;
  showHost?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, showHost = false }) => {
  const isClosingSoon = event.application_deadline && 
    differenceInDays(new Date(event.application_deadline), new Date()) <= 3;

  // Find approved creator if any
  const approvedCreator = event.applications?.find(app => app.status === 'approved')?.creator;

  // Get display name helper function
  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  // Determine event status and color
  const getEventStatus = () => {
    if (approvedCreator) {
      return {
        variant: 'success' as const,
        label: 'Creator Assigned',
        bgColor: 'bg-success-50',
        borderColor: 'border-success-100'
      };
    }
    if (event.seeking_creators) {
      return {
        variant: 'primary' as const,
        label: 'Seeking Creator',
        bgColor: 'bg-primary-50',
        borderColor: 'border-primary-100'
      };
    }
    return {
      variant: 'secondary' as const,
      label: 'No Creator Needed',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const status = getEventStatus();

  return (
    <Link 
      to={`/events/${event.id}`}
      className="block group"
    >
      <div className={`
        rounded-xl border ${status.borderColor} ${status.bgColor}
        transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px]
      `}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={status.variant}>
                  {status.label}
                </Badge>
                {event.category && (
                  <Badge variant="secondary" size="sm">
                    {event.category}
                  </Badge>
                )}
                {isClosingSoon && event.seeking_creators && (
                  <Badge variant="warning" size="sm">
                    Closing Soon
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Date Badge */}
            <div className="flex-shrink-0 text-center">
              <div className="text-sm font-medium text-gray-600">
                {format(new Date(event.event_date), 'MMM')}
              </div>
              <div className="text-xl font-bold text-gray-900">
                {format(new Date(event.event_date), 'd')}
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-2 text-sm text-gray-600">
            {event.location && (
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}

            {event.seeking_creators && (
              <>
                {event.max_applications && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Users size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                      <span>{event.current_applications || 0} of {event.max_applications} spots</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(((event.current_applications || 0) / event.max_applications) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {event.application_deadline && (
                  <div className="flex items-center text-sm">
                    <Clock size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                    <span>Applications due {format(new Date(event.application_deadline), 'MMM d')}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Creator/Host Info */}
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            {showHost ? (
              <div className="flex items-center">
                <Avatar
                  src={event.creator?.avatar_url}
                  fallback={getDisplayName(event.creator)}
                  size="sm"
                />
                <div className="ml-2 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayName(event.creator)}
                  </p>
                  <p className="text-xs text-gray-500">Event Host</p>
                </div>
              </div>
            ) : approvedCreator ? (
              <div className="flex items-center">
                <Avatar
                  src={approvedCreator.avatar_url}
                  fallback={getDisplayName(approvedCreator)}
                  size="sm"
                />
                <div className="ml-2 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayName(approvedCreator)}
                  </p>
                  <p className="text-xs text-gray-500">Approved Creator</p>
                </div>
              </div>
            ) : event.seeking_creators ? (
              <div className="flex items-center text-primary-600">
                <Users size={16} className="mr-2" />
                <span className="text-sm font-medium">Apply as Creator</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <Users size={16} className="mr-2" />
                <span className="text-sm">No creator needed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;