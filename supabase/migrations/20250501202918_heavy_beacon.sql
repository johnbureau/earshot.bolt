/*
  # Add missing event fields

  1. New Columns
    - `start_time` (text) - Event start time
    - `end_time` (text) - Event end time
    - `is_recurring` (boolean) - Whether event repeats
    - `recurring_frequency` (text) - How often event repeats
    - `recurring_end_date` (date) - When recurring event ends
    - `is_private` (boolean) - Whether event is private
    - `cost` (numeric) - Event cost/price
    - `cost_type` (text) - Type of cost (ticket, cover, etc)
    - `age_restriction` (text) - Age requirements

  2. Changes
    - Add check constraints for valid values
    - Add default values where appropriate
*/

-- Add missing columns
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS end_time TEXT,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_frequency TEXT,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cost NUMERIC,
ADD COLUMN IF NOT EXISTS cost_type TEXT,
ADD COLUMN IF NOT EXISTS age_restriction TEXT;

-- Add check constraints
ALTER TABLE events ADD CONSTRAINT valid_recurring_frequency 
  CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('daily', 'weekly', 'monthly'));

ALTER TABLE events ADD CONSTRAINT valid_cost_type
  CHECK (cost_type IS NULL OR cost_type IN ('ticket', 'cover', 'entry', 'donation'));

ALTER TABLE events ADD CONSTRAINT valid_age_restriction
  CHECK (age_restriction IS NULL OR age_restriction IN ('18+', '21+'));

-- Add validation for times
ALTER TABLE events ADD CONSTRAINT valid_time_format
  CHECK (
    (start_time IS NULL OR start_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$') AND
    (end_time IS NULL OR end_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
  );