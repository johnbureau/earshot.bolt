/*
  # Improve Profile Names and Add Display Name Function

  1. Changes
    - Add NOT NULL constraint to email field
    - Add trigger to auto-populate name from email if not provided
    - Add function to get display name

  2. Security
    - Function is SECURITY DEFINER to ensure consistent access
*/

-- Add NOT NULL constraint to email
ALTER TABLE profiles 
ALTER COLUMN email SET NOT NULL;

-- Create function to get display name
CREATE OR REPLACE FUNCTION get_display_name(profile_row profiles)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    CASE
      WHEN profile_row.name IS NOT NULL AND length(trim(profile_row.name)) > 0 
        THEN profile_row.name
      ELSE split_part(profile_row.email, '@', 1)
    END;
$$;

-- Create trigger function to set default name
CREATE OR REPLACE FUNCTION set_default_profile_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.name IS NULL OR length(trim(NEW.name)) = 0 THEN
    NEW.name := split_part(NEW.email, '@', 1);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-populate name
CREATE TRIGGER ensure_profile_name
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_profile_name();