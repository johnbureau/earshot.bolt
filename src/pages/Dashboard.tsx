import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  PlusCircle,
  Calendar,
  MessageSquare,
  Search,
  Users,
  DollarSign,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ChatPreview from '../components/ui/ChatPreview';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import DashboardCard from '../components/ui/DashboardCard';
import StatsChart from '../components/ui/StatsChart';
import { Event, Chat } from '../types';
import { format, subDays, parseISO, isAfter } from 'date-fns';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [opportunities, setOpportunities] = useState<Event[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [netProfit, setNetProfit] = useState(0);
  
  // Mock data for stats
  const mockStatsData = Array.from({ length: 7 }, (_, i) => ({
    name: format(subDays(new Date(), 6 - i), 'MMM d'),
    value: Math.floor(Math.random() * 50) + 20,
    total: Math.floor(Math.random() * 100) + 50,
  }));

  useEffect(() => {
    if (!profile) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch events created by the user
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            *,
            creator:profilesv2(*),
            applications(count)
          `)
          .eq('creator_id', profile.id)
          .order('event_date', { ascending: true });
          
        if (eventsError) throw eventsError;
        setEvents(eventsData || []);
        
        // Fetch opportunities for creators
        if (profile.role === 'creator') {
          const { data: opportunitiesData, error: opportunitiesError } = await supabase
            .from('events')
            .select(`
              *,
              creator:profilesv2(*),
              applications(count)
            `)
            .eq('seeking_creators', true)
            .eq('status', 'published')
            .neq('creator_id', profile.id)
            .order('event_date', { ascending: true });
            
          if (opportunitiesError) throw opportunitiesError;
          setOpportunities(opportunitiesData || []);
        }
        
        // Fetch chats
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select(`
            *,
            event:events(title),
            host:profilesv2!host_id(*),
            creator:profilesv2!creator_id(*)
          `)
          .or(`host_id.eq.${profile.id},creator_id.eq.${profile.id}`)
          .order('last_message_at', { ascending: false });
          
        if (chatsError) throw chatsError;
        setChats(chatsData || []);

        // Fetch financial data for net profit
        if (profile.role === 'host') {
          const { data: financialsData, error: financialsError } = await supabase
            .from('event_financials')
            .select('total_sales, creator_cost')
            .in('event_id', eventsData?.map(e => e.id) || []);

          if (financialsError) throw financialsError;

          const totalProfit = (financialsData || []).reduce((sum, f) => 
            sum + (f.total_sales - f.creator_cost), 0
          );
          setNetProfit(totalProfit);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [profile]);

  const stats = [
    {
      title: 'Active Events',
      value: events.filter(e => isAfter(parseISO(e.event_date), new Date())).length,
      change: 2.5,
      icon: <Calendar size={20} />,
    },
    {
      title: 'Total Events',
      value: events.length,
      change: 0.8,
      icon: <Users size={20} />,
    },
    {
      title: 'Unread Messages',
      value: chats.reduce((acc, chat) => acc + (chat.unread_count || 0), 0),
      change: 1.2,
      icon: <MessageSquare size={20} />,
    },
    {
      title: 'Net Profit',
      value: `$${netProfit.toLocaleString()}`,
      change: 3.2,
      icon: <DollarSign size={20} />,
    },
  ];

  const filteredData = {
    events: events.filter(event => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isUpcoming = isAfter(parseISO(event.event_date), new Date());
      
      if (filter === 'upcoming') return matchesSearch && isUpcoming;
      if (filter === 'past') return matchesSearch && !isUpcoming;
      return matchesSearch;
    }),
    opportunities: opportunities.filter(event =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    chats: chats.filter(chat =>
      chat.event?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.creator?.Email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.host?.Email?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container-custom max-w-7xl px-2 sm:px-4">
        {error && (
          <div className="mb-4 sm:mb-8 bg-error-50 border border-error-200 text-error-700 px-4 sm:px-6 py-4 rounded-lg flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {getDisplayName(profile)}</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Here's what's happening with your {profile?.role === 'host' ? 'events' : 'opportunities'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search size={18} />}
                className="w-full"
              />
            </div>
            <Link to="/events/create" className="w-full sm:w-auto">
              <Button icon={<PlusCircle size={18} />} fullWidth>
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-6 mb-4 sm:mb-8">
          {stats.map((stat, index) => (
            <DashboardCard key={index} {...stat} />
          ))}
        </div>

        {/* Activity Chart */}
        <div className="mb-4 sm:mb-8 overflow-x-auto">
          <div className="min-w-[350px] sm:min-w-0">
            <StatsChart data={mockStatsData} />
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Events/Opportunities Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-semibold">
                    {profile?.role === 'host' ? 'Your Events' : 'Available Opportunities'}
                  </h2>

                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        filter === 'upcoming' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
                      }`}
                      onClick={() => setFilter('upcoming')}
                    >
                      Upcoming
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        filter === 'past' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
                      }`}
                      onClick={() => setFilter('past')}
                    >
                      Past
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        filter === 'all' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
                      }`}
                      onClick={() => setFilter('all')}
                    >
                      All
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {(profile?.role === 'host' ? filteredData.events : filteredData.opportunities)
                  .slice(0, 5)
                  .map((event) => (
                    <Link 
                      key={event.id} 
                      to={`/events/${event.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            {format(parseISO(event.event_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.applications?.[0]?.count || 0} applications
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>

              {(profile?.role === 'host' ? filteredData.events : filteredData.opportunities).length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No events found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {profile?.role === 'host'
                      ? "You haven't created any events yet"
                      : "No opportunities match your search criteria"}
                  </p>
                  {profile?.role === 'host' && (
                    <Link to="/events/create">
                      <Button icon={<PlusCircle size={18} />}>
                        Create Your First Event
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {(profile?.role === 'host' ? filteredData.events : filteredData.opportunities).length > 5 && (
                <div className="p-4 border-t border-gray-100">
                  <Link to="/events">
                    <Button variant="outline" fullWidth>
                      View All Events
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Chat Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Recent Chats</h2>
                  <Link to="/chats" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                    View All
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredData.chats.slice(0, 5).map((chat) => (
                  <ChatPreview
                    key={chat.id}
                    chat={chat}
                    currentUserId={profile?.id || ''}
                  />
                ))}

                {filteredData.chats.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full">
                      <MessageSquare size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No chats yet
                    </h3>
                    <p className="text-gray-500">
                      Start collaborating with other users to see your chats here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;