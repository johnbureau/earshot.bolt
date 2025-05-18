/*
  # Update events foreign key to reference profilesv2

  1. Changes
    - Drop existing foreign key constraint on events.creator_id
    - Add new foreign key constraint referencing profilesv2 table
    - Update existing events to ensure data consistency
*/

-- Drop the existing foreign key constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_creator_id_fkey;

-- Add new foreign key constraint to profilesv2
ALTER TABLE events
ADD CONSTRAINT events_creator_id_fkey
FOREIGN KEY (creator_id) REFERENCES profilesv2(id)
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);