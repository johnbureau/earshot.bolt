/*
  # Add Stripe customer ID to profilesv2 table

  1. Changes
    - Add stripe_customer_id column to profilesv2 table
    - Add index for faster lookups
*/

-- Add stripe_customer_id column
ALTER TABLE profilesv2
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profilesv2_stripe_customer_id ON profilesv2(stripe_customer_id); 