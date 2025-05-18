import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Paintbrush, ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from 'react-select';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';

const HOST_TYPES = [
  'Apartment', 'Art House', 'Bar', 'Beer Garden', 'Bistro',
  'Bottle Shop', 'Brewery', 'Brewpub', 'Cafe', 'Club',
  'Coffee Shop', 'Cocktail Bar', 'Country Club', 'Distillery',
  'Event Space', 'Food Hall', 'Garden', 'Gastropub', 'Grill',
  'Grocery Store', 'Hotel', 'Inn', 'Kitchen', 'Lounge',
  'Market (Shop)', 'Museum', 'Music Hall', 'Park',
  'Pop-up Market', 'Pub', 'Restaurant', 'Saloon', 'Seltzery',
  'Shopping Center', 'Speakeasy', 'Sports Bar', 'Stadium',
  'Taproom', 'Tasting Room', 'Tavern', 'Vineyard', 'Wine Bar',
  'Winery', 'Other'
].map(type => ({ value: type, label: type }));

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
].map(state => ({ value: state, label: state }));

const MUSICIAN_TYPES = [
  'Solo', 'Duo', 'Trio', 'Band'
].map(type => ({ value: type, label: type }));

const MUSIC_GENRES = [
  'Rock', 'Pop', 'Jazz', 'Blues', 'Country',
  'Folk', 'R&B', 'Hip Hop', 'Electronic',
  'Classical', 'Latin', 'Reggae', 'World',
  'Alternative', 'Metal'
].map(genre => ({ value: genre, label: genre }));

const RoleSelection: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    Name: '',
    Description: '',
    Website: '',
    location: '',
    'User Type': '',
    'User Sub-Type': '',
    'Experience (Yrs.)': '',
    Category: '',
    Activity: '',
    'Song Types': '',
    Spotify: '',
    Instagram: '',
    Video: ''
  });
  
  const handleRoleSelect = () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedRole || !user?.id || !user?.email) {
      setError('Missing required information. Please try again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Process form data
      const processedData = {
        id: user.id,
        role: selectedRole,
        Email: user.email,
        "Row ID": `user_${user.id}`,
        ...formData,
        'User Type': selectedRole === 'host' ? 'Host' : 'Creator',
        Category: selectedRole === 'host' ? null : 'Music',
        Activity: selectedRole === 'host' ? null : formData['User Sub-Type'],
        created_at: new Date().toISOString()
      };

      // Validate required fields
      if (!processedData.Name) {
        throw new Error('Name is required');
      }

      if (selectedRole === 'host' && !formData['User Sub-Type']) {
        throw new Error('Venue type is required');
      }

      if (selectedRole === 'creator' && !formData['User Sub-Type']) {
        throw new Error('Musician type is required');
      }

      // Create profile in profilesv2
      const { error: upsertError } = await supabase
        .from('profilesv2')
        .upsert(processedData);
      
      if (upsertError) throw upsertError;
      
      // Update local auth context
      await updateProfile(processedData);
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error setting up profile:', err);
      setError(err.message || 'Failed to set up profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };
  
  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 pb-12 flex flex-col items-center justify-center bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
          {step === 1 ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Choose your account type
              </h2>
              <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
                Select the role that best describes you. This will personalize your experience.
              </p>
              
              {error && (
                <div className="mb-6 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div 
                  className={`
                    border-2 p-6 rounded-xl shadow-sm text-center cursor-pointer 
                    transition-all transform hover:scale-105
                    ${selectedRole === 'host' 
                      ? 'border-primary-600 bg-primary-50 scale-105'
                      : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/30'
                    }
                  `}
                  onClick={() => setSelectedRole('host')}
                >
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full">
                    <Briefcase size={30} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Host</h3>
                  <p className="text-gray-600">
                    You organize events and are looking for creators to collaborate with.
                  </p>
                </div>
                
                <div 
                  className={`
                    border-2 p-6 rounded-xl shadow-sm text-center cursor-pointer 
                    transition-all transform hover:scale-105
                    ${selectedRole === 'creator' 
                      ? 'border-accent-600 bg-accent-50 scale-105'
                      : 'border-gray-200 bg-white hover:border-accent-300 hover:bg-accent-50/30'
                    }
                  `}
                  onClick={() => setSelectedRole('creator')}
                >
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-accent-100 text-accent-700 rounded-full">
                    <Paintbrush size={30} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Creator</h3>
                  <p className="text-gray-600">
                    You are a talent looking for opportunities to showcase your skills at events.
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleRoleSelect}
                disabled={!selectedRole}
                icon={<ArrowRight size={18} />}
                iconPosition="right"
                size="lg"
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Complete Your Profile
              </h2>
              <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
                Tell us more about yourself so we can help you find the perfect matches.
              </p>

              {error && (
                <div className="mb-6 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <Input
                      label="Name"
                      value={formData.Name}
                      onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        className="input min-h-[120px]"
                        value={formData.Description}
                        onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <Input
                      label="Website"
                      value={formData.Website}
                      onChange={(e) => setFormData({ ...formData, Website: e.target.value })}
                      placeholder="https://your-website.com"
                    />

                    <Input
                      label="Location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, State"
                    />
                  </div>

                  {/* Role-specific Fields */}
                  {selectedRole === 'host' ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Venue Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Venue Type
                        </label>
                        <Select
                          value={formData['User Sub-Type'] ? { value: formData['User Sub-Type'], label: formData['User Sub-Type'] } : null}
                          onChange={(option) => setFormData({ ...formData, 'User Sub-Type': option?.value || '' })}
                          options={HOST_TYPES}
                          isClearable
                          placeholder="Select venue type..."
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Creator Information</h3>
                      
                      <Input
                        type="text"
                        label="Years of Experience"
                        value={formData['Experience (Yrs.)']}
                        onChange={(e) => setFormData({ ...formData, 'Experience (Yrs.)': e.target.value })}
                        placeholder="Enter years of experience"
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Musician Type
                        </label>
                        <Select
                          value={formData['User Sub-Type'] ? { value: formData['User Sub-Type'], label: formData['User Sub-Type'] } : null}
                          onChange={(option) => setFormData({ ...formData, 'User Sub-Type': option?.value || '' })}
                          options={MUSICIAN_TYPES}
                          isClearable
                          placeholder="Select musician type..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Music Genre
                        </label>
                        <Select
                          value={formData['Song Types'] ? { value: formData['Song Types'], label: formData['Song Types'] } : null}
                          onChange={(option) => setFormData({ ...formData, 'Song Types': option?.value || '' })}
                          options={MUSIC_GENRES}
                          isClearable
                          placeholder="Select music genre..."
                        />
                      </div>

                      <Input
                        label="Spotify Profile"
                        value={formData.Spotify}
                        onChange={(e) => setFormData({ ...formData, Spotify: e.target.value })}
                        placeholder="Your Spotify profile URL"
                      />

                      <Input
                        label="Instagram Profile"
                        value={formData.Instagram}
                        onChange={(e) => setFormData({ ...formData, Instagram: e.target.value })}
                        placeholder="Your Instagram handle"
                      />

                      <Input
                        label="Video Link"
                        value={formData.Video}
                        onChange={(e) => setFormData({ ...formData, Video: e.target.value })}
                        placeholder="Link to your performance video"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    icon={<ArrowLeft size={18} />}
                    disabled={loading}
                  >
                    Back
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    isLoading={loading}
                    icon={<ArrowRight size={18} />}
                    iconPosition="right"
                  >
                    Complete Setup
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RoleSelection;