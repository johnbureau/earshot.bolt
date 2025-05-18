import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, MapPin, Building, Instagram, Filter } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';

interface HostLocation {
  "Row ID": string;
  "Name": string;
  "Standalone Name": string;
  "address": string;
  "Instagram": string;
  "Host Type": string;
  "Host Row-ID": string;
  id: string;
}

const Places: React.FC = () => {
  const [locations, setLocations] = useState<HostLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('host_locations')
          .select('*')
          .order('Name', { ascending: true });

        if (error) throw error;
        setLocations(data || []);
      } catch (err: any) {
        console.error('Error fetching locations:', err);
        setError('Failed to load locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const hostTypes = Array.from(new Set(locations.map(loc => loc['Host Type'])))
    .filter(Boolean)
    .sort();

  const filteredLocations = locations.filter(location => {
    const matchesSearch = 
      location.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !typeFilter || location['Host Type'] === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom max-w-7xl py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Places</h1>
              <p className="text-sm text-gray-500 mt-1">
                Discover amazing venues and event spaces
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Search places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search size={18} />}
                className="w-full sm:w-64"
              />

              <Button
                variant="outline"
                size="sm"
                icon={<Filter size={18} />}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue Type
              </label>
              <select
                className="input"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All types</option>
                {hostTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
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
        ) : error ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error}
            </h3>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full">
              <MapPin size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No places found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary-100 text-primary-600 rounded-xl">
                    <Building size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {location.Name}
                      </h3>
                      <Badge variant="secondary" size="sm">
                        {location['Host Type']}
                      </Badge>
                    </div>

                    {location['Standalone Name'] && (
                      <p className="text-sm text-gray-600 mt-1">
                        {location['Standalone Name']}
                      </p>
                    )}
                    
                    {location.address && (
                      <div className="flex items-center text-gray-600 mt-2">
                        <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                        <span className="truncate">{location.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      {location.Instagram && (
                        <a
                          href={`https://instagram.com/${location.Instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                        >
                          <Instagram size={16} className="mr-1" />
                          {location.Instagram}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Places;