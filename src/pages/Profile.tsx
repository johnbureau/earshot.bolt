import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera, Mail, MapPin, Globe, Building, Music, Clock, Loader2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Select from 'react-select';

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

const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    Name: profile?.Name || '',
    Description: profile?.Description || '',
    Website: profile?.Website || '',
    location: profile?.location || '',
    'User Type': profile?.['User Type'] || '',
    'User Sub-Type': profile?.['User Sub-Type'] || '',
    'Experience (Yrs.)': profile?.['Experience (Yrs.)'] || '',
    Category: profile?.Category || '',
    Activity: profile?.Activity || '',
    Instruments: profile?.Instruments || '',
    'Song Types': profile?.['Song Types'] || '',
    Spotify: profile?.Spotify || '',
    Instagram: profile?.Instagram || '',
    Video: profile?.Video || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await updateProfile(formData);
      if (updateError) throw updateError;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });

      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([oldFileName]);
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getDisplayName = () => {
    return profile?.Name || profile?.Email?.split('@')[0] || '';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="bg-white rounded-lg shadow">
        {/* Profile Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div 
                className={`cursor-pointer relative ${uploadingAvatar ? 'opacity-50' : ''}`}
                onClick={handleAvatarClick}
              >
                <Avatar
                  src={profile?.avatar_url}
                  fallback={getDisplayName()}
                  size="lg"
                />
                <button className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-lg border border-gray-200">
                  {uploadingAvatar ? (
                    <Loader2 size={16} className="text-gray-600 animate-spin" />
                  ) : (
                    <Camera size={16} className="text-gray-600" />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploadingAvatar}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{getDisplayName()}</h2>
              <p className="text-gray-600 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                placeholder="Enter your full name"
              />
              
              <Input
                label="Email"
                value={profile?.Email || ''}
                disabled
                startIcon={<Mail size={18} className="text-gray-400" />}
                helperText="Email cannot be changed"
              />
              
              <Input
                label="Website"
                value={formData.Website}
                onChange={(e) => setFormData({ ...formData, Website: e.target.value })}
                placeholder="https://your-website.com"
                startIcon={<Globe size={18} className="text-gray-400" />}
              />

              <Input
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter your location"
                startIcon={<MapPin size={18} className="text-gray-400" />}
              />
            </div>

            <div className="mt-4">
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
          </div>

          {/* Role-specific Fields */}
          {profile?.role === 'host' ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Venue Information</h3>
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
                />
              </div>
            </div>
          ) : profile?.role === 'creator' ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Creator Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Years of Experience"
                  value={formData['Experience (Yrs.)']}
                  onChange={(e) => setFormData({ ...formData, 'Experience (Yrs.)': e.target.value })}
                  placeholder="Enter years of experience"
                  startIcon={<Clock size={18} className="text-gray-400" />}
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
            </div>
          ) : null}

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              type="submit"
              isLoading={loading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;