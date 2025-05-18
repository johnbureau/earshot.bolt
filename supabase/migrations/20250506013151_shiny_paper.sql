/*
  # Connect host_locations to profilesv2

  1. Changes
    - Add foreign key constraint between host_locations and profilesv2
    - Enable RLS and add access policies
    - Add performance indexes
    
  2. Security
    - Public read access to locations
    - Hosts can manage their own locations
*/

-- First, create a temporary table to store valid relationships
CREATE TEMP TABLE valid_host_locations AS
SELECT hl.*
FROM host_locations hl
JOIN profilesv2 p ON p."Row ID" = hl."Host Row-ID"
WHERE p.role = 'host';

-- Clear the original table
TRUNCATE host_locations;

-- Add foreign key constraint
ALTER TABLE host_locations
ADD CONSTRAINT host_locations_host_row_id_fkey
FOREIGN KEY ("Host Row-ID")
REFERENCES profilesv2("Row ID")
ON DELETE CASCADE;

-- Restore valid data
INSERT INTO host_locations
SELECT * FROM valid_host_locations;

-- Drop temporary table
DROP TABLE valid_host_locations;

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