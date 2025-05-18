/*
  # Simplify Event Permissions

  1. Changes
    - Update RLS policies to allow anyone to view events
    - Remove unnecessary complexity from event queries
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view events" ON events;

-- Create a simpler policy for viewing events
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  USING (true);

-- Update opportunities query in the application to remove unnecessary joins
COMMENT ON TABLE events IS 'Events table with simplified permissions for better visibility';