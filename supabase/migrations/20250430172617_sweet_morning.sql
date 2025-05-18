/*
  # Create event_financials table

  1. New Tables
    - `event_financials`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events.id)
      - `total_sales` (numeric, not null)
      - `creator_cost` (numeric, not null)
      - `month` (text, not null) - Format: 'YYYY-MM'
      - `created_at` (timestamptz, default: now())

  2. Security
    - Enable RLS on `event_financials` table
    - Add policies for:
      - Event hosts can view and manage financials for their events
      - Creators can view financials for events they're involved in
*/

-- Create the event_financials table
CREATE TABLE IF NOT EXISTS public.event_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  total_sales numeric NOT NULL DEFAULT 0,
  creator_cost numeric NOT NULL DEFAULT 0,
  month text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_month_format CHECK (month ~ '^\d{4}-(?:0[1-9]|1[0-2])$')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_financials_event_id ON public.event_financials(event_id);
CREATE INDEX IF NOT EXISTS idx_event_financials_month ON public.event_financials(month);

-- Enable Row Level Security
ALTER TABLE public.event_financials ENABLE ROW LEVEL SECURITY;

-- Policy for event hosts to manage their event financials
CREATE POLICY "Event hosts can manage their event financials"
ON public.event_financials
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_financials.event_id
    AND events.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_financials.event_id
    AND events.creator_id = auth.uid()
  )
);

-- Policy for creators to view financials for events they're involved in
CREATE POLICY "Creators can view event financials they're involved in"
ON public.event_financials
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.event_id = event_financials.event_id
    AND applications.creator_id = auth.uid()
    AND applications.status = 'approved'
  )
);