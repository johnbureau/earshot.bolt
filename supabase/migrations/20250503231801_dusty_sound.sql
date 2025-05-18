/*
  # Add Profile Fields

  1. New Columns
    - Basic profile fields (bio, website)
    - Location fields (street_address, city, state)
    - Host-specific fields (host_type)
    - Creator-specific fields (experience, category, activity)
    - Musician-specific fields (type, genre)
    - Preferences (preferred_host_types)

  2. Constraints
    - Valid US states
    - Valid host types
    - Valid musician types
    - Valid music genres
    - URL format validation
    - Experience years validation
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS host_type TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS creator_category TEXT,
ADD COLUMN IF NOT EXISTS creator_activity TEXT,
ADD COLUMN IF NOT EXISTS musician_type TEXT,
ADD COLUMN IF NOT EXISTS music_genre TEXT,
ADD COLUMN IF NOT EXISTS preferred_host_types TEXT[];

-- Add check constraint for valid US states
ALTER TABLE profiles ADD CONSTRAINT valid_us_state 
  CHECK (
    state IS NULL OR state IN (
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    )
  );

-- Add check constraint for valid host types
ALTER TABLE profiles ADD CONSTRAINT valid_host_type
  CHECK (
    host_type IS NULL OR host_type IN (
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
    )
  );

-- Add check constraint for musician types
ALTER TABLE profiles ADD CONSTRAINT valid_musician_type
  CHECK (
    musician_type IS NULL OR musician_type IN (
      'Solo', 'Duo', 'Trio', 'Band'
    )
  );

-- Add check constraint for music genres
ALTER TABLE profiles ADD CONSTRAINT valid_music_genre
  CHECK (
    music_genre IS NULL OR music_genre IN (
      'Rock', 'Pop', 'Jazz', 'Blues', 'Country',
      'Folk', 'R&B', 'Hip Hop', 'Electronic',
      'Classical', 'Latin', 'Reggae', 'World',
      'Alternative', 'Metal'
    )
  );

-- Create a function to validate host types array
CREATE OR REPLACE FUNCTION check_host_types(types TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN types <@ ARRAY[
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
  ]::TEXT[];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraint for preferred host types array using the function
ALTER TABLE profiles ADD CONSTRAINT valid_preferred_host_types
  CHECK (
    preferred_host_types IS NULL OR
    check_host_types(preferred_host_types)
  );

-- Add URL format validation for website
ALTER TABLE profiles ADD CONSTRAINT valid_website_url
  CHECK (
    website IS NULL OR 
    website ~* '^https?:\/\/([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$'
  );

-- Add validation for experience years
ALTER TABLE profiles ADD CONSTRAINT valid_experience_years
  CHECK (
    experience_years IS NULL OR 
    (experience_years >= 0 AND experience_years <= 100)
  );

-- Add indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_profiles_host_type ON profiles(host_type) WHERE host_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_creator_category ON profiles(creator_category) WHERE creator_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city) WHERE city IS NOT NULL;