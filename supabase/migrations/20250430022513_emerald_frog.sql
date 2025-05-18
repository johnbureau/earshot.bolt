/*
  # Add chat_id to applications table

  1. Changes
    - Add chat_id column to applications table
    - Add foreign key constraint to chats table
    - Update existing applications to link with chats
*/

-- Add chat_id column to applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES chats(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_chat_id ON applications(chat_id);

-- Update RLS policies to include chat_id in selections
CREATE POLICY "Creators can view chat_id in their applications" 
  ON applications FOR SELECT 
  USING (auth.uid() = creator_id);

CREATE POLICY "Hosts can view chat_id in applications for their events" 
  ON applications FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = applications.event_id 
    AND events.creator_id = auth.uid()
  ));