/*
  # Add notifications table and metrics views

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `title` (text, not null)
      - `message` (text, not null)
      - `type` (text) - e.g., 'application', 'chat', 'financial'
      - `read` (boolean, default false)
      - `created_at` (timestamptz)
      - `related_id` (uuid) - Optional reference to related entity
      - `link` (text) - Optional link to relevant page

  2. Security
    - Enable RLS on notifications table
    - Add policies for users to view their own notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('application', 'chat', 'financial', 'system')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  related_id uuid,
  link text
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'system',
  p_related_id uuid DEFAULT NULL,
  p_link text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, related_id, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_id, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for application notifications
CREATE OR REPLACE FUNCTION notify_application_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Notify host about new application
    PERFORM create_notification(
      (SELECT creator_id FROM events WHERE id = NEW.event_id),
      'New Application',
      'A creator has applied to your event',
      'application',
      NEW.id,
      '/applications'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Notify creator about application status change
    PERFORM create_notification(
      NEW.creator_id,
      'Application ' || INITCAP(NEW.status),
      'Your application status has been updated to ' || NEW.status,
      'application',
      NEW.id,
      '/applications'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for applications
CREATE TRIGGER application_notification_trigger
AFTER INSERT OR UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION notify_application_changes();

-- Trigger function for chat notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the other participant in the chat
  PERFORM create_notification(
    CASE 
      WHEN NEW.sender_id = (SELECT host_id FROM chats WHERE id = NEW.chat_id)
      THEN (SELECT creator_id FROM chats WHERE id = NEW.chat_id)
      ELSE (SELECT host_id FROM chats WHERE id = NEW.chat_id)
    END,
    'New Message',
    substring(NEW.content from 1 for 50) || CASE WHEN length(NEW.content) > 50 THEN '...' ELSE '' END,
    'chat',
    NEW.chat_id,
    '/chats/' || NEW.chat_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for messages
CREATE TRIGGER message_notification_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();