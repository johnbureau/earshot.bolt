/*
  # Drop profiles table

  1. Changes
    - Drop the profiles table as it has been replaced by profilesv2
    - All data has been migrated and foreign keys updated
*/

-- Drop the profiles table
DROP TABLE IF EXISTS profiles CASCADE;