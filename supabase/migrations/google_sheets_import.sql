-- Simple copy-paste migration for Google Sheets data
-- Copy your Google Sheets data here and run this migration

-- Example for player data - replace with your actual data:
-- Just copy-paste from Google Sheets (comma-separated values)
-- Format: player_slug, first_name, last_name, jersey_number, position, height, weight, birth_date, nationality, bio, is_active

-- Paste your data between the lines below (remove examples):
INSERT INTO player_info (player_slug, first_name, last_name, jersey_number, position, height, weight, birth_date, nationality, bio, is_active) VALUES
-- === PASTE YOUR GOOGLE SHEETS DATA HERE ===
('kevin-rassner', 'Kevin', 'Rassner', 19, 'Forward', NULL, NULL, NULL, NULL, 'Der Spieler für die, die sich nicht entscheiden wollen: Veteran moves oder lieber Explosivität? Guard, Forward oder Center? Offense oder Defense? Dummes Gelaber oder Lebensweisheit?', true),
('stefan-anselm', 'Stefan', 'Anselm', 30, 'Guard', NULL, NULL, NULL, NULL, 'Es ist Allen ein Rätsel wie man so schnell zigzag rennen und dann so unkonventionell Korbleger durch Gegner hindurch treffen kann. Manche haben versucht, seinen Lebensstil zu kopieren um gleiche Ergebnisse zu erreichen, aber die sind inzwischen alle an Skorbut gestorben.', true),
('gregor-arapidis', 'Gregor', 'Arapidis', 77, 'Forward', 182, NULL, NULL, NULL, 'Der griechische Russe spielt deutlich robuster und stabiler als die französischen Autos die er verkauft. Gegner, die gegen ihn spielen mussten, dürfen nur noch auf eine Abfrackprämie hoffen.', true),
('abdullah-ari', 'Abdullah', 'Ari', 55, 'Forward', 188, NULL, NULL, NULL, 'Hookshots oder Unter-dem-Arm-des-Gegners-Korbleger: Bei Abdullah ist der Ball immer da, wo man 1) ihn nicht erwartet hätte und 2) man als Gegenspieler richtig dumm aussieht. Low-key bester Schauspieler des Unterlandes.', true),
('sven-bader', 'Sven', 'Bader', 17, 'Guard', NULL, NULL, NULL, NULL, 'Stealth Bomber Sven ist ein Meister der Täuschung: Egal ob seine Ausdauer, sein Ausboxen, die Korbleger oder Corner-Dreier, Sven macht die Drecksarbeit so, dass man als Unwissender seinen Erfolgen eine gewisse Zufälligkeit zusprechen würde. Bis zum nächsten Einschlag.', true),
('jan-crocoll', 'Jan', 'Crocoll', 21, 'Center', NULL, NULL, NULL, NULL, 'Jan könnte nach eigener Einschätzung auch NBA spielen. Und tatsächlich: Die körperliche Dominanz wie Shaq und Referee-Relations wie Luka Doncic bringt er schon mit.', true),
('nino-de-bortoli', 'Nino', 'de Bortoli', 7, 'Guard', 177, NULL, NULL, NULL, 'Einer der kleinsten und doch der zweitbeste Dunker des Teams, dabei weniger Fettanteil als H-Milch, ähnlich weiß ist er allerdings auch. Seine Tattoowiererin und er arbeiten allerdings bereits an einer Lösung.', true),
('marcus-hayes', 'Marcus', 'Hayes', 33, 'Center', NULL, NULL, NULL, NULL, 'Nein, dass ist kein Schreibfehler: Man kann auch mit 45 noch körperlichen Basketball spielen. Lebron, schneide dir davon mal eine Scheibe ab!', true),
('tim-krause', 'Tim', 'Krause', 13, 'Guard', NULL, NULL, NULL, NULL, 'Dieser Guard weiß, wie man seinen Körper einsetzt. Der als Verteidiger gefürchtete Lefty drückt er alles weg, was entweder zwei Beine oder eine Metallstange in der Mitte hat.', true),
('christoph-mrsch', 'Christoph', 'Mörsch', 41, 'Center', NULL, NULL, NULL, NULL, 'Nach komplizierter Knieverletzung auf dem Weg zurück zur alter Dominanz. Vielleicht der beste Dreierwerfer auf der Centerposition der Liga.', true),
('alexander-rib', 'Alexander', 'Rib', 11, 'Guard', 192, NULL, NULL, NULL, 'Der einzige Spieler des Vereins mit 2k Badges auf Legend: Dreier, Onball Defense, Penetration und Pässe, Alex kann alles sobald er heiß läuft.', true),
('david-scheja', 'David', 'Scheja', 69, 'Center', NULL, NULL, NULL, NULL, 'David weiß was er kann und das kann er richtig gut. So arbeitet er zB ausschließlich in der Zone. Also wirklich ausschließlich. Es sei denn ein Umzug steht an, denn umziehen tut er (sich) auch gerne.', true),
('marius-scholl', 'Marius', 'Scholl', 24, 'Guard', NULL, NULL, NULL, NULL, 'Bester Dunker und Mega-Talent. 2026 wird sein Jahr, da sind sich alle sicher. Oder Marius? Sag doch auch mal was!', true),
('jan-strobel', 'Jan', 'Strobel', 8, 'Forward', 192, NULL, NULL, NULL, 'Wer glaubt, dass die Existenz von streaky Shootern ein Mythos sei, hat noch nie Strobel spielen sehen. Wenn er heiß wird, geht alles rein. Janbelievable ist auch, wie resilient dieser Dude ist. Jan stand schon mit Verletzungen und anderen Zuständen im Training, die einen Elefanten umhauen würden.', true),
('tobi-thury', 'Tobi', 'Thury', 52, 'Forward', 184, NULL, NULL, NULL, 'Du willst wissen, wie viel dein Auto wert ist? Früher ein gefürchteter Breakdancer, heute dreht er lieber an Heizungen.', true),
('danny-seitz', 'Danny', 'Seitz', 31, 'Forward', 182, NULL, NULL, NULL, 'Danny''s spirit animal ist eine amerikanische Lokomotive: Immer am Schnauben und Pumpen, trotzdem ist er nicht zu bremsen und bringt immer Dampf – zum Glück schießt er lieber Dreier als Büffel. Porsche-Fahrer?', true)
-- === END OF PASTE SECTION ===
ON CONFLICT (player_slug) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  jersey_number = EXCLUDED.jersey_number,
  position = EXCLUDED.position,
  height = EXCLUDED.height,
  weight = EXCLUDED.weight,
  birth_date = EXCLUDED.birth_date,
  nationality = EXCLUDED.nationality,
  bio = EXCLUDED.bio,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- For game data (if needed):
-- Format: game_id, date, home_team, away_team, home_score, away_score, location
-- INSERT INTO games (...) VALUES ...
-- ON CONFLICT (game_id) DO UPDATE SET ...

-- For boxscore data (if needed):
-- Format: game_id, player_id, points, assists, rebounds, etc.
-- INSERT INTO boxscores (...) VALUES ...
-- ON CONFLICT (game_id, player_id) DO UPDATE SET ...;
