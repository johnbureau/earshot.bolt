/*
  # Add activity column to events table

  1. Changes
    - Add activity column to events table
    - Add check constraint to validate activity values
    - Update existing events to have null activity

  2. Security
    - Maintain existing RLS policies
*/

-- Add activity column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS activity TEXT;

-- Add check constraint for valid activities
ALTER TABLE events ADD CONSTRAINT valid_activity_values CHECK (
  (category = 'Community' AND activity IN (
    'Bike Night', 'Book Club', 'Discussion Group', 'Market', 'Pop-up Shop'
  )) OR
  (category = 'Entertainment' AND activity IN (
    'Arts & Crafts', 'Comedy', 'Improv', 'Line Dancing', 'Movie', 'Theatre', 'Variety Open Mic'
  )) OR
  (category = 'Fitness' AND activity IN (
    'Bike Club', 'HIIT', 'Pilates', 'Run Club', 'Workout Class', 'Yoga'
  )) OR
  (category = 'Food' AND activity IN (
    'Class', 'Food Truck', 'Guest Chef', 'Pop-up'
  )) OR
  (category = 'Games' AND activity IN (
    'Bingo', 'Cornhole Tournament', 'DJ Trivia', 'Live Music Bingo', 'Mixtape Matchup',
    'Music Bingo', 'Poker', 'Sip & Spell', 'Survey Says', 'Themed Trivia', 'Trivia'
  )) OR
  (category = 'Music' AND activity IN (
    'Jam', 'Karaoke', 'Live Music', 'Open Mic', 'Singing Competition', 'Song Request Night'
  )) OR
  activity IS NULL
);