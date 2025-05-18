/*
  # Remove professional_title field

  1. Changes
    - Remove professional_title column from profiles table
    - Update any references to this field
*/

-- Drop the professional_title column if it exists
ALTER TABLE profiles DROP COLUMN IF EXISTS professional_title;