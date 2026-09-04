-- Migration: Add phone column to profiles and applications for WhatsApp notifications
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN public.profiles.phone IS 'Nomor WhatsApp aktif kandidat untuk notifikasi rekrutmen (+62...)';
COMMENT ON COLUMN public.applications.phone IS 'Nomor WhatsApp snapshot saat kandidat mengajukan lamaran';

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
