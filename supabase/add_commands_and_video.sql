-- Migration: Kommandos, Übungs-Kommando-Verknüpfung, Video-Support
-- Ausführen im Supabase Dashboard → SQL Editor

-- 1. Kommandos-Tabelle
CREATE TABLE IF NOT EXISTS commands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  description text,
  sport_context text,  -- 'alltag' | 'bh' | 'ro' oder NULL = alle Sportarten
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own commands" ON commands
  FOR ALL USING (user_id = auth.uid());

-- 2. Übungs-Kommando-Verknüpfung
CREATE TABLE IF NOT EXISTS exercise_commands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  exercise_ref_id text NOT NULL,
  command_id uuid REFERENCES commands(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, exercise_ref_id, command_id)
);

ALTER TABLE exercise_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own exercise_commands" ON exercise_commands
  FOR ALL USING (user_id = auth.uid());

-- 3. Video-URL in exercise_overrides
ALTER TABLE exercise_overrides
  ADD COLUMN IF NOT EXISTS video_url text;

-- 4. Update-Policy für custom_exercises (falls nur INSERT vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_exercises'
      AND policyname = 'Own custom_exercises update'
  ) THEN
    CREATE POLICY "Own custom_exercises update" ON custom_exercises
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;
