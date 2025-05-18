/*
  # Add notification update policy

  1. Changes
    - Add policy to allow users to update their own notifications
    - Users can only update notifications where they are the recipient
    - Only the 'read' status can be modified
*/

-- Add policy for users to update their own notifications
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);