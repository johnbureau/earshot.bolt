/*
  # Fix host locations foreign key and policies

  1. Changes
    - Drop existing constraint and policies
    - Update host locations with correct Row IDs
    - Recreate foreign key constraint
    - Recreate RLS policies
    - Add performance indexes
*/

-- Drop existing constraint and policies
ALTER TABLE host_locations
DROP CONSTRAINT IF EXISTS host_locations_host_row_id_fkey;

DROP POLICY IF EXISTS "Anyone can view host locations" ON host_locations;
DROP POLICY IF EXISTS "Hosts can manage their own locations" ON host_locations;

-- First, ensure all host_locations have valid Host Row-ID values
DO $$ 
BEGIN
  -- Create a temporary table to store the mapping
  CREATE TEMP TABLE host_mapping AS
  SELECT 
    hl."Row ID" as location_id,
    p."Row ID" as profile_row_id
  FROM host_locations hl
  JOIN profilesv2 p ON p.id::text = hl."Host Row-ID"
  WHERE p.role = 'host';

  -- Update host_locations with the correct Row ID values
  UPDATE host_locations hl
  SET "Host Row-ID" = m.profile_row_id
  FROM host_mapping m
  WHERE hl."Row ID" = m.location_id;
END $$;

-- Add foreign key constraint
ALTER TABLE host_locations
ADD CONSTRAINT host_locations_host_row_id_fkey
FOREIGN KEY ("Host Row-ID")
REFERENCES profilesv2("Row ID")
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE host_locations ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Anyone can view host locations"
ON host_locations
FOR SELECT
TO public
USING (true);

CREATE POLICY "Hosts can manage their own locations"
ON host_locations
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profilesv2 p
    WHERE p.id = auth.uid()
    AND p."Row ID" = host_locations."Host Row-ID"
    AND p.role = 'host'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profilesv2 p
    WHERE p.id = auth.uid()
    AND p."Row ID" = host_locations."Host Row-ID"
    AND p.role = 'host'
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_host_locations_host_row_id 
ON host_locations("Host Row-ID");

CREATE INDEX IF NOT EXISTS idx_host_locations_name 
ON host_locations("Name");

CREATE INDEX IF NOT EXISTS idx_host_locations_host_type 
ON host_locations("Host Type");