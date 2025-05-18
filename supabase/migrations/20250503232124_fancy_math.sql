/*
  # Add professional title to profiles

  1. Changes
    - Add 'professional_title' column to profiles table
      - Type: text
      - Nullable: true
      - No default value

  2. Security
    - No additional RLS policies needed as the column will be covered by existing profile policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'professional_title'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN professional_title text;
  END IF;
END $$;