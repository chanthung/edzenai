-- Add telegram_registered column to track which parents have registered with the Telegram bot
ALTER TABLE public.students 
ADD COLUMN telegram_registered boolean NOT NULL DEFAULT false;