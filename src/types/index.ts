export type UserRole = 'host' | 'creator';

export type Profile = {
  id: string;
  role: UserRole;
  created_at: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  website?: string;
  street_address?: string;
  city?: string;
  state?: string;
  host_type?: string;
  experience_years?: number;
  creator_category?: string;
  creator_activity?: string;
  musician_type?: string;
  music_genre?: string;
  preferred_host_types?: string[];
  // Add profilesv2 specific fields
  "Row ID"?: string;
  "Name"?: string;
  "Email"?: string;
  "Description"?: string;
  "Experience (Yrs.)"?: string;
  "Payment"?: string;
  "User Type"?: string;
  "User Sub-Type"?: string;
  "Specialty"?: string;
  "Spotify"?: string;
  "Instagram"?: string;
  "Website"?: string;
  "Category"?: string;
  "Activity"?: string;
  "Instruments"?: string;
  "Song Types"?: string;
  "Date Created"?: string;
  "Earshot-Identified"?: string;
  "Video"?: string;
};

export type Event = {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly';
  recurring_end_date?: string;
  seeking_creators: boolean;
  created_at: string;
  creator?: Profile;
  location?: string;
  category?: string;
  status?: 'draft' | 'published' | 'cancelled';
  featured_image?: string;
  application_deadline?: string;
  max_applications?: number;
  current_applications?: number;
  is_private?: boolean;
  cost?: number;
  cost_type?: 'ticket' | 'cover' | 'entry' | 'donation';
  age_restriction?: string;
};

export type ApplicationStatus = 'pending' | 'approved' | 'declined';

export type Application = {
  id: string;
  event_id: string;
  creator_id: string;
  status: ApplicationStatus;
  created_at: string;
  event?: Event;
  creator?: Profile;
  chat_id?: string;
  message?: string;
  skills?: string[];
};

export type Chat = {
  id: string;
  event_id: string;
  host_id: string;
  creator_id: string;
  created_at: string;
  last_message_at: string;
  event?: Event;
  host?: Profile;
  creator?: Profile;
  unread_count?: number;
};

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
  type?: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
};