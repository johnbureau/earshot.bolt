import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, ChevronLeft } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Application } from '../types';
import { format } from 'date-fns';

const Applications: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!profile) return;
    
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let query = supabase
          .from('applications')
          .select(`
            *,
            event:events(*),
            creator:profilesv2!creator_id(*)
          `)
          .order('created_at', { ascending: false });
          
        if (profile.role === 'creator') {
          query = query.eq('creator_id', profile.id);
        } else if (profile.role === 'host') {
          query = query.eq('event.creator_id', profile.id);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        setApplications(data || []);
      } catch (err: any) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [profile]);

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };
  
  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 pb-12">
        <div className="container-custom py-8">
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={16} className="mr-1" />
              Back to Dashboard
            </button>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            {profile?.role === 'creator' ? 'My Applications' : 'Applications'}
          </h1>
          
          {error && (
            <div className="mb-6 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {profile?.role === 'creator'
                  ? "You haven't applied to any events yet"
                  : "No applications received"
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {profile?.role === 'creator'
                  ? "Check out the opportunities tab to find events to apply to!"
                  : "When creators apply to your events, they'll appear here."
                }
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {application.event?.title}
                        </h3>
                        {application.status === 'pending' && (
                          <Badge variant="warning">Pending</Badge>
                        )}
                        {application.status === 'approved' && (
                          <Badge variant="success">Approved</Badge>
                        )}
                        {application.status === 'declined' && (
                          <Badge variant="error">Declined</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar size={14} className="mr-1.5" />
                        Event Date: {application.event?.event_date && 
                          format(new Date(application.event.event_date), 'MMMM d, yyyy')}
                      </div>
                      
                      {profile?.role === 'host' && (
                        <div className="text-sm text-gray-600 mt-2">
                          Applicant: {getDisplayName(application.creator)}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500 mt-2">
                        Applied on {format(new Date(application.created_at), 'MMMM d, yyyy')}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      <Link to={`/events/${application.event_id}`}>
                        <Button variant="outline" size="sm">
                          View Event
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Applications;