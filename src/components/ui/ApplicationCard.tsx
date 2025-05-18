import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';
import { Application } from '../../types';

interface ApplicationCardProps {
  application: Application;
  onApprove?: () => void;
  onDecline?: () => void;
  showCreator?: boolean;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onApprove,
  onDecline,
  showCreator = false,
}) => {
  const statusVariant = {
    pending: 'warning',
    approved: 'success',
    declined: 'error',
  }[application.status];

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-start gap-4">
        {showCreator && application.creator && (
          <Avatar
            src={application.creator.avatar_url}
            fallback={getDisplayName(application.creator)}
            size="lg"
          />
        )}

        <div className="flex-grow">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {application.event?.title}
              </h3>
              {showCreator && application.creator && (
                <div className="mt-1">
                  <p className="font-medium text-gray-800">
                    {getDisplayName(application.creator)}
                  </p>
                  {application.creator['User Sub-Type'] && (
                    <p className="text-sm text-gray-600">
                      {application.creator['User Sub-Type']}
                    </p>
                  )}
                </div>
              )}
            </div>
            <Badge variant={statusVariant}>{application.status}</Badge>
          </div>

          {/* Skills */}
          {application.skills && application.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {application.skills.map((skill) => (
                <Badge key={skill} variant="secondary" size="sm">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {/* Message */}
          {application.message && (
            <p className="text-gray-600 text-sm mb-4">
              {application.message}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Applied {format(new Date(application.created_at), 'MMM d, yyyy')}
            </div>

            <div className="flex gap-2">
              {application.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDecline}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={onApprove}
                  >
                    Approve
                  </Button>
                </>
              )}
              
              {application.status === 'approved' && application.chat_id && (
                <Link to={`/chats/${application.chat_id}`}>
                  <Button
                    size="sm"
                    icon={<MessageSquare size={16} />}
                  >
                    Chat
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;