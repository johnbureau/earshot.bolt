/*
  # Add RLS policies for profilesv2 table

  1. Security Changes
    - Add policy for users to insert their own profile
    - Add policy for users to update their own profile
    - Add policy for users to delete their own profile

  2. Notes
    - Policies ensure users can only manage their own profile data
    - Maintains existing public read access
*/

-- Policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profilesv2
FOR INSERT
TO public
WITH CHECK (auth.uid()::text = id::text);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profilesv2
FOR UPDATE
TO public
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- Policy to allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.profilesv2
FOR DELETE
TO public
USING (auth.uid()::text = id::text);