/*
  # Add Profile Fields and Event Enhancements

  1. Profile Updates
    - Add bio, skills, location, and professional title
    - Add avatar support
  
  2. Event Updates
    - Add location and category
    - Add status field
    - Add featured image support
    - Add application deadline and limits
    
  3. Application Updates
    - Add message and skills fields
*/

-- Update profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS professional_title TEXT;

-- Update events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled')),
ADD COLUMN IF NOT EXISTS featured_image TEXT,
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_applications INTEGER;

-- Update applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Add indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);