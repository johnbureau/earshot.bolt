/*
  # Make event_id nullable in chats table

  1. Changes
    - Make event_id column nullable in chats table
    - Update foreign key constraint to allow NULL values
    - Update existing policies to handle NULL event_id

  2. Security
    - Maintain existing RLS policies
    - Ensure chat access remains secure
*/

-- Make event_id nullable
ALTER TABLE chats ALTER COLUMN event_id DROP NOT NULL;

-- Drop and recreate the foreign key constraint to allow NULL values
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_event_id_fkey;
ALTER TABLE chats ADD CONSTRAINT chats_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Update indexes for better query performance with nullable event_id
DROP INDEX IF EXISTS idx_chats_event_id;
CREATE INDEX idx_chats_event_id ON chats(event_id) WHERE event_id IS NOT NULL;