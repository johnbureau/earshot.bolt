/*
  # Initial Schema Setup

  1. New Tables
    - `profiles` - Stores user profile information with role selection
    - `events` - Stores event details created by users
    - `applications` - Tracks creator applications to events
    - `chats` - Manages chat threads between hosts and creators
    - `messages` - Stores individual messages within chats

  2. Security
    - Enable RLS on all tables
    - Create policies for authenticated users to access their own data
    - Set up appropriate security policies for event visibility and applications
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT CHECK (role IN ('host', 'creator')),
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  seeking_creators BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, creator_id)
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, host_id, creator_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create security policies

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = creator_id);

-- Applications policies
CREATE POLICY "Creators can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Hosts can view applications for their events"
  ON applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = applications.event_id
    AND events.creator_id = auth.uid()
  ));

CREATE POLICY "Creators can insert applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Hosts can update application status for their events"
  ON applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = applications.event_id
    AND events.creator_id = auth.uid()
  ));

-- Chats policies
CREATE POLICY "Users can view their chats"
  ON chats FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = creator_id);

CREATE POLICY "Hosts can insert chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Messages policies
CREATE POLICY "Chat participants can view messages"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND (chats.host_id = auth.uid() OR chats.creator_id = auth.uid())
  ));

CREATE POLICY "Chat participants can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.host_id = auth.uid() OR chats.creator_id = auth.uid())
    )
  );