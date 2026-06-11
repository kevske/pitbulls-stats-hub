# Migrationen

## Status / Historie

Dieses Verzeichnis ist historisch gewachsen: Die Basistabellen (`games`,
`box_scores`, `standings`, `teams`, `scrape_log`) wurden ursprünglich über
die Supabase-UI bzw. Lovable angelegt und existieren **nicht** als
Migration. Viele ältere Dateien sind unversionierte Ad-hoc-Fixes, die
teilweise dieselben Views mehrfach per `CREATE OR REPLACE` überschreiben.

**Maßgeblich für den aktuellen Zustand sind die zeitgestempelten
Migrationen** (`YYYYMMDDHHMMSS_*.sql`), insbesondere:

| Migration | Inhalt |
|---|---|
| `20260324140000_architectural_fix_topscorers.sql` | Letzter View-Stand vor Saison-Modell (Ghost-Player-Handling, Slug-Trigger) |
| `20260611120000_season_model.sql` | **Saison-Datenmodell**: seasons-Tabelle, season_id überall, Unique-Constraints, tsv-Nummerierung |
| `20260611121000_season_aware_views.sql` | **Saisonfähige Views** + `is_our_team()` |

Die unbenannten Altdateien bleiben als Dokumentation liegen; sie dürfen
**nicht** erneut ausgeführt werden (einige sind destruktiv bzw. von
neueren Migrationen überholt).

## Empfehlung für die Zukunft

1. Neue Änderungen ausschließlich als `YYYYMMDDHHMMSS_name.sql` anlegen
   (`npx supabase migration new <name>`).
2. Einmalig eine Baseline ziehen, sobald Zugriff mit Supabase CLI besteht:
   `npx supabase db dump --schema public > migrations/<ts>_baseline.sql`
   und die Altdateien danach in ein Archiv verschieben.
3. Einmal-Datenkorrekturen gehören nach `scripts/sql/archive/`, nicht
   hierher.
