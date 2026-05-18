-- ============================================================
-- Hundetraining App – Supabase Setup
-- Im Supabase SQL Editor ausführen (alles auf einmal)
-- ============================================================

-- ── Erweiterungen ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Sportarten-Referenztabelle (öffentlich lesbar, kein RLS) ─
CREATE TABLE IF NOT EXISTS public.sports (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.sports (slug, name, icon, sort_order) VALUES
  ('bh',          'Begleithundeprüfung', '🐕', 1),
  ('ro',          'Rally Obedience',     '🏁', 2),
  ('agility',     'Agility',             '🔵', 3),
  ('obedience',   'Obedience',           '🎯', 4),
  ('mantrailing', 'Mantrailing',         '👃', 5),
  ('igt',         'IGP',                 '🦺', 6),
  ('hoopers',     'Hoopers',             '⭕', 7),
  ('dummy',       'Dummytraining',       '🟡', 8),
  ('trick',       'Tricktraining',       '✨', 9)
ON CONFLICT (slug) DO NOTHING;

-- ── Profile ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         TEXT,
  avatar_url           TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profil wird automatisch beim Signup angelegt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── User-Sportarten ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sports (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport_id   UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, sport_id)
);

-- ── Hunde ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dogs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  breed      TEXT,
  gender     TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  birthdate  DATE,
  weight_kg  NUMERIC(5, 2),
  photo_url  TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Trainingseinheiten ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id           UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  sport_id         UUID NOT NULL REFERENCES public.sports(id),
  session_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location         TEXT,
  duration_minutes INTEGER,
  mood             SMALLINT CHECK (mood BETWEEN 1 AND 5),
  general_note     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Übungseinträge pro Einheit ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_exercises (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  exercise_ref_id     TEXT NOT NULL,
  rating              SMALLINT CHECK (rating BETWEEN 1 AND 3),
  level_after         TEXT,
  note                TEXT,
  is_ro               BOOLEAN NOT NULL DEFAULT FALSE,
  feedback            TEXT CHECK (feedback IN ('gut', 'weiter')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BH-Übungsfortschritt ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercise_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id          UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  exercise_ref_id TEXT NOT NULL,
  level           TEXT NOT NULL DEFAULT 'nicht_begonnen',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, dog_id, exercise_ref_id)
);

-- ── RO-Schilderfortschritt ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ro_sign_progress (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id            UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  sign_ref_id       TEXT NOT NULL,
  level             TEXT NOT NULL DEFAULT 'nicht_begonnen',
  leitner_box       INTEGER NOT NULL DEFAULT 1,
  last_practiced_at TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, dog_id, sign_ref_id)
);

-- ── Custom-Übungen ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_exercises (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id      UUID REFERENCES public.dogs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Übungsanpassungen ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercise_overrides (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_ref_id      TEXT NOT NULL,
  name_override        TEXT,
  description_override TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, exercise_ref_id)
);

-- ── Versteckte Übungen ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hidden_exercises (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_ref_id TEXT NOT NULL,
  UNIQUE (user_id, exercise_ref_id)
);

-- ── Erfolge/Prüfungen ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id           UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  sport_id         UUID REFERENCES public.sports(id),
  title            TEXT NOT NULL,
  organization     TEXT,
  achievement_date DATE,
  score            NUMERIC(6, 2),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ro_sign_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_exercises   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_exercises   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements       ENABLE ROW LEVEL SECURITY;

-- Direkte user_id-Spalte
CREATE POLICY "own" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "own" ON public.user_sports
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own" ON public.dogs
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "own" ON public.exercise_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own" ON public.ro_sign_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own" ON public.custom_exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own" ON public.exercise_overrides
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own" ON public.hidden_exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indirekt über dogs.owner_id
CREATE POLICY "own" ON public.training_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = training_sessions.dog_id AND d.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = training_sessions.dog_id AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "own" ON public.session_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.training_sessions ts
      JOIN public.dogs d ON d.id = ts.dog_id
      WHERE ts.id = session_exercises.training_session_id AND d.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.training_sessions ts
      JOIN public.dogs d ON d.id = ts.dog_id
      WHERE ts.id = session_exercises.training_session_id AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "own" ON public.achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = achievements.dog_id AND d.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = achievements.dog_id AND d.owner_id = auth.uid()
    )
  );

-- ── Sports öffentlich lesbar (war bisher ohne RLS) ───────────
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON public.sports FOR SELECT USING (true);

-- ── exercise_overrides: Foto und Notiz ────────────────────────
ALTER TABLE public.exercise_overrides ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.exercise_overrides ADD COLUMN IF NOT EXISTS notes     TEXT;

-- ── Supabase Storage: Übungsfotos ────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('exercise-photos', 'exercise-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "user_manage_exercise_photos" ON storage.objects FOR ALL
  USING (
    bucket_id = 'exercise-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'exercise-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- Prüf-Queries (optional ausführen)
-- ============================================================
-- SELECT count(*) FROM public.sports;        -- Erwartung: 9
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
