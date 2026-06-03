-- ============================================================
-- Manuelle Migrationen – im Supabase SQL Editor ausführen
-- https://supabase.com/dashboard/project/kyujjcnkpvinkfmladah/sql/new
-- ============================================================


-- ============================================================
-- MIGRATION 1: "Bleib (Dauer & Distanz)" verstecken
-- Versteckt die Übung und alle Sub-Übungen für alle User.
-- ============================================================

INSERT INTO hidden_exercises (user_id, exercise_ref_id)
SELECT
  au.id AS user_id,
  ex.id AS exercise_ref_id
FROM auth.users au
CROSS JOIN (
  -- Bleib selbst + alle Sub-Übungen (parent_id = 'bleib')
  SELECT id FROM exercises WHERE id = 'bleib'
  UNION ALL
  SELECT id FROM exercises WHERE parent_id = 'bleib'
) ex
ON CONFLICT (user_id, exercise_ref_id) DO NOTHING;


-- ============================================================
-- MIGRATION 2: Sitz-Übungen nach Platz und Steh kopieren
-- Kopiert alle custom_exercises mit category = 'gl_sitz'
-- als unabhängige Kopien nach 'gl_platz' und 'gl_steh'.
-- Nur ausführen wenn die Sitz-Übungen bereits angelegt sind!
-- ============================================================

-- Vorher prüfen welche Übungen kopiert werden:
-- SELECT name, category FROM custom_exercises WHERE category = 'gl_sitz';

-- Kopieren nach gl_platz:
INSERT INTO custom_exercises (id, dog_id, user_id, name, description, category, criteria, created_at)
SELECT
  gen_random_uuid(),
  dog_id,
  user_id,
  name,
  description,
  'gl_platz',
  criteria,
  now()
FROM custom_exercises
WHERE category = 'gl_sitz';

-- Kopieren nach gl_steh:
INSERT INTO custom_exercises (id, dog_id, user_id, name, description, category, criteria, created_at)
SELECT
  gen_random_uuid(),
  dog_id,
  user_id,
  name,
  description,
  'gl_steh',
  criteria,
  now()
FROM custom_exercises
WHERE category = 'gl_sitz';
