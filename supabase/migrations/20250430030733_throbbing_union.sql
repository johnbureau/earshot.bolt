/*
  # Simplify chat permissions

  1. Changes
    - Simplify chat policies to allow access based on user ID
    - Update message policies to match chat access
    - Remove redundant conditions
*/

-- Drop existing chat policies
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
DROP POLICY IF EXISTS "Hosts can insert chats" ON chats;

-- Create simplified chat policies
CREATE POLICY "Users can view and update their chats"
  ON chats FOR ALL
  USING (auth.uid() IN (host_id, creator_id))
  WITH CHECK (auth.uid() IN (host_id, creator_id));

-- Drop existing message policies
DROP POLICY IF EXISTS "Chat participants can view messages" ON messages;
DROP POLICY IF EXISTS "Chat participants can insert messages" ON messages;

-- Create simplified message policies
CREATE POLICY "Chat participants can manage messages"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND auth.uid() IN (chats.host_id, chats.creator_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND auth.uid() IN (chats.host_id, chats.creator_id)
    )
    AND auth.uid() = sender_id
  );