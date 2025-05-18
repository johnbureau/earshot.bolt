/*
  # Add recurring event support

  1. New Columns
    - `is_recurring` (boolean) - Whether event repeats
    - `recurring_frequency` (text) - How often event repeats
    - `recurring_end_date` (date) - When recurring event ends
    - `start_time` (text) - Event start time
    - `end_time` (text) - Event end time

  2. Changes
    - Add check constraints for valid values
    - Add default values where appropriate
    - Add indexes for recurring event queries
*/

-- Drop existing constraints if they exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_recurring_frequency'
    ) THEN
        ALTER TABLE events DROP CONSTRAINT valid_recurring_frequency;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_time_format'
    ) THEN
        ALTER TABLE events DROP CONSTRAINT valid_time_format;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_recurring_event'
    ) THEN
        ALTER TABLE events DROP CONSTRAINT valid_recurring_event;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_recurring_end_date'
    ) THEN
        ALTER TABLE events DROP CONSTRAINT valid_recurring_end_date;
    END IF;
END $$;

-- Add recurring event columns
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_frequency TEXT,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE,
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Add check constraints
ALTER TABLE events ADD CONSTRAINT valid_recurring_frequency 
  CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('daily', 'weekly', 'monthly'));

-- Add validation for times
ALTER TABLE events ADD CONSTRAINT valid_time_format
  CHECK (
    (start_time IS NULL OR start_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$') AND
    (end_time IS NULL OR end_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
  );

-- Add validation for recurring events
ALTER TABLE events ADD CONSTRAINT valid_recurring_event
  CHECK (
    (is_recurring = false) OR
    (is_recurring = true AND recurring_frequency IS NOT NULL AND recurring_end_date IS NOT NULL)
  );

-- Add validation for end date
ALTER TABLE events ADD CONSTRAINT valid_recurring_end_date
  CHECK (
    (recurring_end_date IS NULL) OR
    (recurring_end_date >= event_date)
  );

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_events_recurring;
DROP INDEX IF EXISTS idx_events_date_time;

-- Create indexes for recurring event queries
CREATE INDEX idx_events_recurring 
  ON events(is_recurring, recurring_frequency, recurring_end_date);

CREATE INDEX idx_events_date_time 
  ON events(event_date, start_time, end_time);

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view recurring events they're involved in" ON events;

-- Add RLS policies for recurring events
CREATE POLICY "Users can view recurring events they're involved in"
  ON events
  FOR SELECT
  USING (
    is_recurring = true AND (
      creator_id = auth.uid() OR
      seeking_creators = true OR
      EXISTS (
        SELECT 1 FROM applications
        WHERE applications.event_id = events.id
        AND applications.creator_id = auth.uid()
      )
    )
  );

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_recurring_event_instances;

-- Add function to get recurring event instances
CREATE OR REPLACE FUNCTION get_recurring_event_instances(
  p_event_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  event_date DATE,
  start_time TEXT,
  end_time TEXT
) AS $$
DECLARE
  v_event RECORD;
  v_current_date DATE;
BEGIN
  -- Get the base event
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id;

  IF NOT FOUND OR NOT v_event.is_recurring THEN
    RETURN;
  END IF;

  v_current_date := GREATEST(v_event.event_date, p_start_date);

  WHILE v_current_date <= LEAST(v_event.recurring_end_date, p_end_date) LOOP
    CASE v_event.recurring_frequency
      WHEN 'daily' THEN
        RETURN QUERY SELECT v_current_date, v_event.start_time, v_event.end_time;
        v_current_date := v_current_date + INTERVAL '1 day';
      WHEN 'weekly' THEN
        IF EXTRACT(DOW FROM v_current_date) = EXTRACT(DOW FROM v_event.event_date) THEN
          RETURN QUERY SELECT v_current_date, v_event.start_time, v_event.end_time;
        END IF;
        v_current_date := v_current_date + INTERVAL '1 day';
      WHEN 'monthly' THEN
        IF EXTRACT(DAY FROM v_current_date) = EXTRACT(DAY FROM v_event.event_date) THEN
          RETURN QUERY SELECT v_current_date, v_event.start_time, v_event.end_time;
        END IF;
        v_current_date := v_current_date + INTERVAL '1 day';
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 