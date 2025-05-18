/*
  # Add public access policy for profilesv2

  1. Changes
    - Add policy to allow public read access to profilesv2 table
    - Anyone can view basic profile information
*/

-- Enable RLS if not already enabled
ALTER TABLE profilesv2 ENABLE ROW LEVEL SECURITY;

-- Add policy for public read access
CREATE POLICY "Allow public read access to profiles"
ON profilesv2
FOR SELECT
TO public
USING (true);