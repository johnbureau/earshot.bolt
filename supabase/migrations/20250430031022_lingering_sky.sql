/*
  # Simplify chat system policies

  1. Changes
    - Simplify chat access policies
    - Streamline message policies
    - Add better indexes for performance

  2. Security
    - Users can access chats where they are host or creator
    - Messages are accessible to chat participants
*/

-- Drop existing complex policies
DROP POLICY IF EXISTS "Users can view and update their chats" ON chats;
DROP POLICY IF EXISTS "Chat participants can manage messages" ON messages;

-- Create simple chat access policy
CREATE POLICY "Chat participants can access"
  ON chats FOR ALL
  USING (auth.uid() IN (host_id, creator_id))
  WITH CHECK (auth.uid() IN (host_id, creator_id));

-- Create simple messages policy
CREATE POLICY "Chat participants can manage messages"
  ON messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = chat_id
    AND auth.uid() IN (host_id, creator_id)
  ))
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND auth.uid() IN (host_id, creator_id)
    )
  );

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(host_id, creator_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_sender ON messages(chat_id, sender_id);