-- Safe migration to align bookings schema to use user_id instead of tourist_id

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'tourist_id'
    ) THEN
        ALTER TABLE public.bookings RENAME COLUMN tourist_id TO user_id;
    END IF;
END $$;

-- Ensure foreign key exists on user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'bookings_user_id_fkey'
    ) THEN
        ALTER TABLE public.bookings
        ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;
