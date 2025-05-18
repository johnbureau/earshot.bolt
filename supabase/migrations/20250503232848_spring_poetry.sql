/*
  # Remove professional_title field

  1. Changes
    - Drop professional_title column from profiles table
*/

ALTER TABLE profiles DROP COLUMN IF EXISTS professional_title;