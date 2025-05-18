-- Add stripe_customer_id column to profilesv2 table
ALTER TABLE profilesv2
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profilesv2_stripe_customer_id ON profilesv2(stripe_customer_id);

-- Add RLS policies for stripe_customer_id
ALTER TABLE profilesv2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stripe_customer_id"
    ON profilesv2
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own stripe_customer_id"
    ON profilesv2
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id); 