/*
  # Update foreign key relationships for applications

  1. Changes
    - Copy profiles data to profilesv2 with required Row ID
    - Update foreign key constraint to reference profilesv2
    - Update indexes for better performance
*/

-- First, ensure all profiles exist in profilesv2
INSERT INTO profilesv2 (
  id, 
  "Row ID",
  "Email", 
  "Name", 
  role, 
  created_at
)
SELECT 
  p.id,
  p.id::text as "Row ID",
  p.email as "Email",
  COALESCE(p.name, split_part(p.email, '@', 1)) as "Name",
  p.role,
  p.created_at
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM profilesv2 pv2 WHERE pv2.id = p.id
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing foreign key constraint
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_creator_id_fkey;

-- Add new foreign key constraint to profilesv2
ALTER TABLE applications
ADD CONSTRAINT applications_creator_id_fkey
FOREIGN KEY (creator_id) REFERENCES profilesv2(id)
ON DELETE CASCADE;

-- Update indexes for better performance
DROP INDEX IF EXISTS idx_applications_chat_id;
CREATE INDEX idx_applications_chat_id ON applications(chat_id);