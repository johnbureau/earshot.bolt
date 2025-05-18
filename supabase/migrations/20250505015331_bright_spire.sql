/*
  # Fix profilesv2 table structure and policies

  1. Changes
    - Add missing columns to match the profiles schema
    - Enable RLS and add proper policies
    - Add necessary indexes
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profilesv2;

-- Add missing columns if they don't exist
ALTER TABLE profilesv2
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('host', 'creator')),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Enable RLS
ALTER TABLE profilesv2 ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to profiles"
ON profilesv2
FOR SELECT
TO public
USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profilesv2_name ON profilesv2("Name");
CREATE INDEX IF NOT EXISTS idx_profilesv2_email ON profilesv2("Email");
CREATE INDEX IF NOT EXISTS idx_profilesv2_location ON profilesv2(location);