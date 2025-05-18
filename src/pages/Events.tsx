import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Search, Filter, PlusCircle } from 'lucide-react';
import Select from 'react-select';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EventCard from '../components/ui/EventCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Event } from '../types';

const Events: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        let query = supabase
          .from('events')
          .select(`
            *,
            creator:profilesv2(*),
            applications(
              id,
              status,
              creator:profilesv2(*)
            )
          `);

        if (categoryFilter) {
          query = query.eq('category', categoryFilter);
        }

        if (locationFilter) {
          query = query.eq('location', locationFilter);
        }

        const { data } = await query;

        let sortedData = data || [];
        switch (sortBy) {
          case 'date':
            sortedData.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
            break;
          case 'recent':
            sortedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
        }

        setEvents(sortedData);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [categoryFilter, locationFilter, sortBy]);

  const categories = Array.from(new Set(events.map(event => event.category).filter(Boolean)));
  const locations = Array.from(new Set(events.map(event => event.location).filter(Boolean)));

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingEvents = filteredEvents.filter(event => 
    new Date(event.event_date) >= new Date()
  );

  const pastEvents = filteredEvents.filter(event => 
    new Date(event.event_date) < new Date()
  );

  return (
    <div className="bg-gray-50 py-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="container-custom max-w-5xl py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Events</h1>
              <p className="text-sm text-gray-500 mt-1">
                Browse upcoming events
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search size={18} />}
                className="w-full sm:w-64"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters((prev) => !prev)}
                icon={<Filter size={18} />}
              >
                Filters
              </Button>

              {profile?.role === 'host' && (
                <Link to="/events/create">
                  <Button
                    size="sm"
                    icon={<PlusCircle size={18} />}
                  >
                    Create
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select
                  isClearable
                  placeholder="All categories"
                  value={categoryFilter ? { value: categoryFilter, label: categoryFilter } : null}
                  onChange={(option) => setCategoryFilter(option?.value || null)}
                  options={categories.map(cat => ({ value: cat, label: cat }))}
                  className="text-sm"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Select
                  isClearable
                  placeholder="All locations"
                  value={locationFilter ? { value: locationFilter, label: locationFilter } : null}
                  onChange={(option) => setLocationFilter(option?.value || null)}
                  options={locations.map(loc => ({ value: loc, label: loc }))}
                  className="text-sm"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <Select
                  value={{ value: sortBy, label: {
                    date: 'Event Date',
                    recent: 'Recently Added',
                  }[sortBy] }}
                  onChange={(option) => setSortBy(option?.value || 'date')}
                  options={[
                    { value: 'date', label: 'Event Date' },
                    { value: 'recent', label: 'Recently Added' },
                  ]}
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container-custom max-w-5xl py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Upcoming Events
                </h2>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      showHost={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Past Events
                </h2>
                <div className="space-y-4">
                  {pastEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      showHost={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;