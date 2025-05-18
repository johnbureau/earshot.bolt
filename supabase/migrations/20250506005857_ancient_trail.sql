/*
  # Update Profile and Chat Relationships

  1. Changes
    - Ensure all profilesv2 records have Row ID
    - Add unique constraint on Row ID
    - Update foreign key relationships for chats and messages
    - Update indexes for better performance

  2. Security
    - Maintain existing RLS policies
    - Ensure referential integrity with CASCADE delete
*/

-- First ensure all profiles have a Row ID
UPDATE profilesv2
SET "Row ID" = id::text
WHERE "Row ID" IS NULL;

-- Add unique constraint on Row ID
ALTER TABLE profilesv2
ADD CONSTRAINT profilesv2_row_id_key UNIQUE ("Row ID");

-- Drop existing foreign key constraints
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_host_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_creator_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Add new foreign key constraints to profilesv2
ALTER TABLE chats
ADD CONSTRAINT chats_host_id_fkey
FOREIGN KEY (host_id) REFERENCES profilesv2(id)
ON DELETE CASCADE;

ALTER TABLE chats
ADD CONSTRAINT chats_creator_id_fkey
FOREIGN KEY (creator_id) REFERENCES profilesv2(id)
ON DELETE CASCADE;

-- Add new foreign key constraint for messages
ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES profilesv2(id)
ON DELETE CASCADE;

-- Update indexes for better performance
DROP INDEX IF EXISTS idx_chats_participants;
CREATE INDEX idx_chats_participants ON chats(host_id, creator_id);

-- Only create message index if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_messages_chat_sender'
  ) THEN
    CREATE INDEX idx_messages_chat_sender ON messages(chat_id, sender_id);
  END IF;
END $$;