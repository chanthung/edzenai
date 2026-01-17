-- Add subscription fields to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT 'monthly' CHECK (subscription_type IN ('monthly', 'annual')),
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial')),
ADD COLUMN IF NOT EXISTS subscription_start_date date,
ADD COLUMN IF NOT EXISTS subscription_renewal_date date;