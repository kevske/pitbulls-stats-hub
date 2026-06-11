# Saisonwechsel-Runbook

Anleitung für den Start einer neuen Saison (z. B. 2026/27). Seit der
Saison-Migration (`20260611120000_season_model.sql`) ist der Wechsel ein
einziger Datenbank-Schritt — keine Secrets, keine Deployments.

## Voraussetzungen

- Die neue Liga-ID von basketball-bund.net ist bekannt.
  Zu finden über die Ligasuche auf https://www.basketball-bund.net —
  die ID steht in der URL der Ligaseite (`liga_id=...`).
- Optional: die `teamPermanentId` der Pitbulls in der neuen Liga
  (steht in den Spielplan-API-Antworten unter `homeTeam.teamPermanentId`;
  kann auch leer bleiben, dann greift das Namens-Matching).

## Schritt 1: Neue Saison anlegen

Im Supabase SQL-Editor (Werte anpassen):

```sql
-- Alte Saison beenden
UPDATE seasons SET is_current = false WHERE is_current;

-- Neue Saison anlegen
INSERT INTO seasons (name, league_id, our_team_id, start_date, end_date, is_current)
VALUES ('2026/27', '<NEUE_LIGA_ID>', '<PITBULLS_TEAM_ID oder NULL>',
        DATE '2026-08-01', DATE '2027-07-31', true);
```

## Schritt 2: Crawler einmal manuell laufen lassen

GitHub → Actions → „BasketballBund Crawler" → „Run workflow".

Der Crawler:
- liest Liga-ID und Team-ID automatisch aus der neuen Saison-Zeile,
- legt alle Spiele/Teams/Standings mit der neuen `season_id` an,
- vergibt `tsv_game_number` für die neuen Pitbulls-Spiele automatisch
  (fortlaufend nach Spieldatum, beginnend bei MAX+1 der Vorsaison —
  bestehende Video-/Minuten-Zuordnungen bleiben gültig).

## Schritt 3: Kontrolle im Frontend

- In der Sidebar erscheint die neue Saison im Saison-Dropdown und ist
  vorausgewählt; die Vorsaison bleibt als Archiv wählbar (inkl. Awards).
- Statistiken starten leer und füllen sich mit den ersten Spielen.

## Schritt 4: Kader pflegen

Zu- und Abgänge wie gewohnt unter `/admin/player-info` pflegen
(`is_active` Flag). Box-Scores neuer Spieler werden über den
automatischen Slug-Trigger verknüpft, sobald `player_info`-Einträge
existieren.

## Troubleshooting

| Symptom | Ursache / Lösung |
|---|---|
| Crawler loggt „No current season found" | Kein `is_current = true` in `seasons` — Schritt 1 prüfen |
| Neue Spiele ohne `tsv_game_number` | `SELECT assign_tsv_game_numbers();` manuell ausführen |
| Keine Crawls seit Tagen, kein Alert | `ALERT_WEBHOOK_URL`-Secret setzen (Discord/Slack-Webhook); Health-Check-Job in Actions prüfen |
| Statistiken mischen Saisons | View-Migration `20260611121000_season_aware_views.sql` noch nicht angewendet |
