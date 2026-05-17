-- Builtin exercises table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kyujjcnkpvinkfmladah/sql/new

CREATE TABLE IF NOT EXISTS exercises (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  bh_required boolean NOT NULL DEFAULT false,
  is_foundational boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  criteria jsonb NOT NULL,
  prerequisites jsonb NOT NULL DEFAULT '[]'::jsonb,
  parent_id text REFERENCES exercises(id),
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_select_authenticated" ON exercises
  FOR SELECT TO authenticated USING (true);

-- SUB-Kriterien (für alle Sub-Übungen gleich)
-- {"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}

INSERT INTO exercises (id, name, category, bh_required, is_foundational, description, criteria, prerequisites, parent_id, sort_order) VALUES

-- GRUNDLAGEN
('schwellenwert', 'Schwellenwertarbeit', 'grundlage', true, true,
 'Ruhiges Verhalten in der Nähe von Reizen (Menschen, Hunde, Fahrzeuge)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund ist mit großem Abstand zu Reizen führbar","basis":"Hund orientiert sich zur Trainerin bei Reizpräsenz auf mittlerem Abstand","stabil":"Hund bleibt bei verschiedenen Reizen in kurzer Distanz ruhig und arbeitsfähig","pruefungsreif":"Hund ist in Alltagssituationen zuverlässig verkehrsruhig"}',
 '[]', null, 10),

('impulskontrolle', 'Impulskontrolle', 'grundlage', true, true,
 'Hund wartet auf Signal, greift nicht selbstständig zu/vor',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund versteht \"Warten\" bei statischer Übung ohne Ablenkung","basis":"Hund wartet zuverlässig auf Signal bei einfachen Situationen","stabil":"Hund wartet auch bei mittlerer Verlockung (Futter auf Boden, Spielzeug)","pruefungsreif":"Hund zeigt Impulskontrolle zuverlässig in Prüfungssituationen"}',
 '[]', null, 20),

('frustrationstoleranz', 'Frustrationstoleranz', 'grundlage', false, true,
 'Hund bleibt ruhig wenn Erwartungen nicht sofort erfüllt werden',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund zeigt kein Problemverhalten bei kurzer Wartezeit","basis":"Hund akzeptiert ausbleibende Belohnung ohne Eskalation","stabil":"Hund arbeitet auch nach Fehlern/Korrekturen motiviert weiter","pruefungsreif":"Hund bleibt in stressigen Situationen ausgeglichen"}',
 '["impulskontrolle"]', null, 30),

-- UNTERORDNUNG: SITZ
('sitz', 'Sitz', 'unterordnung', true, false,
 'Sitz auf Signal, gerade, ohne Stützen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund setzt sich auf Signal in ruhiger Umgebung","basis":"Sitz zuverlässig zuhause und in vertrauter Umgebung","stabil":"Sitz auf erstem Signal auch bei leichter Ablenkung","pruefungsreif":"Sitz aus der Bewegung, gerade, auch in belebter Umgebung"}',
 '[]', null, 40),

('sitz_im_stand', 'Im Stand einnehmen', 'unterordnung', false, false,
 'Sitz aus dem Stand',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'sitz', 50),

('sitz_aus_bewegung', 'Aus der Bewegung einnehmen', 'unterordnung', false, false,
 'Sitz aus der Bewegung',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'sitz', 60),

('sitz_halten', 'Position halten', 'unterordnung', false, false,
 'Sitz halten auf Distanz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'sitz', 70),

('sitz_weggehen', 'Weggehen', 'unterordnung', false, false,
 'Von sitzendem Hund weggehen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'sitz', 80),

('sitz_hingehen', 'Hingehen', 'unterordnung', false, false,
 'Zum sitzenden Hund hingehen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'sitz', 90),

('sitz_wechsel_steh', 'Wechsel ins Steh (am Bein)', 'unterordnung', false, false,
 'Aus Sitz ins Steh am Bein',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'sitz', 100),

('sitz_wechsel_platz', 'Wechsel ins Platz (am Bein)', 'unterordnung', false, false,
 'Aus Sitz ins Platz am Bein',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'sitz', 110),

('sitz_distanz', 'Positionswechsel auf Distanz', 'unterordnung', false, false,
 'Positionswechsel auf Distanz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'sitz', 120),

-- PLATZ
('platz', 'Platz', 'unterordnung', true, false,
 'Ablegen auf Signal, gerade, ruhig',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund legt sich auf Signal in ruhiger Umgebung ab","basis":"Platz zuverlässig zuhause und in vertrauter Umgebung","stabil":"Platz auf erstem Signal auch bei leichter Ablenkung","pruefungsreif":"Platz aus der Bewegung, gerade, auch in belebter Umgebung"}',
 '[]', null, 130),

('platz_im_stand', 'Im Stand einnehmen', 'unterordnung', false, false,
 'Platz aus dem Stand',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'platz', 140),

('platz_aus_bewegung', 'Aus der Bewegung einnehmen', 'unterordnung', false, false,
 'Platz aus der Bewegung',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'platz', 150),

('platz_halten', 'Position halten', 'unterordnung', false, false,
 'Platz halten auf Distanz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'platz', 160),

('platz_weggehen', 'Weggehen', 'unterordnung', false, false,
 'Von liegendem Hund weggehen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'platz', 170),

('platz_hingehen', 'Hingehen', 'unterordnung', false, false,
 'Zum liegenden Hund hingehen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'platz', 180),

('platz_wechsel_steh', 'Wechsel ins Steh (am Bein)', 'unterordnung', false, false,
 'Aus Platz ins Steh am Bein',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'platz', 190),

('platz_wechsel_sitz', 'Wechsel ins Sitz (am Bein)', 'unterordnung', false, false,
 'Aus Platz ins Sitz am Bein',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'platz', 200),

('platz_distanz', 'Positionswechsel auf Distanz', 'unterordnung', false, false,
 'Positionswechsel auf Distanz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'platz', 210),

-- STEH
('steh', 'Steh', 'unterordnung', true, false,
 'Stehen auf Signal, ohne Vorwärtsbewegung',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund bleibt auf Signal stehen (aus dem Stand oder aus der Bewegung)","basis":"Steh zuverlässig in ruhiger Umgebung, kurze Dauer","stabil":"Steh auch bei leichter Ablenkung, mittlere Dauer","pruefungsreif":"Steh aus der Bewegung, auch in belebter Umgebung"}',
 '["sitz","platz"]', null, 220),

('steh_im_stand', 'Im Stand einnehmen', 'unterordnung', false, false,
 'Steh aus dem Stand',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'steh', 230),

('steh_aus_bewegung', 'Aus der Bewegung einnehmen', 'unterordnung', false, false,
 'Steh aus der Bewegung',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'steh', 240),

('steh_halten', 'Position halten', 'unterordnung', false, false,
 'Steh halten auf Distanz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'steh', 250),

('steh_weggehen', 'Weggehen', 'unterordnung', false, false,
 'Von stehendem Hund weggehen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'steh', 260),

('steh_hingehen', 'Hingehen', 'unterordnung', false, false,
 'Zum stehenden Hund hingehen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'steh', 270),

('steh_wechsel_platz', 'Wechsel ins Platz (am Bein)', 'unterordnung', false, false,
 'Aus Steh ins Platz am Bein',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'steh', 280),

('steh_wechsel_sitz', 'Wechsel ins Sitz (am Bein)', 'unterordnung', false, false,
 'Aus Steh ins Sitz am Bein',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'steh', 290),

('steh_distanz', 'Positionswechsel auf Distanz', 'unterordnung', false, false,
 'Positionswechsel auf Distanz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'steh', 300),

-- BLEIB
('bleib', 'Bleib (Dauer & Distanz)', 'unterordnung', true, false,
 'Hund verbleibt in Sitz/Platz bei Distanz und Dauer',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund bleibt 10 Sek. in Sitz/Platz wenn Trainerin direkt davor steht","basis":"Hund bleibt 30 Sek. bei 3 Schritten Distanz","stabil":"Hund bleibt 1 Min. bei 10 Schritten Distanz, leichte Ablenkung","pruefungsreif":"Hund bleibt zuverlässig im Prüfungsablauf"}',
 '["sitz","platz","impulskontrolle"]', null, 310),

-- ABRUF
('abruf', 'Abruf', 'unterordnung', true, false,
 'Hund kommt zuverlässig auf Signal, gerade Ankunft',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund kommt auf Signal in ruhiger Umgebung ohne Ablenkung","basis":"Abruf in vertrauter Umgebung zuverlässig, gerader Einlauf","stabil":"Abruf auch bei mittlerer Ablenkung (andere Hunde, Menschen)","pruefungsreif":"Abruf aus dem Ablegen, gerader Einlauf, Frontsitz, Einordnung"}',
 '["sitz","schwellenwert"]', null, 320),

('abruf_aus_sitz', 'Herankommen aus Sitz', 'unterordnung', false, false,
 'Schneller Abruf aus Sitz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'abruf', 330),

('abruf_aus_platz', 'Herankommen aus Platz', 'unterordnung', false, false,
 'Schneller Abruf aus Platz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'abruf', 340),

('abruf_aus_steh', 'Herankommen aus Steh', 'unterordnung', false, false,
 'Schneller Abruf aus Steh',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'abruf', 350),

('abruf_frontsitz', 'Frontsitz einnehmen', 'unterordnung', false, false,
 'Gerade Frontsitzposition einnehmen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'abruf', 360),

('abruf_frontsitz_halten', 'Frontsitz halten', 'unterordnung', false, false,
 'Frontsitz ruhig halten',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'abruf', 370),

('abruf_wechsel_fuss', 'Wechsel ins Fuß', 'unterordnung', false, false,
 'Aus Frontsitz in Fußposition',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'abruf', 380),

('abruf_anleinen', 'Anleinen in Fußposition', 'unterordnung', false, false,
 'Anleinen in korrekter Fußposition',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'abruf', 390),

-- FUSS AN DER LEINE
('fuss_leine', 'Fuß an der Leine', 'unterordnung', true, false,
 'Lockere Leine, Hund auf Höhe des linken Knies',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund versteht Fußposition, kurze Sequenzen ohne Zug","basis":"Leinenführigkeit auf gerader Linie, ruhige Umgebung","stabil":"Fuß an Leine mit Kurven, Tempoänderung, leichter Ablenkung","pruefungsreif":"BH-konforme Führarbeit mit Kehrtwendung, Tempo, Ablenkung"}',
 '["schwellenwert","impulskontrolle"]', null, 400),

('fl_position', 'Position einnehmen', 'unterordnung', false, false,
 'Fußposition einnehmen (mit Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 410),

('fl_halten_sitz', 'Position halten (Sitz)', 'unterordnung', false, false,
 'In Fußposition im Sitz warten (mit Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 420),

('fl_angehen', 'Angehen', 'unterordnung', false, false,
 'Gemeinsam angehen (mit Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 430),

('fl_strecke', 'Strecke gehen', 'unterordnung', false, false,
 'Gerade Strecke in Fußposition (mit Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 440),

('fl_kehrtwende', 'Kehrtwende', 'unterordnung', false, false,
 'Kehrtwende in Fußposition (mit Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 450),

('fl_tempo_schnell', 'Tempo: Normal → Schnell', 'unterordnung', false, false,
 'Tempowechsel auf Schnell (mit Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 460),

('fl_tempo_langsam', 'Tempo: Schnell → Langsam', 'unterordnung', false, false,
 'Tempowechsel auf Langsam (mit Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 470),

('fl_tempo_normal', 'Tempo: Langsam → Normal', 'unterordnung', false, false,
 'Tempowechsel zurück auf Normal (mit Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 480),

('fl_winkel_links', 'Winkel links', 'unterordnung', false, false,
 'Linkskurve in Fußposition',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 490),

('fl_winkel_rechts', 'Winkel rechts', 'unterordnung', false, false,
 'Rechtskurve in Fußposition',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 500),

('fl_anhalten', 'Anhalten', 'unterordnung', false, false,
 'Anhalten mit Sitz (mit Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 510),

('fl_gruppe_rechts', 'Personengruppe: Rechts', 'unterordnung', false, false,
 'Durch Personengruppe rechts',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 520),

('fl_gruppe_links', 'Personengruppe: Links', 'unterordnung', false, false,
 'Durch Personengruppe links',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 530),

('fl_gruppe_anhalten', 'Personengruppe: Anhalten', 'unterordnung', false, false,
 'Anhalten in Personengruppe',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 540),

('fl_gruppe_angehen', 'Personengruppe: Angehen', 'unterordnung', false, false,
 'Angehen aus Personengruppe',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'fuss_leine', 550),

-- FREIFOLGE
('freifolge', 'Freifolge', 'unterordnung', true, false,
 'Fuß ohne Leine, Hund bleibt freiwillig auf Position',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund bleibt kurze Sequenzen ohne Leine auf Fußposition","basis":"Freifolge auf gerader Linie, 20 Sek., ruhige Umgebung","stabil":"Freifolge mit Kehrtwendung und Tempoänderung, leichte Ablenkung","pruefungsreif":"BH-konforme Freifolge in belebter Umgebung"}',
 '["fuss_leine","schwellenwert"]', null, 560),

('ff_position', 'Position einnehmen', 'unterordnung', false, false,
 'Fußposition einnehmen (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 570),

('ff_halten_sitz', 'Position halten (Sitz)', 'unterordnung', false, false,
 'In Fußposition im Sitz warten (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 580),

('ff_angehen', 'Angehen', 'unterordnung', false, false,
 'Gemeinsam angehen (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 590),

('ff_strecke', 'Strecke gehen', 'unterordnung', false, false,
 'Gerade Strecke in Fußposition (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 600),

('ff_kehrtwende', 'Kehrtwende', 'unterordnung', false, false,
 'Kehrtwende in Fußposition (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 610),

('ff_tempo_schnell', 'Tempo: Normal → Schnell', 'unterordnung', false, false,
 'Tempowechsel auf Schnell (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 620),

('ff_tempo_langsam', 'Tempo: Schnell → Langsam', 'unterordnung', false, false,
 'Tempowechsel auf Langsam (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 630),

('ff_tempo_normal', 'Tempo: Langsam → Normal', 'unterordnung', false, false,
 'Tempowechsel zurück auf Normal (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 640),

('ff_winkel_links', 'Winkel links', 'unterordnung', false, false,
 'Linkskurve in Fußposition (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 650),

('ff_winkel_rechts', 'Winkel rechts', 'unterordnung', false, false,
 'Rechtskurve in Fußposition (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 660),

('ff_anhalten', 'Anhalten', 'unterordnung', false, false,
 'Anhalten mit Sitz (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 670),

('ff_sitz_anhalten', 'Sitz mit Anhalten', 'unterordnung', false, false,
 'Sitz beim Anhalten (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 680),

('ff_sitz_bewegung', 'Sitz aus der Bewegung', 'unterordnung', false, false,
 'Sitz aus der Bewegung (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 690),

('ff_platz_anhalten', 'Platz mit Anhalten', 'unterordnung', false, false,
 'Platz beim Anhalten (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 700),

('ff_platz_bewegung', 'Platz aus der Bewegung', 'unterordnung', false, false,
 'Platz aus der Bewegung (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 710),

('ff_steh_anhalten', 'Steh mit Anhalten', 'unterordnung', false, false,
 'Steh beim Anhalten (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 720),

('ff_steh_bewegung', 'Steh aus der Bewegung', 'unterordnung', false, false,
 'Steh aus der Bewegung (ohne Leine)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'freifolge', 730),

-- ABLEGEN MIT HERANKOMMEN
('ablegen_herankommen', 'Ablegen mit Herankommen', 'unterordnung', true, false,
 'Hund liegt auf Distanz, kommt auf Signal gerade heran',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund bleibt im Platz bei kurzer Distanz, kommt auf Signal","basis":"Ablegen auf 5 Schritte, zuverlässiger Abruf, gerader Einlauf","stabil":"Ablegen auf 15 Schritte, direkter Einlauf zur Endgrundstellung","pruefungsreif":"BH-konform: HZ während Bewegung, mind. 30 Schritte Distanz, Abruf, freudig direkt in Endgrundstellung"}',
 '["platz","bleib","abruf"]', null, 740),

('abh_ableinen', 'Ableinen in Fußposition', 'unterordnung', false, false,
 'Leine abnehmen in Fußposition',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'ablegen_herankommen', 750),

('abh_leine_einstecken', 'Leine einstecken', 'unterordnung', false, false,
 'Leine einstecken ohne Lageveränderung des Hundes',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'ablegen_herankommen', 760),

('abh_platz', 'Positionswechsel ins Platz', 'unterordnung', false, false,
 'Aus Fußposition ins Platz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'ablegen_herankommen', 770),

('abh_weggehen', 'Weggehen', 'unterordnung', false, false,
 'Von liegendem Hund weggehen (10 Schritte)',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'ablegen_herankommen', 780),

('abh_warten', 'Warten (10 Schritte)', 'unterordnung', false, false,
 'Warten auf 10 Schritte Entfernung',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'ablegen_herankommen', 790),

('abh_zurueck', 'Zurückgehen', 'unterordnung', false, false,
 'Zum Hund zurückgehen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'ablegen_herankommen', 800),

('abh_sitz', 'Positionswechsel ins Sitz', 'unterordnung', false, false,
 'Aus Platz in Sitz',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'ablegen_herankommen', 810),

('abh_leine_raus', 'Leine herausholen', 'unterordnung', false, false,
 'Leine herausholen ohne Lageveränderung',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'ablegen_herankommen', 820),

('abh_anleinen', 'Anleinen in Fußposition', 'unterordnung', false, false,
 'Anleinen in Fußposition',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'ablegen_herankommen', 830),

-- ABLAGE UNTER ABLENKUNG
('ablegen_ablenkung', 'Ablage unter Ablenkung', 'unterordnung', true, false,
 'Hund liegt ruhig abgeleint, während der andere Hund des Teams seine Übungen absolviert',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund bleibt abgeleint ruhig liegen, HF steht seitwärts gewandt, kurze Dauer (30 Sek.)","basis":"Hund bleibt 1–2 Min. ruhig liegen, auch wenn HF sich seitwärts dreht und nicht zuschaut","stabil":"Hund bleibt ruhig liegen, während anderer Hund im Sichtfeld aktiv arbeitet","pruefungsreif":"BH-konform: vollständige Übungsabfolge des Partners abwarten ohne HF-Einwirkung, Ablageposition nicht >1 m verlassen, beim Abholen nicht dem HF entgegengehen"}',
 '["platz","bleib"]', null, 840),

-- VERKEHRSTEIL
('verhalten_menschen', 'Verhalten bei Menschen', 'verkehr', true, false,
 'Ruhiges Verhalten bei Personengruppen, Begrüßungen, Trubel',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund ist an ruhigen Passanten vorbeiführbar","basis":"Hund bleibt ruhig bei Personengruppen auf mittlerem Abstand","stabil":"Hund ignoriert Menschen in der Nähe, auch wenn diese aktiv sind","pruefungsreif":"Hund zeigt kein Reaktionsverhalten im städtischen Umfeld bei allen BH-Szenarien"}',
 '["schwellenwert"]', null, 850),

('verhalten_hunde', 'Verhalten bei Hunden', 'verkehr', true, false,
 'Neutral-ruhiges Verhalten beim Vorbeilaufen an anderen Hunden',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund ist mit großem Abstand an anderen Hunden vorbeiführbar","basis":"Hund orientiert sich zur Trainerin bei Hundebegegnungen (mittlerer Abstand)","stabil":"Hund passiert andere Hunde auf kurze Distanz ohne Reaktion","pruefungsreif":"Hund neutral beim Überholen und Entgegenkommen; nimmt auf HZ Sitz/Platz ein"}',
 '["schwellenwert"]', null, 860),

('verhalten_fahrzeuge', 'Verhalten bei Fahrzeugen', 'verkehr', true, false,
 'Gelassenheit gegenüber Autos, Motorrädern, LKW',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund reagiert nicht auf vorbeifahrende Fahrzeuge aus Distanz","basis":"Hund bleibt ruhig bei Fahrzeugverkehr auf dem Gehweg","stabil":"Hund zeigt keine Reaktion auch bei lautem/schnellem Verkehr","pruefungsreif":"Verkehrsruhig in jeder Alltagssituation; gelassen bei BH-spezifischen Szenarien"}',
 '["schwellenwert"]', null, 870),

('verhalten_fahrraeder', 'Verhalten bei Fahrrädern', 'verkehr', true, false,
 'Kein Jagen, kein Anspringen, ruhiges Vorbeilassen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund reagiert nicht auf stehendes Fahrrad","basis":"Hund lässt langsam fahrendes Fahrrad ruhig vorbei","stabil":"Hund zeigt keine Reaktion bei schnell fahrenden Rädern","pruefungsreif":"BH-konform: Radfahrer von hinten und von vorn, mit Klingelzeichen, Hund zwischen HF und Rad"}',
 '["schwellenwert","impulskontrolle"]', null, 880),

('anbinden', 'Anbinden / Alleinbleiben', 'verkehr', true, false,
 'Hund wartet ruhig angebunden ohne Trainerin',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund bleibt 30 Sek. angebunden, Trainerin in Sichtweite","basis":"Hund bleibt 2 Min. angebunden, Trainerin außer Sicht","stabil":"Hund bleibt ruhig angebunden bei Alltagsreizen","pruefungsreif":"BH-konform: außer Sicht, angeleinter Hund läuft ~5 Schritte seitlich vorbei, kein anhaltendes Zerren/Bellen"}',
 '["bleib","frustrationstoleranz"]', null, 890),

-- PRÜFUNGSABLAUF
('chipkontrolle', 'Chipkontrolle', 'pruefung', true, false,
 'Hund duldet Chip-Kontrolle durch die Richterin ruhig',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund duldet Berührung am Hals/Nacken durch Trainerin","basis":"Hund steht ruhig während Chip-Leser genähert wird","stabil":"Chip-Kontrolle durch fremde Person, Hund bleibt ruhig","pruefungsreif":"BH-konform: ruhiges Stehen bei Chip-Kontrolle durch Richterin"}',
 '["schwellenwert"]', null, 900),

('chip_ruhig', 'Ruhig bleiben', 'pruefung', false, false,
 'Ruhig stehen bei Berührung',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'chipkontrolle', 910),

('chip_ablesen', 'Chip ablesen lassen', 'pruefung', false, false,
 'Chip-Leser annähern lassen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'chipkontrolle', 920),

('anmeldung', 'Anmeldung bei Richterin', 'pruefung', true, false,
 'Korrekte Anmeldung beim Richter zu Beginn der Prüfung',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Hund läuft in Fußposition zur Richterin","basis":"Anhalten vor Richterin, Hund bleibt ruhig im Sitz","stabil":"Vollständiger Anmeldeablauf in ruhiger Umgebung","pruefungsreif":"BH-konform: Anmeldung zuverlässig und souverän"}',
 '["fuss_leine","schwellenwert"]', null, 930),

('anm_laufen', 'Zur Richterin laufen', 'pruefung', false, false,
 'In Fußposition zur Richterin laufen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'anmeldung', 940),

('anm_anhalten', 'Anhalten', 'pruefung', false, false,
 'Vor der Richterin anhalten',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'anmeldung', 950),

('anm_anmelden', 'Anmelden', 'pruefung', false, false,
 'Anmeldung aussprechen, Hund bleibt ruhig',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'anmeldung', 960),

('anm_warten', 'Warten', 'pruefung', false, false,
 'Auf Freigabe der Richterin warten',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'anmeldung', 970),

('anm_weiter', 'Weiterlaufen', 'pruefung', false, false,
 'Nach Freigabe weiterlaufen',
 '{"nicht_begonnen":"Noch nicht begonnen","aufbau":"Im Aufbau – Teilübung bekannt, noch unsicher","basis":"In ruhiger Umgebung zuverlässig","stabil":"Auch mit leichter Ablenkung stabil","pruefungsreif":"Prüfungstauglich und zuverlässig"}',
 '[]', 'anmeldung', 980);
