/*
  # Update chat foreign key relationships

  1. Changes
    - Drop existing foreign key constraints for host_id and creator_id
    - Add new foreign key constraints referencing profilesv2
    - Update indexes for better performance

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing foreign key constraints
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_host_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_creator_id_fkey;

-- Add new foreign key constraints to profilesv2
ALTER TABLE chats
ADD CONSTRAINT chats_host_id_fkey
FOREIGN KEY (host_id) REFERENCES profilesv2(id)
ON DELETE CASCADE;

ALTER TABLE chats
ADD CONSTRAINT chats_creator_id_fkey
FOREIGN KEY (creator_id) REFERENCES profilesv2(id)
ON DELETE CASCADE;

-- Update indexes for better performance
DROP INDEX IF EXISTS idx_chats_participants;
CREATE INDEX idx_chats_participants ON chats(host_id, creator_id);

-- Drop existing foreign key constraints for messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Add new foreign key constraint to profilesv2
ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES profilesv2(id)
ON DELETE CASCADE;